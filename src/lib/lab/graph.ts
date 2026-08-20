/**
 * PATHFINDING — four searches over one seeded, weighted grid.
 *
 * ── Why a grid, and why weights ─────────────────────────────────────────
 * A grid is the only graph that needs no legend: adjacency is visible, the
 * shortest route is something the eye can argue with, and a wrong answer is
 * obvious rather than plausible. So the graph is a grid — but a grid with
 * *terrain*, because a uniform grid quietly hides the whole point of this
 * bench.
 *
 * On uniform edges, breadth-first search and Dijkstra return routes of equal
 * cost, and Dijkstra looks like BFS with extra machinery for nothing. Give
 * some cells a higher entry cost and the two separate immediately: BFS still
 * finds the route with the *fewest cells*, and cheerfully walks straight
 * through the expensive ones; Dijkstra finds the route with the *lowest cost*
 * and detours around them. That divergence is the lesson, and it only exists
 * if the weights do.
 *
 * ── What each search claims, and what is checked ────────────────────────
 * The four searches here make deliberately different promises:
 *
 *   - breadth-first  — fewest cells. Optimal in steps, blind to cost.
 *   - depth-first    — *a* route. No optimality claim at all.
 *   - Dijkstra       — lowest total cost.
 *   - A*             — lowest total cost, guided, so fewer expansions.
 *
 * `verifyRoute` below checks each search against the promise it actually
 * makes rather than against one shared notion of "correct", because holding
 * depth-first search to Dijkstra's standard would mark a correct algorithm
 * wrong. The reference it compares against is Bellman–Ford: a different
 * algorithm with a different shape — no priority queue, no greedy settle,
 * just repeated relaxation of every edge — so agreement between the two is
 * evidence rather than a tautology. Comparing Dijkstra against a second
 * Dijkstra would only prove that the code was copied consistently.
 *
 * ── Cost of a trace ────────────────────────────────────────────────────
 * As in `sorting.ts`, the search runs to completion first and the view is a
 * pure function of `(trace, cursor)`. A frame here is a `Uint8Array` of cell
 * states plus a `Float32Array` of known distances: for the 21x13 default that
 * is 273 + 1092 ≈ 1.4 KB per step, and a full Dijkstra over 273 cells records
 * roughly a thousand steps — about 1.4 MB, built once, in a few milliseconds.
 * That is the price of O(1) scrubbing, and it is why `GRID_MAX_CELLS` exists:
 * the trade is fine at hundreds of cells and would not be at tens of
 * thousands.
 *
 * Neighbour rejections are the exception — they are tallied but not recorded.
 * A step per rejected neighbour would roughly double every trace to show a
 * frame identical to the one before it. The count stays honest; only the
 * frame is skipped.
 */

import { rng } from './core/rng';
import { check, ratio, verification, type Verification } from './core/verify';
import { counting, recording, type Recorder, type Trace } from './core/trace';

/* ──────────────────────────────────────────────────────────────────────
 * SECTION 1. THE GRID
 * ────────────────────────────────────────────────────────────────────── */

/** What a cell is. Stored as bytes so a frame copy is a memcpy. */
export const OPEN = 0;
export const ROUGH = 1;
export const WALL = 2;

/**
 * Entering a rough cell costs this much.
 *
 * Five, not two: the detour Dijkstra takes has to be visibly *worth* taking.
 * At a cost of two, avoiding rough terrain rarely changes the route on a small
 * grid, and the bench would appear to show two algorithms agreeing.
 */
export const ROUGH_COST = 5;

/**
 * Upper bound on cells, enforced by `makeGrid`.
 *
 * Not a performance guess — a memory one. Every step keeps a full copy of the
 * state and distance arrays, so trace size grows with cells x steps, and steps
 * themselves grow with cells. Past a few hundred cells the honest options are
 * delta-encoded frames or no scrubbing; this bench keeps scrubbing.
 */
export const GRID_MAX_CELLS = 900;

export type ShapeId = 'maze' | 'rooms' | 'terrain' | 'scatter';

export interface Grid {
  readonly cols: number;
  readonly rows: number;
  /** One byte per cell: `OPEN`, `ROUGH` or `WALL`. Row-major. */
  readonly cells: Uint8Array;
  readonly start: number;
  readonly goal: number;
  readonly shape: ShapeId;
  readonly seed: number;
}

/** Cost to *enter* a cell. Walls are unreachable rather than expensive. */
export function enterCost(grid: Grid, index: number): number {
  const cell = grid.cells[index];
  if (cell === WALL) return Infinity;
  return cell === ROUGH ? ROUGH_COST : 1;
}

/**
 * Open neighbours, always in the order north, east, south, west.
 *
 * The order is fixed and documented because it is not cosmetic: it decides
 * every tie, so it decides which of several equally short routes each search
 * returns. Depth-first search in particular is *defined* by it. A neighbour
 * order that varied between runs would make the bench irreproducible while
 * still looking correct, which is the worst kind of non-determinism.
 */
export function neighbours(grid: Grid, index: number): number[] {
  const { cols, rows, cells } = grid;
  const x = index % cols;
  const y = (index - x) / cols;
  const out: number[] = [];
  if (y > 0 && cells[index - cols] !== WALL) out.push(index - cols);
  if (x < cols - 1 && cells[index + 1] !== WALL) out.push(index + 1);
  if (y < rows - 1 && cells[index + cols] !== WALL) out.push(index + cols);
  if (x > 0 && cells[index - 1] !== WALL) out.push(index - 1);
  return out;
}

/** Manhattan distance in cells. Also A*'s heuristic — see `searches`. */
export function manhattan(grid: Grid, a: number, b: number): number {
  const ax = a % grid.cols;
  const bx = b % grid.cols;
  return Math.abs(ax - bx) + Math.abs((a - ax) / grid.cols - (b - bx) / grid.cols);
}

/* ──────────────────────────────────────────────────────────────────────
 * SECTION 2. GENERATION — four shapes, one seed
 * ────────────────────────────────────────────────────────────────────── */

export interface Shape {
  readonly id: ShapeId;
  readonly name: string;
  /** What this shape is *for* — which behaviour it exposes. */
  readonly note: string;
}

export const shapes: readonly Shape[] = [
  {
    id: 'maze',
    name: 'Maze',
    note: 'A perfect maze: exactly one route between any two cells, so every search must find the same one and only the order of exploration differs.',
  },
  {
    id: 'rooms',
    name: 'Rooms',
    note: 'Chambers joined by corridors. Open space lets depth-first search commit to a wrong direction for a long time.',
  },
  {
    id: 'terrain',
    name: 'Terrain',
    note: 'No walls, only cheap and expensive ground. This is where fewest-cells and lowest-cost stop agreeing.',
  },
  {
    id: 'scatter',
    name: 'Scatter',
    note: 'Random obstacles. Many routes of equal length, so tie-breaking becomes visible.',
  },
];

/** Odd side lengths, because the maze carver needs them — see `carveMaze`. */
function oddDown(n: number): number {
  const floored = Math.floor(n);
  return floored % 2 === 0 ? floored - 1 : floored;
}

/**
 * Rows that suit the width.
 *
 * Exported because the bench's size control drives width only: it has one
 * slider, and deriving height keeps the two from being set to a combination
 * that no shape generates well (a 31x3 maze is a corridor, not a maze).
 */
export function rowsFor(cols: number): number {
  return Math.max(7, oddDown(cols * 0.62));
}

/**
 * Build a grid. Same `(cols, rows, shape, seed)` always yields the same grid.
 *
 * Start and goal are the two inner corners rather than random cells: a fixed
 * pair makes two runs comparable, which is the only reason to have a seed at
 * all. On odd dimensions both corners are on the maze carver's lattice, so
 * every shape can use the same two cells.
 */
export function makeGrid(cols: number, rows: number, shape: ShapeId, seed: number): Grid {
  let w = Math.max(7, oddDown(cols));
  let h = Math.max(7, oddDown(rows));
  // Shrink the longer side, two at a time so both stay odd, until the cell
  // budget is met. Clamping here rather than trusting every caller means the
  // memory argument in this file's header holds no matter who calls it.
  while (w * h > GRID_MAX_CELLS && (w > 7 || h > 7)) {
    if (w >= h && w > 7) w -= 2;
    else if (h > 7) h -= 2;
    else break;
  }
  const cells = new Uint8Array(w * h);
  const start = w + 1; // (1, 1)
  const goal = (h - 2) * w + (w - 2);

  const grid: Grid = { cols: w, rows: h, cells, start, goal, shape, seed };
  const r = rng(seed);

  if (shape === 'maze') {
    cells.fill(WALL);
    carveMaze(grid, r);
  } else if (shape === 'rooms') {
    cells.fill(WALL);
    carveRooms(grid, r);
  } else if (shape === 'scatter') {
    for (let i = 0; i < cells.length; i += 1) cells[i] = r.chance(0.3) ? WALL : OPEN;
  } else {
    cells.fill(OPEN);
  }

  // Border walls make every shape read as a contained space, and remove the
  // edge cases where a route leaves through the side of the picture.
  for (let x = 0; x < w; x += 1) {
    cells[x] = WALL;
    cells[(h - 1) * w + x] = WALL;
  }
  for (let y = 0; y < h; y += 1) {
    cells[y * w] = WALL;
    cells[y * w + w - 1] = WALL;
  }

  cells[start] = OPEN;
  cells[goal] = OPEN;
  connect(grid);

  // Rough ground is painted *after* connectivity is settled, so it can never
  // make the goal unreachable — expensive is not the same as impassable, and
  // the repair pass should not have to know the difference.
  if (shape === 'terrain') roughen(grid, r, 5, 26);
  else if (shape === 'rooms') roughen(grid, r, 3, 12);

  cells[start] = OPEN;
  cells[goal] = OPEN;
  return grid;
}

/**
 * Recursive backtracker, iterative.
 *
 * Cells with both coordinates odd are rooms; the even cells between them are
 * the walls that get knocked through. That is why the grid is forced odd: on
 * an even width the last column is not on the lattice and the maze would be
 * carved against a wall it cannot use.
 *
 * The result is a spanning tree of the lattice, which is what makes this shape
 * useful here: exactly one route exists between any two cells, so all four
 * searches must agree on the route and can only differ in how much of the maze
 * they touch on the way. Any disagreement about the route itself is a bug, and
 * this shape is where it would show.
 */
function carveMaze(grid: Grid, r: ReturnType<typeof rng>): void {
  const { cols, rows, cells } = grid;
  const stack: number[] = [cols + 1];
  cells[cols + 1] = OPEN;

  while (stack.length > 0) {
    const at = stack[stack.length - 1];
    const x = at % cols;
    const y = (at - x) / cols;

    const options: number[] = [];
    if (y > 2 && cells[at - 2 * cols] === WALL) options.push(at - 2 * cols);
    if (x < cols - 3 && cells[at + 2] === WALL) options.push(at + 2);
    if (y < rows - 3 && cells[at + 2 * cols] === WALL) options.push(at + 2 * cols);
    if (x > 2 && cells[at - 2] === WALL) options.push(at - 2);

    if (options.length === 0) {
      stack.pop();
      continue;
    }

    const next = options[r.int(0, options.length - 1)];
    cells[(at + next) / 2] = OPEN; // the wall exactly between the two rooms
    cells[next] = OPEN;
    stack.push(next);
  }
}

/** Rectangular chambers, then L-shaped corridors joining them in sequence. */
function carveRooms(grid: Grid, r: ReturnType<typeof rng>): void {
  const { cols, rows, cells } = grid;
  const count = Math.max(3, Math.round((cols * rows) / 60));
  const centres: number[] = [];

  for (let i = 0; i < count; i += 1) {
    const w = r.int(3, 6);
    const h = r.int(2, 4);
    const x0 = r.int(1, Math.max(1, cols - 2 - w));
    const y0 = r.int(1, Math.max(1, rows - 2 - h));
    for (let y = y0; y < Math.min(rows - 1, y0 + h); y += 1) {
      for (let x = x0; x < Math.min(cols - 1, x0 + w); x += 1) cells[y * cols + x] = OPEN;
    }
    centres.push((y0 + Math.floor(h / 2)) * cols + x0 + Math.floor(w / 2));
  }

  // Chaining consecutive centres, rather than joining every pair, keeps the
  // layout sparse enough that a wrong turn is a real commitment.
  for (let i = 1; i < centres.length; i += 1) corridor(grid, centres[i - 1], centres[i]);
  corridor(grid, grid.start, centres[0]);
  corridor(grid, centres[centres.length - 1], grid.goal);
}

/** Carve horizontally then vertically. Two straight runs, one bend. */
function corridor(grid: Grid, from: number, to: number): void {
  const { cols, rows, cells } = grid;
  const fx = from % cols;
  const fy = (from - fx) / cols;
  const tx = to % cols;
  const ty = (to - tx) / cols;
  const y = Math.min(rows - 2, Math.max(1, fy));

  for (let x = Math.min(fx, tx); x <= Math.max(fx, tx); x += 1) cells[y * cols + x] = OPEN;
  const x = Math.min(cols - 2, Math.max(1, tx));
  for (let yy = Math.min(y, ty); yy <= Math.max(y, ty); yy += 1) cells[yy * cols + x] = OPEN;
}

/** Random walks of rough ground — blobs rather than noise, so detours exist. */
function roughen(grid: Grid, r: ReturnType<typeof rng>, blobs: number, length: number): void {
  const { cols, rows, cells } = grid;
  for (let b = 0; b < blobs; b += 1) {
    let at = r.int(1, rows - 2) * cols + r.int(1, cols - 2);
    for (let i = 0; i < length; i += 1) {
      if (cells[at] === OPEN && at !== grid.start && at !== grid.goal) cells[at] = ROUGH;
      const step = neighbours(grid, at);
      if (step.length === 0) break;
      at = step[r.int(0, step.length - 1)];
    }
  }
}

/**
 * Guarantee the goal is reachable by removing walls until it is.
 *
 * A bench whose default view says "no route exists" teaches nothing about the
 * four searches, so the generator does not ship one. The repair is blunt on
 * purpose: flood from the start, then open the wall that is adjacent to the
 * flooded region and closest to the goal. Each pass opens exactly one wall, so
 * the loop cannot run longer than there are walls, and it terminates without
 * needing an argument about the random layout it was handed.
 *
 * Note that the searches themselves do *not* rely on this. They all handle an
 * unreachable goal, and `verifyRoute` checks that case against the reference
 * too — a guarantee made by the generator is not a licence for the engine to
 * assume it.
 */
function connect(grid: Grid): void {
  const { cols, cells } = grid;

  for (;;) {
    const seen = new Uint8Array(cells.length);
    const queue: number[] = [grid.start];
    seen[grid.start] = 1;
    for (let head = 0; head < queue.length; head += 1) {
      for (const next of neighbours(grid, queue[head])) {
        if (seen[next] === 1) continue;
        seen[next] = 1;
        queue.push(next);
      }
    }
    if (seen[grid.goal] === 1) return;

    let best = -1;
    let bestScore = Infinity;
    for (let i = 0; i < cells.length; i += 1) {
      if (cells[i] !== WALL) continue;
      const x = i % cols;
      const y = (i - x) / cols;
      if (x === 0 || y === 0 || x === cols - 1 || y === grid.rows - 1) continue;
      const touches =
        seen[i - cols] === 1 || seen[i + cols] === 1 || seen[i - 1] === 1 || seen[i + 1] === 1;
      if (!touches) continue;
      const score = manhattan(grid, i, grid.goal);
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }

    // No wall borders the flooded region: the goal is sealed off by the frame
    // itself, which the border pass above cannot produce. Nothing to open.
    if (best < 0) return;
    cells[best] = OPEN;
  }
}

/* ──────────────────────────────────────────────────────────────────────
 * SECTION 3. THE FRONTIER — one binary heap, written out
 * ────────────────────────────────────────────────────────────────────── */

/**
 * A binary min-heap over cell indices.
 *
 * Written rather than imported because the priority queue *is* the difference
 * between Dijkstra and a linear scan, and a bench that claims to show Dijkstra
 * should not hide the part that makes it O((V+E) log V).
 *
 * Stale entries are tolerated instead of supported: improving a distance
 * pushes the cell again and leaves the old entry in place, and `pop` skips any
 * cell already settled. Lazy deletion costs a larger heap — bounded by the
 * number of pushes, which is bounded by the number of edges — and saves the
 * index bookkeeping that decrease-key needs. On a grid, where a cell has at
 * most four edges, that is the right side of the trade.
 */
class Heap {
  private readonly cell: number[] = [];
  private readonly key: number[] = [];

  push(cell: number, key: number): void {
    this.cell.push(cell);
    this.key.push(key);
    let i = this.cell.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.key[parent] <= this.key[i]) break;
      this.swap(parent, i);
      i = parent;
    }
  }

  pop(): { cell: number; key: number } | null {
    if (this.cell.length === 0) return null;
    const cell = this.cell[0];
    const key = this.key[0];
    const lastCell = this.cell.pop() as number;
    const lastKey = this.key.pop() as number;

    if (this.cell.length > 0) {
      this.cell[0] = lastCell;
      this.key[0] = lastKey;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let small = i;
        if (left < this.key.length && this.key[left] < this.key[small]) small = left;
        if (right < this.key.length && this.key[right] < this.key[small]) small = right;
        if (small === i) break;
        this.swap(small, i);
        i = small;
      }
    }
    return { cell, key };
  }

  private swap(a: number, b: number): void {
    const c = this.cell[a];
    this.cell[a] = this.cell[b];
    this.cell[b] = c;
    const k = this.key[a];
    this.key[a] = this.key[b];
    this.key[b] = k;
  }
}

/* ──────────────────────────────────────────────────────────────────────
 * SECTION 4. THE TRACE
 * ────────────────────────────────────────────────────────────────────── */

/** Per-cell state inside a frame. Bytes, so a frame copy stays a memcpy. */
export const UNSEEN = 0;
export const FRONTIER = 1;
export const SETTLED = 2;
export const ROUTE = 3;

export type StepKind =
  /** Taken off the frontier and settled. Its distance will not change again. */
  | 'expand'
  /** A neighbour reached for the first time and put on the frontier. */
  | 'discover'
  /** A neighbour already on the frontier, reached more cheaply. */
  | 'improve'
  /** The goal came off the frontier. The search stops here. */
  | 'reach'
  /** One cell of the finished route, revealed walking back from the goal. */
  | 'route';

export interface Frame {
  /** `UNSEEN` / `FRONTIER` / `SETTLED` / `ROUTE` per cell. */
  readonly state: Uint8Array;
  /** Best distance known so far, `Infinity` where unknown. */
  readonly dist: Float32Array;
  /** The cell this step is about, or -1. */
  readonly head: number;
  /** Frontier size after this step — measured from the structure, not guessed. */
  readonly frontier: number;
  /** Route cells revealed so far. Empty until the reveal phase. */
  readonly route: readonly number[];
}

/**
 * What a search produced, separately from how it got there.
 *
 * `cost` is the distance the *search* reported, and is deliberately not the
 * cost recomputed from `route`. Keeping them apart is what lets `verifyRoute`
 * compare two independent numbers instead of one number with itself.
 */
export interface Outcome {
  /** Start to goal inclusive, or empty when no route exists. */
  readonly route: readonly number[];
  /** Distance to the goal as the search finished. `Infinity` if unreachable. */
  readonly cost: number;
  /** Priority of each settled cell, in settle order. Checked for monotonicity. */
  readonly priorities: readonly number[];
  /** Pops that settled a cell. */
  readonly settled: number;
  /**
   * Pops thrown away because that cell was already settled.
   *
   * This is the price of lazy deletion, measured rather than asserted — and it
   * is genuinely zero for the two searches that never push a cell twice, which
   * is why the heap needs the mechanism and the queue and stack do not.
   */
  readonly stale: number;
  /** Largest the frontier ever got. Not additive, so it is not a counter. */
  readonly peak: number;
}

export interface Run {
  readonly trace: Trace<Frame, StepKind>;
  readonly outcome: Outcome;
}

export type SearchId = 'bfs' | 'dfs' | 'dijkstra' | 'astar';

export interface Search {
  readonly id: SearchId;
  readonly name: string;
  /** The data structure the frontier is. This is the whole difference. */
  readonly frontier: string;
  /** What the search guarantees about the route it returns. */
  readonly claims: 'steps' | 'cost' | 'none';
  readonly optimal: string;
  readonly note: string;
}

export const searches: readonly Search[] = [
  {
    id: 'bfs',
    name: 'Breadth-first',
    frontier: 'FIFO queue',
    claims: 'steps',
    optimal: 'Fewest cells',
    note: 'Expands in rings of equal step count, so the first time it reaches a cell it has used the fewest possible moves. It never looks at cost, so on rough ground it will happily take the expensive shortcut.',
  },
  {
    id: 'dfs',
    name: 'Depth-first',
    frontier: 'LIFO stack',
    claims: 'none',
    optimal: 'None',
    note: 'Follows one direction until it runs out of grid, then backtracks. It finds a route, not a good one — which is exactly why it is here: the route it returns is usually far worse than the reference, and the self-check below says so rather than hiding it.',
  },
  {
    id: 'dijkstra',
    name: 'Dijkstra',
    frontier: 'binary min-heap by cost',
    claims: 'cost',
    optimal: 'Lowest cost',
    note: 'Always settles the cheapest reachable cell next, so a settled distance can never be improved later. That invariant is what makes it correct, and it holds only because no edge cost is negative.',
  },
  {
    id: 'astar',
    name: 'A*',
    frontier: 'binary min-heap by cost + estimate',
    claims: 'cost',
    optimal: 'Lowest cost',
    note: 'Dijkstra plus a Manhattan estimate of the distance still to go. Because the cheapest cell costs 1 to enter, that estimate can never overshoot the true remaining cost, which is the condition for the answer to stay optimal — and it usually settles far fewer cells to get there.',
  },
];

export function findSearch(id: string): Search | null {
  return searches.find((s) => s.id === id) ?? null;
}

/**
 * Run one search over one grid.
 *
 * `record` exists so the same code can be run for its counters alone — the
 * complexity comparison needs totals from grids far too large to keep frames
 * for, and re-implementing the searches to count them would mean measuring
 * something other than what the bench displays.
 */
export function search(grid: Grid, id: SearchId, record = true): Run {
  const total = grid.cols * grid.rows;
  const state = new Uint8Array(total);
  const dist = new Float32Array(total).fill(Infinity);
  const from = new Int32Array(total).fill(-1);
  /*
   * Moves from the start along the tree this search built.
   *
   * Kept separate from `dist`, because conflating the two is exactly how this
   * bench would end up lying about a correct algorithm. `dist` accumulates
   * *terrain cost*, so the display can show what breadth-first search's route
   * really costs on rough ground. `rank` counts *moves*, which is the quantity
   * breadth-first search is optimal in and therefore the priority its frontier
   * is actually ordered by. Report cost as its priority and the monotonicity
   * check below would fail a textbook-correct search.
   */
  const rank = new Int32Array(total).fill(-1);

  let frontierSize = 0;
  let peak = 0;
  const priorities: number[] = [];
  let settled = 0;
  let stale = 0;

  const snapshot = (head: number, route: readonly number[] = []): Frame => ({
    state: state.slice(),
    dist: dist.slice(),
    head,
    frontier: frontierSize,
    route,
  });

  const rec: Recorder<Frame, StepKind> = record
    ? recording<Frame, StepKind>(snapshot(-1))
    : counting<Frame, StepKind>(snapshot(-1));

  dist[grid.start] = 0;
  rank[grid.start] = 0;
  state[grid.start] = FRONTIER;

  /*
   * All four searches share this loop. What varies is only which cell comes
   * off the frontier next, so that is the only thing the branches below decide
   * — writing four near-identical loops would let them drift apart, and then a
   * difference in the display would not be evidence of a difference in the
   * algorithm.
   */
  const heap = new Heap();
  const queue: number[] = [];
  let head = 0;
  const stack: number[] = [];

  const heuristic = (cell: number): number => (id === 'astar' ? manhattan(grid, cell, grid.goal) : 0);

  const push = (cell: number, priority: number): void => {
    if (id === 'bfs') queue.push(cell);
    else if (id === 'dfs') stack.push(cell);
    else heap.push(cell, priority);
    frontierSize += 1;
    if (frontierSize > peak) peak = frontierSize;
  };

  const take = (): { cell: number; key: number } | null => {
    if (id === 'bfs') {
      while (head < queue.length) {
        const cell = queue[head];
        head += 1;
        frontierSize -= 1;
        if (state[cell] !== SETTLED) return { cell, key: rank[cell] };
        stale += 1;
      }
      return null;
    }
    if (id === 'dfs') {
      while (stack.length > 0) {
        const cell = stack.pop() as number;
        frontierSize -= 1;
        if (state[cell] !== SETTLED) return { cell, key: rank[cell] };
        stale += 1;
      }
      return null;
    }
    for (;;) {
      const top = heap.pop();
      if (top === null) return null;
      frontierSize -= 1;
      // A stale entry: this cell was already settled through a cheaper route.
      if (state[top.cell] === SETTLED) {
        stale += 1;
        continue;
      }
      return top;
    }
  };

  push(grid.start, heuristic(grid.start));

  let reached = false;

  while (!reached) {
    const next = take();
    if (next === null) break;

    state[next.cell] = SETTLED;
    settled += 1;
    priorities.push(next.key);
    rec.tally('expanded');
    rec.step('expand', [next.cell], () => snapshot(next.cell));

    if (next.cell === grid.goal) {
      rec.step('reach', [next.cell], () => snapshot(next.cell));
      reached = true;
      break;
    }

    for (const side of neighbours(grid, next.cell)) {
      if (state[side] === SETTLED) {
        rec.tally('rejected');
        continue;
      }

      /*
       * Breadth-first and depth-first search are *not* cost-driven: they must
       * accept a neighbour the first time they see it and never reconsider it,
       * or they stop being the algorithms they are named after. Only the two
       * cost-driven searches compare and improve.
       */
      const step = id === 'bfs' || id === 'dfs' ? 1 : enterCost(grid, side);
      const through = dist[next.cell] + step;
      const known = dist[side];

      if (known === Infinity) {
        dist[side] = id === 'bfs' || id === 'dfs' ? dist[next.cell] + enterCost(grid, side) : through;
        from[side] = next.cell;
        rank[side] = rank[next.cell] + 1;
        state[side] = FRONTIER;
        rec.tally('pushed');
        push(side, dist[side] + heuristic(side));
        rec.step('discover', [next.cell, side], () => snapshot(side));
        continue;
      }

      if ((id === 'dijkstra' || id === 'astar') && through < known) {
        dist[side] = through;
        from[side] = next.cell;
        rank[side] = rank[next.cell] + 1;
        state[side] = FRONTIER;
        rec.tally('improved');
        push(side, through + heuristic(side));
        rec.step('improve', [next.cell, side], () => snapshot(side));
        continue;
      }

      rec.tally('rejected');
    }
  }

  /*
   * Walk the predecessor chain back from the goal.
   *
   * `from` is only ever written for a cell that is not yet settled, and it is
   * written by a cell that has just been settled — so every link is an edge
   * of the grid between two cells the search actually stood on, and following
   * it cannot wander off the route. Depth-first search included: its chain is
   * its own tree, which is why it produces a valid but expensive route rather
   * than an invalid one.
   */
  const route: number[] = [];
  if (reached) {
    for (let at = grid.goal; at !== -1; at = from[at]) route.push(at);
    route.reverse();
  }

  // Revealed one cell at a time, from the goal backwards, so the end of the
  // timeline is the answer being drawn rather than a frame that simply appears.
  const shown: number[] = [];
  for (let i = route.length - 1; i >= 0; i -= 1) {
    state[route[i]] = ROUTE;
    shown.push(route[i]);
    const frozen = [...shown];
    rec.step('route', [route[i]], () => snapshot(route[i], frozen));
  }

  const outcome: Outcome = {
    route,
    cost: reached ? dist[grid.goal] : Infinity,
    priorities,
    settled,
    stale,
    peak,
  };

  return { trace: rec.done(snapshot(-1, route)), outcome };
}

/* ──────────────────────────────────────────────────────────────────────
 * SECTION 5. SELF-VERIFICATION — a reference that is not this code
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Bellman–Ford from the start cell.
 *
 * Chosen precisely because it shares nothing with the four searches above: no
 * frontier, no settle order, no early exit at the goal. It relaxes every edge,
 * repeatedly, until a full pass changes nothing. If Dijkstra's answer and this
 * answer agree, two unrelated methods reached the same number; if they
 * disagree, one of them is wrong and the badge says so instead of the bench
 * quietly showing a plausible route.
 *
 * `unit` swaps every cost for 1, which turns the same routine into a reference
 * for the *fewest-cells* claim that breadth-first search makes. One reference,
 * two questions, still independent of the code under test.
 *
 * O(V x E) is the price. At `GRID_MAX_CELLS` cells with at most four edges
 * each that is a few million relaxations worst case, and the early exit
 * usually ends it in a small number of passes — cheap enough to run on every
 * change to the grid, which is what makes the check continuous rather than
 * something that was true once.
 */
function reference(grid: Grid, unit: boolean): Float64Array {
  const total = grid.cols * grid.rows;
  const dist = new Float64Array(total).fill(Infinity);
  dist[grid.start] = 0;

  for (let pass = 0; pass < total; pass += 1) {
    let changed = false;
    for (let cell = 0; cell < total; cell += 1) {
      if (dist[cell] === Infinity) continue;
      for (const side of neighbours(grid, cell)) {
        const step = unit ? 1 : enterCost(grid, side);
        if (dist[cell] + step < dist[side]) {
          dist[side] = dist[cell] + step;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return dist;
}

/** `Infinity` prints as a word, because "∞ cells" reads as a rendering bug. */
function showCost(value: number): string {
  return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : 'unreachable';
}

/**
 * Cost of the route's own prefix up to `cell`, or `null` if it is not on it.
 *
 * Recomputed from the route rather than read out of the engine's `dist` array
 * on purpose: the point of the check above is to compare the drawn line
 * against an outside reference, and reusing the engine's own number for one
 * side of that comparison would quietly remove half the test.
 */
function dist(grid: Grid, route: readonly number[], cell: number): number | null {
  let total = 0;
  for (let i = 0; i < route.length; i += 1) {
    if (i > 0) total += enterCost(grid, route[i]);
    if (route[i] === cell) return total;
  }
  return null;
}

/**
 * Check a run against the promise its algorithm actually makes.
 *
 * Four checks for the three searches that claim an optimum, three for
 * depth-first search, which claims none. The set is not padded out to a fixed
 * length with checks that pass vacuously: a badge reading "monotonic settle
 * order — not applicable" would be a property nobody claimed, dressed as
 * evidence.
 */
export function verifyRoute(grid: Grid, id: SearchId, outcome: Outcome): Verification {
  const algorithm = findSearch(id);
  if (algorithm === null) return verification([]);

  const { route, cost } = outcome;
  const unreachable = route.length === 0;

  /* 1. Is the thing on screen a route at all? */
  let legal = 0;
  for (let i = 1; i < route.length; i += 1) {
    const a = route[i - 1];
    const b = route[i];
    const adjacent = manhattan(grid, a, b) === 1;
    if (adjacent && grid.cells[a] !== WALL && grid.cells[b] !== WALL) legal += 1;
  }
  const endsRight =
    unreachable || (route[0] === grid.start && route[route.length - 1] === grid.goal);
  const moves = Math.max(0, route.length - 1);

  const checks = [
    check(
      'Every move in the route joins two open, adjacent cells',
      legal === moves && endsRight,
      unreachable ? 'no route to check' : ratio(legal, moves, 'moves are legal'),
    ),
  ];

  /* 2. Does the number under the grid describe the line drawn on it? */
  let walked = 0;
  for (let i = 1; i < route.length; i += 1) walked += enterCost(grid, route[i]);
  checks.push(
    check(
      'Route cost equals the distance the search reported',
      unreachable ? !Number.isFinite(cost) : walked === cost,
      unreachable
        ? 'no route · distance unbounded'
        : `walked ${showCost(walked)} · reported ${showCost(cost)}`,
    ),
  );

  /* 3. Where an optimum is claimed, does an unrelated algorithm agree? */
  if (algorithm.claims === 'cost') {
    const best = reference(grid, false)[grid.goal];
    checks.push(
      check(
        'The claimed optimum matches an independent Bellman–Ford reference',
        Number.isFinite(best) === Number.isFinite(cost) && (!Number.isFinite(best) || best === cost),
        `search ${showCost(cost)} · Bellman–Ford ${showCost(best)}`,
      ),
    );
  } else if (algorithm.claims === 'steps') {
    const best = reference(grid, true)[grid.goal];
    checks.push(
      check(
        'The claimed optimum matches an independent Bellman–Ford reference',
        Number.isFinite(best) === Number.isFinite(moves) && (!Number.isFinite(best) || best === moves),
        `search ${showCost(moves)} moves · Bellman–Ford ${showCost(best)}`,
      ),
    );
  } else {
    /*
     * Depth-first search claims no optimum, so there is no optimum to check.
     * What can still be checked is that it only ever stood on ground the
     * reference agrees is reachable — a genuine test of the frontier and the
     * predecessor chain, and one this search can actually fail. The cost gap
     * rides along in the detail so the bench states plainly how much worse
     * this route is, instead of leaving the impression that any route will do.
     */
    const truth = reference(grid, false);
    let sound = 0;
    for (const cell of route) {
      // Reachable at all, and never claimed to be closer than it truly is —
      // the two ways a predecessor chain can be wrong without looking wrong.
      if (Number.isFinite(truth[cell]) && truth[cell] <= (dist(grid, route, cell) ?? Infinity)) {
        sound += 1;
      }
    }
    const best = truth[grid.goal];
    checks.push(
      check(
        'Every cell on the route is reachable, and no closer than the reference says',
        sound === route.length,
        unreachable
          ? 'no route to check'
          : `${ratio(sound, route.length, 'cells hold up')} · costs ${showCost(walked)} against a best of ${showCost(best)}`,
      ),
    );
  }

  /* 4. The invariant that makes the frontier order correct in the first place. */
  if (algorithm.claims !== 'none') {
    const order = outcome.priorities;
    let sorted = 0;
    for (let i = 1; i < order.length; i += 1) if (order[i] >= order[i - 1]) sorted += 1;
    const pairs = Math.max(0, order.length - 1);
    checks.push(
      check(
        'Cells were settled in non-decreasing order of priority',
        sorted === pairs,
        ratio(sorted, pairs, 'settles never went backwards'),
      ),
    );
  }

  return verification(checks);
}
