'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  IDLE,
  PRIORITY_MAX,
  PROC_MAX,
  PROC_MIN,
  QUANTUM_MAX,
  QUANTUM_MIN,
  UNRUN,
  findPolicy,
  findShape,
  makeWorkload,
  policies,
  shapes,
  simulate,
  verifyRun,
  type PolicyId,
  type ShapeId,
  type StepKind,
} from '@/lib/lab/scheduler';
import { frameAt, stepAt } from '@/lib/lab/core/trace';
import { parseSeed, randomSeed } from '@/lib/lab/core/rng';
import { benchFragment, benchPath } from '@/lib/lab/catalogue';
import { haptic } from '@/lib/haptics';
import {
  Bay,
  CopyButton,
  Segmented,
  Slider,
  Stat,
  Transport,
  VerifyBadge,
  num,
  type Option,
} from './Controls';

/**
 * SCHEDULER BENCH — the view layer over `lib/lab/scheduler.ts`.
 *
 * Same contract as every other bench here: the engine runs to completion in a
 * `useMemo`, the playhead only moves an integer, and what is drawn is
 * `frameAt(trace, cursor)`. This component cannot schedule anything and does
 * not know how — it reads `frame.lane` and paints it.
 *
 * ── Why the Gantt chart is a table ──────────────────────────────────────
 * Because it is one. A Gantt chart of a schedule is a grid of processes against
 * time, and the accessible name for a cell in it is "P3 held the CPU at tick
 * 11" — which is a row header, a column header and a value. Building it out of
 * absolutely-positioned divs would have meant inventing an ARIA grid to
 * describe a real table, so the markup is a real table and the visual bars are
 * cell backgrounds. Screen readers get row and column semantics for free, and
 * so does keyboard navigation in the browsers that provide it.
 *
 * The alternative most visualisers pick — one div per process with a `width`
 * derived from its burst — cannot draw a preempted process at all without
 * splitting into multiple divs anyway, and round robin splits constantly.
 *
 * ── What the visitor is meant to notice ─────────────────────────────────
 * Bay 03 is the argument. On `Convoy`, FCFS shows an average wait roughly twice
 * SRTF's, because one long job at the front holds up a queue of one-tick jobs;
 * on the same workload round robin has the lowest response time and the most
 * context switches, which is the trade it exists to make. Those numbers come
 * from five real simulations of the workload above them, so changing the seed
 * changes all five together.
 */

const BENCH_ID = 'scheduler';

/** Defaults, kept out of the address bar so a clean link stays clean. */
const DEFAULT_POLICY: PolicyId = 'fcfs';
const DEFAULT_SHAPE: ShapeId = 'convoy';
const DEFAULT_PROCS = 5;
const DEFAULT_QUANTUM = 2;
const DEFAULT_SEED = 7;

/**
 * Steps per second at 1×.
 *
 * Slower than the pathfinding bench's 40 and closer to the sorting bench's 14,
 * because a scheduling trace is short — a few dozen steps — and every one of
 * them is a decision worth seeing. At 40/sec the whole run would be over before
 * the eye caught the first preemption.
 */
const BASE_RATE = 6;
const SPEEDS = [0.5, 1, 2, 4] as const;
type Speed = `${(typeof SPEEDS)[number]}`;

const speedOptions: Option<Speed>[] = SPEEDS.map((s) => ({
  id: String(s) as Speed,
  label: `${s}×`,
}));

const policyOptions: Option<PolicyId>[] = policies.map((p) => ({
  id: p.id,
  label: p.name,
  hint: p.note,
}));

const shapeOptions: Option<ShapeId>[] = shapes.map((s) => ({
  id: s.id,
  label: s.name,
  hint: s.note,
}));

/** What a step did, in words. Also drives the live region. */
const STEP_VERB: Record<StepKind, string> = {
  arrive: 'Arrived',
  dispatch: 'Dispatched',
  run: 'Ran',
  preempt: 'Preempted',
  complete: 'Completed',
  idle: 'Idle',
};

export function SchedulerBench() {
  const [policyId, setPolicyId] = useState<PolicyId>(DEFAULT_POLICY);
  const [shape, setShape] = useState<ShapeId>(DEFAULT_SHAPE);
  const [count, setCount] = useState(DEFAULT_PROCS);
  const [quantum, setQuantum] = useState(DEFAULT_QUANTUM);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [speed, setSpeed] = useState<Speed>('1');
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);

  /* ---------------- the run in the URL ---------------- */

  /*
   * Read the link before writing to it — a state flag rather than a ref, for
   * the reason spelled out in `SortingBench`: on mount both effects run in the
   * same commit, and a ref guard would let the write fire with the pre-read
   * settings and strip the parameters it was about to be told about.
   */
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);

    const policyParam = q.get('policy');
    if (policyParam && findPolicy(policyParam)) setPolicyId(policyParam as PolicyId);

    const shapeParam = q.get('load');
    if (shapeParam && findShape(shapeParam)) setShape(shapeParam as ShapeId);

    const procsParam = Number.parseInt(q.get('procs') ?? '', 10);
    if (Number.isInteger(procsParam)) {
      setCount(Math.min(PROC_MAX, Math.max(PROC_MIN, procsParam)));
    }

    const quantumParam = Number.parseInt(q.get('quantum') ?? '', 10);
    if (Number.isInteger(quantumParam)) {
      setQuantum(Math.min(QUANTUM_MAX, Math.max(QUANTUM_MIN, quantumParam)));
    }

    const seedParam = parseSeed(q.get('seed'));
    if (seedParam !== null) setSeed(seedParam);

    setLinked(true);
  }, []);

  /*
   * Mirror the settings back. The URL is edited rather than rebuilt, because
   * `LabShell` owns `?bench=` and the `#bench-*` hash; a bench that assembled
   * its own address would delete the shell's parameter and the two would fight.
   */
  useEffect(() => {
    if (!linked) return;

    const url = new URL(window.location.href);
    const put = (key: string, value: string, fallback: string) => {
      if (value === fallback) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    };

    put('policy', policyId, DEFAULT_POLICY);
    put('load', shape, DEFAULT_SHAPE);
    put('procs', String(count), String(DEFAULT_PROCS));
    put('seed', String(seed), String(DEFAULT_SEED));

    /*
     * The quantum is only in the link when round robin is selected. It is the
     * one setting that does nothing under the other four policies, and a link
     * carrying `quantum=5` beside `policy=fcfs` would imply it changed
     * something.
     */
    if (policyId === 'rr') put('quantum', String(quantum), String(DEFAULT_QUANTUM));
    else url.searchParams.delete('quantum');

    const next = `${url.pathname}${url.search}${url.hash}`;
    const now = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== now) window.history.replaceState(null, '', next);
  }, [linked, policyId, shape, count, quantum, seed]);

  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  /** Spells out every setting, even defaults — a link is a promise. */
  const permalink = useMemo(() => {
    const path = benchPath(BENCH_ID);
    const q = new URLSearchParams({
      policy: policyId,
      load: shape,
      procs: String(count),
      seed: String(seed),
    });
    if (policyId === 'rr') q.set('quantum', String(quantum));
    return `${origin}${path}${path.includes('?') ? '&' : '?'}${q}#${benchFragment(BENCH_ID)}`;
  }, [origin, policyId, shape, count, quantum, seed]);

  /** A different workload — and never the one already on screen. */
  const reroll = useCallback(() => {
    setSeed((current) => {
      let next = randomSeed();
      while (next === current) next = randomSeed();
      return next;
    });
    haptic('press');
  }, []);

  /* ---------------- the run ---------------- */

  const workload = useMemo(() => makeWorkload(shape, count, seed), [shape, count, seed]);

  const policy = useMemo(() => findPolicy(policyId) ?? policies[0], [policyId]);

  /*
   * The whole simulation, computed once per (workload, policy, quantum).
   *
   * At most eight processes of at most nine ticks each, so this is under a
   * hundred steps carrying a few hundred bytes apiece — small enough to build
   * during render rather than behind a loading state.
   */
  const run = useMemo(
    () => simulate(workload, policy.id, quantum),
    [workload, policy, quantum],
  );
  const { trace, outcome } = run;
  const total = trace.steps.length;

  /*
   * A new workload or policy invalidates the cursor entirely — step 20 of an
   * SRTF run is not step 20 of the FCFS run over the same processes. Park at
   * the resting position rather than clamping, so what plays is a whole run.
   */
  useEffect(() => {
    setCursor(-1);
  }, [trace]);

  /* ---------------- the playhead ---------------- */

  const rate = BASE_RATE * Number(speed);

  useEffect(() => {
    if (!playing) return;

    /*
     * Fractional accumulator advanced by elapsed time, so the rate is what the
     * control says rather than one step per display refresh. `dt` is clamped
     * because a backgrounded tab returns with a huge delta, and without a
     * ceiling the first frame back would jump the whole run.
     */
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.25);
      last = now;
      acc += dt * rate;

      if (acc >= 1) {
        const advance = Math.floor(acc);
        acc -= advance;
        setCursor((c) => {
          const next = c + advance;
          if (next >= total - 1) {
            setPlaying(false);
            return total - 1;
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
      if (!p && cursor >= total - 1) setCursor(-1);
      return !p;
    });
    haptic('press');
  }, [cursor, total]);

  const onSeek = useCallback((v: number) => {
    setPlaying(false);
    setCursor(v);
  }, []);

  const onReset = useCallback(() => {
    setPlaying(false);
    setCursor(-1);
    haptic('press');
  }, []);

  /* ---------------- what is on screen ---------------- */

  const frame = useMemo(() => frameAt(trace, cursor), [trace, cursor]);
  const step = useMemo(() => stepAt(trace, cursor), [trace, cursor]);

  /**
   * Context switches so far, counted off the lane that is on screen.
   *
   * This started as `tallyThrough(trace, cursor).switched`, which was wrong in a
   * way worth recording: `tallyThrough` counts steps by *kind*, and there is no
   * `switched` kind — it is a tally the engine keeps beside the trace. So the
   * readout was a constant zero, and nothing caught it, because zero is a
   * plausible number to see at the start of a run.
   *
   * Counting it here is the better repair rather than merely the available one.
   * A switch is a change of occupant between two consecutive *busy* ticks, so
   * taking it from `frame.lane` means the figure is derivable from the chart the
   * visitor is looking at — which is the rule the rest of this bench follows.
   * `IDLE` is skipped rather than treated as an occupant, matching the engine's
   * definition exactly: returning to the same process after an idle gap is not a
   * switch, and re-dispatching the only runnable process is not one either.
   */
  const switchesSoFar = useMemo(() => {
    let count = 0;
    let previous = IDLE;
    for (let t = 0; t < frame.lane.length; t += 1) {
      const owner = frame.lane[t];
      if (owner === IDLE || owner === UNRUN) continue;
      if (previous !== IDLE && owner !== previous) count += 1;
      previous = owner;
    }
    return count;
  }, [frame]);

  /*
   * The properties this run has to satisfy, recomputed inside the engine from
   * the finished lane. Not from the cursor: a schedule is not wrong halfway
   * through, it is merely unfinished.
   */
  const verification = useMemo(
    () => verifyRun(workload, policy, quantum, outcome),
    [workload, policy, quantum, outcome],
  );

  /** Confirm completion the way the sorting bench confirms a finished sort. */
  const wasDone = useRef(false);
  const done = cursor >= total - 1 && total > 0;
  useEffect(() => {
    if (done && !wasDone.current) haptic('lock');
    wasDone.current = done;
  }, [done]);

  /*
   * All five policies over the workload on screen.
   *
   * `record = false` builds no frames, so this is five counting passes over at
   * most eight processes — the same code path the chart above uses, which is
   * the only way the row for the current policy can be trusted to agree with
   * it. The current policy's own row reuses the recorded run rather than
   * simulating a sixth time.
   */
  const comparison = useMemo(
    () =>
      policies.map((p) => ({
        policy: p,
        outcome:
          p.id === policy.id
            ? outcome
            : simulate(workload, p.id, quantum, false).outcome,
      })),
    [workload, policy, quantum, outcome],
  );

  /**
   * The best average wait any policy managed, so the table can mark it.
   *
   * Measured across the five rows rather than assumed to be SRTF's: on a
   * workload where every process arrives at tick 0, SJF and SRTF tie, and
   * hard-coding a winner would print a claim the numbers might not support.
   */
  const bestWaiting = useMemo(
    () => comparison.reduce((lo, c) => Math.min(lo, c.outcome.avgWaiting), Infinity),
    [comparison],
  );

  const shapeNote = findShape(shape)?.note ?? '';

  /** Ticks the chart draws. The full span once finished, the cursor's before. */
  const span = outcome.span;

  /** Plain-language state of the chart, for the figure's accessible name. */
  const caption = done
    ? `all ${num(workload.procs.length)} processes finished at tick ${num(span)}, average wait ${outcome.avgWaiting.toFixed(2)} ticks`
    : `tick ${num(Math.max(0, frame.tick))}, ${num(frame.finished)} of ${num(workload.procs.length)} finished`;

  return (
    <div className="lab-bench">
      {/* ---------------- the workload ---------------- */}
      <Bay
        n="01"
        title="Generate"
        note="One seeded set of processes, five policies. Each workload shape is built to expose a specific policy's weakness rather than to look random."
        className="lab-bay--narrow"
      >
        <Segmented
          label="Workload"
          options={shapeOptions}
          value={shape}
          onChange={setShape}
          columns={2}
        />

        <Slider
          label="Processes"
          value={count}
          min={PROC_MIN}
          max={PROC_MAX}
          onChange={setCount}
          format={(v) => `${v} processes`}
          hint={`Capped at ${PROC_MAX} for two reasons: the chart needs a labelled row each, and the optimality check brute-forces every ordering — ${PROC_MAX} is 40,320 of them, nine would be 362,880.`}
        />

        {/*
          The seed, printed rather than hidden.

          It is the name of this workload: `makeWorkload` is a pure function of
          shape, count and seed, so these three values *are* the process table.
          `aria-live` because re-rolling changes the number without moving focus.
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
              New workload
            </button>
            <CopyButton value={permalink} label="Copy link" done="Link copied" />
          </div>

          <p className="lab-note">{shapeNote}</p>
        </div>

        {/*
          The processes as the scheduler receives them: what they want, before
          anything has decided when they get it. Kept in bay 01 rather than
          beside the chart because it is an input, and the distinction between
          what was asked for and what was granted is the whole subject.
        */}
        <div className="lab-table-wrap">
          <table className="lab-table lab-table--tight">
            <caption className="sr-only">
              The {workload.procs.length} processes generated from seed {seed}
            </caption>
            <thead>
              <tr>
                <th scope="col">Process</th>
                <th scope="col">Arrives</th>
                <th scope="col">Burst</th>
                <th scope="col">Priority</th>
              </tr>
            </thead>
            <tbody>
              {workload.procs.map((p) => (
                <tr key={p.id}>
                  <th scope="row">
                    <span className={`lab-chip is-p${p.id % 8}`} aria-hidden="true" />
                    {p.name}
                  </th>
                  <td className="is-mono">{num(p.arrival)}</td>
                  <td className="is-mono is-cyan">{num(p.burst)}</td>
                  <td className="is-mono">
                    {p.priority}
                    <span className="sr-only"> of {PRIORITY_MAX}, 1 most urgent</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bay>

      {/* ---------------- the schedule ---------------- */}
      <Bay
        n="02"
        title="Schedule"
        note={`${policy.full} — ${policy.preemptive ? 'preemptive' : 'runs each process to completion'}. Cost: ${policy.cost.toLowerCase()}`}
      >
        <Segmented
          label="Policy"
          options={policyOptions}
          value={policyId}
          onChange={setPolicyId}
          columns={2}
        />

        {/*
          The quantum only exists for round robin, so it is only rendered for
          round robin. A disabled control would be four policies' worth of dead
          UI explaining itself; an absent one explains nothing and misleads
          nobody.
        */}
        {policyId === 'rr' && (
          <Slider
            label="Quantum"
            value={quantum}
            min={QUANTUM_MIN}
            max={QUANTUM_MAX}
            onChange={setQuantum}
            format={(v) => `${v} tick${v === 1 ? '' : 's'}`}
            hint="The dial that can be wrong in both directions: small buys responsiveness with context switches, large decays into first-come-first-served. Watch the switch count and the response time move in opposite directions."
          />
        )}

        <Segmented label="Speed" options={speedOptions} value={speed} onChange={setSpeed} />

        <Transport
          playing={playing}
          onPlayPause={onPlayPause}
          cursor={Math.max(0, cursor + 1)}
          total={total}
          onSeek={(v) => onSeek(v - 1)}
          onReset={onReset}
        >
          <span className="lab-transport__pos">
            {num(Math.max(0, cursor + 1))}
            <span aria-hidden="true"> / </span>
            <span className="sr-only"> of </span>
            {num(total)}
          </span>
        </Transport>

        {/*
          The Gantt chart.

          A real table, for the reason in the file header. It carries no inline
          style: a table lays its own columns out, so unlike the pathfinding grid
          there is no column count to hand to CSS.

          Every cell reads `frame.lane`, which is a full copy of the lane as it
          stood at this step — that is what makes scrubbing backwards genuinely
          un-draw the bars instead of dimming them. `UNRUN` ticks are drawn as
          not-yet-simulated rather than as idle, because a half-played chart and
          a finished one with a gap in it mean different things.
        */}
        <div className="lab-gantt-wrap">
          <table
            className="lab-gantt"
            aria-label={`Gantt chart, ${policy.full} — ${caption}`}
          >
            <caption className="sr-only">
              Which process held the CPU at each of the {span} ticks, under {policy.full}
            </caption>
            <thead>
              <tr>
                <th scope="col" className="lab-gantt__corner">
                  <span className="sr-only">Process</span>
                </th>
                {Array.from({ length: span }, (_, t) => (
                  <th key={t} scope="col" className="lab-gantt__tick">
                    {/*
                      Only every other label is shown once the span is long
                      enough for them to collide, but all of them stay in the
                      accessible tree — a screen reader has no collision
                      problem, and hiding a column header from it would leave
                      the cells unlabelled.
                    */}
                    <span className={span > 24 && t % 2 === 1 ? 'sr-only' : undefined}>{t}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workload.procs.map((p) => (
                <tr key={p.id}>
                  <th scope="row" className="lab-gantt__who">
                    <span className={`lab-chip is-p${p.id % 8}`} aria-hidden="true" />
                    {p.name}
                  </th>
                  {Array.from({ length: span }, (_, t) => {
                    const owner = frame.lane[t];
                    const mine = owner === p.id;
                    const pending = owner === UNRUN;
                    const waiting = !mine && !pending && p.arrival <= t;
                    return (
                      <td
                        key={t}
                        className={[
                          'lab-gantt__cell',
                          mine ? `is-run is-p${p.id % 8}` : '',
                          pending ? 'is-pending' : '',
                          waiting ? 'is-waiting' : '',
                          frame.tick === t ? 'is-now' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {/*
                          The only text in the body of the chart, and it is for
                          assistive technology alone. Sighted readers get the
                          bar; a screen reader gets "P3, tick 11, running",
                          which is what the bar means.
                        */}
                        <span className="sr-only">
                          {mine ? 'running' : pending ? 'not yet simulated' : waiting ? 'waiting' : 'not arrived'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/*
                The CPU's own row. Present so idle ticks have somewhere to be
                drawn: without it, a tick where nothing ran is an empty column,
                indistinguishable from a tick that has not been reached.
              */}
              <tr className="lab-gantt__cpu">
                <th scope="row" className="lab-gantt__who">
                  CPU
                </th>
                {Array.from({ length: span }, (_, t) => {
                  const owner = frame.lane[t];
                  return (
                    <td
                      key={t}
                      className={[
                        'lab-gantt__cell',
                        owner === IDLE ? 'is-idle' : '',
                        owner === UNRUN ? 'is-pending' : '',
                        owner >= 0 ? `is-run is-p${owner % 8}` : '',
                        frame.tick === t ? 'is-now' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <span className="sr-only">
                        {owner === IDLE
                          ? 'idle'
                          : owner === UNRUN
                            ? 'not yet simulated'
                            : (workload.procs[owner]?.name ?? '')}
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/*
          The ready queue, in the policy's own order.

          Front first, and the front is not always what runs next — SJF and
          priority pick out of the middle. Showing the queue rather than only
          the winner is what makes that visible instead of surprising.
        */}
        <p className="lab-queue" aria-live={playing ? 'off' : 'polite'}>
          <span className="lab-queue__key">Ready</span>
          {frame.ready.length > 0 ? (
            frame.ready.map((id, i) => (
              <span key={`${id}-${i}`} className={`lab-queue__item is-p${id % 8}`}>
                {workload.procs[id]?.name}
                <span className="lab-queue__left">{frame.left[id]}</span>
              </span>
            ))
          ) : (
            <span className="lab-queue__empty">empty</span>
          )}
        </p>

        {/*
          What the current step did. A live region only while paused — running
          it would be a firehose, and paused is exactly when someone stepping
          through needs each decision announced.
        */}
        <p className="lab-step" aria-live={playing ? 'off' : 'polite'}>
          {step ? (
            <>
              <span className={`lab-step__kind is-${step.kind}`}>{STEP_VERB[step.kind]}</span>
              <span className="lab-step__idx">
                {step.indices.length > 0
                  ? step.indices.map((i) => workload.procs[i]?.name ?? '?').join(' → ')
                  : `tick ${Math.max(0, frame.tick)} — nothing to run`}
              </span>
            </>
          ) : (
            <span className="lab-step__kind">Ready — the clock has not started</span>
          )}
        </p>

        <dl className="lab-stats">
          <Stat k="Avg wait" v={done ? outcome.avgWaiting.toFixed(2) : '—'} tone="cyan" />
          <Stat k="Avg turnaround" v={done ? outcome.avgTurnaround.toFixed(2) : '—'} />
          <Stat k="Switches" v={num(switchesSoFar)} tone="amber" />
          <Stat
            k="Utilisation"
            v={done ? `${Math.round(outcome.utilisation * 100)}%` : '—'}
          />
        </dl>

        {/*
          The self-check.

          Recomputed from the lane by code that shares nothing with the
          scheduler, and each policy is held only to what it actually promised —
          FCFS is not failed for a suboptimal wait it never claimed to avoid.
          On a staggered workload two checks disappear rather than being
          redefined; the engine explains why at the check itself.
        */}
        <VerifyBadge verification={verification} label="Schedule properties" />

        {/*
          The metrics table: what each process got, against what it asked for.
          Every figure here was measured from the lane above, and the badge
          proves it — check four recomputes this entire table independently and
          compares.
        */}
        <div className="lab-table-wrap">
          <table className="lab-table lab-table--tight">
            <caption className="sr-only">
              Per-process timings under {policy.full}
            </caption>
            <thead>
              <tr>
                <th scope="col">Process</th>
                <th scope="col">Wait</th>
                <th scope="col">Turnaround</th>
                <th scope="col">Response</th>
                <th scope="col">Slices</th>
              </tr>
            </thead>
            <tbody>
              {workload.procs.map((p) => {
                const m = outcome.metrics[p.id];
                const served = m.finish >= 0;
                return (
                  <tr key={p.id}>
                    <th scope="row">
                      <span className={`lab-chip is-p${p.id % 8}`} aria-hidden="true" />
                      {p.name}
                    </th>
                    <td className="is-mono is-cyan">{served ? num(m.waiting) : '—'}</td>
                    <td className="is-mono">{served ? num(m.turnaround) : '—'}</td>
                    <td className="is-mono is-amber">{m.start >= 0 ? num(m.response) : '—'}</td>
                    <td className="is-mono">{m.slices > 0 ? num(m.slices) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Bay>

      {/* ---------------- the comparison ---------------- */}
      <Bay
        n="03"
        title="Compare"
        note="All five policies over the workload above. Every number is measured from a real simulation — none of them is a formula."
      >
        <div className="lab-table-wrap">
          <table className="lab-table">
            <caption className="sr-only">
              Five policies over the same {workload.procs.length} processes from seed {seed}
            </caption>
            <thead>
              <tr>
                <th scope="col">Policy</th>
                <th scope="col">Avg wait</th>
                <th scope="col">Avg turnaround</th>
                <th scope="col">Avg response</th>
                <th scope="col">Switches</th>
                <th scope="col">Finished</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map(({ policy: p, outcome: o }) => {
                const isCurrent = p.id === policy.id;
                const isBest = o.avgWaiting === bestWaiting;
                return (
                  <tr key={p.id} className={isCurrent ? 'is-current' : undefined}>
                    <th scope="row">
                      {p.name}
                      {isCurrent && <span className="sr-only"> (currently shown)</span>}
                    </th>
                    <td className={`is-mono ${isBest ? 'is-cyan' : ''}`}>
                      {o.avgWaiting.toFixed(2)}
                      {isBest && <span className="sr-only"> — lowest of the five</span>}
                    </td>
                    <td className="is-mono">{o.avgTurnaround.toFixed(2)}</td>
                    <td className="is-mono">{o.avgResponse.toFixed(2)}</td>
                    <td className="is-mono is-amber">{num(o.switches)}</td>
                    <td className="is-mono">{num(o.span)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="lab-note">
          Every policy finishes at the same tick, because the same total work has to be done and
          none of these lets the CPU sit idle with a process waiting. What changes is who waited,
          and for how long. On <strong>Convoy</strong> the long job at the front is what makes
          first-come-first-served indefensible — the short jobs behind it wait out its whole burst.
          Shortest-remaining-time-first cuts the average wait by preempting it, and pays in context
          switches. Round robin usually posts the best response time and the worst switch count,
          which is the trade it exists to make. On <strong>All at once</strong> shortest-job-first
          matches shortest-remaining-time-first exactly, and the badge proves the number is the
          best any ordering could achieve.
        </p>
      </Bay>
    </div>
  );
}
