/**
 * SELF-VERIFICATION
 *
 * Every engine in the lab checks its own output and shows the result on screen.
 *
 * ── Why a visualiser needs this at all ─────────────────────────────────
 * An animated sort that is subtly wrong looks *exactly* like an animated sort
 * that is right. The bars move, the counters climb, and nothing on screen
 * distinguishes a correct merge from one that drops the last element of the
 * left run. That is the failure mode of every algorithm visualisation on the
 * web, and it is why "it looks like it works" is not evidence of anything.
 *
 * So each bench asserts the properties its algorithm is *supposed* to
 * guarantee, against the run that just happened, and prints the verdict:
 *
 *   - sorting  → output is ordered, and is a permutation of the input
 *                (ordered alone would pass for a function that returns
 *                `[1, 2, 3]` no matter what you hand it)
 *   - compiler → the three-address code evaluates to the same value as the AST
 *   - automata → the NFA and the minimised DFA agree on N random strings
 *   - graph    → the path returned is contiguous, walkable, and its cost is
 *                the cost the search reported
 *
 * ── Why properties instead of expected values ──────────────────────────
 * A fixture ("sorting [3,1,2] gives [1,2,3]") only tests one input. A property
 * ("the output is ordered and is a permutation of the input") holds for every
 * input, including the one the visitor just typed and the one a seed produced
 * that nobody has ever looked at. Since the inputs here are generated at
 * runtime, properties are the only kind of check that can run at all.
 *
 * ── Why it renders rather than throws ──────────────────────────────────
 * A thrown assertion would take the route down and tell the visitor nothing.
 * A failing badge is strictly better: the bench keeps working, the trace is
 * still scrubbable, and now there is a visible bug to go and find. A red badge
 * is more honest than a blank page, and far more honest than a green one.
 */

export interface Check {
  /** Short enough to sit on one line under the bench. */
  readonly label: string;
  readonly pass: boolean;
  /**
   * What was actually measured — "48 of 48 in order", not "ok". A detail that
   * only says "passed" makes the badge decorative; a number makes it a reading.
   */
  readonly detail: string;
}

export interface Verification {
  readonly checks: readonly Check[];
  /** True only when every check passed. An empty list is vacuously true. */
  readonly pass: boolean;
}

export function check(label: string, pass: boolean, detail: string): Check {
  return { label, pass, detail };
}

export function verification(checks: readonly Check[]): Verification {
  return { checks, pass: checks.every((c) => c.pass) };
}

/** Nothing to verify yet — an empty source box, a bench before its first run. */
export const NO_CHECKS: Verification = { checks: [], pass: true };

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PREDICATES
//
// These are the properties more than one bench needs. Anything specific to a
// single engine stays in that engine's file, next to the code it describes.
// ─────────────────────────────────────────────────────────────────────────────

/** Non-decreasing. Equal neighbours are fine — this is not strict ordering. */
export function isOrdered(xs: readonly number[]): boolean {
  for (let i = 1; i < xs.length; i += 1) {
    if (xs[i - 1] > xs[i]) return false;
  }
  return true;
}

/** Index of the first out-of-order pair, or -1. Turns a `false` into a lead. */
export function firstDisorder(xs: readonly number[]): number {
  for (let i = 1; i < xs.length; i += 1) {
    if (xs[i - 1] > xs[i]) return i;
  }
  return -1;
}

/**
 * Same multiset, any order.
 *
 * Counted rather than sorted-and-compared, because sorting the arrays to check
 * a sort is circular: a broken comparison would be used to validate itself.
 * A tally uses only equality, which the algorithm under test does not touch.
 */
export function isPermutation(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;

  const seen = new Map<number, number>();
  for (const v of a) seen.set(v, (seen.get(v) ?? 0) + 1);

  for (const v of b) {
    const n = seen.get(v);
    if (n === undefined || n === 0) return false;
    seen.set(v, n - 1);
  }

  // Every count landed back on zero, or the length check above would have failed.
  return true;
}

/**
 * Float comparison with a tolerance.
 *
 * The compiler bench lowers `a / b` to real division and the learning bench
 * sums gradients, so both produce values where `===` is the wrong question:
 * `0.1 + 0.2 !== 0.3` is arithmetic working correctly, not a bug to report.
 * The tolerance is relative for large magnitudes and absolute near zero, since
 * a fixed epsilon is either uselessly strict at 1e9 or uselessly loose at 1e-9.
 */
export function nearly(a: number, b: number, epsilon = 1e-9): boolean {
  if (a === b) return true; // exact, and also catches both-Infinity
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= epsilon * Math.max(1, Math.abs(a), Math.abs(b));
}

/**
 * Format a count as "m of n", the phrasing every badge uses.
 *
 * Centralised so a passing check and a failing one are worded identically —
 * only the numbers differ. Badges that change their sentence structure when
 * they fail make the reader hunt for the actual result.
 */
export function ratio(part: number, whole: number, noun: string): string {
  return `${part} of ${whole} ${noun}`;
}
