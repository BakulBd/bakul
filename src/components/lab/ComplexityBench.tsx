'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  METRICS,
  REFERENCES,
  SWEEP_SIZES,
  analyse,
  runSweep,
  type Metric,
} from '@/lib/lab/complexity';
import { distributions, type Distribution } from '@/lib/lab/sorting';
import { parseSeed, randomSeed } from '@/lib/lab/core/rng';
import { benchFragment, benchPath } from '@/lib/lab/catalogue';
import { haptic } from '@/lib/haptics';
import { Bay, CopyButton, num, Segmented, Stat, TableWrap, type Option, VerifyBadge } from './Controls';

/**
 * COMPLEXITY BENCH
 *
 * ── What this bench is for ──────────────────────────────────────────────
 * The sorting bench animates one array at one size and prints `O(n²)` beside
 * the algorithm's name. That string is the only thing on the page that is
 * asserted rather than measured — it comes from a textbook, and a single array
 * size cannot check it, because growth is a claim about what happens when the
 * size changes.
 *
 * So this bench changes the size. `lib/lab/complexity.ts` runs all five sorts at
 * n = 8, 16 … 1024 and hands back what it counted; everything below is a view of
 * those integers.
 *
 * ── Why the chart is not the evidence ───────────────────────────────────
 * The plot is log-log, where a power law is a straight line and its gradient is
 * the exponent, so five lines fan out by slope and the two families separate at
 * a glance. That makes it the fastest way to *see* the result — but a picture
 * is not checkable, so the table underneath carries every measured integer and
 * the ratio between consecutive sizes. A visitor who does not believe the chart
 * can do the division.
 *
 * The ratio column is the real argument. Each size is exactly twice the last,
 * so a cost that quadruples is a quadratic algorithm caught in the act, and it
 * takes no logarithms and no trust in the author's fitting to read.
 *
 * ── Why big-O and the measurement are shown side by side, unjudged ──────
 * They disagree constantly, and every disagreement is correct. `O(n²)` is a
 * worst case; run bubble sort on sorted input and it measures linear, because
 * its early exit fires on the first pass. Printing a pass/fail verdict against
 * the textbook column would therefore mark the most interesting result on the
 * page as a failure. The two columns are shown as what they are — a bound and a
 * measurement — and the caption says which is which.
 *
 * ── Cost ────────────────────────────────────────────────────────────────
 * 40 sorts plus 20 re-runs for the self-check, measured at 13–40ms on the
 * development machine. That fits in a `useMemo` during render only because the
 * sweep runs with recording off; see `Recorder` in `lib/lab/sorting.ts`.
 */

/** This bench's id in the catalogue, which is also its fragment and its link. */
const BENCH_ID = 'complexity';

/*
 * Opening settings — constants, and the seed deliberately not random. `/lab`
 * gets linked, screenshot and described in structured data, and all three are
 * claims about a specific run.
 */
const DEFAULT_SHAPE: Distribution = 'random';
const DEFAULT_METRIC: Metric = 'comparisons';
const DEFAULT_SEED = 1;

/* ------------------------------------------------------------------ *
 * CHART GEOMETRY
 *
 * Fixed user units with a viewBox, so the figure scales with its container
 * without any measuring in JavaScript. The padding leaves room for the axis
 * labels, which are drawn inside the SVG so they cannot drift out of alignment
 * with the plot the way absolutely-positioned HTML labels do.
 * ------------------------------------------------------------------ */

const W = 340;
const H = 210;
const PAD = { l: 32, r: 10, t: 12, b: 26 };
const PLOT_W = W - PAD.l - PAD.r;
const PLOT_H = H - PAD.t - PAD.b;

/** log₂ of the smallest and largest swept size — the x axis, in exponents. */
const X_MIN = Math.log2(SWEEP_SIZES[0]);
const X_MAX = Math.log2(SWEEP_SIZES[SWEEP_SIZES.length - 1]);

function xAt(n: number): number {
  return PAD.l + ((Math.log2(n) - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}

/**
 * Vertical position of a cost, on a log₂ axis scaled to the sweep's peak.
 *
 * Zero is floored to 1 so that log₂ stays finite — a genuine case, since three
 * of the five sorts perform no writes at all on sorted input. Those series then
 * sit flat on the baseline, which is the truthful picture: nothing happened.
 */
function yAt(cost: number, yMax: number): number {
  return PAD.t + PLOT_H - (Math.log2(Math.max(1, cost)) / yMax) * PLOT_H;
}

export function ComplexityBench() {
  const [shape, setShape] = useState<Distribution>(DEFAULT_SHAPE);
  const [metric, setMetric] = useState<Metric>(DEFAULT_METRIC);
  const [seed, setSeed] = useState(DEFAULT_SEED);

  /**
   * Which series the visitor has singled out, or `null` for all five.
   *
   * Five overlapping lines is the most this plot can carry before the quadratic
   * three become indistinguishable — they sit within a few per cent of each
   * other on random input. Isolating one is the difference between a chart that
   * looks like a result and one that can be interrogated.
   */
  const [only, setOnly] = useState<string | null>(null);

  /* ---------------- the run in the URL ---------------- */

  /*
   * Read the link before writing to the address bar, guarded by state rather
   * than a ref: both effects run in the same commit on mount, and a ref would
   * let the writer fire with pre-read settings and strip the very parameters it
   * was about to be told about.
   *
   * Values are validated against what the engine offers, not trusted —
   * `?shape=banana` is a URL someone can type.
   */
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);

    const shapeParam = q.get('shape');
    if (shapeParam && distributions.some((d) => d.id === shapeParam)) {
      setShape(shapeParam as Distribution);
    }

    const metricParam = q.get('metric');
    if (metricParam && METRICS.some((m) => m.id === metricParam)) {
      setMetric(metricParam as Metric);
    }

    const seedParam = parseSeed(q.get('seed'));
    if (seedParam !== null) setSeed(seedParam);

    setLinked(true);
  }, []);

  /*
   * Mirror the settings back. The URL is edited rather than rebuilt because
   * `LabShell` owns `?bench=` and the hash; a bench that assembled its own URL
   * would delete the shell's parameter and the two would fight forever.
   */
  useEffect(() => {
    if (!linked) return;

    const url = new URL(window.location.href);
    const put = (key: string, value: string, fallback: string) => {
      if (value === fallback) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    };

    put('shape', shape, DEFAULT_SHAPE);
    put('metric', metric, DEFAULT_METRIC);
    put('seed', String(seed), String(DEFAULT_SEED));

    const next = `${url.pathname}${url.search}${url.hash}`;
    const now = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== now) window.history.replaceState(null, '', next);
  }, [linked, shape, metric, seed]);

  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  /**
   * The shareable address of exactly this sweep.
   *
   * Spells out all three settings even when they are the defaults: a copied link
   * is a promise about what the recipient will see, and an implicit default is a
   * promise that breaks the day a default changes.
   */
  const permalink = useMemo(() => {
    const path = benchPath(BENCH_ID);
    const q = new URLSearchParams({ shape, metric, seed: String(seed) });
    return `${origin}${path}${path.includes('?') ? '&' : '?'}${q}#${benchFragment(BENCH_ID)}`;
  }, [origin, shape, metric, seed]);

  const reroll = useCallback(() => {
    setSeed((current) => {
      let next = randomSeed();
      while (next === current) next = randomSeed();
      return next;
    });
    haptic('press');
  }, []);

  /* ---------------- the measurement ---------------- */

  /*
   * The 40 runs. Memoised on shape and seed only — switching metric is a
   * different *view* of the same measurement, so it must not re-run anything.
   */
  const sweep = useMemo(() => runSweep(shape, seed), [shape, seed]);
  const analysis = useMemo(() => analyse(sweep, metric), [sweep, metric]);

  const metricLabel = useMemo(
    () => METRICS.find((m) => m.id === metric)?.label.toLowerCase() ?? metric,
    [metric],
  );
  const shapeLabel = useMemo(
    () => distributions.find((d) => d.id === shape)?.label.toLowerCase() ?? shape,
    [shape],
  );

  /** The y axis, in exponents of two, rounded up so the peak sits inside. */
  const yMax = Math.max(1, Math.ceil(Math.log2(Math.max(2, analysis.peak))));

  /** Ticks every 2 or 4 powers, so the axis never crowds itself. */
  const yTicks = useMemo(() => {
    const step = yMax <= 8 ? 2 : 4;
    const out: number[] = [];
    for (let k = 0; k <= yMax; k += step) out.push(k);
    return out;
  }, [yMax]);

  /**
   * Where the reference guides sit vertically.
   *
   * On log axes a constant factor is a vertical shift, so only a guide's
   * *gradient* carries meaning — its height is free. Anchoring at the cheapest
   * measured cost at the smallest size puts all three inside the data rather
   * than hugging the axis, without changing what they say.
   */
  const anchor = useMemo(() => {
    let lowest = Infinity;
    for (const row of analysis.rows) lowest = Math.min(lowest, row.costs[0]);
    return Math.max(1, Number.isFinite(lowest) ? lowest : 1);
  }, [analysis]);

  const lastSize = SWEEP_SIZES[SWEEP_SIZES.length - 1];

  /**
   * How far apart the algorithms end up, as a measured multiple.
   *
   * `null` when the cheapest series recorded nothing, because "58× zero" is not
   * a spread — it is a division nobody should print.
   */
  const spread = useMemo(() => {
    const finals = analysis.rows.map((r) => r.costs[r.costs.length - 1]);
    const lo = Math.min(...finals);
    const hi = Math.max(...finals);
    return lo > 0 ? hi / lo : null;
  }, [analysis]);

  const metricOptions: Option<Metric>[] = METRICS.map((m) => ({
    id: m.id,
    label: m.label,
    hint: m.note,
  }));

  return (
    <div className="lab-bench">
      {/* ---------------- controls ---------------- */}
      <Bay
        n="01"
        title="Configure"
        note="Every change re-runs all forty sorts. Nothing here is cached from a previous build or precomputed at deploy time."
        className="lab-bay--narrow"
      >
        <Segmented
          label="Input shape"
          options={distributions.map((d) => ({ id: d.id, label: d.label, hint: d.note }))}
          value={shape}
          onChange={setShape}
          columns={2}
        />

        {/* `metricOptions` above carries each metric's note as its `hint`, and
            `Segmented` renders the selected option's hint directly beneath the
            group. A second `<p>` here printed the identical sentence again, on
            the very next line — "The operation the complexity classes are
            stated in terms of." twice, in a 320px column. */}
        <Segmented label="Measure" options={metricOptions} value={metric} onChange={setMetric} />

        <div className="lab-seed">
          <p className="lab-seed__row">
            <span className="lab-seed__key">Seed</span>
            <span className="lab-seed__val" aria-live="polite">
              {seed}
            </span>
          </p>

          <div className="lab-seed__acts">
            <button type="button" className="btn lab-shuffle" onClick={reroll}>
              Re-roll inputs
            </button>
            <CopyButton value={permalink} label="Copy link" done="Link copied" />
          </div>

          <p className="lab-note">
            All eight arrays come from this seed, and all five algorithms see the same array at
            each size — otherwise the comparison would be measuring arrangements, not
            algorithms.
          </p>
        </div>

        <dl className="lab-stats">
          <Stat k="Sorts run" v={num(analysis.rows.length * SWEEP_SIZES.length)} />
          <Stat k="Sizes" v={`${num(SWEEP_SIZES[0])} → ${num(lastSize)}`} />
          <Stat
            k={`Spread at n=${num(lastSize)}`}
            v={spread === null ? '—' : `${spread.toFixed(0)}×`}
            tone="amber"
          />
        </dl>
      </Bay>

      {/* ---------------- the chart ---------------- */}
      <Bay
        n="02"
        title="Observe"
        note="Both axes are log₂, so a power law is a straight line and its gradient is the exponent."
      >
        {/*
          The plot.

          `role="img"` with a summary rather than a labelled graphic: the numbers
          are all in the table below, which is the accessible copy of this figure
          and is a better one — a screen reader user gets exact integers instead
          of a described trend line.
        */}
        <div
          className="lab-plot"
          role="img"
          aria-label={`Log-log plot of ${metricLabel} against array size for five sorting algorithms on ${shapeLabel} input. The measured values are in the table that follows.`}
        >
          <svg className="lab-plot__svg" viewBox={`0 0 ${W} ${H}`}>
            {/* Horizontal gridlines, one per labelled power of two. */}
            {yTicks.map((k) => (
              <g key={`y${k}`}>
                <line
                  className="lab-plot__grid"
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={yAt(2 ** k, yMax)}
                  y2={yAt(2 ** k, yMax)}
                />
                <text className="lab-plot__tick" x={PAD.l - 4} y={yAt(2 ** k, yMax) + 2.5}>
                  {`2^${k}`}
                </text>
              </g>
            ))}

            {/* One vertical tick per swept size — the x axis is the sweep. */}
            {SWEEP_SIZES.map((n) => (
              <text
                key={`x${n}`}
                className="lab-plot__tick is-x"
                x={xAt(n)}
                y={H - PAD.b + 9}
              >
                {n}
              </text>
            ))}

            <line
              className="lab-plot__axis"
              x1={PAD.l}
              x2={W - PAD.r}
              y1={H - PAD.b}
              y2={H - PAD.b}
            />

            {/*
              Reference gradients. Dashed, unlabelled in the plot itself and
              named in the legend, because three more solid lines would compete
              with the five that are measurements.
            */}
            {REFERENCES.map((r) => (
              <line
                key={r.id}
                className={`lab-plot__ref is-${r.id}`}
                x1={xAt(SWEEP_SIZES[0])}
                y1={yAt(anchor, yMax)}
                x2={xAt(lastSize)}
                y2={
                  PAD.t +
                  PLOT_H -
                  ((Math.log2(anchor) + r.slope * (X_MAX - X_MIN)) / yMax) * PLOT_H
                }
              />
            ))}

            {/* The measurements. */}
            {analysis.rows.map((row) => {
              const dim = only !== null && only !== row.id;
              return (
                <g
                  key={row.id}
                  className={`lab-plot__series is-${row.id}${dim ? ' is-dim' : ''}`}
                >
                  <polyline
                    className="lab-plot__line"
                    points={row.costs
                      .map((c, i) => `${xAt(SWEEP_SIZES[i])},${yAt(c, yMax)}`)
                      .join(' ')}
                  />
                  {row.costs.map((c, i) => (
                    <circle
                      key={i}
                      className="lab-plot__dot"
                      cx={xAt(SWEEP_SIZES[i])}
                      cy={yAt(c, yMax)}
                      r={1.7}
                    />
                  ))}
                </g>
              );
            })}
          </svg>
        </div>

        {/*
          The legend, as buttons.

          `aria-pressed` rather than a checkbox because these are toggles on a
          view, not values being submitted. Clicking the active one clears the
          isolation, so the control is its own escape hatch and needs no
          separate "show all".
        */}
        <div className="lab-legend">
          {analysis.rows.map((row) => (
            <button
              key={row.id}
              type="button"
              className={`lab-legend__item is-${row.id}${only === row.id ? ' is-on' : ''}`}
              aria-pressed={only === row.id}
              onClick={() => setOnly((cur) => (cur === row.id ? null : row.id))}
            >
              <span className="lab-legend__swatch" aria-hidden="true" />
              <span className="lab-legend__label">{row.name}</span>
              <span className="lab-legend__slope">{row.slope.toFixed(2)}</span>
            </button>
          ))}

          {REFERENCES.map((r) => (
            <span key={r.id} className={`lab-legend__item is-ref is-${r.id}`}>
              <span className="lab-legend__swatch" aria-hidden="true" />
              <span className="lab-legend__label">{r.label}</span>
              <span className="lab-legend__slope">{r.slope.toFixed(2)}</span>
            </span>
          ))}
        </div>

        <p className="lab-note">
          The number beside each name is the measured gradient. The three dashed guides are the
          gradients <strong>n</strong>, <strong>n log n</strong> and <strong>n²</strong> fitted
          over these same eight sizes — which is why <strong>n log n</strong> reads{' '}
          {REFERENCES[1].slope.toFixed(2)} rather than 1.00: across this window log₂ n triples,
          so a linearithmic curve is genuinely steeper than linear. Only the gradients of the
          guides mean anything; their height is a free constant on log axes.
        </p>

        {/*
          The checks that make the numbers above worth reading, rendered whatever
          the answer. The first one is the load-bearing one: the sweep runs with
          snapshots disabled, a path the animated bench never takes, so the
          recorded path is re-run at the small sizes and required to agree.
        */}
        <VerifyBadge verification={sweep.verification} label="Measurement integrity" />
      </Bay>

      {/* ---------------- the numbers ---------------- */}
      <Bay
        n="03"
        title="Measure"
        note="Each size is exactly twice the last, so the ratio underneath each count is what growth looks like without any fitting."
      >
        <TableWrap>
          <table className="lab-table lab-table--tight">
            <caption className="sr-only">
              {metricLabel} counted at each array size, with the ratio to the previous size, for
              five sorting algorithms on {shapeLabel} input from seed {seed}
            </caption>
            <thead>
              <tr>
                <th scope="col">Algorithm</th>
                {SWEEP_SIZES.map((n) => (
                  <th scope="col" key={n} className="is-mono">
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analysis.rows.map((row) => (
                <tr
                  key={row.id}
                  className={only === row.id ? 'is-current' : undefined}
                  onMouseEnter={() => setOnly(row.id)}
                  onMouseLeave={() => setOnly(null)}
                >
                  <th scope="row">{row.name}</th>
                  {row.costs.map((c, i) => (
                    <td key={i} className="is-mono">
                      <span className="lab-count">{num(c)}</span>
                      {/*
                        The ratio, printed under the count rather than in its own
                        table. Two tables of eight columns would be read
                        separately; a count with its own growth factor attached
                        is read as one fact.
                      */}
                      <span className="lab-ratio">
                        {row.ratios[i] === null ? '—' : `×${row.ratios[i]!.toFixed(2)}`}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>

        <p className="lab-note">
          A ratio settling near <strong>4.00</strong> is a doubling of n quadrupling the work —
          quadratic. Near <strong>2.2</strong> it is linearithmic, and near{' '}
          <strong>2.00</strong> linear. Hovering a row isolates it in the chart above.
        </p>
      </Bay>

      {/* ---------------- textbook against measurement ---------------- */}
      <Bay
        n="04"
        title="Classify"
        note="The left column is a bound from a textbook. The right two were measured just now, on this input."
      >
        <TableWrap>
          <table className="lab-table">
            <caption className="sr-only">
              Textbook worst-case bound compared with the growth measured on {shapeLabel} input
            </caption>
            <thead>
              <tr>
                <th scope="col">Algorithm</th>
                <th scope="col">Worst case</th>
                <th scope="col">Measured gradient</th>
                <th scope="col">Nearest reference</th>
                <th scope="col">{metricLabel} at n={num(lastSize)}</th>
              </tr>
            </thead>
            <tbody>
              {analysis.rows.map((row) => (
                <tr key={row.id} className={only === row.id ? 'is-current' : undefined}>
                  <th scope="row">{row.name}</th>
                  <td className="is-mono">{row.time}</td>
                  <td className="is-mono is-cyan">{row.slope.toFixed(2)}</td>
                  {/*
                    `null` where the metric recorded nothing at all — three of
                    these sorts perform zero writes on sorted input, and a flat
                    line of zeroes fits to a gradient that would be reported as
                    "linear" by a naive nearest-match. Saying nothing is the
                    honest option; see `Row.nearest` in the engine.
                  */}
                  <td className="is-mono is-amber">{row.nearest ? row.nearest.label : '—'}</td>
                  <td className="is-mono">{num(row.costs[row.costs.length - 1])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>

        <p className="lab-note">
          These columns are expected to disagree, and every disagreement here is correct.
          Big-O is an <em>upper</em> bound on the worst input; the gradient beside it is what
          this run actually did. Switch the shape to <strong>Sorted</strong> and bubble sort
          measures linear — its early exit fires on the first pass — while quicksort climbs to
          a quadratic gradient, because a last-element pivot on ordered data partitions one
          element at a time. Neither is a bug in the bound or the measurement; it is the gap
          between worst case and this case, which is the whole reason the distribution control
          exists.
        </p>
      </Bay>
    </div>
  );
}
