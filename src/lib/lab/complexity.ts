/**
 * COMPLEXITY — growth measured, by running the real sorts at eight sizes.
 *
 * ── What this exists to settle ──────────────────────────────────────────
 * The sorting bench prints `O(n²)` and `O(n log n)` beside each algorithm, and
 * those strings are the one thing on the page a visitor has to take on trust.
 * They are copied from a textbook. Nothing in the bench checks them, and at a
 * single array size nothing could: 1,200 steps against 190 is a fact about
 * n=48, not about growth.
 *
 * Growth is a statement about what happens as n changes, so the only way to
 * show it is to change n. This module runs all five algorithms at n = 8, 16,
 * 32 … 1024 and reports what it counted.
 *
 * ── Why it re-uses the bench's algorithms rather than its own ───────────
 * Every number here comes from `algorithms[].run` in `./sorting` — the same
 * five functions the bench animates. A private set of counting-only sorts would
 * have been easier to write and worthless: the claim being made is that *these*
 * implementations grow this way, and two copies of bubble sort could drift apart
 * without either one being wrong on its own terms. `verifySweep` below closes
 * the loop by re-running the recorded path and checking the totals match.
 *
 * ── Why the exponent is fitted, and against fitted references ──────────
 * The tempting shortcut is to compare a measured log-log slope against the
 * exponent in the big-O and call a match a proof. That would be wrong, and
 * visibly so: over 8 ≤ n ≤ 1024 a perfectly linearithmic curve does not fit to
 * slope 1.0, it fits to about 1.24, because `log₂ n` is not constant across the
 * window — it triples. Asserting "merge sort measured 1.24, expected 1.0,
 * therefore something is off" would be an artefact of the window, not a finding.
 *
 * So the references are fitted the same way, to `n`, `n log₂ n` and `n²`
 * sampled at exactly these eight sizes, by exactly the same least-squares
 * routine. Measured slopes are then compared to numbers derived under identical
 * conditions, and the nearest one is named. That is a comparison the arithmetic
 * actually supports.
 *
 * ── Why there are no timings here ───────────────────────────────────────
 * Wall-clock milliseconds would be the obvious thing to plot and the one number
 * that could not be trusted. It varies with the machine, the browser, the JIT's
 * warm-up and whatever else the laptop is doing, so the same seed would produce
 * a different chart on every visit and a screenshot would be evidence of
 * nothing. Operation counts are exact integers, identical everywhere, and they
 * are what the complexity classes are actually about.
 *
 * ── Cost ────────────────────────────────────────────────────────────────
 * 40 runs, ~2.1M to 4.9M recorded operations depending on the shape, measured at
 * 17–46ms on the development machine. Affordable only because `run(input,
 * false)` skips the per-step array snapshot — see `Recorder` in `./sorting`.
 * Recording this sweep would allocate hundreds of millions of numbers.
 */

import { algorithms, makeInput, type Distribution } from './sorting';
import { check, verification, type Verification } from './core/verify';

/**
 * The sizes swept, doubling.
 *
 * Powers of two so that "the next size" is always exactly twice the last, which
 * is what makes the ratio column below readable without arithmetic: a cost that
 * quadruples on a doubling is the signature of n², and one that a little more
 * than doubles is the signature of n log n. Irregular sizes would carry the same
 * information and require the reader to do division.
 *
 * It stops at 1024 because the quadratic sorts perform about half a million
 * operations there and the next doubling would be two million — past the point
 * where a synchronous sweep during render is honest about being cheap.
 */
export const SWEEP_SIZES = [8, 16, 32, 64, 128, 256, 512, 1024] as const;

/** What to plot. All three are counted; none is derived from the others. */
export type Metric = 'comparisons' | 'writes' | 'steps';

export const METRICS: readonly { id: Metric; label: string; note: string }[] = [
  {
    id: 'comparisons',
    label: 'Comparisons',
    note: 'The operation the complexity classes are stated in terms of.',
  },
  {
    id: 'writes',
    label: 'Writes',
    note: 'Where selection sort wins and bubble sort loses, at identical comparison counts.',
  },
  {
    id: 'steps',
    label: 'Steps',
    note: 'Everything the recorder saw, including the settles the animation needs.',
  },
];

/** One algorithm measured at one size. Three integers, all counted. */
export interface Point {
  n: number;
  comparisons: number;
  writes: number;
  steps: number;
}

export function costOf(p: Point, metric: Metric): number {
  return metric === 'comparisons' ? p.comparisons : metric === 'writes' ? p.writes : p.steps;
}

/* ------------------------------------------------------------------ *
 * FITTING
 * ------------------------------------------------------------------ */

/**
 * Least-squares slope of log₂(cost) against log₂(n).
 *
 * On log-log axes a power law `c·nᵏ` is a straight line of gradient `k`, so this
 * recovers the exponent — the standard way to measure an empirical growth rate,
 * and the reason the chart itself is drawn log-log.
 *
 * Zero costs are floored to 1 before the logarithm rather than dropped: a run
 * that performed no writes is a real measurement (selection sort on sorted input
 * comes close), and log₂(1) = 0 keeps it on the axis instead of at −∞. Dropping
 * the point would silently fit fewer samples than the caller thinks.
 */
function logLogSlope(xs: readonly number[], ys: readonly number[]): number {
  const k = xs.length;
  if (k < 2) return 0;

  let sx = 0;
  let sy = 0;
  let sxy = 0;
  let sxx = 0;

  for (let i = 0; i < k; i++) {
    const x = Math.log2(xs[i]);
    const y = Math.log2(Math.max(1, ys[i]));
    sx += x;
    sy += y;
    sxy += x * y;
    sxx += x * x;
  }

  const denom = k * sxx - sx * sx;
  // Every size distinct means this cannot be zero, but a caller passing one
  // repeated size would otherwise get NaN and paint an empty chart.
  return denom === 0 ? 0 : (k * sxy - sx * sy) / denom;
}

export interface Reference {
  id: string;
  /** How the curve is written in the legend. */
  label: string;
  /** The slope this curve fits to *over `SWEEP_SIZES`* — not its asymptote. */
  slope: number;
}

/**
 * The three shapes worth comparing against, fitted over the swept sizes.
 *
 * `slope` is measured, not declared: each reference curve is sampled at the same
 * eight n and pushed through the same `logLogSlope`. That is what makes `n log n`
 * arrive as ≈1.24 rather than as the 1.0 its leading term would suggest, and it
 * is the only way the comparison in `analyse` is like-for-like.
 */
export const REFERENCES: readonly Reference[] = [
  {
    id: 'linear',
    label: 'n',
    slope: logLogSlope(SWEEP_SIZES, SWEEP_SIZES.map((n) => n)),
  },
  {
    id: 'linearithmic',
    label: 'n log n',
    slope: logLogSlope(SWEEP_SIZES, SWEEP_SIZES.map((n) => n * Math.log2(n))),
  },
  {
    id: 'quadratic',
    label: 'n²',
    slope: logLogSlope(SWEEP_SIZES, SWEEP_SIZES.map((n) => n * n)),
  },
];

/* ------------------------------------------------------------------ *
 * THE SWEEP
 * ------------------------------------------------------------------ */

export interface Sweep {
  shape: Distribution;
  seed: number;
  sizes: readonly number[];
  /** One entry per algorithm, in `algorithms` order, each measured at every size. */
  series: readonly { id: string; name: string; time: string; points: Point[] }[];
  verification: Verification;
}

/**
 * Runs every algorithm at every size on the given distribution and seed.
 *
 * Each size gets a fresh input from `makeInput`, and all five algorithms see the
 * *same* array at that size — the comparison would be meaningless otherwise,
 * since these sorts' costs depend on the arrangement and not just the length.
 */
export function runSweep(shape: Distribution, seed: number): Sweep {
  const inputs = SWEEP_SIZES.map((n) => makeInput(n, shape, seed));

  const series = algorithms.map((a) => ({
    id: a.id,
    name: a.name,
    time: a.time,
    points: inputs.map((input, i) => {
      // `false`: count everything, snapshot nothing. The whole sweep depends on
      // this — see the note on `Recorder` in `./sorting`.
      const t = a.run(input, false);
      return {
        n: SWEEP_SIZES[i],
        comparisons: t.comparisons,
        writes: t.writes,
        steps: t.length,
      };
    }),
  }));

  return { shape, seed, sizes: SWEEP_SIZES, series, verification: verifySweep(series, inputs) };
}

/**
 * The two properties that make this sweep's numbers trustworthy.
 *
 * ── Why the first check is the important one ────────────────────────────
 * Every figure above was produced with recording switched off, which is a code
 * path the animated bench never takes. If that path had drifted — an early
 * return that skipped a tally, a counter incremented inside the `if` — the sweep
 * would report a beautifully clean quadratic that no longer described the
 * algorithm anyone can watch. So the recorded path is re-run at the small sizes
 * and the totals are required to be identical. That is the check that earns the
 * right to say these are the same five algorithms.
 *
 * It re-runs only n ≤ 64 because recording is what makes large n unaffordable in
 * the first place; the flag is a single branch, so if the two paths agree on 20
 * runs across four sizes they do not diverge at the fifth.
 *
 * ── Why monotonicity, when it looks trivial ─────────────────────────────
 * It is the cheapest possible guard against the sweep measuring the wrong thing.
 * A reused recorder, an input generated once and sorted in place by the first
 * algorithm to see it, an off-by-one in the size list — every one of those shows
 * up as a bigger array costing less than a smaller one, and none of them would
 * be obvious on a log-log chart where all five lines would still rise.
 */
function verifySweep(
  series: readonly { id: string; name: string; points: Point[] }[],
  inputs: readonly number[][],
): Verification {
  const AGREE_UP_TO = 64;

  let compared = 0;
  let firstDrift = '';

  for (const a of algorithms) {
    const measured = series.find((s) => s.id === a.id);
    if (!measured) continue;

    for (let i = 0; i < inputs.length; i++) {
      if (SWEEP_SIZES[i] > AGREE_UP_TO) break;
      const recorded = a.run(inputs[i], true);
      const counted = measured.points[i];
      compared++;

      if (
        recorded.comparisons !== counted.comparisons ||
        recorded.writes !== counted.writes ||
        recorded.steps.length !== counted.steps
      ) {
        if (!firstDrift) {
          firstDrift =
            `${a.name} at n=${SWEEP_SIZES[i]}: counted ` +
            `${counted.comparisons}/${counted.writes}/${counted.steps}, ` +
            `recorded ${recorded.comparisons}/${recorded.writes}/${recorded.steps.length}`;
        }
      }
    }
  }

  let drops = 0;
  let firstDrop = '';
  for (const s of series) {
    for (let i = 1; i < s.points.length; i++) {
      if (s.points[i].steps < s.points[i - 1].steps) {
        drops++;
        if (!firstDrop) {
          firstDrop =
            `${s.name}: n=${s.points[i].n} took ${s.points[i].steps} steps, ` +
            `fewer than ${s.points[i - 1].steps} at n=${s.points[i - 1].n}`;
        }
      }
    }
  }

  return verification([
    check(
      'Counted runs match recorded runs',
      !firstDrift,
      firstDrift || `${compared} runs re-executed with recording on, all totals identical`,
    ),
    check(
      'Cost never falls as n grows',
      drops === 0,
      drops === 0
        ? `${series.length * (SWEEP_SIZES.length - 1)} doublings checked, all non-decreasing`
        : firstDrop,
    ),
  ]);
}

/* ------------------------------------------------------------------ *
 * ANALYSIS
 * ------------------------------------------------------------------ */

export interface Row {
  id: string;
  name: string;
  /** The textbook class, as the sorting bench prints it. */
  time: string;
  /** Cost at each swept size, in the chosen metric. */
  costs: number[];
  /**
   * Cost at each size divided by cost at the previous one. `null` for the first
   * size, which has nothing to be a ratio of.
   *
   * This is the column that does the actual work of this bench. A doubling of n
   * that quadruples the cost is a quadratic algorithm being caught in the act,
   * and it needs no fitting, no logarithms and no trust in the author's
   * arithmetic — it is two measured integers and a division.
   */
  ratios: (number | null)[];
  /** Measured log-log slope across all eight sizes. */
  slope: number;
  /**
   * Which `REFERENCES` entry that slope is closest to, or `null` when the series
   * has no growth to classify.
   *
   * Nullable because of a case the `writes` metric turns up for real: on sorted
   * input bubble, selection and quicksort perform *zero* writes at every size —
   * bubble exits early, selection's `min !== i` is never true, and Lomuto's `i`
   * and `j` advance in lockstep so nothing is ever exchanged. A flat line of
   * zeroes fits to slope 0, and 0 is nearer to `n` than to anything else here,
   * so a naive nearest-match would print "measured: n" for an algorithm that did
   * no work at all. That is worse than saying nothing, because it looks like a
   * measurement. `null` means "this metric recorded nothing to grow".
   */
  nearest: Reference | null;
}

export interface Analysis {
  rows: Row[];
  /** Largest cost anywhere in the sweep, for scaling the chart. */
  peak: number;
}

/**
 * Derives everything metric-dependent from an already-measured sweep.
 *
 * Kept separate from `runSweep` so that switching between comparisons, writes
 * and steps is arithmetic on numbers already in hand rather than 40 more runs.
 * The measurement is the expensive, seeded, verifiable part; this is a view of
 * it.
 */
export function analyse(sweep: Sweep, metric: Metric): Analysis {
  let peak = 1;

  const rows = sweep.series.map<Row>((s) => {
    const costs = s.points.map((p) => costOf(p, metric));
    for (const c of costs) if (c > peak) peak = c;

    const slope = logLogSlope(
      s.points.map((p) => p.n),
      costs,
    );

    // A series that never left zero has a slope, but not a growth rate. See the
    // note on `Row.nearest`.
    const measurable = costs.some((c) => c > 0);
    const nearest = measurable
      ? REFERENCES.reduce((best, r) =>
          Math.abs(r.slope - slope) < Math.abs(best.slope - slope) ? r : best,
        )
      : null;

    return {
      id: s.id,
      name: s.name,
      time: s.time,
      costs,
      ratios: costs.map((c, i) =>
        // A previous cost of zero has no meaningful ratio, and dividing by it
        // would put Infinity in a table cell.
        i === 0 || costs[i - 1] === 0 ? null : c / costs[i - 1],
      ),
      slope,
      nearest,
    };
  });

  return { rows, peak };
}
