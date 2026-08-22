'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GRID_MAX_CELLS,
  FRONTIER,
  ROUGH,
  ROUTE,
  SETTLED,
  WALL,
  findSearch,
  makeGrid,
  rowsFor,
  search,
  searches,
  shapes,
  verifyRoute,
  type SearchId,
  type ShapeId,
  type StepKind,
} from '@/lib/lab/graph';
import { frameAt, stepAt, tallyThrough } from '@/lib/lab/core/trace';
import { parseSeed, randomSeed } from '@/lib/lab/core/rng';
import { benchFragment, benchPath } from '@/lib/lab/catalogue';
import { haptic } from '@/lib/haptics';
import { Bay, CopyButton, num, Segmented, Slider, Stat, TableWrap, Transport, type Option, VerifyBadge } from './Controls';

/**
 * PATHFINDING BENCH — the view layer over `lib/lab/graph.ts`.
 *
 * Every rule this file follows is the one `SortingBench` established, for the
 * same reasons: the engine runs to completion in a `useMemo`, the playhead only
 * moves a cursor, and what is drawn is `frameAt(trace, cursor)`. Nothing here
 * knows how a search works — which is the point of the trace architecture, and
 * the reason this component is mostly layout.
 *
 * ── Why a CSS grid of divs rather than a canvas ─────────────────────────
 * The grid is capped at `GRID_MAX_CELLS`, so this is at most a few hundred
 * nodes, and a step changes the class of one or two of them. React reconciles
 * that in well under a frame, and staying in the DOM keeps three things a
 * canvas would cost: the cells inherit the page's colour tokens instead of
 * duplicating them in JavaScript, `prefers-reduced-motion` applies without
 * being reimplemented, and the whole figure can carry a real accessible
 * description rather than being an opaque bitmap.
 *
 * ── What the visitor is meant to notice ─────────────────────────────────
 * The comparison table in bay 03 is the argument. On `Terrain` it shows
 * breadth-first search returning the route with the fewest cells at a *higher*
 * cost than Dijkstra's longer one, and A* reaching Dijkstra's exact optimum
 * after visibly fewer expansions. Those numbers are counted from four real
 * traces of the grid on screen, so they change when the grid does.
 */

const BENCH_ID = 'graph';

/** Defaults, absent from the address bar for the reasons `SortingBench` gives. */
const DEFAULT_SEARCH: SearchId = 'bfs';
const DEFAULT_SHAPE: ShapeId = 'terrain';
const DEFAULT_COLS = 21;
const DEFAULT_SEED = 7;

const MIN_COLS = 11;
const MAX_COLS = 29;

/**
 * Steps per second at 1×.
 *
 * Faster than the sorting bench's 14, because a pathfinding trace is longer —
 * a full Dijkstra over 273 cells is around a thousand steps — and at 14/sec
 * watching one to the end would take over a minute.
 */
const BASE_RATE = 40;
const SPEEDS = [0.5, 1, 2, 4, 8] as const;
type Speed = `${(typeof SPEEDS)[number]}`;

const speedOptions: Option<Speed>[] = SPEEDS.map((s) => ({
  id: String(s) as Speed,
  label: `${s}×`,
}));

const searchOptions: Option<SearchId>[] = searches.map((s) => ({
  id: s.id,
  label: s.name,
  hint: s.note,
}));

const shapeOptions: Option<ShapeId>[] = shapes.map((s) => ({
  id: s.id,
  label: s.name,
  hint: s.note,
}));

/** What a step did, in words. Also drives the live region. */
const STEP_VERB: Record<StepKind, string> = {
  expand: 'Settle',
  discover: 'Discover',
  improve: 'Improve',
  reach: 'Reached goal',
  route: 'Route',
};

export function GraphBench() {
  const [searchId, setSearchId] = useState<SearchId>(DEFAULT_SEARCH);
  const [shape, setShape] = useState<ShapeId>(DEFAULT_SHAPE);
  const [cols, setCols] = useState(DEFAULT_COLS);
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

    const searchParam = q.get('find');
    if (searchParam && searches.some((s) => s.id === searchParam)) {
      setSearchId(searchParam as SearchId);
    }

    const shapeParam = q.get('map');
    if (shapeParam && shapes.some((s) => s.id === shapeParam)) setShape(shapeParam as ShapeId);

    const colsParam = Number.parseInt(q.get('cols') ?? '', 10);
    if (Number.isInteger(colsParam)) {
      setCols(Math.min(MAX_COLS, Math.max(MIN_COLS, colsParam)));
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

    put('find', searchId, DEFAULT_SEARCH);
    put('map', shape, DEFAULT_SHAPE);
    put('cols', String(cols), String(DEFAULT_COLS));
    put('seed', String(seed), String(DEFAULT_SEED));

    const next = `${url.pathname}${url.search}${url.hash}`;
    const now = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== now) window.history.replaceState(null, '', next);
  }, [linked, searchId, shape, cols, seed]);

  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  /** Spells out every setting, even defaults — a link is a promise. */
  const permalink = useMemo(() => {
    const path = benchPath(BENCH_ID);
    const q = new URLSearchParams({
      find: searchId,
      map: shape,
      cols: String(cols),
      seed: String(seed),
    });
    return `${origin}${path}${path.includes('?') ? '&' : '?'}${q}#${benchFragment(BENCH_ID)}`;
  }, [origin, searchId, shape, cols, seed]);

  /** A different map — and never the one already on screen. */
  const reroll = useCallback(() => {
    setSeed((current) => {
      let next = randomSeed();
      while (next === current) next = randomSeed();
      return next;
    });
    haptic('press');
  }, []);

  /* ---------------- the run ---------------- */

  const grid = useMemo(() => makeGrid(cols, rowsFor(cols), shape, seed), [cols, shape, seed]);

  const algorithm = useMemo(() => findSearch(searchId) ?? searches[0], [searchId]);

  /*
   * The whole search, computed once per (grid, algorithm).
   *
   * Bounded by `GRID_MAX_CELLS` in the engine rather than by hope here: at the
   * 21x13 default this is around a thousand steps of about 1.4 KB, built in a
   * few milliseconds, which is why it can sit in a memo during render instead
   * of behind a loading state.
   */
  const run = useMemo(() => search(grid, algorithm.id), [grid, algorithm]);
  const { trace, outcome } = run;
  const total = trace.steps.length;

  /*
   * A new grid or a new algorithm invalidates the cursor entirely — step 400 of
   * a 1,100-step Dijkstra is not step 400 of a 300-step depth-first search. Park
   * at the resting position rather than clamping, so what plays is a whole run.
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
     * ceiling the first frame back would jump hundreds of steps at once.
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

  /** Counts up to the cursor, so the readouts track the scrubber. */
  const soFar = useMemo(() => tallyThrough(trace, cursor), [trace, cursor]);

  /*
   * The properties this run has to satisfy, checked against an independent
   * Bellman–Ford reference inside the engine. Computed from the finished
   * outcome, not from the cursor: a route is not wrong halfway through being
   * drawn, it is simply incomplete.
   */
  const verification = useMemo(
    () => verifyRoute(grid, algorithm.id, outcome),
    [grid, algorithm, outcome],
  );

  /** Confirm arrival the way the sorting bench confirms a finished sort. */
  const wasDone = useRef(false);
  const done = cursor >= total - 1 && total > 0;
  useEffect(() => {
    if (done && !wasDone.current) haptic('lock');
    wasDone.current = done;
  }, [done]);

  /*
   * All four searches over the grid on screen.
   *
   * Re-run on every render of the table, deliberately: `record = false` builds
   * no frames, so this is four counting passes over a few hundred cells — the
   * same code path the bench displays, which is the only way the row for the
   * current search can be trusted to agree with the grid above it.
   */
  const comparison = useMemo(
    () =>
      searches.map((s) => {
        const r = s.id === algorithm.id ? run : search(grid, s.id, false);
        const moves = Math.max(0, r.outcome.route.length - 1);
        return { search: s, outcome: r.outcome, moves };
      }),
    [grid, algorithm, run],
  );

  const routeCells = new Set(frame.route);
  const cells = Array.from(frame.state);

  /** Plain-language state of the grid, for the figure's accessible name. */
  const caption = done
    ? outcome.route.length > 0
      ? `route found: ${num(outcome.route.length - 1)} moves at cost ${num(outcome.cost)}`
      : 'no route exists'
    : `${num(soFar.expand ?? 0)} cells settled, ${num(frame.frontier)} on the frontier`;

  return (
    <div className="lab-bench">
      {/* ---------------- the map ---------------- */}
      <Bay
        n="01"
        title="Generate"
        note="One seeded grid, four searches. Terrain costs five to enter instead of one, which is what makes fewest-cells and lowest-cost different questions."
        className="lab-bay--narrow"
      >
        <Segmented label="Map" options={shapeOptions} value={shape} onChange={setShape} columns={2} />

        <Slider
          label="Width"
          value={cols}
          min={MIN_COLS}
          max={MAX_COLS}
          step={2}
          onChange={setCols}
          format={(v) => `${v} × ${rowsFor(v)}`}
          hint={`Height follows width, and both are forced odd so the maze carver has a lattice to work on. Capped at ${num(GRID_MAX_CELLS)} cells, because every step of the trace keeps a full copy of the grid.`}
        />

        {/*
          The seed, printed rather than hidden.

          It is the name of this grid: `makeGrid` is a pure function of width,
          height, shape and seed, so these four values are the map. `aria-live`
          because re-rolling changes the number without moving focus.
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
              New map
            </button>
            <CopyButton value={permalink} label="Copy link" done="Link copied" />
          </div>

        </div>
      </Bay>

      {/* ---------------- the search ---------------- */}
      <Bay
        n="02"
        title="Search"
        note={`${algorithm.name} — frontier is a ${algorithm.frontier}. Optimal in: ${algorithm.optimal.toLowerCase()}.`}
      >
        <Segmented
          label="Algorithm"
          options={searchOptions}
          value={searchId}
          onChange={setSearchId}
          columns={2}
        />

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
          The grid.

          `--lab-cols` carries the column count into CSS so the grid template is
          declared once there rather than assembled as an inline string here.
          One `role="img"` with a written description, rather than several
          hundred focusable cells: the interesting content is the *shape* of the
          exploration, which is exactly what a per-cell reading destroys.
        */}
        <div
          className="lab-grid"
          style={{ '--lab-cols': grid.cols } as React.CSSProperties}
          role="img"
          aria-label={`${grid.cols} by ${grid.rows} grid, ${algorithm.name} search — ${caption}`}
        >
          {cells.map((state, i) => {
            const terrain = grid.cells[i];
            const isHead = frame.head === i;
            return (
              <span
                key={i}
                className={[
                  'lab-cell',
                  terrain === WALL ? 'is-wall' : '',
                  terrain === ROUGH ? 'is-rough' : '',
                  state === FRONTIER ? 'is-frontier' : '',
                  state === SETTLED ? 'is-settled' : '',
                  state === ROUTE || routeCells.has(i) ? 'is-route' : '',
                  i === grid.start ? 'is-start' : '',
                  i === grid.goal ? 'is-goal' : '',
                  isHead ? 'is-head' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            );
          })}
        </div>

        {/*
          What the current step did. A live region only while paused — with the
          playhead running at 40 steps a second it would be a firehose, and
          paused is exactly when someone stepping through needs it announced.
        */}
        <p className="lab-step" aria-live={playing ? 'off' : 'polite'}>
          {step ? (
            <>
              <span className={`lab-step__kind is-${step.kind}`}>{STEP_VERB[step.kind]}</span>
              <span className="lab-step__idx">
                {step.indices
                  .map((i) => `(${i % grid.cols}, ${Math.floor(i / grid.cols)})`)
                  .join(' → ')}
              </span>
            </>
          ) : (
            <span className="lab-step__kind">Ready — nothing explored</span>
          )}
        </p>

        <dl className="lab-stats">
          <Stat k="Settled" v={num(soFar.expand ?? 0)} tone="cyan" />
          <Stat k="Frontier" v={num(frame.frontier)} tone="amber" />
          <Stat k="Improved" v={num(soFar.improve ?? 0)} />
          <Stat
            k="Route cost"
            v={done && outcome.route.length > 0 ? num(outcome.cost) : '—'}
          />
        </dl>

        {/*
          The self-check.

          Rendered whatever the answer is, and each search is held to the promise
          it actually makes — depth-first search claims no optimum, so it is not
          failed for missing one. The reference is Bellman–Ford, which shares no
          code with any of the four.
        */}
        <VerifyBadge verification={verification} label="Route properties" />
      </Bay>

      {/* ---------------- the comparison ---------------- */}
      <Bay
        n="03"
        title="Compare"
        note="All four searches over the grid above. Every number is counted from a real run — none of them is a formula."
      >
        <TableWrap>
          <table className="lab-table">
            <caption className="sr-only">
              Four searches over the same {grid.cols} by {grid.rows} {shape} grid from seed {seed}
            </caption>
            <thead>
              <tr>
                <th scope="col">Search</th>
                <th scope="col">Frontier</th>
                <th scope="col">Cost</th>
                <th scope="col">Moves</th>
                <th scope="col">Settled</th>
                <th scope="col">Optimal in</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map(({ search: s, outcome: o, moves }) => {
                const isCurrent = s.id === algorithm.id;
                return (
                  <tr key={s.id} className={isCurrent ? 'is-current' : undefined}>
                    <th scope="row">
                      {s.name}
                      {isCurrent && <span className="sr-only"> (currently shown)</span>}
                    </th>
                    <td className="is-mono">{s.frontier}</td>
                    <td className="is-mono is-cyan">
                      {o.route.length > 0 ? num(o.cost) : '—'}
                    </td>
                    <td className="is-mono">{o.route.length > 0 ? num(moves) : '—'}</td>
                    <td className="is-mono is-amber">{num(o.settled)}</td>
                    <td className="is-mono">{s.optimal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>

        <p className="lab-note">
          On <strong>Terrain</strong> the first two columns disagree on purpose: breadth-first
          search returns the route with the fewest moves and pays more to walk it, because it
          never looks at what a cell costs to enter. Dijkstra takes more moves for a lower total.
          A* reaches Dijkstra&rsquo;s exact cost while settling fewer cells — the estimate never
          overshoots, so nothing is lost by trusting it. Depth-first search finds a route and
          makes no claim about it at all.
        </p>
      </Bay>
    </div>
  );
}
