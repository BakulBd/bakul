/**
 * THE BENCH CATALOGUE
 *
 * One list of what the lab contains. The shell renders from it, the JSON-LD
 * graph publishes from it, `/llms.txt` describes the lab from it, the command
 * palette builds its entries from it, and the web manifest takes its shortcuts
 * from it.
 *
 * ── Why this file is data and not components ───────────────────────────
 * `src/lib/seo.ts`, `src/app/llms.txt/route.ts` and `src/app/manifest.ts` all
 * run on the server. If the bench list carried React components or `lucide`
 * icons, importing it from those modules would drag a client-side component
 * graph into a server bundle — so the list stays plain strings and numbers, and
 * everything that needs an icon or a lazy loader is bolted on in
 * `src/components/lab/registry.ts`, which is a client module.
 *
 * That split is what makes "add a bench" a single-file change on the data side.
 * Before it, the two benches were hardcoded in five places: the shell's
 * `BENCHES` array, two `SoftwareApplication` nodes in `seo.ts`, a sentence in
 * `llms.txt`, three commands in the palette, and a manifest shortcut. Adding a
 * third bench meant remembering all five, and the ones that were forgotten
 * failed silently — a JSON-LD node for a bench nobody could reach, or a bench
 * that no crawler knew existed.
 *
 * ── Why every bench names a course ─────────────────────────────────────
 * `course` is the exact string from `profile.education.coursework`. That is a
 * deliberate join: the education section lists thirteen subjects, and a list of
 * subjects is an assertion. When a bench cites "Compiler Design" it is citing a
 * line on the CV and showing the working for it in the same breath. The strings
 * must match character for character — a bench claiming a course that is not on
 * the transcript would be exactly the invented-credential problem that
 * `src/lib/data/profile.ts` exists to prevent.
 *
 * ── Why `since` is not a date ──────────────────────────────────────────
 * There is no per-bench build date here and no "new" badge. A dated list rots:
 * either the dates are maintained by hand and drift, or they are generated from
 * git and turn the lab into a changelog. The order of the array is the only
 * ordering claim being made, and it runs foundational → applied.
 */

/**
 * The four racks.
 *
 * Grouping exists because a flat strip of eight tabs is a scrolling problem on
 * a phone and a wall of undifferentiated words everywhere else. The groups are
 * the shape of the degree, not arbitrary buckets: what data moves through
 * (`algorithms`), what the machine underneath does (`systems`), how source
 * becomes instructions (`languages`), and what learns (`intelligence`).
 */
export const BENCH_GROUPS = [
  {
    id: 'algorithms',
    label: 'Algorithms',
    note: 'Cost measured, not asserted.',
  },
  {
    id: 'systems',
    label: 'Systems',
    note: 'What the hardware and the kernel actually do.',
  },
  {
    id: 'languages',
    label: 'Languages',
    note: 'Source text to executable instructions.',
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    note: 'Learning, written out by hand.',
  },
] as const;

export type BenchGroupId = (typeof BENCH_GROUPS)[number]['id'];

export interface BenchEntry {
  /** URL-stable. Appears in `?bench=`, in `#bench-<id>`, and in the JSON-LD `@id`. */
  readonly id: string;
  /** Rail label. Two words at most — the rail is narrow. */
  readonly label: string;
  readonly group: BenchGroupId;
  /**
   * The course this bench is evidence for. Must be a verbatim entry in
   * `profile.education.coursework`.
   */
  readonly course: string;
  /** One sentence, shown under the rail. What the bench demonstrates. */
  readonly blurb: string;
  /**
   * A longer description for machines: JSON-LD `description`, `/llms.txt`, and
   * the palette hint all read this. Written to be true when read alone, with no
   * surrounding page for context.
   */
  readonly summary: string;
  /** The engine's source file, linked from the bench so the claim is checkable. */
  readonly source: string;
  /**
   * What the bench lets you *do*, as short capability phrases.
   *
   * Published as the JSON-LD `featureList` and as the bullets under each bench
   * in `/llms.txt`. Kept separate from `blurb` and `summary` because those are
   * prose about what the bench demonstrates, and a crawler asking "what can
   * this application do" wants a list, not a paragraph. Every line must be
   * something the shipped UI actually does — this is the field most likely to
   * describe a control that was planned and never built.
   */
  readonly features: readonly string[];
  /**
   * The properties this bench verifies about its own output, in the words the
   * badge uses. Empty means the bench has nothing meaningful to assert.
   */
  readonly verifies: readonly string[];
}

/**
 * The benches, in rail order.
 *
 * Appended to as benches land. A bench appears here only once its engine and
 * UI exist — an entry for something unbuilt would publish a structured-data
 * node and a palette command pointing at nothing, which is the "advertised but
 * never built" failure the README already records once.
 */
export const BENCHES: readonly BenchEntry[] = [
  {
    id: 'sorting',
    label: 'Sorting',
    group: 'algorithms',
    course: 'Data Structures and Algorithms',
    blurb:
      'Five comparison sorts on one seeded input. Every comparison and write on screen was counted during the run.',
    summary:
      'Five instrumented comparison sorts — bubble, insertion, selection, merge and quicksort — sharing one seeded input so their measured comparison and write counts are directly comparable. The run is recorded as a trace and replayed, so it can be scrubbed, stepped backwards, and slowed down without re-running the algorithm. Output is checked for order and for being a permutation of the input.',
    source: 'src/lib/lab/sorting.ts',
    features: [
      'Step, play and scrub a recorded trace',
      'Live comparison, swap and write counters',
      'Adjustable array size and starting distribution',
      'Seeded input, so a run can be shared by its number',
    ],
    verifies: ['Output is ordered', 'Output is a permutation of the input'],
  },
  {
    id: 'complexity',
    label: 'Complexity',
    group: 'algorithms',
    course: 'Data Structures and Algorithms',
    blurb:
      'The same five sorts run at eight array sizes, so the growth rate beside each name is measured rather than quoted.',
    summary:
      'A growth sweep that runs the sorting bench\u2019s own five algorithms at n = 8, 16, 32 up to 1024 and counts comparisons, writes and steps at every size. Results are plotted on log-log axes against gradients fitted for n, n log n and n\u00b2 over the same window, and tabulated with the ratio between consecutive sizes \u2014 where a doubling of n that quadruples the work identifies a quadratic algorithm without any curve fitting. The textbook worst-case bound is shown beside the measured gradient so the gap between the two can be read directly: on already-sorted input bubble sort measures linear and quicksort measures quadratic.',
    source: 'src/lib/lab/complexity.ts',
    features: [
      'Forty sorts run in the browser at eight doubling sizes',
      'Log-log plot with fitted n, n log n and n\u00b2 reference gradients',
      'Measured growth ratio between consecutive sizes, per algorithm',
      'Switch between comparisons, writes and total steps',
      'Textbook worst case shown beside the measured gradient',
    ],
    verifies: ['Counted runs match recorded runs', 'Cost never falls as n grows'],
  },
  {
    id: 'structures',
    label: 'Structures',
    group: 'algorithms',
    course: 'Data Structures and Algorithms',
    blurb:
      'A search tree and a hash table on the same keys. One pays in comparisons, the other in probes, and both bills are counted.',
    summary:
      'Two ways to answer "where does this key live?", built side by side from one seeded key set. The tree half inserts into a plain binary search tree or an AVL tree, drawing every comparison, link and rotation: switch the insertion order to ascending and the unbalanced tree degenerates into a list while AVL holds its height bound, and the rotation counter shows what that cost. The table half places the same keys by linear probing, quadratic probing or double hashing into a prime-length table, drawing each probe on the slot it touched, so primary clustering appears as a run of adjacent full slots rather than as a claim. Quadratic probing cannot reach every slot of a prime table, so on a loaded table it genuinely fails to place a key while space remains; those keys are named on screen instead of being hidden by growing the table. Every counter is a tally the algorithm kept, read at the point the playhead is parked.',
    source: 'src/lib/lab/structures.ts',
    features: [
      'Binary search tree and AVL over the same keys, with a measured height and rotation comparison',
      'Four insertion orders, including the sorted input that degenerates a plain BST',
      'Linear, quadratic and double hashing into a prime-length table',
      'Per-key probe sequence drawn on the slots it visited, with a live clustering measure',
      'Keys that could not be placed are named, with the reason',
      'Step, play and scrub a recorded trace',
      'Seeded keys, so a run can be shared by its number',
    ],
    verifies: [
      'In-order traversal is sorted',
      'Every key is findable by descending the tree',
      'Stored heights match the subtrees beneath them',
      'AVL balance factors stay within ±1, and height stays inside the AVL bound',
      'Every stored key is reachable by its probe sequence',
      'Occupied slots equal the keys the table accepted',
    ],
  },
  {
    id: 'graph',
    label: 'Pathfinding',
    group: 'algorithms',
    course: 'Data Structures and Algorithms',
    blurb:
      'Four searches over one generated map. The terrain costs more to cross than it looks, which is where they stop agreeing.',
    summary:
      'Breadth-first, depth-first, Dijkstra and A* walking the same generated grid, where rough ground costs five to enter and open ground costs one. Because the terrain is weighted, the four searches genuinely disagree: breadth-first finds the fewest cells and pays more to cross them, Dijkstra finds the cheapest route, and A* reaches the same cost after visibly fewer expansions. Settled cells, frontier size and route cost are tallied during the run, and the route each search returns is checked against an independent Bellman–Ford reference that shares no code with any of them.',
    source: 'src/lib/lab/graph.ts',
    features: [
      'Breadth-first, depth-first, Dijkstra and A* over one map',
      'Weighted terrain, so the four searches genuinely disagree',
      'Step, play and scrub a recorded trace',
      'Settled, frontier, improvement and route-cost counters',
      'Seeded maps, so a map can be shared by its number',
    ],
    verifies: [
      'Every move in the route joins two open, adjacent cells',
      'Route cost equals the distance the search reported',
      'The claimed optimum matches an independent Bellman–Ford reference',
      'Cells were settled in non-decreasing order of priority',
      'Every cell on the route is reachable, and no closer than the reference says',
    ],
  },
  {
    id: 'scheduler',
    label: 'Scheduler',
    group: 'systems',
    course: 'Operating Systems',
    blurb:
      'Five CPU scheduling policies dispatching one workload, one tick at a time.',
    summary:
      'A tick-driven CPU scheduler running first-come-first-served, shortest-job-first, shortest-remaining-time-first, round robin and priority over the same generated workload. There is a real clock, a real ready queue and one CPU, so the Gantt chart is the record of what ran rather than a drawing of a formula — waiting time, turnaround, response time, context switches and utilisation are all measured from it afterwards. Workload shapes are adversarial by design: the convoy exists to make first-come-first-served indefensible.',
    source: 'src/lib/lab/scheduler.ts',
    features: [
      'A scrubbable Gantt chart built from the simulated clock',
      'The ready queue at every tick, in the policy’s own order',
      'Per-process waiting, turnaround and response times',
      'All five policies compared over one workload',
    ],
    verifies: [
      'Every process ran for exactly the burst it asked for',
      'The CPU only idled when nothing was runnable',
      'Every printed figure is derivable from the chart alone',
      'Shortest-job-first beats all 40,320 orderings of eight bursts',
    ],
  },
  {
    id: 'compiler',
    label: 'Compiler',
    group: 'languages',
    course: 'Compiler Design',
    blurb:
      'A complete front end for one assignment statement: scan, parse, lower, allocate.',
    summary:
      'A compiler front end that recompiles as you type: a scanner producing positioned tokens, a recursive-descent parser with correct precedence and unary minus, a lowering pass to three-address code with temporaries, and a linear-scan register allocator with a configurable register budget that spills when it runs out. Syntax errors report the column that caused them.',
    source: 'src/lib/lab/compiler.ts',
    features: [
      'Token stream from your own input',
      'Parse tree from a recursive-descent parser',
      'Three-address intermediate code',
      'Register allocation at a budget you choose',
    ],
    verifies: [
      'Three-address code evaluates to the same value as the tree',
      'Allocated registers evaluate to the same value as the tree',
      'Every token span matches the source it was scanned from',
    ],
  },
];

/** Lookup by id. `null` rather than a throw — a bad `?bench=` is not fatal. */
export function findBench(id: string | null | undefined): BenchEntry | null {
  if (!id) return null;
  return BENCHES.find((b) => b.id === id) ?? null;
}

/** The default bench. First in the array, so rail order decides it. */
export const DEFAULT_BENCH: BenchEntry = BENCHES[0];

/**
 * Groups that actually contain something, in `BENCH_GROUPS` order.
 *
 * The shell renders from this rather than from `BENCH_GROUPS`, so a group
 * declared ahead of the benches that will fill it renders as nothing instead of
 * as an empty heading. Empty racks are the same failure as the placeholder
 * project bays the content rules already forbid.
 */
export function populatedGroups(): readonly {
  id: BenchGroupId;
  label: string;
  note: string;
  benches: readonly BenchEntry[];
}[] {
  return BENCH_GROUPS.map((g) => ({
    ...g,
    benches: BENCHES.filter((b) => b.group === g.id),
  })).filter((g) => g.benches.length > 0);
}

/** The fragment a bench is addressable at. One definition, four consumers. */
export function benchFragment(id: string): string {
  return `bench-${id}`;
}

/**
 * The canonical path for a bench.
 *
 * The default bench is a bare `/lab` — a query parameter that selects what is
 * already selected is noise in a shared link, and would give the same page two
 * addresses for a crawler to reconcile.
 */
export function benchPath(id: string): string {
  return id === DEFAULT_BENCH.id ? '/lab' : `/lab?bench=${id}`;
}

/* ───────────────────────── Describing the rack in prose ────────────────────
 *
 * Six surfaces state what the lab contains: the page's own copy, the meta
 * description, the share-card caption, the web app manifest, the FAQ answer and
 * llms.txt. Every one of them used to spell the count out by hand, and every one
 * of them was wrong within minutes of a bench shipping — the sentence "two
 * engines" survived into a build that served three.
 *
 * A miscount is a peculiarly bad bug here. Nothing crashes, no check goes red,
 * and the only symptom is that the site undersells itself in its own voice to
 * exactly the people who never opened it: the search result, the link preview,
 * the model summarising the page. It fails silently and it fails outward.
 *
 * So the helpers live here, next to the data they describe. This module imports
 * nothing, which is what makes it safe for a server route and a client
 * component to share, and the alternative — one file owning the phrasing and
 * the rest importing from it — would have made `seo.ts` a dependency of the
 * manifest and the FAQ purely to borrow a comma.
 */

/**
 * "A, B and C" — no serial comma, matching the prose voice used everywhere else
 * on the site. One and two items are the degenerate cases and read naturally.
 */
export function sentenceList(items: readonly string[]): string {
  return items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * Small counts as words, because "Three engines" is a sentence and "3 engines"
 * is a label. Past twelve it falls back to digits — by then the number is
 * information rather than prose, and English stops helping.
 */
const COUNT_WORDS = [
  'no', 'one', 'two', 'three', 'four', 'five', 'six',
  'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
] as const;

export function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}

/** The same word, capitalised, for when the count opens a sentence. */
export function countWordCapped(n: number): string {
  return countWord(n).replace(/^./, (c) => c.toUpperCase());
}

/**
 * "Sorting, Pathfinding and Compiler" — the rack named in rail order.
 *
 * `lower` exists because the phrase appears mid-sentence about as often as it
 * appears as a list of proper nouns, and "the sorting, pathfinding and compiler
 * benches" should not shout in the middle of a clause.
 */
export function benchList(opts?: { lower?: boolean }): string {
  return sentenceList(
    BENCHES.map((b) => (opts?.lower ? b.label.toLowerCase() : b.label)),
  );
}

/**
 * "Three engines" / "three benches" — the count and the noun, agreeing.
 *
 * The plural is computed rather than passed because a one-bench rack is a real
 * state this site has been in, and "one engines" is the sort of thing that ships
 * when the singular is somebody else's responsibility. `lower` is for the
 * mid-sentence case, which is most of them.
 */
export function benchCountPhrase(opts?: { noun?: string; lower?: boolean }): string {
  const n = BENCHES.length;
  const noun = opts?.noun ?? 'engine';
  const count = opts?.lower ? countWord(n) : countWordCapped(n);
  return `${count} ${noun}${n === 1 ? '' : 's'}`;
}
