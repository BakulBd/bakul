/**
 * TRACES
 *
 * The one idea the whole lab is built on: an engine runs to completion, and
 * while it runs it records what it did. Nothing in the lab animates itself.
 *
 * ── Why record instead of animate ──────────────────────────────────────
 * The obvious way to build a sorting visualiser is a generator or an `await
 * sleep()` inside the loop — the algorithm drives the clock and yields a frame
 * each time it wants to be seen. It works, and then every feature after the
 * first one fights it:
 *
 *   - **Scrubbing** needs the state at step 400 without running steps 0–399,
 *     which a suspended coroutine cannot give you.
 *   - **Reverse stepping** needs the state *before* a mutation, which is gone.
 *     The usual fix is an inverse operation per step, i.e. writing every
 *     algorithm twice and keeping the halves in sync.
 *   - **Speed control** becomes a moving target: changing the sleep mid-run
 *     only affects steps not yet taken, so the first half plays at the old rate.
 *   - **Comparing two algorithms** on one input means running two coroutines in
 *     lockstep and interleaving their sleeps.
 *
 * Recording first collapses all four into one property: the view is a pure
 * function of `(trace, cursor)`. Scrub by setting the cursor. Step back by
 * decrementing it. Change speed by changing how fast the cursor moves. Compare
 * by running both engines and reading two arrays. None of those are features
 * that had to be built; they are consequences of the shape.
 *
 * The trade is memory, and it is bounded on purpose: a frame is a small array,
 * and each bench caps its own input size at what stays interactive.
 *
 * ── Why counters are tallied, never derived ────────────────────────────
 * "Bubble sort is O(n²)" is a claim about growth, not a measurement of this
 * run. Printing `n * n` next to a picture of a sort is the same dishonesty as
 * a video pretending to be a live render — the number would be right about the
 * shape and wrong about the fact. So every counter here is incremented by the
 * algorithm at the moment it does the thing, and the totals on screen are that
 * tally. When measured comparisons and the textbook bound disagree, the
 * measurement is what gets shown.
 *
 * ── Why count-only mode exists ─────────────────────────────────────────
 * The complexity sweep runs every sort at n = 8…1024 to plot measured
 * comparisons against reference curves. At n = 1024 a full trace is on the
 * order of a million array copies — hundreds of megabytes, to draw a graph
 * that needs exactly two numbers per run. `counting()` gives a recorder with
 * the same interface whose snapshots are dropped on the floor, so the sweep and
 * the animation share one implementation of each algorithm rather than
 * maintaining a fast copy and a watchable copy that can silently diverge.
 */

/**
 * One recorded moment.
 *
 * `frame` is deliberately generic: the sorting bench stores `number[]`, the
 * scheduler stores a timeline row, the machine stores its register file. The
 * player, the transport and the scrubber never look inside it — they only need
 * `steps.length` and an index — which is why one player drives every bench.
 */
export interface Step<TFrame, TKind extends string = string> {
  /** What happened. Drives colour and the step readout. */
  readonly kind: TKind;
  /**
   * Which positions this step is about. Empty for steps that are not
   * positional (a scheduler tick, a pipeline stall).
   */
  readonly indices: readonly number[];
  /** The engine's state *after* the step. Rendered as-is. */
  readonly frame: TFrame;
}

/**
 * A completed run.
 *
 * `counters` is an open record rather than fixed fields because each engine
 * measures different work — comparisons and writes for a sort, node expansions
 * for a search, cycles and stalls for the pipeline — and a shared `Trace` type
 * with every engine's fields on it would be mostly nulls.
 */
export interface Trace<TFrame, TKind extends string = string> {
  readonly steps: readonly Step<TFrame, TKind>[];
  readonly counters: Readonly<Record<string, number>>;
  /** The engine's state before any step ran, so the cursor can rest at -1. */
  readonly initial: TFrame;
  /** Final state. Not `steps.at(-1).frame`: an engine can finish without a step. */
  readonly final: TFrame;
}

export interface Recorder<TFrame, TKind extends string = string> {
  /**
   * Record a step. `snapshot` is a *thunk* so that in count-only mode the copy
   * is never made — the cost of a frame is skipped, not made and discarded.
   */
  step(kind: TKind, indices: readonly number[], snapshot: () => TFrame): void;
  /** Add to a counter, creating it at zero on first use. */
  tally(name: string, by?: number): void;
  /** Read a counter back — engines occasionally branch on their own totals. */
  count(name: string): number;
  /** How many steps so far. Used by engines that record positions in the trace. */
  readonly length: number;
  /** Seal the recording. */
  done(final: TFrame): Trace<TFrame, TKind>;
}

/**
 * A recorder that keeps every frame. This is what the benches use.
 *
 * `initial` is taken eagerly, because "the state before anything happened" has
 * to be captured before the algorithm gets a chance to mutate it — asking for
 * it later would return the end state and the cursor's resting position would
 * silently show a sorted array.
 */
export function recording<TFrame, TKind extends string = string>(
  initial: TFrame,
): Recorder<TFrame, TKind> {
  const steps: Step<TFrame, TKind>[] = [];
  const counters: Record<string, number> = {};

  return {
    step(kind, indices, snapshot) {
      steps.push({ kind, indices, frame: snapshot() });
    },
    tally(name, by = 1) {
      counters[name] = (counters[name] ?? 0) + by;
    },
    count(name) {
      return counters[name] ?? 0;
    },
    get length() {
      return steps.length;
    },
    done(final) {
      return { steps, counters, initial, final };
    },
  };
}

/**
 * A recorder that counts but records nothing.
 *
 * The returned trace has an empty `steps` array — which is the honest
 * representation, not a bug: this run genuinely has no watchable history. Any
 * caller that scrubs a counting trace correctly sees zero steps rather than
 * frames that were never taken.
 */
export function counting<TFrame, TKind extends string = string>(
  initial: TFrame,
): Recorder<TFrame, TKind> {
  const counters: Record<string, number> = {};
  let n = 0;

  return {
    step() {
      // The thunk is not called. That omission is the entire optimisation.
      n += 1;
    },
    tally(name, by = 1) {
      counters[name] = (counters[name] ?? 0) + by;
    },
    count(name) {
      return counters[name] ?? 0;
    },
    get length() {
      return n;
    },
    done(final) {
      return { steps: [], counters, initial, final };
    },
  };
}

/**
 * The frame a cursor is pointing at.
 *
 * The cursor convention across every bench: **-1 means "before the first
 * step"**, so a freshly loaded bench shows its input rather than its answer,
 * and `0` is the state after one step has run. Without a resting position
 * outside the array, "start" and "one step in" would be the same view and the
 * first step would be invisible.
 */
export function frameAt<TFrame, TKind extends string>(
  trace: Trace<TFrame, TKind>,
  cursor: number,
): TFrame {
  if (cursor < 0) return trace.initial;
  const step = trace.steps[Math.min(cursor, trace.steps.length - 1)];
  return step ? step.frame : trace.final;
}

/** The step a cursor is on, or `null` at the resting position. */
export function stepAt<TFrame, TKind extends string>(
  trace: Trace<TFrame, TKind>,
  cursor: number,
): Step<TFrame, TKind> | null {
  if (cursor < 0) return null;
  return trace.steps[cursor] ?? null;
}

/**
 * Count steps of each kind up to and including the cursor.
 *
 * The stats row shows work done *so far*, not work done in total — a progress
 * readout that jumps straight to the final tally is a spoiler, and makes the
 * counters look decorative rather than live. Scanning is O(cursor) per render,
 * which at these trace lengths measures as noise next to the reconciliation
 * it happens inside.
 */
export function tallyThrough<TFrame, TKind extends string>(
  trace: Trace<TFrame, TKind>,
  cursor: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  const upto = Math.min(cursor, trace.steps.length - 1);
  for (let i = 0; i <= upto; i += 1) {
    const k = trace.steps[i].kind;
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}
