'use client';

import dynamic from 'next/dynamic';
import {
  Binary,
  Cpu,
  Gauge,
  Network,
  TrendingUp,
  Waypoints,
  type LucideIcon,
} from 'lucide-react';
import type { ComponentType } from 'react';
import {
  BENCHES,
  BENCH_GROUPS,
  type BenchEntry,
  type BenchGroupId,
} from '@/lib/lab/catalogue';

/**
 * BENCH REGISTRY — the client half of the catalogue
 *
 * `src/lib/lab/catalogue.ts` holds the facts about each bench in a form the
 * server can read. This file attaches the two things that only exist on the
 * client: an icon component, and a loader for the bench UI.
 *
 * ── Why the benches are dynamically imported ───────────────────────────
 * Both benches used to be static imports in the shell, which meant every
 * visitor downloaded both regardless of which one they opened. With two small
 * benches that was defensible. It stops being defensible as the rack fills:
 * the route's whole argument is that it costs 14 kB of code because it ships no
 * renderer, and undoing that with eight eagerly-loaded benches would be a
 * strange way to make the point.
 *
 * `ssr: false` on each loader is deliberate rather than incidental. These are
 * instruments — every one of them mounts with a `useEffect`, a rAF playhead, or
 * an input the visitor is about to type into, and none of them render anything
 * meaningful before hydration. Prerendering them would produce markup that is
 * immediately replaced, pay for it twice, and add the whole bench to the server
 * bundle for no benefit. The page's *content* — the heading, the lead, the
 * footer, the structured data — is all server-rendered, which is the part that
 * has to exist without JavaScript.
 *
 * ── Why the loading state is a real reservation ────────────────────────
 * Each loader renders a fixed-height panel rather than `null`. A bench that
 * pops into existence shoves the footer down the page, which is a layout shift
 * a visitor feels as the page misbehaving at the exact moment they clicked
 * something. Reserving the space means the swap is invisible.
 *
 * ── Why the icon map is separate from the entries ──────────────────────
 * Keying icons by bench id here, instead of putting an `Icon` field in the
 * catalogue, is what keeps the catalogue importable from `seo.ts`,
 * `manifest.ts` and `llms.txt/route.ts`. A single `lucide-react` import inside
 * that file would pull a client component into three server modules.
 */

/**
 * Placeholder shown while a bench's chunk is in flight.
 *
 * `role="status"` with a live region rather than a silent box: a screen-reader
 * user who activated a bench gets told it is loading, which is the one thing a
 * visual spinner communicates and an `aria-hidden` div does not.
 */
function BenchLoading() {
  return (
    <div className="lab-bench-loading" role="status" aria-live="polite">
      <span className="lab-bench-loading__label t-mono">Loading bench…</span>
    </div>
  );
}

const SortingBench = dynamic(
  () => import('./SortingBench').then((m) => m.SortingBench),
  { ssr: false, loading: BenchLoading },
);

const ComplexityBench = dynamic(
  () => import('./ComplexityBench').then((m) => m.ComplexityBench),
  { ssr: false, loading: BenchLoading },
);

const StructuresBench = dynamic(
  () => import('./StructuresBench').then((m) => m.StructuresBench),
  { ssr: false, loading: BenchLoading },
);

const GraphBench = dynamic(
  () => import('./GraphBench').then((m) => m.GraphBench),
  { ssr: false, loading: BenchLoading },
);

const SchedulerBench = dynamic(
  () => import('./SchedulerBench').then((m) => m.SchedulerBench),
  { ssr: false, loading: BenchLoading },
);

const CompilerBench = dynamic(
  () => import('./CompilerBench').then((m) => m.CompilerBench),
  { ssr: false, loading: BenchLoading },
);

/**
 * Icons and views, keyed by the catalogue's ids.
 *
 * Typed as partial records rather than complete ones, because the catalogue's
 * ids are plain strings and nothing here can prove a lookup will hit. That
 * makes every read `T | undefined`, which is what forces the guard in
 * `REGISTERED` below — the alternative, a total `Record<string, LucideIcon>`,
 * would type an unwired bench as a component and let it reach the renderer.
 */
const ICONS: Partial<Record<string, LucideIcon>> = {
  sorting: Binary,
  complexity: TrendingUp,
  structures: Network,
  graph: Waypoints,
  scheduler: Gauge,
  compiler: Cpu,
};

const VIEWS: Partial<Record<string, ComponentType>> = {
  sorting: SortingBench,
  complexity: ComplexityBench,
  structures: StructuresBench,
  graph: GraphBench,
  scheduler: SchedulerBench,
  compiler: CompilerBench,
};

export interface RegisteredBench extends BenchEntry {
  readonly Icon: LucideIcon;
  readonly View: ComponentType;
}

/**
 * The catalogue, with icon and view attached.
 *
 * Entries missing either are dropped rather than rendered as a broken tab. A
 * bench listed in the catalogue but not wired up here would otherwise appear in
 * the rail and do nothing when clicked; dropping it turns a wiring mistake into
 * a visible absence, which is at least honest.
 */
export const REGISTERED: readonly RegisteredBench[] = BENCHES.flatMap((entry) => {
  const Icon = ICONS[entry.id];
  const View = VIEWS[entry.id];
  if (!Icon || !View) return [];
  return [{ ...entry, Icon, View }];
});

export function findRegistered(id: string | null | undefined): RegisteredBench | null {
  if (!id) return null;
  return REGISTERED.find((b) => b.id === id) ?? null;
}

/** The first registered bench — what the shell opens with. */
export const FIRST_BENCH: RegisteredBench | undefined = REGISTERED[0];

export interface RegisteredGroup {
  readonly id: BenchGroupId;
  readonly label: string;
  readonly note: string;
  readonly benches: readonly RegisteredBench[];
}

/**
 * Groups in catalogue order, containing only benches that are wired up.
 *
 * Empty groups are filtered out — a rack heading with nothing under it is the
 * same failure as the placeholder project bays the content rules forbid.
 */
export const REGISTERED_GROUPS: readonly RegisteredGroup[] = BENCH_GROUPS.map((g) => ({
  id: g.id,
  label: g.label,
  note: g.note,
  benches: REGISTERED.filter((b) => b.group === g.id),
})).filter((g) => g.benches.length > 0);

/**
 * Every registered bench, flattened in rail order.
 *
 * The rail's arrow keys traverse *across* group boundaries — a keyboard user
 * pressing Down at the end of one rack expects to land in the next one, not to
 * stop. So the tablist needs one flat sequence, and it has to be the same
 * sequence the eye reads top to bottom, which is why it is derived from
 * `REGISTERED_GROUPS` rather than from `REGISTERED` directly: the two only
 * agree while every bench belongs to a declared group.
 */
export const RAIL_ORDER: readonly RegisteredBench[] = REGISTERED_GROUPS.flatMap(
  (g) => g.benches,
);
