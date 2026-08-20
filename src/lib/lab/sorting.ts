/**
 * SORTING — five algorithms that emit a trace instead of animating.
 *
 * ── The architecture, and why it is this one ─────────────────────────────
 * Every algorithm here runs to completion *before* anything is drawn, pushing
 * a `Step` for each comparison, swap, overwrite and settle it performs. The
 * view is then a pure function of `(trace, cursor)`.
 *
 * That inversion is the whole design, and it buys four things that an
 * animation-driven implementation cannot have without extra machinery:
 *
 *   1. **Scrubbing is free.** Jumping to step 400 is an array index, not a
 *      re-run. A timeline slider is therefore trivially correct rather than an
 *      approximation that has to replay from the start.
 *   2. **Speed is free, and cannot desynchronise.** Playback rate only changes
 *      how fast the cursor advances; it cannot change what is displayed at a
 *      given step, because the steps were computed once.
 *   3. **Stepping backwards is free**, which an algorithm animated in place
 *      cannot do at all — it would have to invert every mutation.
 *   4. **The algorithms stay readable as algorithms.** `bubbleSort` below is
 *      the textbook loop with recording calls in it, not a state machine
 *      rewritten around a render loop. That matters on a page whose claim is
 *      that the author understands the algorithm, not just the animation.
 *
 * This is the same separation the CV's Algorithms Visualizer project describes
 * ("separated algorithm execution from rendering so new algorithms need no new
 * animation code"), rebuilt here rather than described.
 *
 * ── Cost ────────────────────────────────────────────────────────────────
 * A trace is bounded by the algorithm's own complexity: ~n² steps for the
 * quadratic sorts. At the 28-element default that is a few hundred small
 * objects, computed once, in about a millisecond. Every `indices` array is a
 * fresh literal so a step can never alias the working array it came from.
 */

import { rng } from './core/rng';
import {
  check,
  firstDisorder,
  isOrdered,
  isPermutation,
  ratio,
  verification,
  type Verification,
} from './core/verify';

/** Which array positions a step is talking about, and what it did to them. */
export type StepKind =
  /** Read two positions and compared them. No mutation. */
  | 'compare'
  /** Exchanged two positions. */
  | 'swap'
  /** Wrote a value into a position (merge sort's copy-back, insertion's shift). */
  | 'overwrite'
  /** This position is now in its final place and will not move again. */
  | 'settle'
  /** Chosen as the partition pivot (quicksort). */
  | 'pivot';

export interface Step {
  kind: StepKind;
  /** Positions involved. One for settle/overwrite/pivot, two for compare/swap. */
  indices: number[];
  /**
   * The array *after* this step, as a snapshot.
   *
   * Storing a full copy per step rather than replaying mutations is the
   * deliberate trade that makes random access to any step O(1) — which is what
   * a scrubbable timeline needs. At n=28 and a few hundred steps this is a few
   * tens of kilobytes and it is what keeps the renderer a pure function.
   */
  array: number[];
}

export interface Trace {
  steps: Step[];
  /**
   * How many steps the run performed.
   *
   * Equal to `steps.length` for a recorded run, and the *real* count for a
   * counted one — where `steps` is empty by design. Anything reporting a step
   * total must read this rather than the array, or a counted run silently
   * reports zero work.
   */
  length: number;
  /** Comparisons and writes, counted from the trace itself — never estimated. */
  comparisons: number;
  writes: number;
}

/**
 * Records steps and tallies real operation counts as it goes.
 *
 * ── Why recording is optional ───────────────────────────────────────────
 * `push` snapshots the whole array, which is what makes any step O(1) to seek
 * to — see the note on `Step.array`. At n=28 that is a few tens of kilobytes;
 * at n=1024 bubble sort performs over half a million steps, and a copy per step
 * is hundreds of millions of numbers. So a growth sweep cannot afford snapshots.
 *
 * The flag is the answer, rather than a second set of counting-only algorithms:
 * two implementations of bubble sort would be two things to keep in agreement,
 * and the sweep's entire claim is that its numbers are the *same* numbers the
 * bench shows at the sizes where the two overlap. One code path makes that true
 * by construction instead of by discipline. Same bargain as `buildTree`'s
 * `record` parameter in `structures.ts`.
 */
class Recorder {
  readonly steps: Step[] = [];
  comparisons = 0;
  writes = 0;
  /** Counted separately, because `steps` stays empty when not recording. */
  length = 0;

  constructor(
    private readonly work: number[],
    private readonly record = true,
  ) {}

  private push(kind: StepKind, indices: number[]) {
    this.length += 1;
    // The snapshot is the only thing skipped. Every tally above still runs, so a
    // counted run and a recorded one cannot disagree about the totals.
    if (!this.record) return;
    this.steps.push({ kind, indices, array: [...this.work] });
  }

  compare(i: number, j: number) {
    this.comparisons++;
    this.push('compare', [i, j]);
  }

  swap(i: number, j: number) {
    const t = this.work[i];
    this.work[i] = this.work[j];
    this.work[j] = t;
    // A swap is two writes. Counting it as one would understate every
    // exchange-based sort against the ones that shift instead.
    this.writes += 2;
    this.push('swap', [i, j]);
  }

  write(i: number, value: number) {
    this.work[i] = value;
    this.writes++;
    this.push('overwrite', [i]);
  }

  settle(...indices: number[]) {
    this.push('settle', indices);
  }

  pivot(i: number) {
    this.push('pivot', [i]);
  }

  done(): Trace {
    return {
      steps: this.steps,
      length: this.length,
      comparisons: this.comparisons,
      writes: this.writes,
    };
  }
}

/* ------------------------------------------------------------------ *
 * THE ALGORITHMS
 *
 * Each takes the input array and returns a Trace. They operate on their own
 * copy, so the caller's array is never mutated and the same input can be run
 * through all five for comparison.
 *
 * The `record` flag is passed straight to the Recorder and changes nothing else
 * — see the note on that class for why the growth sweep needs it and why it is a
 * flag rather than a second implementation.
 * ------------------------------------------------------------------ */

function bubbleSort(input: number[], record = true): Trace {
  const a = [...input];
  const r = new Recorder(a, record);
  const n = a.length;

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      r.compare(j, j + 1);
      if (a[j] > a[j + 1]) {
        r.swap(j, j + 1);
        swapped = true;
      }
    }
    // The largest remaining element has bubbled to the end of the unsorted
    // region, so that position is final.
    r.settle(n - 1 - i);
    // The early exit is the difference between bubble sort's O(n²) worst case
    // and its O(n) best case on already-sorted input — visible in the step
    // count, which is the point of showing it.
    if (!swapped) {
      for (let k = 0; k < n - 1 - i; k++) r.settle(k);
      break;
    }
  }
  if (n > 0) r.settle(0);
  return r.done();
}

function insertionSort(input: number[], record = true): Trace {
  const a = [...input];
  const r = new Recorder(a, record);
  const n = a.length;

  r.settle(0);
  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    // Shifts rather than swaps: insertion sort's advantage over bubble sort is
    // that it performs one write per shift instead of two per exchange, and the
    // write counter makes that concrete instead of asserted.
    while (j >= 0) {
      r.compare(j, j + 1);
      if (a[j] <= key) break;
      r.write(j + 1, a[j]);
      j--;
    }
    r.write(j + 1, key);
    for (let k = 0; k <= i; k++) r.settle(k);
  }
  return r.done();
}

function selectionSort(input: number[], record = true): Trace {
  const a = [...input];
  const r = new Recorder(a, record);
  const n = a.length;

  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      r.compare(min, j);
      if (a[j] < a[min]) min = j;
    }
    // Exactly one swap per pass, whatever the input — selection sort's
    // defining property, and why it is chosen when writes are expensive.
    if (min !== i) r.swap(i, min);
    r.settle(i);
  }
  if (n > 0) r.settle(n - 1);
  return r.done();
}

function mergeSort(input: number[], record = true): Trace {
  const a = [...input];
  const r = new Recorder(a, record);

  const merge = (lo: number, mid: number, hi: number) => {
    const left = a.slice(lo, mid + 1);
    const right = a.slice(mid + 1, hi + 1);
    let i = 0;
    let j = 0;
    let k = lo;

    while (i < left.length && j < right.length) {
      // Compared against the *original* positions of the two runs, so the
      // highlight lands on the elements the comparison is actually about.
      r.compare(lo + i, mid + 1 + j);
      // `<=` not `<`: this is what makes the sort stable, and swapping it
      // would silently change the algorithm's guarantees.
      if (left[i] <= right[j]) r.write(k++, left[i++]);
      else r.write(k++, right[j++]);
    }
    while (i < left.length) r.write(k++, left[i++]);
    while (j < right.length) r.write(k++, right[j++]);
  };

  const sort = (lo: number, hi: number) => {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    sort(lo, mid);
    sort(mid + 1, hi);
    merge(lo, mid, hi);
  };

  sort(0, a.length - 1);
  for (let i = 0; i < a.length; i++) r.settle(i);
  return r.done();
}

function quickSort(input: number[], record = true): Trace {
  const a = [...input];
  const r = new Recorder(a, record);

  const partition = (lo: number, hi: number): number => {
    // Lomuto partition with the last element as pivot.
    r.pivot(hi);
    const pivot = a[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      r.compare(j, hi);
      if (a[j] < pivot) {
        if (i !== j) r.swap(i, j);
        i++;
      }
    }
    if (i !== hi) r.swap(i, hi);
    r.settle(i);
    return i;
  };

  const sort = (lo: number, hi: number) => {
    if (lo >= hi) {
      if (lo === hi) r.settle(lo);
      return;
    }
    const p = partition(lo, hi);
    sort(lo, p - 1);
    sort(p + 1, hi);
  };

  sort(0, a.length - 1);
  return r.done();
}

/* ------------------------------------------------------------------ *
 * REGISTRY
 * ------------------------------------------------------------------ */

export interface Algorithm {
  id: string;
  name: string;
  /** Big-O, written as the UI displays it. */
  time: string;
  space: string;
  stable: boolean;
  /** One sentence on what actually distinguishes it. No filler. */
  note: string;
  /**
   * Pass `record: false` to tally without keeping snapshots. The growth sweep
   * needs the totals at n = 1024, where a recorded bubble sort would hold
   * hundreds of millions of numbers in memory.
   */
  run: (input: number[], record?: boolean) => Trace;
}

export const algorithms: Algorithm[] = [
  {
    id: 'bubble',
    name: 'Bubble Sort',
    time: 'O(n²)',
    space: 'O(1)',
    stable: true,
    note: 'Exchanges adjacent pairs. Included because its early exit makes it O(n) on already-sorted input — the one case where it beats the divide-and-conquer sorts.',
    run: bubbleSort,
  },
  {
    id: 'insertion',
    name: 'Insertion Sort',
    time: 'O(n²)',
    space: 'O(1)',
    stable: true,
    note: 'Shifts rather than swaps, so it performs half the writes of bubble sort on the same data. This is why real libraries fall back to it for small subarrays.',
    run: insertionSort,
  },
  {
    id: 'selection',
    name: 'Selection Sort',
    time: 'O(n²)',
    space: 'O(1)',
    stable: false,
    note: 'Performs exactly n−1 swaps regardless of input — the fewest writes of any comparison sort here, which is what makes it useful when writing is expensive.',
    run: selectionSort,
  },
  {
    id: 'merge',
    name: 'Merge Sort',
    time: 'O(n log n)',
    space: 'O(n)',
    stable: true,
    note: 'Guaranteed O(n log n) with no worst case, and stable — it trades O(n) auxiliary memory for both properties.',
    run: mergeSort,
  },
  {
    id: 'quick',
    name: 'Quick Sort',
    time: 'O(n log n) avg',
    space: 'O(log n)',
    stable: false,
    note: 'Fastest here in practice on random input, sorting in place. Degrades to O(n²) when the pivot is consistently the extreme — visible by running it on sorted data.',
    run: quickSort,
  },
];

/* ------------------------------------------------------------------ *
 * INPUT SETS
 *
 * The distributions matter as much as the algorithms: the entire point of
 * comparing sorts is that their costs depend on the shape of the input, and a
 * bench that only ever runs random data cannot show that.
 * ------------------------------------------------------------------ */

export type Distribution = 'random' | 'sorted' | 'reversed' | 'nearly' | 'duplicates';

export const distributions: { id: Distribution; label: string; note: string }[] = [
  { id: 'random', label: 'Random', note: 'Uniform shuffle — the average case.' },
  { id: 'sorted', label: 'Sorted', note: 'Best case for insertion and bubble; worst for this quicksort pivot.' },
  { id: 'reversed', label: 'Reversed', note: 'Worst case for the quadratic sorts — every comparison fails.' },
  { id: 'nearly', label: 'Nearly sorted', note: 'The common real-world shape, and where insertion sort wins.' },
  {
    id: 'duplicates',
    label: 'Many duplicates',
    note: 'Only a handful of distinct values, so stability decides the order of equal elements.',
  },
];

/**
 * Builds an input array of `n` values in the requested shape, from a seed.
 *
 * ── Why every shape is seeded ───────────────────────────────────────────
 * This generator used to call `Math.random()`, and that one detail cost the
 * bench three things it should never have been without:
 *
 *   1. **A run could not be shared.** The comparison table is the bench's
 *      strongest claim — five sorts measured on one array — and a link to it
 *      arrived showing a *different* array. There was no way to say "look at
 *      what quicksort does to this input".
 *   2. **A surprise could not be re-examined.** An unusually cheap run
 *      vanished the moment anything was touched, which is exactly backwards
 *      for an instrument.
 *   3. **A failing self-check would have been unreproducible.** A verification
 *      badge is only worth having if a failure can be looked at twice; with an
 *      unseeded input the one interesting event the bench can report would be
 *      gone before it could be investigated.
 *
 * A seed fixes all three at once, and it is why `?seed=` is in the URL. The
 * generator is `mulberry32` from `core/rng.ts` — a pure function of the seed,
 * identical on the server and in every browser, so the same link is the same
 * array forever.
 *
 * ── Why the values are a permutation of 1..n ────────────────────────────
 * Not random magnitudes: even bar heights make the picture an ordering problem
 * rather than a noisy histogram, and distinct values make a stability claim
 * observable at all. `duplicates` is the deliberate exception — see below.
 */
export function makeInput(n: number, shape: Distribution, seed: number): number[] {
  const r = rng(seed);
  const ordered = Array.from({ length: n }, (_, i) => i + 1);

  switch (shape) {
    case 'sorted':
      return ordered;

    case 'reversed':
      return ordered.reverse();

    case 'nearly': {
      // A handful of *local* transpositions. "Nearly sorted" means a few
      // elements a short distance from home — which is the shape real data
      // arrives in, and the one insertion sort is chosen for. A light global
      // shuffle would be a different distribution wearing the same name.
      const a = ordered;
      const swaps = Math.max(1, Math.round(n * 0.08));
      for (let s = 0; s < swaps; s++) {
        const i = r.int(0, n - 2);
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
      }
      return a;
    }

    case 'duplicates': {
      /*
       * Roughly √n distinct values, so each appears several times.
       *
       * This is the only shape that abandons distinctness, and it is here
       * because stability is otherwise an unobservable claim: with every value
       * unique there are no equal elements whose relative order could be
       * disturbed, so the table's "Stable — yes/no" column is asserting
       * something the bench never exercises. With duplicates, selection and
       * quicksort genuinely reorder equal keys and merge sort genuinely does
       * not.
       *
       * It also drives the counters apart in a way no permutation does: every
       * comparison of equal elements is a branch the quadratic sorts take
       * differently from the divide-and-conquer ones.
       */
      const distinct = Math.max(2, Math.round(Math.sqrt(n)));
      // Values are spread across the full 1..n range rather than 1..distinct,
      // so the bars still use the whole height of the chart — a duplicates run
      // that drew everything in the bottom eighth of the panel would look like
      // a rendering fault.
      const step = n / distinct;
      return Array.from({ length: n }, () =>
        Math.max(1, Math.round((r.int(1, distinct) - 0.5) * step)),
      );
    }

    case 'random':
    default:
      // Fisher–Yates, in `core/rng.ts`. Every permutation equally likely —
      // which the widespread `sort(() => Math.random() - 0.5)` shuffle is not.
      return r.shuffle(ordered);
  }
}

/* ------------------------------------------------------------------ *
 * SELF-VERIFICATION
 * ------------------------------------------------------------------ */

/**
 * Checks a run's output against the two properties a sort must have.
 *
 * ── Why this exists at all ──────────────────────────────────────────────
 * A wrong sort is invisible. The bars still shrink and settle, the counters
 * still climb, the run still ends — and an off-by-one in a partition bound
 * would produce a perfectly plausible animation with two elements quietly
 * transposed. Nothing on screen would betray it, which means the page's central
 * claim ("these are real algorithms, measured") would rest entirely on the
 * reader's willingness to believe it.
 *
 * So the postconditions are asserted on the real output of the real run, and
 * the result is printed. The claim becomes checkable in the place it is made.
 *
 * ── Why both checks, when one looks sufficient ──────────────────────────
 * Ordering alone is trivially satisfiable by cheating: `[1, 2, 3]` is ordered
 * whatever the input was, and so is an array where a lost element has been
 * overwritten by its neighbour — the exact damage a bad `write` index causes.
 * Permutation alone is satisfied by doing nothing at all. Together they pin the
 * output down to precisely "the input, in order", which is the definition of a
 * correct sort and the strongest statement two O(n) passes can make.
 *
 * ── Why it returns a value instead of throwing ──────────────────────────
 * A thrown assertion would replace the bench with the route's error boundary,
 * which is the one outcome where the visitor learns nothing. A failure here is
 * the most interesting thing this page could display, so it is rendered: in
 * alert red, with the index that localises it.
 */
export function verifySort(input: readonly number[], output: readonly number[]): Verification {
  const disorder = firstDisorder(output);
  const inOrder = isOrdered(output);
  const permuted = isPermutation(input, output);

  return verification([
    check(
      'Output is ordered',
      inOrder,
      inOrder
        ? // Adjacent pairs, not elements: an n-element array makes n−1 ordering
          // claims, and reporting n of n would be counting the wrong thing.
          ratio(Math.max(0, output.length - 1), Math.max(0, output.length - 1), 'pairs in order')
        : `first inversion at index ${disorder}: ${output[disorder - 1]} precedes ${output[disorder]}`,
    ),
    check(
      'Output is a permutation of the input',
      permuted,
      permuted
        ? ratio(output.length, input.length, 'elements accounted for')
        : `${input.length} in, ${output.length} out, and the multisets differ`,
    ),
  ]);
}
