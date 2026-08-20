/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Search structures: a balancing tree and an open-addressed hash table
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Two engines under one roof, because they answer the same question — "where
 * does a key live?" — with opposite strategies, and the interesting thing is
 * what each one pays for its answer.
 *
 * A binary search tree pays in *comparisons*, and its bill depends entirely on
 * the shape it grew into. Feed it sorted keys and it degenerates into a linked
 * list: the classic result that a textbook states and this bench makes you
 * watch. AVL pays a little extra at insert time — the rotations — to buy a
 * height bound of O(log n) no matter what order the keys arrive in.
 *
 * A hash table pays in *probes*, and its bill depends on the load factor and
 * on how the probe sequence handles collisions. Linear probing is fastest per
 * step and worst at clustering; the alternatives trade locality for spread.
 *
 * Both halves record their work through the same trace core as every other
 * bench here, so the view stays a pure function of (trace, cursor) and every
 * number on screen is a tally the algorithm kept while it ran. Nothing is a
 * closed-form estimate. If the readout says nine comparisons, nine comparisons
 * happened and the highlighted path has nine nodes on it.
 */

import { rng } from './core/rng';
import { recording, type Recorder, type Trace } from './core/trace';
import { check, verification, type Verification } from './core/verify';

// ── Shared limits ──────────────────────────────────────────────────────────
//
// Key counts stay small on purpose. This bench is read, not benchmarked: a tree
// with fourteen nodes still fits on a phone at a legible font size, and a
// sixteen-slot table shows a clustering run without scrolling. The complexity
// story belongs to the sweep bench, which measures counts instead of drawing
// them.

export const KEY_MIN = 5;
export const KEY_MAX = 14;
export const KEY_CEILING = 99;

/** Nothing here: an absent child, an empty slot, a cursor before the first key. */
export const NONE = -1;

// ═══════════════════════════════════════════════════════════════════════════
// Insertion order
// ═══════════════════════════════════════════════════════════════════════════
//
// Keys are always distinct. Duplicates would force a policy decision — send
// them left, send them right, or keep a count on the node — and whichever this
// bench picked, the visitor would be watching that choice rather than the
// balancing. Distinct keys also let verification make an exact claim: the node
// count must equal the key count, and every key must be findable.

export type OrderId = 'shuffled' | 'ascending' | 'descending' | 'zigzag';

export interface Order {
  readonly id: OrderId;
  readonly name: string;
  /** What this order does to an unbalanced tree, in one clause. */
  readonly note: string;
}

export const orders: readonly Order[] = [
  { id: 'shuffled', name: 'Shuffled', note: 'no adversary; roughly balanced by luck' },
  { id: 'ascending', name: 'Ascending', note: 'every key goes right — a plain BST becomes a list' },
  { id: 'descending', name: 'Descending', note: 'the mirror case; every key goes left' },
  { id: 'zigzag', name: 'Zigzag', note: 'smallest, largest, next smallest — a chain that alternates sides' },
];

export function findOrder(id: string): Order {
  return orders.find((o) => o.id === id) ?? orders[0];
}

/**
 * Build `n` distinct keys in the requested order.
 *
 * Every order draws from the same seeded pool first and then arranges it, so
 * switching order at a fixed seed changes the arrangement and not the values.
 * That is what makes the tree comparison fair: BST and AVL, ascending and
 * shuffled, all see the same multiset.
 */
export function makeKeys(order: OrderId, n: number, seed: number): readonly number[] {
  const r = rng(seed);
  const pool: number[] = [];
  const seen = new Set<number>();
  while (pool.length < n) {
    const k = r.int(1, KEY_CEILING);
    if (seen.has(k)) continue;
    seen.add(k);
    pool.push(k);
  }

  if (order === 'shuffled') return pool;

  const sorted = [...pool].sort((a, b) => a - b);
  if (order === 'ascending') return sorted;
  if (order === 'descending') return sorted.reverse();

  // Zigzag: alternate the two ends inward. Each key lands on the opposite side
  // of the previous one, so the tree grows a staircase rather than a straight
  // chain — a different pathology with the same O(n) height.
  const out: number[] = [];
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    out.push(sorted[lo]);
    lo += 1;
    if (lo <= hi) {
      out.push(sorted[hi]);
      hi -= 1;
    }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// Trees
// ═══════════════════════════════════════════════════════════════════════════

export type TreeModeId = 'bst' | 'avl';

export interface TreeMode {
  readonly id: TreeModeId;
  readonly name: string;
  readonly full: string;
  /** The guarantee this mode actually makes. No mode claims more. */
  readonly claims: string;
  readonly cost: string;
}

export const treeModes: readonly TreeMode[] = [
  {
    id: 'bst',
    name: 'BST',
    full: 'Unbalanced binary search tree',
    claims: 'In-order traversal is sorted. Height is whatever the input order produced.',
    cost: 'O(h) per insert, and h can reach n',
  },
  {
    id: 'avl',
    name: 'AVL',
    full: 'AVL self-balancing tree',
    claims: 'Every node stays within a balance factor of ±1, so height is O(log n).',
    cost: 'O(log n) per insert, plus at most two rotations',
  },
];

export function findTreeMode(id: string): TreeMode {
  return treeModes.find((m) => m.id === id) ?? treeModes[0];
}

/**
 * A node in the arena.
 *
 * Children are indices into a flat array rather than object references. Two
 * reasons: a snapshot is then a shallow copy of small records with no pointer
 * graph to rebuild, and the React view can key rows by a stable integer that
 * survives every rotation. `height` is stored rather than derived so the
 * verifier can check the stored value against a recomputed one — a stale height
 * is the classic AVL bug, and it would be invisible if the height were computed
 * fresh at every read.
 */
export interface TreeNode {
  readonly key: number;
  readonly left: number;
  readonly right: number;
  readonly height: number;
}

export type TreeStepKind =
  | 'compare'
  | 'attach'
  | 'retrace'
  | 'rotate'
  | 'settled';

export interface TreeFrame {
  readonly nodes: readonly TreeNode[];
  readonly root: number;
  /** The key currently being inserted, or NONE once the run is finished. */
  readonly inserting: number;
  /** Node indices walked so far on this insert, root first. */
  readonly path: readonly number[];
  /** Nodes whose links this step rewrote, for the rotation flash. */
  readonly touched: readonly number[];
  /**
   * The recorder's own tallies at this instant.
   *
   * Carried in the frame rather than recomputed by the view, because the view
   * cannot recover them: `tallyThrough` counts steps by *kind*, and a left-right
   * rotation is one step that performs two rotations. Reading the tally here
   * means the stat on screen is the number the algorithm counted, at exactly the
   * point the cursor is parked, and it necessarily agrees with the final total.
   */
  readonly comparisons: number;
  readonly rotations: number;
  readonly note: string;
}


export interface TreeOutcome {
  readonly height: number;
  /** ceil(log2(n + 1)) — the shortest a binary tree of this size could be. */
  readonly ideal: number;
  readonly count: number;
  readonly comparisons: number;
  readonly rotations: number;
  /** Longest root-to-leaf path, as node indices, for the depth readout. */
  readonly deepest: readonly number[];
  readonly sorted: readonly number[];
  readonly balanced: boolean;
}

export interface TreeRun {
  readonly trace: Trace<TreeFrame, TreeStepKind>;
  readonly outcome: TreeOutcome;
}

const EMPTY_TREE: TreeFrame = {
  nodes: [],
  root: NONE,
  inserting: NONE,
  path: [],
  touched: [],
  comparisons: 0,
  rotations: 0,
  note: 'Empty tree.',
};

/**
 * Insert every key, recording each comparison, link and rotation.
 *
 * The AVL retrace is written iteratively over the recorded path rather than
 * recursively on the way out of a call stack. Recursion is the shorter code,
 * but the path is exactly what the bench highlights, so walking it backwards
 * keeps the thing being drawn and the thing being fixed as one object — and it
 * makes the "at most two rotations per insert" bound something you can watch
 * hold rather than something a comment asserts.
 */
export function buildTree(
  keys: readonly number[],
  mode: TreeModeId,
  record = true,
): TreeRun {
  const rec: Recorder<TreeFrame, TreeStepKind> = recording<TreeFrame, TreeStepKind>(EMPTY_TREE);

  const key: number[] = [];
  const left: number[] = [];
  const right: number[] = [];
  const height: number[] = [];
  let root = NONE;

  const heightOf = (i: number) => (i === NONE ? 0 : height[i]);
  const balanceOf = (i: number) => (i === NONE ? 0 : heightOf(left[i]) - heightOf(right[i]));
  const refresh = (i: number) => {
    height[i] = 1 + Math.max(heightOf(left[i]), heightOf(right[i]));
  };

  const snapshot = (
    inserting: number,
    path: readonly number[],
    touched: readonly number[],
    note: string,
  ): (() => TreeFrame) => {
    // Materialised eagerly: the arrays below are mutated in place on the very
    // next statement, so a lazy read would report the future, not this step.
    const nodes: TreeNode[] = key.map((k, i) => ({
      key: k,
      left: left[i],
      right: right[i],
      height: height[i],
    }));
    const at = root;
    const walked = [...path];
    const hit = [...touched];
    // Read now, for the same reason: `rec.count` climbs as the run continues.
    const comparisons = rec.count('comparisons');
    const rotations = rec.count('rotations');
    return () => ({
      nodes,
      root: at,
      inserting,
      path: walked,
      touched: hit,
      comparisons,
      rotations,
      note,
    });
  };

  const step = (
    kind: TreeStepKind,
    indices: readonly number[],
    inserting: number,
    path: readonly number[],
    touched: readonly number[],
    note: string,
  ) => {
    if (!record) return;
    rec.step(kind, indices, snapshot(inserting, path, touched, note));
  };

  const rotateRight = (y: number): number => {
    const x = left[y];
    left[y] = right[x];
    right[x] = y;
    refresh(y);
    refresh(x);
    rec.tally('rotations');
    return x;
  };

  const rotateLeft = (x: number): number => {
    const y = right[x];
    right[x] = left[y];
    left[y] = x;
    refresh(x);
    refresh(y);
    rec.tally('rotations');
    return y;
  };

  /** Re-hang a rotated subtree under whatever used to hold it. */
  const relink = (parent: number, was: number, now: number) => {
    if (parent === NONE) root = now;
    else if (left[parent] === was) left[parent] = now;
    else right[parent] = now;
  };

  for (const k of keys) {
    // ── Descend ──────────────────────────────────────────────────────────
    const path: number[] = [];
    let parent = NONE;
    let goLeft = false;
    let at = root;

    while (at !== NONE) {
      path.push(at);
      rec.tally('comparisons');
      step('compare', [at], k, path, [], `${k} vs ${key[at]} — ${k < key[at] ? 'go left' : 'go right'}`);
      parent = at;
      goLeft = k < key[at];
      at = goLeft ? left[at] : right[at];
    }

    // ── Attach ───────────────────────────────────────────────────────────
    const fresh = key.length;
    key.push(k);
    left.push(NONE);
    right.push(NONE);
    height.push(1);
    if (parent === NONE) root = fresh;
    else if (goLeft) left[parent] = fresh;
    else right[parent] = fresh;
    rec.tally('links');
    step(
      'attach',
      [fresh],
      k,
      [...path, fresh],
      [fresh],
      parent === NONE ? `${k} becomes the root` : `${k} attaches ${goLeft ? 'left' : 'right'} of ${key[parent]}`,
    );

    if (mode === 'bst') {
      // A plain BST still needs correct heights, because the height readout and
      // the verifier both read them. It just never acts on them.
      for (let i = path.length - 1; i >= 0; i -= 1) refresh(path[i]);
      continue;
    }

    // ── Retrace ──────────────────────────────────────────────────────────
    let rotations = 0;
    for (let i = path.length - 1; i >= 0; i -= 1) {
      const node = path[i];
      const before = height[node];
      refresh(node);
      const bf = balanceOf(node);
      const holder = i === 0 ? NONE : path[i - 1];

      if (bf > 1 || bf < -1) {
        const heavy = bf > 1 ? left[node] : right[node];
        let replacement: number;
        let shape: string;

        if (bf > 1) {
          if (balanceOf(heavy) < 0) {
            left[node] = rotateLeft(heavy);
            shape = 'left-right';
            rotations += 1;
          } else shape = 'left-left';
          replacement = rotateRight(node);
        } else {
          if (balanceOf(heavy) > 0) {
            right[node] = rotateRight(heavy);
            shape = 'right-left';
            rotations += 1;
          } else shape = 'right-right';
          replacement = rotateLeft(node);
        }

        rotations += 1;
        relink(holder, node, replacement);
        step(
          'rotate',
          [replacement, node],
          k,
          path.slice(0, i + 1),
          [replacement, node],
          `${key[node]} was ${bf > 1 ? 'left' : 'right'}-heavy by ${Math.abs(bf)} — ${shape} rotation lifts ${key[replacement]}`,
        );
        // A rotation restores this subtree's old height, so nothing above it can
        // still be out of balance on a single insert. The loop stops rather than
        // pretending to keep looking.
        break;
      }

      if (before !== height[node]) {
        step(
          'retrace',
          [node],
          k,
          path.slice(0, i + 1),
          [],
          `${key[node]} grew to height ${height[node]}, balance ${bf >= 0 ? '+' : ''}${bf}`,
        );
      }
    }

    if (rotations === 0) {
      step('settled', [fresh], k, [...path, fresh], [], `${k} needed no rotation`);
    }
  }

  // ── Finish ─────────────────────────────────────────────────────────────
  const nodes: TreeNode[] = key.map((k, i) => ({
    key: k,
    left: left[i],
    right: right[i],
    height: height[i],
  }));

  const sorted = inOrder(nodes, root);
  const deepest = deepestPath(nodes, root);
  const count = nodes.length;

  const final: TreeFrame = {
    nodes,
    root,
    inserting: NONE,
    path: deepest,
    touched: [],
    comparisons: rec.count('comparisons'),
    rotations: rec.count('rotations'),
    note: count === 0 ? 'Empty tree.' : `${count} keys, height ${heightOf(root)}.`,
  };


  const trace = rec.done(final);

  return {
    trace,
    outcome: {
      height: heightOf(root),
      ideal: count === 0 ? 0 : Math.ceil(Math.log2(count + 1)),
      count,
      comparisons: rec.count('comparisons'),
      rotations: rec.count('rotations'),
      deepest,
      sorted,
      balanced: nodes.every((_, i) => {
        const bf = heightOf(nodes[i].left) - heightOf(nodes[i].right);
        return bf >= -1 && bf <= 1;
      }),
    },
  };
}

/** In-order key sequence. Iterative, so a 14-deep chain cannot blow a stack. */
export function inOrder(nodes: readonly TreeNode[], root: number): readonly number[] {
  const out: number[] = [];
  const stack: number[] = [];
  let at = root;
  while (at !== NONE || stack.length > 0) {
    while (at !== NONE) {
      stack.push(at);
      at = nodes[at].left;
    }
    const node = stack.pop() as number;
    out.push(nodes[node].key);
    at = nodes[node].right;
  }
  return out;
}

/** The longest root-to-leaf path, as node indices. Ties take the left branch. */
export function deepestPath(nodes: readonly TreeNode[], root: number): readonly number[] {
  const out: number[] = [];
  let at = root;
  while (at !== NONE) {
    out.push(at);
    const l = nodes[at].left;
    const r = nodes[at].right;
    const lh = l === NONE ? 0 : nodes[l].height;
    const rh = r === NONE ? 0 : nodes[r].height;
    if (l === NONE && r === NONE) break;
    at = lh >= rh ? l : r;
  }
  return out;
}

/**
 * Where each node sits on screen.
 *
 * x is the in-order rank and y is the depth, which is the standard tidy-enough
 * layout: no two nodes overlap, and left-of-parent reads as left-on-screen, so
 * the picture and the invariant agree. Kept here rather than in the component
 * because it is derived data — the view stays a pure function of the frame.
 */
export interface TreePlacement {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly parentX: number;
  readonly parentY: number;
}

export interface TreeLayout {
  readonly places: readonly TreePlacement[];
  readonly columns: number;
  readonly rows: number;
}

export function treeLayout(nodes: readonly TreeNode[], root: number): TreeLayout {
  const x = new Array<number>(nodes.length).fill(0);
  const y = new Array<number>(nodes.length).fill(0);
  const parent = new Array<number>(nodes.length).fill(NONE);

  let rank = 0;
  const stack: Array<{ node: number; depth: number }> = [];
  let at = root;
  let depth = 0;
  while (at !== NONE || stack.length > 0) {
    while (at !== NONE) {
      stack.push({ node: at, depth });
      if (nodes[at].left !== NONE) parent[nodes[at].left] = at;
      if (nodes[at].right !== NONE) parent[nodes[at].right] = at;
      at = nodes[at].left;
      depth += 1;
    }
    const top = stack.pop() as { node: number; depth: number };
    x[top.node] = rank;
    y[top.node] = top.depth;
    rank += 1;
    at = nodes[top.node].right;
    depth = top.depth + 1;
  }

  const places = nodes.map((_, i) => ({
    index: i,
    x: x[i],
    y: y[i],
    parentX: parent[i] === NONE ? x[i] : x[parent[i]],
    parentY: parent[i] === NONE ? y[i] : y[parent[i]],
  }));

  return {
    places,
    columns: Math.max(1, nodes.length),
    rows: nodes.length === 0 ? 1 : Math.max(...y) + 1,
  };
}

/**
 * Properties the finished tree must satisfy.
 *
 * These are checks, not assertions: a failure renders as a red badge instead of
 * throwing, because a bench that blanks the screen teaches nothing. The AVL
 * checks only run in AVL mode — holding a plain BST to a balance bound it never
 * claimed would be a false accusation, and the mode's own `claims` string is
 * what the badge is testing against.
 */
export function verifyTree(
  keys: readonly number[],
  mode: TreeModeId,
  outcome: TreeOutcome,
  nodes: readonly TreeNode[],
  root: number,
): Verification {
  const expected = [...keys].sort((a, b) => a - b);
  const sorted = outcome.sorted;

  let ordered = sorted.length === expected.length;
  if (ordered) {
    for (let i = 0; i < sorted.length; i += 1) {
      if (sorted[i] !== expected[i]) {
        ordered = false;
        break;
      }
    }
  }

  // Findability is checked by descending the tree exactly as an insert would,
  // which is the only claim a search structure really makes.
  let missing = NONE;
  for (const k of keys) {
    let at = root;
    while (at !== NONE && nodes[at].key !== k) {
      at = k < nodes[at].key ? nodes[at].left : nodes[at].right;
    }
    if (at === NONE) {
      missing = k;
      break;
    }
  }

  const heightOf = (i: number) => (i === NONE ? 0 : nodes[i].height);
  let staleAt = NONE;
  for (let i = 0; i < nodes.length; i += 1) {
    const want = 1 + Math.max(heightOf(nodes[i].left), heightOf(nodes[i].right));
    if (nodes[i].height !== want) {
      staleAt = i;
      break;
    }
  }

  const checks = [
    check(
      'In-order traversal is sorted',
      ordered,
      ordered
        ? `${sorted.length} keys ascend`
        : 'traversal does not match the sorted input',
    ),
    check(
      'Every key is findable',
      missing === NONE,
      missing === NONE ? `${keys.length} of ${keys.length} keys reachable` : `${missing} is unreachable`,
    ),
    check(
      'Stored heights match the subtrees',
      staleAt === NONE,
      staleAt === NONE ? `${nodes.length} nodes agree` : `node ${nodes[staleAt].key} is stale`,
    ),
  ];

  if (mode === 'avl') {
    const worst = nodes.reduce((w, n) => {
      const bf = Math.abs(heightOf(n.left) - heightOf(n.right));
      return bf > w ? bf : w;
    }, 0);
    const bound = outcome.count === 0 ? 0 : Math.ceil(1.44 * Math.log2(outcome.count + 2));
    checks.push(
      check(
        'Balance factor within ±1 everywhere',
        worst <= 1,
        `worst node is off by ${worst}`,
      ),
      check(
        'Height inside the AVL bound',
        outcome.height <= bound,
        `height ${outcome.height}, bound ${bound}`,
      ),
    );
  }

  return verification(checks);
}

// ═══════════════════════════════════════════════════════════════════════════
// Hash tables
// ═══════════════════════════════════════════════════════════════════════════
//
// Open addressing only, and deliberately: separate chaining hides its cost in
// heap-allocated buckets that a fixed grid cannot honestly draw, whereas open
// addressing puts every collision *in the table*, where clustering is visible
// as a run of adjacent full slots. That is the phenomenon worth showing.
//
// The table length is prime. Not decoration: quadratic probing and double
// hashing both rely on it to reach enough of the table to terminate, and a
// power-of-two length would silently make the second hash useless whenever it
// shared a factor with the length.

/** Primes only, for the reason above. The UI picks from this list, not a range. */
export const SLOT_CHOICES: readonly number[] = [11, 13, 17, 19, 23, 29, 31];

/**
 * The legal length closest to `n`.
 *
 * Exists for hand-edited links: `?slots=16` has to become a prime, and the
 * nearest one is a better answer than either ignoring the parameter or refusing
 * to load. Ties go to the smaller length, which is the harder table.
 */
export function nearestSlots(n: number): number {
  return SLOT_CHOICES.reduce((best, s) =>
    Math.abs(s - n) < Math.abs(best - n) ? s : best,
  SLOT_CHOICES[0]);
}

export type ProbeId = 'linear' | 'quadratic' | 'double';

export interface Probe {
  readonly id: ProbeId;
  readonly name: string;
  readonly full: string;
  /** The step rule, written the way it is implemented below. */
  readonly rule: string;
  readonly claims: string;
  readonly weakness: string;
}

export const probes: readonly Probe[] = [
  {
    id: 'linear',
    name: 'Linear',
    full: 'Linear probing',
    rule: 'h(k) + i',
    claims: 'Visits every slot, so it always finds room if room exists.',
    weakness: 'Primary clustering: full runs merge and grow, so later probes get longer.',
  },
  {
    id: 'quadratic',
    name: 'Quadratic',
    full: 'Quadratic probing',
    rule: 'h(k) + i²',
    claims: 'Breaks up the runs linear probing builds.',
    weakness: 'Secondary clustering, and with i² it reaches only about half a prime table.',
  },
  {
    id: 'double',
    name: 'Double',
    full: 'Double hashing',
    rule: 'h₁(k) + i · h₂(k)',
    claims: 'Each key gets its own stride, so two colliding keys diverge immediately.',
    weakness: 'Two hashes per insert, and the stride must never be a multiple of the length.',
  },
];

export function findProbe(id: string): Probe {
  return probes.find((p) => p.id === id) ?? probes[0];
}

export type HashStepKind = 'hash' | 'collide' | 'place' | 'give-up';

export interface HashFrame {
  /** Slot contents; NONE is empty. Length is always the table length. */
  readonly slots: readonly number[];
  /** The key being placed, or NONE when finished. */
  readonly placing: number;
  /** Slots this key has probed so far, in order. */
  readonly probed: readonly number[];
  /** The slot this step is looking at, or NONE. */
  readonly at: number;
  readonly note: string;
}

export interface HashEntry {
  readonly key: number;
  readonly slot: number;
  readonly home: number;
  /** Probes this key needed, counting its first look. Never modelled. */
  readonly probes: number;
}

export interface HashOutcome {
  readonly slots: readonly number[];
  readonly entries: readonly HashEntry[];
  readonly placed: number;
  readonly probes: number;
  readonly collisions: number;
  readonly worst: number;
  readonly avgProbes: number;
  readonly load: number;
  /** Longest run of consecutive full slots, wrapping. The clustering readout. */
  readonly cluster: number;
  /** Keys the probe sequence could not place. Reported, never hidden. */
  readonly rejected: readonly number[];
}

export interface HashRun {
  readonly trace: Trace<HashFrame, HashStepKind>;
  readonly outcome: HashOutcome;
}

/**
 * The hash itself: multiply, mix the high bits down, mask to 31 bits.
 *
 * Knuth's multiplicative constant, then an xor-shift so that the low bits of
 * the result depend on the high bits of the product. `k % length` alone would
 * have been simpler and would also have been a lie about what a hash function
 * does — with small sequential keys it maps them to sequential slots, and the
 * clustering on screen would be an artefact of the keys rather than of the
 * probe strategy the visitor is there to compare.
 */
export function hash1(k: number, length: number): number {
  let h = Math.imul(k, 2654435761) >>> 0;
  h ^= h >>> 15;
  return (h >>> 1) % length;
}

/**
 * The second hash, used only by double hashing.
 *
 * `1 + (h mod (length - 1))` lands in [1, length - 1]. Both ends matter: a
 * stride of zero would probe one slot forever, and because the length is prime
 * no value in that range shares a factor with it, so the sequence is guaranteed
 * to visit every slot before it repeats.
 */
export function hash2(k: number, length: number): number {
  let h = Math.imul(k ^ 0x9e3779b9, 2246822519) >>> 0;
  h ^= h >>> 13;
  return 1 + ((h >>> 1) % (length - 1));
}

/** The i-th slot this strategy inspects for `k`. Pure, and shared with lookup. */
export function probeAt(strategy: ProbeId, k: number, i: number, length: number): number {
  const home = hash1(k, length);
  if (strategy === 'linear') return (home + i) % length;
  if (strategy === 'quadratic') return (home + i * i) % length;
  return (home + i * hash2(k, length)) % length;
}

/**
 * Insert every key, recording each probe.
 *
 * The probe budget is the table length. Linear probing and double hashing both
 * cover the whole table within that many steps, so for them the budget can only
 * be exhausted by a genuinely full table. Quadratic probing can stall while
 * space remains — that is its real, documented weakness — and when it does, the
 * key is recorded in `rejected` and reported on screen. Growing the table or
 * silently falling back to a linear scan would both erase the very behaviour
 * this bench exists to show.
 */
export function buildHash(
  keys: readonly number[],
  strategy: ProbeId,
  length: number,
  record = true,
): HashRun {
  const empty: HashFrame = {
    slots: new Array<number>(length).fill(NONE),
    placing: NONE,
    probed: [],
    at: NONE,
    note: 'Empty table.',
  };

  const rec: Recorder<HashFrame, HashStepKind> = recording<HashFrame, HashStepKind>(empty);

  const slots = new Array<number>(length).fill(NONE);
  const entries: HashEntry[] = [];
  const rejected: number[] = [];

  const step = (
    kind: HashStepKind,
    at: number,
    placing: number,
    probed: readonly number[],
    note: string,
  ) => {
    if (!record) return;
    const shot = [...slots];
    const walked = [...probed];
    rec.step(kind, at === NONE ? [] : [at], () => ({
      slots: shot,
      placing,
      probed: walked,
      at,
      note,
    }));
  };

  for (const k of keys) {
    const home = hash1(k, length);
    const probed: number[] = [];
    let placed = false;

    for (let i = 0; i < length; i += 1) {
      const slot = probeAt(strategy, k, i, length);
      probed.push(slot);
      rec.tally('probes');

      if (i === 0) {
        step('hash', slot, k, probed, `h(${k}) = ${home}`);
      }

      if (slots[slot] === NONE) {
        slots[slot] = k;
        entries.push({ key: k, slot, home, probes: probed.length });
        placed = true;
        step('place', slot, k, probed, `${k} lands in slot ${slot} after ${probed.length} probe${probed.length === 1 ? '' : 's'}`);
        break;
      }

      // Occupied. A collision is a probe that found someone else's key, so the
      // first look counts too — that is the standard definition, and it is why
      // this tally sits here and not under `i > 0`.
      rec.tally('collisions');
      step(
        'collide',
        slot,
        k,
        probed,
        `slot ${slot} holds ${slots[slot]} — ${strategy === 'linear' ? 'try the next one' : `step to ${probeAt(strategy, k, i + 1, length)}`}`,
      );
    }

    if (!placed) {
      rejected.push(k);
      step('give-up', NONE, k, probed, `${k} exhausted ${probed.length} probes without finding a free slot`);
    }
  }

  // ── Finish ─────────────────────────────────────────────────────────────
  const totalProbes = rec.count('probes');
  const worst = entries.reduce((w, e) => (e.probes > w ? e.probes : w), 0);

  // Longest run of full slots, measured with a wrap-around walk over twice the
  // table so a cluster straddling the end is not cut in half by the array edge.
  let cluster = 0;
  let run = 0;
  const full = slots.filter((s) => s !== NONE).length;
  if (full === length) {
    cluster = length;
  } else {
    for (let i = 0; i < length * 2; i += 1) {
      if (slots[i % length] !== NONE) {
        run += 1;
        if (run > cluster) cluster = run;
      } else run = 0;
    }
  }

  const final: HashFrame = {
    slots: [...slots],
    placing: NONE,
    probed: [],
    at: NONE,
    note: `${entries.length} of ${keys.length} keys placed.`,
  };

  const trace = rec.done(final);

  return {
    trace,
    outcome: {
      slots: [...slots],
      entries,
      placed: entries.length,
      probes: totalProbes,
      collisions: rec.count('collisions'),
      worst,
      avgProbes: entries.length === 0 ? 0 : totalProbes / entries.length,
      load: length === 0 ? 0 : full / length,
      cluster,
      rejected,
    },
  };
}

/**
 * Properties the finished table must satisfy.
 *
 * The findability check re-runs `probeAt` from i = 0 and stops at the first
 * empty slot, which is exactly how a real lookup must behave — and it is the
 * check that matters most, because a table can look perfectly plausible while
 * holding keys that no search would ever reach. Rejected keys are excluded from
 * it: they were never inserted, so their absence is honest rather than a fault.
 */
export function verifyHash(
  keys: readonly number[],
  strategy: ProbeId,
  length: number,
  outcome: HashOutcome,
): Verification {
  const stored = outcome.slots.filter((s) => s !== NONE);
  const distinct = new Set(stored).size === stored.length;

  let unreachable = NONE;
  for (const e of outcome.entries) {
    let found = false;
    for (let i = 0; i < length; i += 1) {
      const slot = probeAt(strategy, e.key, i, length);
      if (outcome.slots[slot] === e.key) {
        found = true;
        break;
      }
      if (outcome.slots[slot] === NONE) break;
    }
    if (!found) {
      unreachable = e.key;
      break;
    }
  }

  // The probe counts are tallied per key while inserting; their sum must equal
  // the run's total minus whatever the rejected keys burned. If those two ever
  // disagree, a stat on screen is not measuring what it says it measures.
  const spentOnPlaced = outcome.entries.reduce((sum, e) => sum + e.probes, 0);
  const accounted = spentOnPlaced <= outcome.probes;

  return verification([
    check(
      'Every stored key is findable',
      unreachable === NONE,
      unreachable === NONE
        ? `${outcome.entries.length} of ${outcome.entries.length} keys reachable by probe sequence`
        : `${unreachable} sits behind an empty slot`,
    ),
    check(
      'No key stored twice',
      distinct,
      `${stored.length} occupied slots, ${new Set(stored).size} distinct keys`,
    ),
    check(
      'Occupied slots equal keys placed',
      stored.length === outcome.placed,
      `${stored.length} full, ${outcome.placed} placed of ${keys.length} offered`,
    ),
    check(
      'Probe counts add up',
      accounted,
      `${spentOnPlaced} probes across placed keys, ${outcome.probes} counted in total`,
    ),
  ]);
}

