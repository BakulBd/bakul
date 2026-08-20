'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KEY_MAX,
  KEY_MIN,
  NONE,
  SLOT_CHOICES,
  buildHash,
  buildTree,
  findOrder,
  findProbe,
  findTreeMode,
  makeKeys,
  nearestSlots,
  orders,
  probes,
  treeLayout,
  treeModes,
  verifyHash,
  verifyTree,
  type HashFrame,
  type HashStepKind,
  type OrderId,
  type ProbeId,
  type TreeFrame,
  type TreeLayout,
  type TreeModeId,
  type TreeStepKind,
} from '@/lib/lab/structures';
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
 * STRUCTURES BENCH — the view layer over `lib/lab/structures.ts`.
 *
 * Same contract as every other bench here: the engine runs to completion in a
 * `useMemo`, the playhead only moves an integer, and what is drawn is
 * `frameAt(trace, cursor)`. Nothing in this file knows how a rotation works or
 * where a probe goes next — it reads frames.
 *
 * ── Why two structures in one bench ─────────────────────────────────────
 * Because the comparison is the lesson. A tree and a hash table solve the same
 * problem, and a visitor who has just watched a BST degenerate into a 14-deep
 * chain is in exactly the right frame of mind to be shown a table that answers
 * in one probe — and then to be shown the clustering that makes it answer in
 * nine. Splitting them into two entries would put a navigation click between
 * the question and its answer.
 *
 * The two halves never render at once. `structure` is a real mode switch, so
 * only one engine runs, one trace exists, and the transport controls one thing.
 *
 * ── Why the tree is SVG edges under DOM nodes ────────────────────────────
 * Lines are the one thing CSS boxes draw badly and SVG draws exactly, and text
 * is the one thing SVG handles worse than the DOM. So the edges are a single
 * `<svg>` layer and the nodes are a CSS grid on top of it.
 *
 * The two align because `treeLayout` returns integer (x, y) cells: a grid of
 * `1fr` columns puts cell x's centre at (x + 0.5) / columns, which is exactly
 * where the SVG line ends when the viewBox is 0 0 100 100 with
 * `preserveAspectRatio="none"`. That stretch would also distort the stroke,
 * which is what `vector-effect="non-scaling-stroke"` is there to prevent — the
 * lines stay one pixel wide at every bench width.
 */


const BENCH_ID = 'structures';

type StructureId = 'tree' | 'hash';

const DEFAULT_STRUCTURE: StructureId = 'tree';
const DEFAULT_TREE: TreeModeId = 'avl';
const DEFAULT_ORDER: OrderId = 'shuffled';
const DEFAULT_PROBE: ProbeId = 'linear';
const DEFAULT_KEYS = 10;
const DEFAULT_SLOTS = 13;
const DEFAULT_SEED = 2048;

/** Steps per second at 1×. Slower than the sorting bench on purpose: a rotation
 *  rearranges the whole picture, and at eight steps a second it is a blur. */
const BASE_RATE = 3.5;

type Speed = '0.5' | '1' | '2' | '4';

const speedOptions: readonly Option<Speed>[] = [
  { id: '0.5', label: '½×' },
  { id: '1', label: '1×' },
  { id: '2', label: '2×' },
  { id: '4', label: '4×' },
];

const structureOptions: readonly Option<StructureId>[] = [
  { id: 'tree', label: 'Tree', hint: 'pays in comparisons; cost depends on shape' },
  { id: 'hash', label: 'Hash table', hint: 'pays in probes; cost depends on load' },
];

const treeOptions: readonly Option<TreeModeId>[] = treeModes.map((m) => ({
  id: m.id,
  label: m.name,
  hint: m.cost,
}));

const orderOptions: readonly Option<OrderId>[] = orders.map((o) => ({
  id: o.id,
  label: o.name,
  hint: o.note,
}));

const probeOptions: readonly Option<ProbeId>[] = probes.map((p) => ({
  id: p.id,
  label: p.name,
  hint: p.rule,
}));

/** What a tree step did, in words. Also drives the live region. */
const TREE_VERB: Record<TreeStepKind, string> = {
  compare: 'Compare',
  attach: 'Attach',
  retrace: 'Retrace',
  rotate: 'Rotate',
  settled: 'Settled',
};

/** The same for the table. `give-up` is a real outcome, so it is named. */
const HASH_VERB: Record<HashStepKind, string> = {
  hash: 'Hash',
  collide: 'Collision',
  place: 'Place',
  'give-up': 'Gave up',
};

export function StructuresBench() {
  const [structure, setStructure] = useState<StructureId>(DEFAULT_STRUCTURE);
  const [treeMode, setTreeMode] = useState<TreeModeId>(DEFAULT_TREE);
  const [order, setOrder] = useState<OrderId>(DEFAULT_ORDER);
  const [probe, setProbe] = useState<ProbeId>(DEFAULT_PROBE);
  const [count, setCount] = useState(DEFAULT_KEYS);
  const [slots, setSlots] = useState(DEFAULT_SLOTS);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [speed, setSpeed] = useState<Speed>('1');
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);

  /* ---------------- the run in the URL ---------------- */

  /*
   * Read the link before writing to it — a state flag rather than a ref, for the
   * reason spelled out in `SortingBench`: on mount both effects run in the same
   * commit, and a ref guard would let the write fire with the pre-read settings
   * and strip the parameters it was about to be told about.
   */
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);

    const structureParam = q.get('struct');
    if (structureParam === 'tree' || structureParam === 'hash') setStructure(structureParam);

    const treeParam = q.get('tree');
    if (treeParam && treeModes.some((m) => m.id === treeParam)) setTreeMode(treeParam as TreeModeId);

    const orderParam = q.get('order');
    if (orderParam && orders.some((o) => o.id === orderParam)) setOrder(orderParam as OrderId);

    const probeParam = q.get('probe');
    if (probeParam && probes.some((p) => p.id === probeParam)) setProbe(probeParam as ProbeId);

    const keysParam = Number.parseInt(q.get('keys') ?? '', 10);
    if (Number.isInteger(keysParam)) {
      setCount(Math.min(KEY_MAX, Math.max(KEY_MIN, keysParam)));
    }

    /*
     * Table length is snapped to the prime list rather than clamped to a range.
     * A hand-edited `slots=16` has to become a prime, because both quadratic
     * probing and double hashing depend on it — quietly accepting 16 would
     * change what the bench demonstrates without saying so.
     */
    const slotsParam = Number.parseInt(q.get('slots') ?? '', 10);
    if (Number.isInteger(slotsParam)) setSlots(nearestSlots(slotsParam));

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

    put('struct', structure, DEFAULT_STRUCTURE);
    put('tree', treeMode, DEFAULT_TREE);
    put('order', order, DEFAULT_ORDER);
    put('probe', probe, DEFAULT_PROBE);
    put('keys', String(count), String(DEFAULT_KEYS));
    put('slots', String(slots), String(DEFAULT_SLOTS));
    put('seed', String(seed), String(DEFAULT_SEED));

    const next = `${url.pathname}${url.search}${url.hash}`;
    const now = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== now) window.history.replaceState(null, '', next);
  }, [linked, structure, treeMode, order, probe, count, slots, seed]);

  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  /** Spells out every setting, even defaults — a link is a promise. */
  const permalink = useMemo(() => {
    const path = benchPath(BENCH_ID);
    const q = new URLSearchParams({
      struct: structure,
      tree: treeMode,
      order,
      probe,
      keys: String(count),
      slots: String(slots),
      seed: String(seed),
    });
    return `${origin}${path}${path.includes('?') ? '&' : '?'}${q}#${benchFragment(BENCH_ID)}`;
  }, [origin, structure, treeMode, order, probe, count, slots, seed]);

  /** A different key set — and never the one already on screen. */
  const reroll = useCallback(() => {
    setSeed((current) => {
      let next = randomSeed();
      while (next === current) next = randomSeed();
      return next;
    });
    haptic('press');
  }, []);

  /* ---------------- the run ---------------- */

  const keys = useMemo(() => makeKeys(order, count, seed), [order, count, seed]);

  const mode = useMemo(() => findTreeMode(treeMode), [treeMode]);
  const strategy = useMemo(() => findProbe(probe), [probe]);
  const orderSpec = useMemo(() => findOrder(order), [order]);

  /*
   * Both engines run, but only for the structure on screen.
   *
   * Written as two memos rather than one branch so that switching structure
   * does not rebuild the half that did not change — and each is cheap anyway:
   * fourteen keys is about a hundred steps of a few hundred bytes.
   */
  const treeRun = useMemo(() => buildTree(keys, treeMode), [keys, treeMode]);
  const hashRun = useMemo(() => buildHash(keys, probe, slots), [keys, probe, slots]);

  const trace = structure === 'tree' ? treeRun.trace : hashRun.trace;
  const total = trace.steps.length;

  /*
   * A new key set, structure or strategy invalidates the cursor entirely — step
   * 40 of an AVL build is not step 40 of a probe sequence. Park at the resting
   * position rather than clamping, so what plays is a whole run.
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
     * ceiling the first frame back would jump the whole run at once.
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

  /** Confirm arrival the way the sorting bench confirms a finished sort. */
  const wasDone = useRef(false);
  const done = cursor >= total - 1 && total > 0;
  useEffect(() => {
    if (done && !wasDone.current) haptic('lock');
    wasDone.current = done;
  }, [done]);

  /* ---------------- what is on screen ---------------- */

  const isTree = structure === 'tree';

  /*
   * Each half is read from its own trace, and the half that is not on screen is
   * pinned to its resting frame at cursor -1.
   *
   * Deliberately not `frameAt(trace, cursor)` on the union: `trace` is a
   * `Trace<TreeFrame> | Trace<HashFrame>`, and asking for one frame type out of
   * that union is exactly the sort of thing that needs a cast to compile. Two
   * calls need none, and the pinning means switching structure cannot leave the
   * hidden half showing a frame from the other one's timeline.
   */
  const treeFrame = useMemo(() => frameAt(treeRun.trace, isTree ? cursor : -1), [treeRun, isTree, cursor]);
  const hashFrame = useMemo(() => frameAt(hashRun.trace, isTree ? -1 : cursor), [hashRun, isTree, cursor]);
  const treeStep = useMemo(() => stepAt(treeRun.trace, isTree ? cursor : -1), [treeRun, isTree, cursor]);
  const hashStep = useMemo(() => stepAt(hashRun.trace, isTree ? -1 : cursor), [hashRun, isTree, cursor]);

  const layout = useMemo(() => treeLayout(treeFrame.nodes, treeFrame.root), [treeFrame]);

  /*
   * Slots filled at this instant, counted off the frame on screen rather than
   * taken from the outcome — the outcome describes the finished table, and while
   * scrubbing, that is not the table the visitor is looking at.
   */
  const occupiedNow = useMemo(
    () => hashFrame.slots.filter((s) => s !== NONE).length,
    [hashFrame],
  );

  /** The clustering readout, measured from the slots that are drawn. */
  const clusterNow = useMemo(() => longestRun(hashFrame.slots), [hashFrame]);

  /** Height of the tree on screen. Read off the root, which stores it. */
  const heightNow = treeFrame.root === NONE ? 0 : treeFrame.nodes[treeFrame.root].height;


  /*
   * The properties this run has to satisfy, computed from the finished outcome
   * rather than the cursor: a half-built tree is not a wrong tree, it is an
   * incomplete one, and a badge that went red mid-scrub would be lying.
   */
  const verification = useMemo(
    () =>
      isTree
        ? verifyTree(keys, treeMode, treeRun.outcome, treeRun.trace.final.nodes, treeRun.trace.final.root)
        : verifyHash(keys, probe, slots, hashRun.outcome),
    [isTree, keys, treeMode, treeRun, probe, slots, hashRun],
  );

  /*
   * Both tree modes over the keys on screen, and all three probe strategies over
   * the same table.
   *
   * Re-run with `record = false`, so no frames are built: this is a handful of
   * counting passes over at most fourteen keys, down the same code path the
   * bench displays. That is the only way the row for the current setting can be
   * trusted to agree with the figure above it.
   */
  const treeComparison = useMemo(
    () =>
      treeModes.map((m) => ({
        mode: m,
        outcome: m.id === treeMode ? treeRun.outcome : buildTree(keys, m.id, false).outcome,
      })),
    [keys, treeMode, treeRun],
  );

  const hashComparison = useMemo(
    () =>
      probes.map((p) => ({
        probe: p,
        outcome: p.id === probe ? hashRun.outcome : buildHash(keys, p.id, slots, false).outcome,
      })),
    [keys, probe, slots, hashRun],
  );

  /** Plain-language state of the figure, for its accessible name. */
  const caption = isTree
    ? done
      ? `${num(treeRun.outcome.count)} keys, height ${num(treeRun.outcome.height)}, ${num(treeRun.outcome.rotations)} rotations`
      : treeFrame.note
    : done
      ? `${num(hashRun.outcome.placed)} of ${num(keys.length)} keys placed in ${num(slots)} slots`
      : hashFrame.note;

  return (
    <div className="lab-bench">
      {/* ---------------- the keys ---------------- */}
      <Bay
        n="01"
        title="Keys"
        note={`${num(count)} distinct keys, ${orderSpec.note}`}
        className="lab-bay--narrow"
      >
        <Segmented
          label="Structure"
          options={structureOptions}
          value={structure}
          onChange={setStructure}
          columns={2}
        />
        <Segmented label="Insertion order" options={orderOptions} value={order} onChange={setOrder} columns={2} />
        <Slider
          label="Keys"
          value={count}
          min={KEY_MIN}
          max={KEY_MAX}
          onChange={setCount}
          hint={isTree ? 'nodes in the tree' : 'keys offered to the table'}
        />
        {!isTree && (
          /*
           * Table length steps through the prime list rather than a numeric
           * range, so every position is a legal length for all three strategies.
           * The load factor is shown because it, not the length, is what the
           * probe counts actually track.
           */
          <Slider
            label="Slots"
            value={SLOT_CHOICES.indexOf(slots)}
            min={0}
            max={SLOT_CHOICES.length - 1}
            onChange={(i) => setSlots(SLOT_CHOICES[i])}
            format={() => `${num(slots)} (prime)`}
            hint={`load ${Math.round((count / slots) * 100)}% at ${num(count)} keys`}
          />
        )}
        <div className="lab-seed">
          <p className="lab-seed__row">
            <span className="lab-seed__key">Seed</span>
            <span className="lab-seed__val" aria-live="polite">
              {seed}
            </span>
          </p>

          <div className="lab-seed__acts">
            <button type="button" className="btn lab-shuffle" onClick={reroll}>
              New keys
            </button>
            <CopyButton value={permalink} label="Copy link" done="Link copied" />
          </div>
        </div>

        <p className="lab-keys" aria-label="Keys in insertion order">
          {keys.map((k, i) => (
            <span key={`${k}-${i}`} className="lab-keys__k">
              {k}
            </span>
          ))}
        </p>
      </Bay>

      {/* ---------------- the structure ---------------- */}
      <Bay
        n="02"
        title={isTree ? mode.full : strategy.full}
        note={isTree ? mode.claims : `${strategy.rule} — ${strategy.claims}`}
        className="lab-bay--narrow"
      >
        {isTree ? (
          <Segmented label="Tree" options={treeOptions} value={treeMode} onChange={setTreeMode} columns={2} />
        ) : (
          <Segmented label="Probe" options={probeOptions} value={probe} onChange={setProbe} />
        )}
        <Segmented label="Speed" options={speedOptions} value={speed} onChange={setSpeed} />

        <Transport
          playing={playing}
          onPlayPause={onPlayPause}
          cursor={cursor}
          total={total}
          onSeek={onSeek}
          onReset={onReset}
        />

        {isTree ? (
          <TreeFigure frame={treeFrame} layout={layout} caption={caption} />
        ) : (
          <HashFigure frame={hashFrame} length={slots} caption={caption} />
        )}

        {/*
          The narration. `aria-live` is off while playing, because a screen
          reader cannot keep up with three announcements a second and would
          drown the transport controls — when paused or scrubbing, each step is
          announced exactly once.
        */}
        <p className="lab-step" aria-live={playing ? 'off' : 'polite'}>
          {isTree ? (
            treeStep === null ? (
              <span className="lab-step__kind">Ready — nothing inserted</span>
            ) : (
              <>
                <span className={`lab-step__kind is-${treeStep.kind}`}>
                  {TREE_VERB[treeStep.kind]}
                </span>
                <span className="lab-step__idx">{treeFrame.note}</span>
              </>
            )
          ) : hashStep === null ? (
            <span className="lab-step__kind">Ready — the table is empty</span>
          ) : (
            <>
              <span className={`lab-step__kind is-${hashStep.kind}`}>
                {HASH_VERB[hashStep.kind]}
              </span>
              <span className="lab-step__idx">{hashFrame.note}</span>
            </>
          )}
        </p>

        {/*
          Every figure here comes off the frame on screen, not the outcome. That
          is the rule the whole lab follows, and it is what makes the numbers
          check out mid-scrub instead of only at the end. `Shortest possible` is
          the one derived value, and it is derived from the node count that is
          drawn beside it.
        */}
        <dl className="lab-stats">
          {isTree ? (
            <>
              <Stat k="Height" v={num(heightNow)} tone="cyan" />
              <Stat
                k="Shortest possible"
                v={num(treeFrame.nodes.length === 0 ? 0 : Math.ceil(Math.log2(treeFrame.nodes.length + 1)))}
              />
              <Stat k="Comparisons" v={num(treeFrame.comparisons)} tone="amber" />
              <Stat k="Rotations" v={num(treeFrame.rotations)} tone="amber" />
              <Stat k="Nodes" v={`${num(treeFrame.nodes.length)} / ${num(count)}`} />
            </>
          ) : (
            <>
              <Stat k="Probes, this key" v={num(hashFrame.probed.length)} tone="cyan" />
              <Stat k="Occupied" v={`${num(occupiedNow)} / ${num(slots)}`} />
              <Stat k="Load" v={`${Math.round((occupiedNow / slots) * 100)}%`} tone="amber" />
              <Stat k="Longest cluster" v={num(clusterNow)} tone="amber" />
              <Stat k="Worst probe" v={done ? num(hashRun.outcome.worst) : '—'} />
            </>
          )}
        </dl>


        <VerifyBadge
          verification={verification}
          label={isTree ? 'Tree properties' : 'Table properties'}
        />

        {/*
          Rejected keys are surfaced, not swallowed. Quadratic probing genuinely
          cannot reach every slot of a prime table, so on a loaded table it will
          fail to place a key while space remains — and the honest thing to do
          with that is name the keys and say why.
        */}
        {!isTree && hashRun.outcome.rejected.length > 0 && (
          <p className="lab-warn">
            {num(hashRun.outcome.rejected.length)} key
            {hashRun.outcome.rejected.length === 1 ? '' : 's'} could not be placed (
            {hashRun.outcome.rejected.join(', ')}). {strategy.weakness}
          </p>
        )}
      </Bay>

      {/* ---------------- the comparison ---------------- */}
      <Bay
        n="03"
        title={isTree ? 'Both trees, same keys' : 'All three strategies, same table'}
        note="Counted by re-running the engine without recording. Every figure is measured."
      >
        {isTree ? (
          <table className="lab-table">
            <caption className="sr-only">
              Height and cost for each tree over the {num(count)} keys above
            </caption>
            <thead>
              <tr>
                <th scope="col">Tree</th>
                <th scope="col">Height</th>
                <th scope="col">Comparisons</th>
                <th scope="col">Rotations</th>
              </tr>
            </thead>
            <tbody>
              {treeComparison.map(({ mode: m, outcome }) => (
                <tr key={m.id} className={m.id === treeMode ? 'is-current' : undefined}>
                  <th scope="row">
                    {m.name}
                    {m.id === treeMode && <span className="sr-only"> (currently shown)</span>}
                  </th>
                  <td className="is-mono">{num(outcome.height)}</td>
                  <td className="is-mono">{num(outcome.comparisons)}</td>
                  <td className="is-mono">{num(outcome.rotations)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="lab-table">
            <caption className="sr-only">
              Probe cost for each strategy over {num(count)} keys in {num(slots)} slots
            </caption>
            <thead>
              <tr>
                <th scope="col">Probe</th>
                <th scope="col">Placed</th>
                <th scope="col">Avg probes</th>
                <th scope="col">Worst</th>
                <th scope="col">Cluster</th>
              </tr>
            </thead>
            <tbody>
              {hashComparison.map(({ probe: p, outcome }) => (
                <tr key={p.id} className={p.id === probe ? 'is-current' : undefined}>
                  <th scope="row">
                    {p.name}
                    {p.id === probe && <span className="sr-only"> (currently shown)</span>}
                  </th>
                  <td className="is-mono">{num(outcome.placed)}</td>
                  <td className="is-mono">{outcome.avgProbes.toFixed(2)}</td>
                  <td className="is-mono">{num(outcome.worst)}</td>
                  <td className="is-mono">{num(outcome.cluster)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="lab-note">
          {isTree
            ? 'Switch the insertion order to Ascending: the plain BST becomes a list of height n while AVL stays put. The rotations column is what that costs.'
            : `${strategy.weakness} Raise the key count toward the slot count and watch the cluster column climb.`}
        </p>
      </Bay>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   The figures
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Longest run of consecutive occupied slots, wrapping around the end.
 *
 * The wrap is why this walks twice the length: a cluster that straddles the last
 * slot is one cluster, and stopping at the array edge would report it as two
 * short ones. The engine measures the finished table the same way — this exists
 * because the stat tracks the cursor, and the engine's figure describes the end.
 */
function longestRun(slots: readonly number[]): number {
  const full = slots.filter((s) => s !== NONE).length;
  if (full === slots.length) return slots.length;

  let best = 0;
  let run = 0;
  for (let i = 0; i < slots.length * 2; i += 1) {
    if (slots[i % slots.length] !== NONE) {
      run += 1;
      if (run > best) best = run;
    } else run = 0;
  }
  return best;
}

interface TreeFigureProps {
  readonly frame: TreeFrame;
  readonly layout: TreeLayout;
  readonly caption: string;
}

/**
 * The tree: an SVG edge layer with a CSS grid of nodes on top.
 *
 * One `role="img"` with a written description rather than a node-by-node
 * reading, for the reason `GraphBench` gives about its grid: the content here is
 * the *shape* the keys grew into, and announcing fourteen numbers in in-order
 * sequence would destroy exactly that. The description is the same sentence the
 * step line shows, so the two never disagree.
 *
 * The empty case renders a real message rather than an empty box, because a
 * blank panel reads as a broken component. Only the edges live in SVG; every
 * label is DOM text, so it scales with the page font and can be selected.
 */
function TreeFigure({ frame, layout, caption }: TreeFigureProps) {
  const onPath = new Set(frame.path);
  const touched = new Set(frame.touched);

  if (frame.nodes.length === 0) {
    return <p className="lab-empty">No nodes yet — press play to insert the first key.</p>;
  }

  const { columns, rows } = layout;

  return (
    <div
      className="lab-tree"
      role="img"
      aria-label={`Tree diagram — ${caption}`}
      style={
        {
          '--lab-tree-cols': columns,
          '--lab-tree-rows': rows,
        } as React.CSSProperties
      }
    >
      {/*
        One SVG for every edge. `preserveAspectRatio="none"` lets the 0–100
        square stretch to whatever the bay is wide, which is what keeps the line
        ends locked to the grid cells above; `non-scaling-stroke` stops that
        stretch from smearing the stroke width.
      */}
      <svg
        className="lab-tree__wires"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        {layout.places
          .filter((p) => p.index !== frame.root)
          .map((p) => (
            <line
              key={p.index}
              x1={((p.parentX + 0.5) / columns) * 100}
              y1={((p.parentY + 0.5) / rows) * 100}
              x2={((p.x + 0.5) / columns) * 100}
              y2={((p.y + 0.5) / rows) * 100}
              className={onPath.has(p.index) ? 'is-path' : undefined}
              vectorEffect="non-scaling-stroke"
            />
          ))}
      </svg>

      {layout.places.map((p) => {
        const node = frame.nodes[p.index];
        const isInserting = node.key === frame.inserting;
        return (
          <span
            key={p.index}
            className={[
              'lab-node',
              onPath.has(p.index) ? 'is-path' : '',
              touched.has(p.index) ? 'is-touched' : '',
              isInserting ? 'is-new' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ gridColumn: p.x + 1, gridRow: p.y + 1 }}
          >
            {node.key}
          </span>
        );
      })}
    </div>
  );
}

interface HashFigureProps {
  readonly frame: HashFrame;
  readonly length: number;
  readonly caption: string;
}


/**
 * The table: one cell per slot, with the probe order written on the cells.
 *
 * The probe sequence is shown as a small ordinal on each visited slot rather
 * than as an arrow, because with quadratic probing and double hashing the jumps
 * are long and non-adjacent — arrows would cross the whole figure and tell the
 * visitor less than the numbers 1, 2, 3 do.
 */
function HashFigure({ frame, length, caption }: HashFigureProps) {
  /** Where in this key's probe sequence each slot was visited. 1-based. */
  const order = new Map<number, number>();
  frame.probed.forEach((slot, i) => {
    if (!order.has(slot)) order.set(slot, i + 1);
  });

  return (
    <ol
      className="lab-slots"
      role="img"
      aria-label={`Hash table — ${caption}`}
      style={{ '--lab-slots': length } as React.CSSProperties}
    >
      {frame.slots.map((key, slot) => {
        const step = order.get(slot);
        const isCurrent = slot === frame.at;
        return (
          <li
            key={slot}
            className={[
              'lab-slot',
              key === NONE ? 'is-empty' : 'is-full',
              step !== undefined ? 'is-probed' : '',
              isCurrent ? 'is-at' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="lab-slot__i">{slot}</span>
            <span className="lab-slot__k">{key === NONE ? '·' : key}</span>
            {step !== undefined && <span className="lab-slot__n">{step}</span>}
          </li>
        );
      })}
    </ol>
  );
}


