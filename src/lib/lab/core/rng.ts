/**
 * SEEDED RANDOMNESS
 *
 * Every bench that generates its own input generates it from a seed the visitor
 * can see, edit, and put in a URL.
 *
 * ── Why not Math.random ────────────────────────────────────────────────
 * The sorting bench originally shuffled with `Math.random()`. That makes a run
 * unrepeatable: the interesting case — "quicksort degrades badly on *this*
 * array" — cannot be shown to anyone else, cannot be reloaded, and cannot be
 * compared against a second algorithm on the same input, because pressing
 * shuffle again destroys the evidence. A visible seed turns every run into a
 * permanent address, which is what makes `?bench=sorting&seed=4821` a link
 * worth sending.
 *
 * It also makes the *comparisons* honest. Claiming insertion sort beats
 * selection sort on nearly-sorted data means nothing if the two ran on
 * different nearly-sorted arrays. Same seed, same input, same distribution —
 * then the counters are measuring the algorithm and nothing else.
 *
 * ── Why mulberry32 ─────────────────────────────────────────────────────
 * It is a 32-bit generator in seven lines with no state beyond one integer, it
 * passes gjrand's smallcrush, and its period (2^32) is longer than anything a
 * bench here will draw. The alternatives were all worse for this job: a plain
 * LCG has visible lattice structure in the low bits, which would show up as
 * stripes in a "random" bar chart; xoshiro needs 128 bits of state and careful
 * seeding to avoid a near-zero start; and a real CSPRNG (`crypto.getRandomValues`)
 * cannot be seeded at all, which is the entire point of this file.
 *
 * ── Why an object rather than a bare function ──────────────────────────
 * `int()`, `shuffle()` and `normal()` are the operations the benches actually
 * want, and each of them is easy to get subtly wrong. `Math.floor(r * n)` for
 * an inclusive range is off by one; a naive shuffle that swaps every index with
 * a *fully* random index is biased (Sattolo's mistake) rather than uniform.
 * Writing them once, correctly, keeps that class of bug out of six engines.
 */

/** Seeds are kept small so they read well in a URL and are easy to retype. */
export const SEED_MAX = 9999;

export interface Rng {
  /** The seed this generator was constructed from. Echoed in the UI. */
  readonly seed: number;
  /** Next float in [0, 1). */
  next(): number;
  /** Next integer in [min, max] — both ends inclusive. */
  int(min: number, max: number): number;
  /** Next float in [min, max). */
  float(min: number, max: number): number;
  /** True with probability `p`. */
  chance(p: number): boolean;
  /** A new, uniformly shuffled array. The input is never mutated. */
  shuffle<T>(items: readonly T[]): T[];
  /** One element, or `undefined` if the list is empty. */
  pick<T>(items: readonly T[]): T | undefined;
  /** A normal sample, for cluster/blob generators in the learning bench. */
  normal(mean?: number, sd?: number): number;
}

/**
 * Build a deterministic generator. The same seed always yields the same
 * sequence, in every browser, forever — that is the contract the URL relies on.
 */
export function rng(seed: number): Rng {
  /*
   * `>>> 0` normalises whatever arrived — a negative number, a float, a value
   * past 2^32 — into the unsigned 32-bit integer the algorithm expects, so a
   * hand-typed seed from a query string can never put the generator into a
   * state it cannot recover from.
   */
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /*
   * Box–Muller needs a spare: each pair of uniforms produces two independent
   * normals, and throwing one away would double the draws for no reason.
   */
  let spare: number | null = null;

  return {
    seed: state,
    next,

    int(min, max) {
      // Inclusive of both ends: `+ 1` before the floor, then clamp so a
      // pathological 0.9999999999 cannot land one past `max`.
      const lo = Math.ceil(min);
      const hi = Math.floor(max);
      if (hi <= lo) return lo;
      return Math.min(hi, lo + Math.floor(next() * (hi - lo + 1)));
    },

    float(min, max) {
      return min + next() * (max - min);
    },

    chance(p) {
      return next() < p;
    },

    shuffle(items) {
      /*
       * Fisher–Yates, walking backwards and swapping with an index in
       * [0, i] — *inclusive of i*. Choosing from [0, i) instead produces
       * Sattolo's algorithm, which only generates cyclic permutations: the
       * array would never be able to stay put, and "shuffled" would quietly
       * mean "guaranteed to have moved", which is a different distribution.
       */
      const out = [...items];
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },

    pick(items) {
      if (items.length === 0) return undefined;
      return items[Math.floor(next() * items.length)];
    },

    normal(mean = 0, sd = 1) {
      if (spare !== null) {
        const v = spare;
        spare = null;
        return mean + sd * v;
      }
      /*
       * `1 - next()` shifts the domain to (0, 1] so `Math.log` can never be
       * handed a zero and return -Infinity. This is the one input value that
       * breaks the polar form, and it is reachable: `next()` genuinely can
       * return exactly 0.
       */
      const u = 1 - next();
      const v = next();
      const r = Math.sqrt(-2 * Math.log(u));
      const theta = 2 * Math.PI * v;
      spare = r * Math.sin(theta);
      return mean + sd * (r * Math.cos(theta));
    },
  };
}

/**
 * A fresh seed for the "shuffle" button.
 *
 * This is the one place unseeded randomness is correct: the visitor asked for
 * *a* new arrangement, not a specific one. The result is immediately written
 * into the URL, so the moment it exists it is reproducible again.
 */
export function randomSeed(): number {
  return Math.floor(Math.random() * (SEED_MAX + 1));
}

/**
 * Parse a seed out of a query string.
 *
 * Returns `null` rather than a fallback so callers decide what a missing or
 * malformed value means — usually "keep the seed already on screen", which is
 * less surprising than silently resetting the bench to seed 0.
 */
export function parseSeed(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n % (SEED_MAX + 1);
}
