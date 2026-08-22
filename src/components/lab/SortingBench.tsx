'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  algorithms,
  distributions,
  makeInput,
  verifySort,
  type Distribution,
  type Step,
} from '@/lib/lab/sorting';
import { parseSeed, randomSeed } from '@/lib/lab/core/rng';
import { benchFragment, benchPath } from '@/lib/lab/catalogue';
import { haptic } from '@/lib/haptics';
import { Bay, CopyButton, num, Segmented, Slider, Stat, TableWrap, Transport, type Option, VerifyBadge } from './Controls';

/**
 * SORTING BENCH
 *
 * ── What is actually on screen ──────────────────────────────────────────
 * Nothing here sorts anything. `lib/lab/sorting.ts` runs the algorithm to
 * completion the moment the inputs change and hands back a `Trace`: an array of
 * steps, each carrying a full snapshot of the array at that moment plus the
 * indices the step touched. This file only ever renders `trace.steps[cursor]`.
 *
 * That separation is the whole design, and it is why every feature below was
 * free rather than implemented:
 *
 *   - **Scrubbing** is `cursor = n`. There is no rewind path because there is
 *     no state to rewind — a step is a snapshot, not a delta.
 *   - **Reverse stepping** is `cursor - 1`, for the same reason.
 *   - **Speed** only changes how often `cursor` advances. It cannot desync the
 *     view from the data, because the view is not accumulated.
 *   - **The counters are measurements.** `comparisons` and `writes` are tallied
 *     by the recorder inside the algorithm as it runs, so what the panel prints
 *     is what the code did, not a formula for what it should have done.
 *
 * The alternative — mutating an array in state and animating each mutation —
 * makes all four of those either hard or dishonest.
 *
 * ── Why the input is seeded and the seed is in the URL ──────────────────
 * The comparison table is this bench's strongest claim: five sorts, measured on
 * one array. That claim is only worth anything if the array can be named. With
 * an unseeded shuffle a link to an interesting run arrived showing a different
 * run, so the interesting thing could neither be shared nor looked at twice.
 *
 * The seed makes the whole bench a pure function of `(algorithm, shape, n,
 * seed)`, all four of which are in the URL — so a link reproduces the run
 * exactly, on any machine, forever. That is also what makes the self-check
 * below worth rendering: a failure can be re-opened and investigated instead of
 * disappearing on the next re-roll.
 *
 * ── Why the playhead is a rAF loop and not setInterval ──────────────────
 * `setInterval` keeps queueing callbacks while the tab is hidden and then
 * delivers the backlog on return, which would fast-forward the animation the
 * instant a visitor comes back to it. rAF is throttled to zero in a background
 * tab, so the playhead simply pauses and resumes where it left off. It also
 * lets the step rate be derived from real elapsed time, so playback runs at the
 * intended speed on a 60Hz and a 120Hz display alike, rather than twice as fast
 * on the latter.
 */

/** Ceiling on the array size. */
const MAX_N = 48;
const MIN_N = 8;

/** This bench's id in the catalogue, which is also its fragment and its link. */
const BENCH_ID = 'sorting';

/**
 * The settings the bench opens on.
 *
 * Constants, and in the seed's case deliberately not `randomSeed()`. `/lab` is a
 * page that gets linked, screenshot and described in structured data, and all
 * three of those are claims about a specific run — a random default would make
 * the page arrive differently for every visitor and mean the numbers in the
 * description matched nothing.
 *
 * They are named rather than inlined into `useState` because the URL sync below
 * needs them twice over: to know a value is worth writing down, and to know one
 * is worth leaving out. That is what keeps a visitor who has changed nothing
 * looking at a clean `/lab` rather than at four query parameters they never
 * asked for.
 */
const DEFAULT_ALGO = algorithms[0].id;
const DEFAULT_SHAPE: Distribution = 'random';
const DEFAULT_N = 28;
const DEFAULT_SEED = 1;

/**
 * Steps per second at speed 1×, and the multipliers offered.
 *
 * 14/sec is fast enough to read as motion and slow enough to follow an
 * individual comparison. The multipliers stop at 8× because beyond that the
 * quadratic sorts at n=48 are a blur, and the honest way to see the end state
 * is to drag the scrubber there.
 */
const BASE_RATE = 14;
const SPEEDS = [0.5, 1, 2, 4, 8] as const;
type Speed = `${(typeof SPEEDS)[number]}`;

const speedOptions: Option<Speed>[] = SPEEDS.map((s) => ({
  id: String(s) as Speed,
  label: `${s}×`,
}));

/** Human-readable name for what a step did — also used for the live region. */
const STEP_VERB: Record<Step['kind'], string> = {
  compare: 'Compare',
  swap: 'Swap',
  overwrite: 'Write',
  settle: 'Settle',
  pivot: 'Pivot',
};

export function SortingBench() {
  const [algoId, setAlgoId] = useState(DEFAULT_ALGO);
  const [shape, setShape] = useState<Distribution>(DEFAULT_SHAPE);
  const [n, setN] = useState(DEFAULT_N);
  const [speed, setSpeed] = useState<Speed>('1');
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);

  /**
   * The seed the input is generated from — the bench's fourth real setting.
   *
   * `makeInput` is a pure function of `(n, shape, seed)`, so this is not a
   * cache-busting counter: it is the *name* of the array. The same three
   * numbers produce the same elements in the same order, in every browser.
   */
  const [seed, setSeed] = useState(DEFAULT_SEED);

  const input = useMemo(() => makeInput(n, shape, seed), [n, shape, seed]);

  /* ---------------- the run in the URL ---------------- */

  /*
   * Read the link first, and only then start writing to the address bar.
   *
   * ── Why a state flag and not a ref ──
   * The read and the write are two effects, and on mount React runs both in the
   * same commit — so a `ref` guard would let the write fire with the *pre-read*
   * settings and strip the very parameters it was about to be told about. A
   * state flag cannot: the write effect sees `false` in that first commit and
   * declines, and by the time it sees `true` the linked values have landed. The
   * cost is one extra render on mount, which buys a deep link that survives.
   *
   * ── Why not useSearchParams ──
   * It opts the whole subtree into the dynamic rendering path and demands a
   * `<Suspense>` boundary, which for a statically exported page means shipping a
   * loading state for data that is already sitting in `window.location`. This
   * bench is client-only anyway (`registry.tsx` mounts it with `ssr: false`), so
   * reading the location directly is both cheaper and less machinery.
   *
   * Every value is validated against what the engine actually offers rather
   * than trusted: `?algo=heapsort` or `?n=99999` is a URL someone can type, and
   * the honest response is to ignore it, not to crash or to render a bench with
   * a setting that does not exist.
   */
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);

    const algoParam = q.get('algo');
    if (algoParam && algorithms.some((a) => a.id === algoParam)) setAlgoId(algoParam);

    const shapeParam = q.get('shape');
    if (shapeParam && distributions.some((d) => d.id === shapeParam)) {
      setShape(shapeParam as Distribution);
    }

    const nParam = Number.parseInt(q.get('n') ?? '', 10);
    if (Number.isInteger(nParam)) setN(Math.min(MAX_N, Math.max(MIN_N, nParam)));

    const seedParam = parseSeed(q.get('seed'));
    if (seedParam !== null) setSeed(seedParam);

    setLinked(true);
  }, []);

  /*
   * Mirror the settings back into the address bar.
   *
   * The URL is *edited*, not rebuilt: `LabShell` owns `?bench=` and the
   * `#bench-*` hash and rewrites them on every tab click, so a bench that
   * assembled its own URL from scratch would delete the shell's parameter and
   * the two would fight forever. Copying the current location and touching only
   * these four keys splits ownership cleanly — the shell names the bench, the
   * bench names its run — and the string comparison before `replaceState` means
   * a render that changed nothing writes nothing.
   */
  useEffect(() => {
    if (!linked) return;

    const url = new URL(window.location.href);
    const put = (key: string, value: string, fallback: string) => {
      if (value === fallback) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    };

    put('algo', algoId, DEFAULT_ALGO);
    put('shape', shape, DEFAULT_SHAPE);
    put('n', String(n), String(DEFAULT_N));
    put('seed', String(seed), String(DEFAULT_SEED));

    const next = `${url.pathname}${url.search}${url.hash}`;
    const now = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== now) window.history.replaceState(null, '', next);
  }, [linked, algoId, shape, n, seed]);

  /*
   * The origin, read after mount rather than during render, because `window`
   * does not exist while this component is being prerendered.
   */
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  /**
   * The shareable address of exactly this run.
   *
   * Unlike the address bar this spells out all four settings even when they are
   * the defaults. A copied link is a promise about what the recipient will see,
   * and an implicit default is a promise that breaks the day a default changes.
   */
  const permalink = useMemo(() => {
    const path = benchPath(BENCH_ID);
    const q = new URLSearchParams({ algo: algoId, shape, n: String(n), seed: String(seed) });
    return `${origin}${path}${path.includes('?') ? '&' : '?'}${q}#${benchFragment(BENCH_ID)}`;
  }, [origin, algoId, shape, n, seed]);

  /** A fresh arrangement — and never the one already on screen. */
  const reroll = useCallback(() => {
    setSeed((current) => {
      let next = randomSeed();
      while (next === current) next = randomSeed();
      return next;
    });
    haptic('press');
  }, []);

  /* ---------------- the run ---------------- */

  const algo = useMemo(
    () => algorithms.find((a) => a.id === algoId) ?? algorithms[0],
    [algoId],
  );

  /** The distribution's own words, for captions that have to read as English. */
  const shapeLabel = useMemo(
    () => distributions.find((d) => d.id === shape)?.label.toLowerCase() ?? shape,
    [shape],
  );

  /*
   * The entire run, computed once per input change.
   *
   * This is the expensive call in the bench — and at these sizes "expensive"
   * means a few hundred small objects and about a millisecond, which is why it
   * can sit in a `useMemo` during render rather than in an effect with a
   * loading state. The quadratic sorts are what bound it: bubble sort at n=48
   * produces roughly 1,200 steps, each holding a 48-element snapshot.
   */
  const trace = useMemo(() => algo.run(input), [algo, input]);

  // `steps.length`, not `trace.length`: this bench records, so the two are
  // equal, and this number also bounds the `trace.steps[...]` reads below.
  // Reading the array keeps that bound true by construction even if a caller
  // ever hands this view a counted trace, where `length` would overrun it.
  const total = trace.steps.length;

  /*
   * Any change of input or algorithm invalidates the cursor: step 400 of a
   * 1,200-step bubble sort is not step 400 of a 190-step merge sort. Reset to
   * the start rather than clamping, so what plays is a run from the beginning.
   */
  useEffect(() => {
    setCursor(0);
  }, [trace]);

  /* ---------------- the playhead ---------------- */

  const rate = BASE_RATE * Number(speed);

  useEffect(() => {
    if (!playing) return;

    /*
     * A fractional step accumulator, advanced by real elapsed time.
     *
     * Without this the loop would move one step per frame, which is a
     * display-refresh-rate-dependent speed: identical settings would run twice
     * as fast on a 120Hz phone as on a 60Hz laptop. Accumulating `dt * rate`
     * instead makes the step rate what the control says it is, and lets 8×
     * take several steps in a single frame rather than being capped by the
     * refresh rate.
     */
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const tick = (now: number) => {
      // Clamp dt: a tab that was backgrounded mid-play returns with a huge
      // delta, and without a ceiling the first frame back would jump hundreds
      // of steps at once.
      const dt = Math.min((now - last) / 1000, 0.25);
      last = now;
      acc += dt * rate;

      if (acc >= 1) {
        const advance = Math.floor(acc);
        acc -= advance;
        setCursor((c) => {
          const next = c + advance;
          if (next >= total) {
            setPlaying(false);
            return total;
          }
          return next;
        });
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, rate, total]);

  /** Play from the start if the run has already finished. */
  const onPlayPause = useCallback(() => {
    setPlaying((p) => {
      if (!p && cursor >= total) setCursor(0);
      return !p;
    });
  }, [cursor, total]);

  const onSeek = useCallback((v: number) => {
    setPlaying(false);
    setCursor(v);
  }, []);

  const onReset = useCallback(() => {
    setPlaying(false);
    setCursor(0);
  }, []);

  /* ---------------- the view, derived ---------------- */

  /*
   * `cursor === 0` shows the unsorted input, before any step has been applied.
   * Every later cursor shows the snapshot the step left behind, which is why
   * the step is looked up at `cursor - 1`.
   */
  const step: Step | null = cursor > 0 ? trace.steps[cursor - 1] : null;
  const view = step ? step.array : input;
  const active = step ? step.indices : [];

  /*
   * Which positions are finished.
   *
   * Recomputed by scanning the settle steps up to the cursor rather than
   * accumulated into state as playback runs. Accumulating would be less work
   * per frame and would also be wrong the moment someone dragged the scrubber
   * backwards, because a set built by appending has no way to un-append. This
   * keeps the rule that the view is a pure function of `(trace, cursor)`.
   */
  const settled = useMemo(() => {
    const s = new Set<number>();
    for (let i = 0; i < cursor; i++) {
      const st = trace.steps[i];
      if (st.kind === 'settle') for (const idx of st.indices) s.add(idx);
    }
    return s;
  }, [trace, cursor]);

  /** Counts up to the cursor, so the readouts track the scrubber. */
  const soFar = useMemo(() => {
    let comparisons = 0;
    let writes = 0;
    for (let i = 0; i < cursor; i++) {
      const k = trace.steps[i].kind;
      if (k === 'compare') comparisons++;
      else if (k === 'swap') writes += 2;
      else if (k === 'overwrite') writes++;
    }
    return { comparisons, writes };
  }, [trace, cursor]);

  const done = cursor >= total;

  /*
   * Does the sort actually sort?
   *
   * The last step's snapshot is the output — there is no separate "result" to
   * check, because the trace *is* the run. Both properties are tested against
   * the input the visitor is looking at, so this is not a unit test that passed
   * once on the author's machine: it is a claim re-established on every
   * distribution, every size and every seed anyone ever tries.
   *
   * Memoised on the trace rather than the cursor: the answer is about the whole
   * run, not about where the playhead happens to be, so it must not flicker as
   * the scrubber moves.
   */
  const verification = useMemo(
    () => verifySort(input, total > 0 ? trace.steps[total - 1].array : input),
    [input, trace, total],
  );

  /*
   * Completion is a real event, so it gets the machine's vocabulary.
   *
   * Guarded on a ref rather than fired from the render path: `done` is true for
   * every render while the run sits finished, and buzzing a phone on each of
   * those would be a continuous vibration.
   */
  const wasDone = useRef(false);
  useEffect(() => {
    if (done && total > 0 && !wasDone.current) haptic('lock');
    wasDone.current = done && total > 0;
  }, [done, total]);

  const max = n;

  return (
    <div className="lab-bench">
      {/* ---------------- controls ---------------- */}
      <Bay
        n="01"
        title="Configure"
        note="The trace is recomputed the moment any of these change — nothing here animates a running sort, it re-runs it."
        className="lab-bay--narrow"
      >
        <Segmented
          label="Algorithm"
          options={algorithms.map((a) => ({ id: a.id, label: a.name }))}
          value={algoId}
          onChange={setAlgoId}
          columns={2}
        />

        <p className="lab-note">{algo.note}</p>

        <Segmented
          label="Input"
          options={distributions.map((d) => ({ id: d.id, label: d.label, hint: d.note }))}
          value={shape}
          onChange={setShape}
          columns={2}
        />

        <Slider
          label="Elements"
          value={n}
          min={MIN_N}
          max={MAX_N}
          onChange={(v) => setN(v)}
          hint="Larger arrays make the quadratic sorts' step counts diverge sharply from the O(n log n) ones."
        />

        <Segmented label="Speed" options={speedOptions} value={speed} onChange={setSpeed} />

        {/*
          The seed, shown rather than hidden.

          Printing it is what turns "some random array" into a specific one the
          visitor can point at, and it is the only way the permalink beside it
          means anything. The number is `aria-live` because re-rolling changes it
          without moving focus, and a screen reader user pressing the button
          otherwise gets no confirmation that anything happened at all.
        */}
        <div className="lab-seed">
          <p className="lab-seed__row">
            <span className="lab-seed__key">Seed</span>
            <span className="lab-seed__val" aria-live="polite">
              {seed}
            </span>
          </p>

          <div className="lab-seed__acts">
            <button type="button" className="btn lab-shuffle" onClick={reroll}>
              Re-roll input
            </button>
            <CopyButton value={permalink} label="Copy link" done="Link copied" />
          </div>

          <p className="lab-note">
            Algorithm, distribution, size and seed are all in the address bar, so this exact
            run reopens from a link — including a run where the self-check fails.
          </p>
        </div>
      </Bay>

      {/* ---------------- the array ---------------- */}
      <Bay
        n="02"
        title="Execute"
        note={`${algo.name} — ${algo.time} time, ${algo.space} space, ${algo.stable ? 'stable' : 'not stable'}.`}
      >
        <Transport
          playing={playing}
          onPlayPause={onPlayPause}
          cursor={cursor}
          total={total}
          onSeek={onSeek}
          onReset={onReset}
        >
          <span className="lab-transport__pos">
            {num(cursor)}
            <span aria-hidden="true"> / </span>
            <span className="sr-only"> of </span>
            {num(total)}
          </span>
        </Transport>

        {/*
          The bars.

          A flex row of divs, not a canvas: at n<=48 that is at most 48 nodes,
          and every frame changes only their heights and classes — which the
          compositor handles without a repaint of the container. A canvas would
          need its own draw loop and would take the bars out of the DOM, where
          they are currently readable by assistive tech through the table below.
        */}
        <div className="lab-bars" role="img" aria-label={`Array of ${n} elements, ${done ? 'sorted' : `${num(settled.size)} in final position`}`}>
          {view.map((v, i) => {
            const isActive = active.includes(i);
            const isSettled = settled.has(i);
            const kind = isActive && step ? step.kind : null;
            return (
              <div
                key={i}
                className={[
                  'lab-bar',
                  isSettled ? 'is-settled' : '',
                  kind ? `is-${kind}` : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ height: `${(v / max) * 100}%` }}
              />
            );
          })}
        </div>

        {/*
          What the current step did, in words.

          `aria-live="polite"` with the playhead running would be a firehose, so
          this is only a live region while playback is paused — which is exactly
          when someone is stepping through and needs each step announced.
        */}
        <p className="lab-step" aria-live={playing ? 'off' : 'polite'}>
          {step ? (
            <>
              <span className={`lab-step__kind is-${step.kind}`}>{STEP_VERB[step.kind]}</span>
              <span className="lab-step__idx">
                {step.indices.map((i) => `[${i}]`).join(' ')}
              </span>
            </>
          ) : (
            <span className="lab-step__kind">Ready — unsorted input</span>
          )}
        </p>

        <dl className="lab-stats">
          <Stat k="Comparisons" v={num(soFar.comparisons)} tone="cyan" />
          <Stat k="Writes" v={num(soFar.writes)} tone="amber" />
          <Stat k="Steps" v={`${num(cursor)} / ${num(total)}`} />
          <Stat k="Settled" v={`${num(settled.size)} / ${num(n)}`} />
        </dl>

        {/*
          The properties the output has to satisfy, checked against this run.

          Rendered whatever the answer is. A badge that only ever appears when it
          says "pass" is decoration; one that can say "fail" — and name the index
          where the order broke — is a test. It sits under the array because it
          is a statement about what the bars ended up as.
        */}
        <VerifyBadge verification={verification} label="Output properties" />
      </Bay>

      {/* ---------------- the comparison ---------------- */}
      <Bay
        n="03"
        title="Compare"
        note="Every one of these numbers is counted from a real trace of the same input — none of them is a formula."
      >
        <TableWrap>
          <table className="lab-table">
            <caption className="sr-only">
              All five algorithms run against the current input: {n} {shapeLabel} elements from
              seed {seed}
            </caption>
            <thead>
              <tr>
                <th scope="col">Algorithm</th>
                <th scope="col">Time</th>
                <th scope="col">Comparisons</th>
                <th scope="col">Writes</th>
                <th scope="col">Stable</th>
              </tr>
            </thead>
            <tbody>
              {algorithms.map((a) => {
                /*
                 * Re-running all five on every render of this table is
                 * deliberate and cheap: five traces at n<=48 is a couple of
                 * milliseconds, and the alternative — caching per algorithm —
                 * would need invalidating on the same inputs the memo above
                 * already tracks, for no measurable gain.
                 *
                 * The current algorithm is not re-run; its trace is reused.
                 */
                const t = a.id === algo.id ? trace : a.run(input);
                const isCurrent = a.id === algo.id;
                return (
                  <tr key={a.id} className={isCurrent ? 'is-current' : undefined}>
                    <th scope="row">
                      {a.name}
                      {isCurrent && <span className="sr-only"> (currently shown)</span>}
                    </th>
                    <td className="is-mono">{a.time}</td>
                    <td className="is-mono is-cyan">{num(t.comparisons)}</td>
                    <td className="is-mono is-amber">{num(t.writes)}</td>
                    <td className="is-mono">{a.stable ? 'Yes' : 'No'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>

        <p className="lab-note">
          Run this on <strong>Sorted</strong> input to see bubble sort&rsquo;s early exit beat
          every divide-and-conquer sort here, and quicksort degrade to its worst case on the
          same data. Then try <strong>Many duplicates</strong>, where the stability column stops
          being trivia: only the stable sorts leave equal elements in the order they arrived.
        </p>
      </Bay>
    </div>
  );
}
