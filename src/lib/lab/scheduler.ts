/**
 * CPU SCHEDULING — the engine.
 *
 * Five scheduling policies dispatching one generated workload, one tick at a
 * time, with the whole run recorded as a trace so the resulting Gantt chart can
 * be scrubbed rather than merely displayed.
 *
 * WHY A TICK-DRIVEN SIMULATION AND NOT A FORMULA
 *
 * Scheduling is the topic where portfolio "visualisers" most often cheat. The
 * average waiting time for a set of processes under FCFS has a closed form, so
 * it is very tempting to compute the numbers directly, draw some coloured bars
 * whose widths came from the same arithmetic, and call the result a simulation.
 * Nothing about that page would be wrong, and nothing about it would be a
 * scheduler either: the bars and the numbers would be two renderings of one
 * formula, and a bug in the formula would show up in both, agreeing with
 * itself.
 *
 * This runs a clock. There is a `while` loop over ticks, a ready queue that is
 * genuinely pushed and popped, and a CPU that holds exactly one process per
 * tick or sits idle. Every number the bench prints — waiting time, turnaround,
 * response time, context switches, utilisation — is derived afterwards from the
 * lane of ticks the loop actually produced. That is what makes the self-check
 * at the bottom of this file meaningful: it recomputes each process's timings
 * from the lane alone, with no access to the scheduler's own bookkeeping, and
 * compares. Two paths, one answer, or the badge says so.
 *
 * WHY THESE FIVE POLICIES
 *
 * Because they disagree, and because the shape of their disagreement is the
 * actual lesson. FCFS is the only one that can be sabotaged by arrival order
 * alone — the convoy workload below exists to sabotage it. SJF beats it on
 * average waiting time and cannot preempt, so a long job already on the CPU
 * still blocks a short one that has just arrived; SRTF fixes exactly that and
 * pays for it in context switches. Round robin is the only one that bounds
 * response time, and its quantum is a dial the visitor can get wrong in both
 * directions. Priority scheduling is the only one that can starve a process
 * outright, which the bench can show rather than assert.
 *
 * @see src/components/lab/SchedulerBench.tsx — the view over this trace
 */

import { rng } from './core/rng';
import { check, ratio, verification, type Check, type Verification } from './core/verify';
import { counting, recording, type Recorder, type Trace } from './core/trace';

/* ═══════════════════════════════════════════════════════════════════════ *
 * THE WORKLOAD
 * ═══════════════════════════════════════════════════════════════════════ */

/** Fewest processes worth scheduling. Two cannot show a convoy or a rotation. */
export const PROC_MIN = 3;

/**
 * Most processes the bench will generate.
 *
 * Eight is a legibility limit, not a performance one: the Gantt chart needs one
 * labelled row per process and the metrics table needs one row per process, and
 * past eight both stop fitting a phone without either scrolling horizontally or
 * shrinking the type past reading size. The simulation itself would happily run
 * hundreds.
 *
 * It is also the limit that keeps `optimalTotals` honest — see the factorial
 * argument there.
 */
export const PROC_MAX = 8;

/** Shortest and longest CPU burst a generated process can want. */
export const BURST_MIN = 1;
export const BURST_MAX = 9;

/**
 * Priority levels, 1 being the most urgent.
 *
 * Small on purpose: the interesting behaviour of priority scheduling is ties
 * and starvation, and with a wide unique range you get neither — every process
 * has its own level, the order is total, and the policy degenerates into a
 * sorted list. Four levels over up to eight processes guarantees ties, which is
 * what makes the tie-break rule visible and worth documenting.
 */
export const PRIORITY_MAX = 4;

/** Round robin's time slice, in ticks. */
export const QUANTUM_MIN = 1;
export const QUANTUM_MAX = 6;

/**
 * Clamp a quantum to the range the simulation will actually honour.
 *
 * Exported because two places need the same number and they are not the same
 * function: `simulate` slices by it, and `verifyRun` computes the round robin
 * response bound from it. If the check used the raw value while the run used a
 * clamped one, a quantum outside the range would produce a bound the run was
 * never held to — a self-check testing a number nobody used.
 */
export function clampQuantum(q: number): number {
  return Math.max(QUANTUM_MIN, Math.min(QUANTUM_MAX, Math.floor(q)));
}

/**
 * Hard stop on the simulated clock.
 *
 * Every policy here is work-conserving and every burst is finite, so the loop
 * terminates on its own; this exists so that a future policy with a bug in its
 * dispatch rule fails as a visibly truncated run instead of hanging the tab.
 * The bound is generous — the longest legitimate run is every burst back to
 * back plus the idle ticks before the last arrival.
 */
const TICK_CAP = PROC_MAX * BURST_MAX + PROC_MAX * 4 + 8;

/** The CPU held nothing during this tick. */
export const IDLE = -1;

/** This tick has not been simulated yet. Distinct from idle, and not the same. */
export const UNRUN = -2;

/**
 * One process as the scheduler receives it: what it wants, not what it got.
 *
 * `burst` is the total CPU time the process needs, known up front. Real
 * schedulers do not know this — SJF and SRTF are unimplementable as written
 * without it, which is why production kernels use round robin with feedback
 * instead. The bench says so on the page rather than quietly presenting a
 * clairvoyant scheduler as a practical one.
 */
export interface Process {
  readonly id: number;
  /** Display name, `P1`-style. Assigned in arrival order. */
  readonly name: string;
  readonly arrival: number;
  readonly burst: number;
  /** 1 is most urgent. Only `priority` reads this. */
  readonly priority: number;
}

export type ShapeId = 'together' | 'stagger' | 'convoy' | 'mixed';

export interface Shape {
  readonly id: ShapeId;
  readonly name: string;
  /** What this shape is built to expose. Printed under the selector. */
  readonly note: string;
}

/**
 * The four workloads, each chosen because it makes a specific policy look bad.
 *
 * A generator that only produced uniform random arrivals and bursts would be
 * defensible and useless: the five policies would land within a tick or two of
 * each other on most seeds, and the bench would consist of five nearly
 * identical charts. These are adversarial on purpose, and each one names its
 * victim.
 */
export const shapes: readonly Shape[] = [
  {
    id: 'together',
    name: 'All at once',
    note: 'Every process is ready at tick 0. The only thing left to decide is order, which is the one case where shortest-job-first is provably optimal.',
  },
  {
    id: 'stagger',
    name: 'Staggered',
    note: 'Arrivals spread out with similar bursts, so the CPU sometimes runs dry. Idle ticks are real here, and utilisation stops being 100%.',
  },
  {
    id: 'convoy',
    name: 'Convoy',
    note: 'One long job arrives first, then a queue of very short ones. This is the workload that makes first-come-first-served indefensible.',
  },
  {
    id: 'mixed',
    name: 'Mixed',
    note: 'Arrivals, bursts and priorities all drawn independently. No policy is being set up to fail, which is why the differences are smaller.',
  },
];

export function findShape(id: string): Shape | null {
  return shapes.find((s) => s.id === id) ?? null;
}

/** A generated set of processes, plus the settings that produced it. */
export interface Workload {
  readonly procs: readonly Process[];
  readonly shape: ShapeId;
  readonly seed: number;
  /** Sum of every burst. The busy time any correct policy must spend. */
  readonly work: number;
}

/**
 * Build a workload from a seed.
 *
 * Deterministic, so a seed in the URL reproduces the exact set of processes on
 * any machine — that is the whole reason the bench can offer a shareable link
 * to a specific disagreement rather than a screenshot of one.
 *
 * Two normalisations happen at the end, and both matter for honesty rather than
 * tidiness. Processes are sorted by arrival so that `P1` is genuinely the first
 * to arrive — a chart whose row labels do not follow the clock is a chart that
 * has to be read twice. And the earliest arrival is shifted to tick 0, so the
 * lane never opens with idle ticks nobody chose; utilisation figures stay about
 * the scheduler's decisions instead of being diluted by dead time before the
 * first process existed.
 */
export function makeWorkload(shape: ShapeId, n: number, seed: number): Workload {
  const count = Math.max(PROC_MIN, Math.min(PROC_MAX, Math.floor(n)));
  const r = rng(seed);
  const draft: { arrival: number; burst: number; priority: number }[] = [];

  for (let i = 0; i < count; i += 1) {
    let arrival: number;
    let burst: number;

    switch (shape) {
      case 'together':
        arrival = 0;
        burst = r.int(BURST_MIN, BURST_MAX);
        break;

      case 'stagger':
        // Gaps of 2–4 ticks against bursts of 1–4: the arrival rate is
        // deliberately slower than the service rate, so the ready queue
        // genuinely empties and the CPU genuinely idles.
        arrival = i === 0 ? 0 : draft[i - 1].arrival + r.int(2, 4);
        burst = r.int(BURST_MIN, 4);
        break;

      case 'convoy':
        // The first job is the convoy: at least three quarters of the maximum
        // burst, arriving before anything else. Everything behind it is 1–2
        // ticks long and arrives while it is still running, so under FCFS every
        // short job waits out the whole long one.
        arrival = i === 0 ? 0 : r.int(1, 3);
        burst = i === 0 ? r.int(Math.ceil(BURST_MAX * 0.75), BURST_MAX) : r.int(1, 2);
        break;

      case 'mixed':
      default:
        arrival = i === 0 ? 0 : r.int(0, count * 2);
        burst = r.int(BURST_MIN, BURST_MAX);
        break;
    }

    draft.push({ arrival, burst, priority: r.int(1, PRIORITY_MAX) });
  }

  // Sorted by arrival, then by the order they were drawn — a stable rule, so
  // the same seed cannot produce two different namings of the same workload.
  draft.sort((a, b) => a.arrival - b.arrival);

  const first = draft.length > 0 ? draft[0].arrival : 0;
  const procs: Process[] = draft.map((d, i) => ({
    id: i,
    name: `P${i + 1}`,
    arrival: d.arrival - first,
    burst: d.burst,
    priority: d.priority,
  }));

  return {
    procs,
    shape,
    seed,
    work: procs.reduce((sum, p) => sum + p.burst, 0),
  };
}

/* ═══════════════════════════════════════════════════════════════════════ *
 * THE POLICIES
 * ═══════════════════════════════════════════════════════════════════════ */

export type PolicyId = 'fcfs' | 'sjf' | 'srtf' | 'rr' | 'priority';

export interface Policy {
  readonly id: PolicyId;
  readonly name: string;
  /** Expanded name, for the one place that has room for it. */
  readonly full: string;
  /** Can it take the CPU away from a process that has not finished? */
  readonly preemptive: boolean;
  /** The quantity it minimises, or `none` if it makes no such promise. */
  readonly claims: 'none' | 'waiting' | 'response';
  /** What the policy is actually good at, in one line. */
  readonly note: string;
  /** Its characteristic failure. Every one of these has one. */
  readonly cost: string;
}

/**
 * The five policies, in the order a course teaches them.
 *
 * `claims` is the field the self-check reads, and it is deliberately narrow.
 * SJF minimises average waiting time only when every process is already
 * present; SRTF extends that to arrivals over time. Round robin promises
 * nothing about waiting time at all — it bounds how long a process waits for
 * its *first* slice, which is a different quantity, and conflating the two is
 * the most common false claim in this topic.
 */
export const policies: readonly Policy[] = [
  {
    id: 'fcfs',
    name: 'FCFS',
    full: 'First come, first served',
    preemptive: false,
    claims: 'none',
    note: 'Runs processes in the order they arrived, to completion. The only policy here that needs to know nothing about a process except when it turned up.',
    cost: 'One long job at the front delays everything behind it — the convoy effect.',
  },
  {
    id: 'sjf',
    name: 'SJF',
    full: 'Shortest job first',
    preemptive: false,
    claims: 'waiting',
    note: 'Always dispatches the shortest waiting job. With every process present at tick 0 this provably minimises average waiting time.',
    cost: 'Needs the burst length in advance, and a long job can be passed over indefinitely.',
  },
  {
    id: 'srtf',
    name: 'SRTF',
    full: 'Shortest remaining time first',
    preemptive: true,
    claims: 'waiting',
    note: 'Shortest job first, rechecked every tick — a job arriving with less work left than the one running takes the CPU immediately.',
    cost: 'Pays for it in context switches, and still needs to know burst lengths.',
  },
  {
    id: 'rr',
    name: 'Round robin',
    full: 'Round robin',
    preemptive: true,
    claims: 'response',
    note: 'Each process gets at most one quantum before going to the back of the queue. The only policy here that bounds how long a process waits to run at all.',
    cost: 'A small quantum buys responsiveness with switches; a large one decays into FCFS.',
  },
  {
    id: 'priority',
    name: 'Priority',
    full: 'Priority, non-preemptive',
    preemptive: false,
    claims: 'none',
    note: 'Dispatches the most urgent waiting process, ties broken by arrival. Urgency is an input, not something the scheduler works out.',
    cost: 'A steady supply of urgent work starves a low-priority process outright.',
  },
];

export function findPolicy(id: string): Policy | null {
  return policies.find((p) => p.id === id) ?? null;
}

/* ═══════════════════════════════════════════════════════════════════════ *
 * THE SIMULATION
 * ═══════════════════════════════════════════════════════════════════════ */

/**
 * What happened at one point in the run.
 *
 * `run` is emitted once per executed tick, so the number of `run` steps in a
 * trace is exactly the total burst — a property the self-check relies on. The
 * other five are events between ticks, which is why a trace is longer than the
 * clock: a tick where a process arrives, is dispatched and then executes is
 * three steps at one tick, and each of those is a thing worth stopping on.
 */
export type StepKind = 'arrive' | 'dispatch' | 'run' | 'preempt' | 'complete' | 'idle';

/**
 * The whole machine at one instant.
 *
 * `lane` is the Gantt chart: one entry per tick, holding the id of the process
 * that owned the CPU, or `IDLE`, or `UNRUN` for ticks the clock has not reached
 * yet. Carrying the entire lane in every frame is what makes the chart
 * scrubbable — the view draws `frame.lane` and nothing else, so dragging the
 * scrubber backwards genuinely un-draws the bars rather than dimming them.
 *
 * `UNRUN` exists so that a half-scrubbed chart cannot be mistaken for a
 * finished one with an idle tail. Two absences that look identical but mean
 * different things are the sort of thing a visualiser is supposed to
 * distinguish.
 */
export interface Frame {
  /** The tick this frame describes. -1 before the clock starts. */
  readonly tick: number;
  readonly lane: Int8Array;
  /** Burst still owed, per process. */
  readonly left: Int32Array;
  /** The ready queue, front first. Order is the policy's own. */
  readonly ready: readonly number[];
  /** Process on the CPU, or `IDLE`. */
  readonly running: number;
  readonly finished: number;
}

/** Everything one process got out of the run, measured from the lane. */
export interface Metric {
  readonly id: number;
  /** First tick it held the CPU, or -1 if it never ran. */
  readonly start: number;
  /** The tick after its last, so `finish - arrival` is turnaround. */
  readonly finish: number;
  readonly waiting: number;
  readonly turnaround: number;
  /** Ticks between arriving and first running. What round robin bounds. */
  readonly response: number;
  /** Separate spells on the CPU. 1 for any non-preemptive policy. */
  readonly slices: number;
}

export interface Outcome {
  readonly metrics: readonly Metric[];
  /** The final lane. The authoritative record of what ran when. */
  readonly lane: Int8Array;
  /** Ticks simulated — the makespan, since the lane starts at 0. */
  readonly span: number;
  /** Ticks the CPU held a process. Equals total burst on a correct run. */
  readonly busy: number;
  readonly idle: number;
  /**
   * Dispatches of a process other than the one that last held the CPU.
   *
   * Defined that way rather than "number of dispatches" on purpose: round robin
   * with one runnable process re-dispatches it every quantum, and counting
   * those would report switching that no operating system would perform. An
   * idle gap does not reset it either — coming back to the same process is not
   * a context switch.
   */
  readonly switches: number;
  readonly avgWaiting: number;
  readonly avgTurnaround: number;
  readonly avgResponse: number;
  /** `busy / span`. Below 1 only when the CPU genuinely had nothing to do. */
  readonly utilisation: number;
  /** True if the clock hit `TICK_CAP`. Always false for a correct policy. */
  readonly truncated: boolean;
}

export interface Run {
  readonly trace: Trace<Frame, StepKind>;
  readonly outcome: Outcome;
}

/**
 * Which waiting process the policy would dispatch — an index into `ready`, or
 * -1 if nothing is waiting.
 *
 * Every non-FIFO policy breaks ties by arrival and then by id. Both fallbacks
 * are load-bearing: with only four priority levels ties are common, and without
 * a total order the chart would depend on the order the ready array happened to
 * be built in, which is an implementation detail masquerading as a scheduling
 * decision. Two runs of the same seed have to draw the same chart.
 */
function pick(
  policy: PolicyId,
  ready: readonly number[],
  procs: readonly Process[],
  left: Int32Array,
): number {
  if (ready.length === 0) return -1;
  // FCFS and round robin are the same rule: whoever has been waiting longest.
  if (policy === 'fcfs' || policy === 'rr') return 0;

  let best = 0;
  for (let i = 1; i < ready.length; i += 1) {
    const a = ready[i];
    const b = ready[best];
    let keyA: number;
    let keyB: number;

    if (policy === 'sjf') {
      keyA = procs[a].burst;
      keyB = procs[b].burst;
    } else if (policy === 'srtf') {
      keyA = left[a];
      keyB = left[b];
    } else {
      keyA = procs[a].priority;
      keyB = procs[b].priority;
    }

    if (
      keyA < keyB ||
      (keyA === keyB &&
        (procs[a].arrival < procs[b].arrival ||
          (procs[a].arrival === procs[b].arrival && a < b)))
    ) {
      best = i;
    }
  }
  return best;
}

/**
 * Run one policy over one workload.
 *
 * `record: false` swaps the recorder for the counting one, which keeps the
 * tallies and throws the frames away. That is what the comparison table uses:
 * five policies at once would otherwise allocate five full frame histories to
 * show fifteen numbers.
 *
 * The loop is deliberately literal. Arrivals are admitted, a preemption is
 * considered, a dispatch happens if the CPU is free, and then exactly one tick
 * of work is done. Nothing is computed ahead of the clock, so there is no path
 * by which the chart and the metrics can disagree — and the self-check proves
 * they do not.
 */
export function simulate(
  workload: Workload,
  policy: PolicyId,
  quantum: number,
  record = true,
): Run {
  const { procs } = workload;
  const n = procs.length;
  const slice = clampQuantum(quantum);

  const lane = new Int8Array(TICK_CAP).fill(UNRUN);
  const left = new Int32Array(n);
  const startAt = new Int32Array(n).fill(-1);
  const finishAt = new Int32Array(n).fill(-1);
  const slices = new Int32Array(n);
  for (const p of procs) left[p.id] = p.burst;

  // Mutated in place throughout — pushed on arrival, spliced on dispatch — and
  // never reassigned, so the snapshot closure always reads the live queue.
  const ready: number[] = [];
  let running = IDLE;
  let used = 0;
  /**
   * A process whose quantum has expired and which is not back in the queue yet.
   *
   * This one variable is the difference between two round robin answers that
   * are both defended in textbooks. A process arriving on the same tick that
   * the running process's quantum expires goes into the queue *ahead* of the
   * preempted one — so the requeue has to be deferred past the next tick's
   * arrivals rather than done at the moment of preemption. Doing it the obvious
   * way produces a chart that is off by one slot and a set of waiting times
   * that no marking scheme would accept.
   */
  let deferred = -1;
  let lastRan = IDLE;
  let finished = 0;
  let busy = 0;
  let tick = 0;
  let switches = 0;

  const snapshot = (at: number, onCpu: number): Frame => ({
    tick: at,
    lane: lane.slice(),
    left: left.slice(),
    ready: [...ready],
    running: onCpu,
    finished,
  });

  const rec: Recorder<Frame, StepKind> = record
    ? recording<Frame, StepKind>(snapshot(-1, IDLE))
    : counting<Frame, StepKind>(snapshot(-1, IDLE));

  while (finished < n && tick < TICK_CAP) {
    for (const p of procs) {
      if (p.arrival === tick) {
        ready.push(p.id);
        rec.tally('arrived');
        rec.step('arrive', [p.id], () => snapshot(tick, running));
      }
    }

    // Deferred requeue, after the arrivals — see `deferred` above.
    if (deferred >= 0) {
      ready.push(deferred);
      deferred = -1;
    }

    /*
     * Preemption by remaining time. Checked before dispatch so that a process
     * arriving this tick can take the CPU on this tick rather than the next —
     * that immediacy is the entire difference between SRTF and SJF.
     *
     * Strictly less, not less-or-equal: swapping on a tie would churn the CPU
     * between two processes with identical remaining time and report context
     * switches that bought nothing. The preempted process goes to the back of
     * the queue, which is invisible here — SRTF re-picks by remaining time
     * every tick, so queue position only ever decides ties, and those are
     * already settled by arrival and id in `pick`.
     *
     * Note what this block does *not* do: it does not hand the CPU to `next`.
     * It only vacates the CPU and lets the dispatch block below run the same
     * `pick` again. That indirection looks redundant and is not — the first
     * draft spliced `next` out of the queue here and forgot to assign it to
     * `running`, so a process that preempted someone was removed from the
     * ready queue and never scheduled again. It vanished: 401 of the 8640
     * runs in the harness finished with a process that had asked for a burst
     * and been given nothing, and every one of them was SRTF. Leaving `next`
     * in the queue makes the loss unrepresentable, because the only path onto
     * the CPU is the dispatch below. The re-pick is guaranteed to return the
     * same process, since the comparison that got us here was strictly less
     * and `pick` is a pure function of the same three arrays.
     */
    if (running !== IDLE && policy === 'srtf') {
      const k = pick(policy, ready, procs, left);
      if (k >= 0 && left[ready[k]] < left[running]) {
        const next = ready[k];
        const off = running;
        ready.push(off);
        rec.tally('preempted');
        rec.step('preempt', [off, next], () => snapshot(tick, off));
        running = IDLE;
        used = 0;
      }
    }

    if (running === IDLE) {
      const k = pick(policy, ready, procs, left);
      if (k >= 0) {
        running = ready[k];
        ready.splice(k, 1);
        used = 0;
        slices[running] += 1;
        if (lastRan !== IDLE && lastRan !== running) {
          switches += 1;
          rec.tally('switched');
        }
        lastRan = running;
        rec.tally('dispatched');
        rec.step('dispatch', [running], () => snapshot(tick, running));
      }
    }

    // Nothing runnable: the clock still advances, and the idle tick is recorded
    // rather than skipped. A Gantt chart that closes its gaps is a lie about
    // when things finished.
    if (running === IDLE) {
      lane[tick] = IDLE;
      rec.tally('idled');
      const at = tick;
      rec.step('idle', [], () => snapshot(at, IDLE));
      tick += 1;
      continue;
    }

    lane[tick] = running;
    left[running] -= 1;
    used += 1;
    busy += 1;
    if (startAt[running] < 0) startAt[running] = tick;
    const ranAt = tick;
    const ranBy = running;
    rec.tally('executed');
    rec.step('run', [ranBy], () => snapshot(ranAt, ranBy));
    tick += 1;

    if (left[running] === 0) {
      finishAt[running] = tick;
      finished += 1;
      rec.tally('completed');
      const done = running;
      rec.step('complete', [done], () => snapshot(ranAt, done));
      running = IDLE;
      used = 0;
    } else if (policy === 'rr' && used >= slice) {
      deferred = running;
      rec.tally('preempted');
      const off = running;
      rec.step('preempt', [off], () => snapshot(ranAt, off));
      running = IDLE;
      used = 0;
    }
  }

  const metrics: Metric[] = procs.map((p) => {
    const finish = finishAt[p.id];
    const start = startAt[p.id];
    const turnaround = finish < 0 ? -1 : finish - p.arrival;
    return {
      id: p.id,
      start,
      finish,
      turnaround,
      waiting: turnaround < 0 ? -1 : turnaround - p.burst,
      response: start < 0 ? -1 : start - p.arrival,
      slices: slices[p.id],
    };
  });

  const served = metrics.filter((m) => m.finish >= 0);
  const mean = (pickValue: (m: Metric) => number): number =>
    served.length === 0 ? 0 : served.reduce((sum, m) => sum + pickValue(m), 0) / served.length;

  const outcome: Outcome = {
    metrics,
    lane,
    span: tick,
    busy,
    idle: tick - busy,
    switches,
    avgWaiting: mean((m) => m.waiting),
    avgTurnaround: mean((m) => m.turnaround),
    avgResponse: mean((m) => m.response),
    utilisation: tick === 0 ? 0 : busy / tick,
    truncated: finished < n,
  };

  return { trace: rec.done(snapshot(tick, IDLE)), outcome };
}

/* ═══════════════════════════════════════════════════════════════════════ *
 * SELF-CHECKS
 * ═══════════════════════════════════════════════════════════════════════ */

/**
 * The best any ordering of these bursts could have done, by brute force.
 *
 * Returns total (not average) waiting and turnaround for the best permutation,
 * or `null` when the input is too large to enumerate.
 *
 * WHY BRUTE FORCE, WHEN THE ANSWER IS KNOWN
 *
 * Shortest-job-first is provably optimal here, so the minimum could be computed
 * by sorting the bursts ascending and adding up prefixes. That would be a
 * cheaper reference and a much weaker one: it is the same insight the scheduler
 * under test is built on, so a misunderstanding of the theorem would be
 * reproduced identically on both sides and the check would agree with itself.
 * Enumerating every ordering assumes nothing at all — not even that SJF is
 * optimal — which is exactly what a reference is for.
 *
 * This is why `PROC_MAX` is 8. Eight processes is 40,320 orderings, each costing
 * a single pass, and the whole search finishes well inside one frame. Nine would
 * be 362,880 and ten 3.6 million, at which point a check that runs on every
 * keystroke stops being free. The limit is not a guess about rendering — it is
 * the point where an honest reference stops being affordable.
 *
 * Valid only when every process is present at tick 0. With staggered arrivals a
 * permutation is not a schedule (the CPU may have to idle, and preemption can
 * beat every ordering), so the caller checks that condition before using this.
 */
export function optimalTotals(
  bursts: readonly number[],
): { waiting: number; turnaround: number } | null {
  const n = bursts.length;
  if (n === 0 || n > PROC_MAX) return null;

  const order = bursts.map((_, i) => i);
  let bestWaiting = Infinity;
  let bestTurnaround = Infinity;

  const walk = (k: number): void => {
    if (k === n) {
      let clock = 0;
      let waiting = 0;
      let turnaround = 0;
      for (const i of order) {
        // Everything arrived at 0, so a process waits exactly as long as the
        // work scheduled ahead of it takes.
        waiting += clock;
        clock += bursts[i];
        turnaround += clock;
      }
      if (waiting < bestWaiting) bestWaiting = waiting;
      if (turnaround < bestTurnaround) bestTurnaround = turnaround;
      return;
    }
    for (let i = k; i < n; i += 1) {
      const swap = order[k];
      order[k] = order[i];
      order[i] = swap;
      walk(k + 1);
      const back = order[k];
      order[k] = order[i];
      order[i] = back;
    }
  };

  walk(0);
  return { waiting: bestWaiting, turnaround: bestTurnaround };
}

/**
 * Check the run against its own lane.
 *
 * Every check here recomputes from `outcome.lane` and the workload — never from
 * the scheduler's bookkeeping. That is the point: the lane is what the bench
 * draws, the metrics are what it prints, and these two are produced by
 * different code from the same run. If the chart and the table ever disagreed,
 * this is what would say so, on the page, in front of the visitor.
 *
 * Failures are reported, never thrown. A bench that blanks itself when a
 * property fails has hidden the most interesting thing that has ever happened
 * on it.
 */
export function verifyRun(
  workload: Workload,
  policy: Policy,
  quantum: number,
  outcome: Outcome,
): Verification {
  const { procs, work } = workload;
  const { lane, span } = outcome;
  const checks: Check[] = [];

  /* ---- 1. Every burst fully served ---- */
  const ticksOwned = new Int32Array(procs.length);
  let laneBusy = 0;
  for (let t = 0; t < span; t += 1) {
    const owner = lane[t];
    if (owner >= 0) {
      ticksOwned[owner] += 1;
      laneBusy += 1;
    }
  }
  const shortfall = procs.filter((p) => ticksOwned[p.id] !== p.burst);
  checks.push(
    check(
      'Every process ran for exactly its burst',
      shortfall.length === 0 && laneBusy === work,
      shortfall.length === 0
        ? `${ratio(laneBusy, work, 'tick')} of requested CPU time served`
        : `${shortfall[0].name} asked for ${shortfall[0].burst} and got ${ticksOwned[shortfall[0].id]}`,
    ),
  );

  /* ---- 2. Nothing ran before it existed ---- */
  let early = -1;
  for (let t = 0; t < span && early < 0; t += 1) {
    const owner = lane[t];
    if (owner >= 0 && procs[owner].arrival > t) early = t;
  }
  checks.push(
    check(
      'No process ran before it arrived',
      early < 0,
      early < 0
        ? `checked all ${span} ticks against ${procs.length} arrival times`
        : `${procs[lane[early]].name} ran at tick ${early} but arrives at ${procs[lane[early]].arrival}`,
    ),
  );

  /*
   * ---- 3. The CPU never idled with work available ----
   *
   * Work conservation, recomputed from the lane alone: for every idle tick, no
   * process had arrived and still owed work. This is the check that would catch
   * a dispatch rule that quietly dropped a process out of the ready queue — the
   * kind of bug that leaves the averages looking plausible, because a process
   * that waits longer than it should still finishes.
   */
  let wasted = -1;
  let idleTicks = 0;
  for (let t = 0; t < span; t += 1) {
    if (lane[t] !== IDLE) continue;
    idleTicks += 1;
    if (wasted >= 0) continue;
    for (const p of procs) {
      if (p.arrival > t) continue;
      let servedByNow = 0;
      for (let u = 0; u < t; u += 1) if (lane[u] === p.id) servedByNow += 1;
      if (servedByNow < p.burst) {
        wasted = t;
        break;
      }
    }
  }
  checks.push(
    check(
      'The CPU only idled with nothing to run',
      wasted < 0,
      wasted < 0
        ? idleTicks === 0
          ? 'never idle — the queue was never empty'
          : `${ratio(idleTicks, span, 'tick')} idle, all with an empty queue`
        : `idle at tick ${wasted} with work still owed`,
    ),
  );

  /*
   * ---- 4. The table agrees with the chart ----
   *
   * The metrics are recomputed here from the lane by a second, independent pass
   * — first and last tick owned, then the arithmetic — and compared with what
   * the simulation recorded while it ran.
   */
  let mismatch: string | null = null;
  for (const p of procs) {
    let first = -1;
    let last = -1;
    for (let t = 0; t < span; t += 1) {
      if (lane[t] !== p.id) continue;
      if (first < 0) first = t;
      last = t;
    }
    const m = outcome.metrics[p.id];
    const finish = last < 0 ? -1 : last + 1;
    const turnaround = finish < 0 ? -1 : finish - p.arrival;
    const waiting = turnaround < 0 ? -1 : turnaround - p.burst;
    const response = first < 0 ? -1 : first - p.arrival;
    if (
      m.start !== first ||
      m.finish !== finish ||
      m.turnaround !== turnaround ||
      m.waiting !== waiting ||
      m.response !== response
    ) {
      mismatch = `${p.name}: table says it waited ${m.waiting}, the chart says ${waiting}`;
      break;
    }
  }
  checks.push(
    check(
      'Every printed figure is derivable from the chart',
      mismatch === null,
      mismatch ?? `${procs.length} processes × 5 figures recomputed from the lane`,
    ),
  );

  /*
   * ---- 5. What the policy actually promised ----
   *
   * Conditional, and narrowly so. A check is only worth showing if the policy
   * claims the property, and only valid if the reference applies: brute-force
   * optimality assumes every process is present at tick 0, and the round robin
   * response bound assumes the same. On a staggered workload neither holds, so
   * the bench shows four checks instead of inventing a fifth — an omitted check
   * is honest, a check that quietly redefines what it is testing is not.
   */
  const allAtZero = procs.every((p) => p.arrival === 0);

  if (allAtZero && policy.claims === 'waiting') {
    const best = optimalTotals(procs.map((p) => p.burst));
    if (best !== null) {
      const total = outcome.metrics.reduce((sum, m) => sum + Math.max(0, m.waiting), 0);
      checks.push(
        check(
          'No ordering of these bursts could have waited less',
          total === best.waiting,
          total === best.waiting
            ? `${total} ticks of waiting, matching the best of ${factorial(procs.length)} orderings`
            : `waited ${total} ticks; some ordering achieves ${best.waiting}`,
        ),
      );
    }
  }

  if (allAtZero && policy.id === 'rr') {
    /*
     * With everything ready at tick 0, a process can be behind at most the
     * other n-1 processes, each holding the CPU for at most one quantum, before
     * its own first slice. So its response time cannot exceed (n-1) × quantum —
     * the bound that makes round robin the responsive choice, and the only
     * promise it actually makes.
     */
    const bound = (procs.length - 1) * clampQuantum(quantum);
    const worst = outcome.metrics.reduce((hi, m) => Math.max(hi, m.response), 0);
    checks.push(
      check(
        'Every process ran within one round of arriving',
        worst <= bound,
        worst <= bound
          ? `worst wait for a first slice was ${worst} tick${worst === 1 ? '' : 's'}, bound is ${bound}`
          : `waited ${worst} ticks for a first slice, above the ${bound}-tick bound`,
      ),
    );
  }

  return verification(checks);
}

/** Only ever called on `procs.length`, which `PROC_MAX` caps at 8. */
function factorial(n: number): number {
  let acc = 1;
  for (let i = 2; i <= n; i += 1) acc *= i;
  return acc;
}
