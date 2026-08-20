/**
 * SECTION REGISTRY — the spine of the experience.
 *
 * The DOM sections, the progress rail, the command palette, and the camera rig
 * all read from this one list, so navigation, choreography, and markup can
 * never drift apart. `t` is the normalised scroll position at which the camera
 * settles on that section, in [0, 1].
 */

export type Phase = 'BOOT' | 'ACTIVATING' | 'CORE' | 'PROJECTS' | 'EXPERIENCE' | 'IMPACT' | 'CONTACT';

export interface SectionDef {
  id: string;
  phase: Phase;
  /** Rail label — kept to a single short word where possible. */
  label: string;
  /** Command palette description. */
  hint: string;
  /**
   * Camera settle point along the scroll timeline, in [0,1].
   *
   * COMPUTED, never hand-written. Hand-tuned values silently drift out of sync
   * the moment a section's height changes, which desynchronises the camera, the
   * morph, and the progress rail from what is actually on screen.
   */
  t: number;
  /** Screen heights of scroll the section occupies. */
  height: number;
}

/**
 * Section order and lengths — the only numbers that need maintaining.
 *
 * `height` is dwell time, not content size. On a wide viewport the content is
 * pinned inside one screen (see Primitives' Section), so this figure is how
 * many screens of scrolling pass while it is held there — which makes it a
 * statement about how much attention a section is worth.
 *
 * The totals used to say something this portfolio does not mean: 10.75
 * screens, with Experience (2.5) given more of the page than Projects (2.25).
 * Coursework history outweighing the shipped work is the wrong order of
 * importance for a portfolio, and the length was what visitors felt first.
 *
 * Now 8.25 screens, and Projects is the longest section at 27% of the page.
 * Nothing was cut to get there except repetition — Impact lost three panels
 * that restated the hero plate, Core's credentials and the Projects section
 * back to the reader (see SectionImpact), so it no longer needs 1.5 screens.
 *
 * 1 is the floor. The pinned stage is `min-h-[100dvh]`, so a section can never
 * occupy less than one screen; a height below 1 would not shorten the page,
 * it would only desynchronise the assumed `t` below from the height the DOM
 * actually has.
 */
const LAYOUT: Omit<SectionDef, 't'>[] = [
  { id: 'boot', phase: 'BOOT', label: 'Standby', hint: 'System power-on', height: 1 },
  { id: 'core', phase: 'CORE', label: 'Core', hint: 'Engineering identity and subsystems', height: 1.25 },
  // 2.25 screens for 3 curated flagship bays — same ~0.75-screen-per-bay
  // dwell time used throughout this rack's history at every bay count. Left
  // alone deliberately: this is the work the site exists to show, and it is
  // now the longest section because the others gave way, not because this
  // one grew.
  { id: 'projects', phase: 'PROJECTS', label: 'Projects', hint: 'Project rack — flagship work', height: 2.25 },
  { id: 'experience', phase: 'EXPERIENCE', label: 'Experience', hint: 'Assembly line — roles and milestones', height: 1.5 },
  { id: 'impact', phase: 'IMPACT', label: 'Impact', hint: 'Verified figures and contributions', height: 1 },
  { id: 'contact', phase: 'CONTACT', label: 'Contact', hint: 'Transmission terminal', height: 1.25 },
];

/**
 * Each section's content is sticky, so it stays pinned while the page scrolls
 * through [start, start + height - 1] screens. The settle point is the middle
 * of that pinned window, normalised against the document's scrollable range
 * (total height minus one viewport).
 */
export const sections: SectionDef[] = (() => {
  const totalScrollHeight = LAYOUT.reduce((sum, s) => sum + s.height, 0);
  const scrollable = totalScrollHeight - 1;
  let start = 0;

  return LAYOUT.map((s) => {
    const pinnedCentre = start + Math.max(0, s.height - 1) / 2;
    start += s.height;
    return {
      ...s,
      t: scrollable > 0 ? Math.min(1, pinnedCentre / scrollable) : 0,
    };
  });
})();

/* ==================================================================
   MEASURED SETTLE POINTS

   The `t` values above are computed from the *assumed* layout: every section
   pinned, occupying exactly `height` screens. That assumption holds on a wide
   viewport and nowhere else. On a phone the pinning is dropped (content is
   taller than the viewport, so pinning it only clips it — see Primitives'
   Section), sections take their natural height, and those heights depend on
   how the copy wraps at that particular width. A camera keyed to the assumed
   layout would then settle on the wrong scroll positions by hundreds of
   pixels, and the further down the page, the worse the drift compounds.

   So the real settle points are measured from the DOM once it exists, and
   everything downstream — camera stations, the morph window, the presence
   fade — reads the measured values. The computed `t` above stays as the
   pre-measurement fallback, which is what the very first frames render from
   and what SSR reasons about.
   ================================================================== */

/**
 * Live settle points, parallel to `sections`. Mutated in place rather than
 * replaced so the render loop can hold a reference and never re-read it.
 */
export const stationT: number[] = sections.map((s) => s.t);

/** Morph and presence-fade windows, in the same measured space. */
export const timeline = {
  morphStart: 0,
  morphEnd: 0,
  presenceFadeStart: 0,
  presenceFadeEnd: 0,
};

const indexOfId = (id: string) => sections.findIndex((s) => s.id === id);

/** Derives the dependent windows from whatever is currently in `stationT`. */
function deriveTimeline() {
  const projects = stationT[indexOfId('projects')];
  const experience = stationT[indexOfId('experience')];
  const impact = stationT[indexOfId('impact')];

  // The signature transformation plays across the gap between the project
  // rack and the assembly line — the same structural position it has always
  // occupied, now expressed against measured geometry rather than assumed.
  timeline.morphStart = projects + (experience - projects) * 0.28;
  timeline.morphEnd = experience;
  // Where the field steps back so the reading sections stay legible.
  timeline.presenceFadeStart = Math.min(1, timeline.morphEnd + 0.03);
  timeline.presenceFadeEnd = impact;
}

deriveTimeline();

/**
 * Re-reads every section's real position and recomputes the settle points.
 * Called on mount and on resize by the scroll engine — never per frame: this
 * reads layout, and doing that inside the render loop is precisely the forced
 * synchronous layout the frame singleton exists to avoid.
 */
export function measureStations() {
  if (typeof document === 'undefined') return;

  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return;

  const vh = window.innerHeight;

  for (let i = 0; i < sections.length; i++) {
    const el = document.getElementById(`section-${sections[i].id}`);
    if (!el) continue;

    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;

    /*
     * The scroll position at which this section is best framed.
     *
     * For a section taller than the viewport that is the middle of its own
     * scroll window; for a shorter one it is whatever centres it. Both are
     * the same expression — centre the section in the viewport — which is
     * why this works unchanged for a pinned wide layout and a natural-height
     * compact one.
     */
    const centred = top + rect.height / 2 - vh / 2;
    stationT[i] = Math.min(1, Math.max(0, centred / max));
  }

  /*
   * Force monotonicity. Every consumer brackets a scroll position between
   * two adjacent stations and divides by the span; a non-increasing pair
   * would make that span zero or negative and send the camera backwards
   * through a section. Measurement can produce one legitimately — a very
   * short section fully inside a tall neighbour's window — so it is clamped
   * here rather than guarded at each of the four call sites.
   */
  for (let i = 1; i < stationT.length; i++) {
    if (stationT[i] < stationT[i - 1]) stationT[i] = stationT[i - 1];
  }

  deriveTimeline();
}

/**
 * NARRATIVE TONE — one source, read by both layers.
 *
 * Amber while the copy is about the physical machine, cyan once it turns to
 * results and outcomes. The DOM has always tinted its ambient section wash
 * from this; the 3D scene did not, which meant the background could be lit
 * amber behind a section the foreground had already washed cyan. Two layers
 * disagreeing about what state the page is in is precisely the seam that
 * separates "a site with a 3D background" from one machine.
 *
 * Expressed as a scalar rather than a colour so it can be interpolated: 0 is
 * fully mechanical, 1 fully computational, and any value between is a real
 * position in the hand-off rather than a switch that flips at a boundary.
 */
export const toneForPhase = (phase: Phase): number =>
  phase === 'EXPERIENCE' || phase === 'IMPACT' || phase === 'CONTACT' ? 1 : 0;

/**
 * Tone at an arbitrary scroll position, smoothly.
 *
 * Interpolates between the two sections bracketing `t` using the same measured
 * stations the camera brackets against, so the colour hand-off happens exactly
 * where the camera move does instead of a few hundred pixels either side.
 */
export function toneAt(t: number): number {
  const last = sections.length - 1;
  if (t <= stationT[0]) return toneForPhase(sections[0].phase);
  if (t >= stationT[last]) return toneForPhase(sections[last].phase);

  for (let i = 0; i < last; i++) {
    if (t >= stationT[i] && t <= stationT[i + 1]) {
      const span = stationT[i + 1] - stationT[i];
      const k = span > 0 ? (t - stationT[i]) / span : 0;
      const eased = k * k * (3 - 2 * k);
      const a = toneForPhase(sections[i].phase);
      const b = toneForPhase(sections[i + 1].phase);
      return a + (b - a) * eased;
    }
  }
  return 0;
}

export const sectionById = (id: string) => sections.find((s) => s.id === id);

/**
 * DISPLAY INDEX — the two-digit number printed beside a section's label.
 *
 * Derived from the registry, never hand-written. These were previously typed
 * as a literal `index` prop on each section component, and they had silently
 * gone stale: an earlier revision of this site had nine sections, and when it
 * was cut to six the survivors kept their original numbers. The page shipped
 * 01, 02, 04, 05, 08 — a visitor could count three sections that do not exist
 * on a rail that shows six.
 *
 * Deriving it applies the same discipline the settle points already follow
 * (see `measureStations`): the registry is the single source of truth for
 * section order, so anything ordinal about a section must be read from it
 * rather than duplicated beside it. Sections can no longer be added, removed
 * or reordered into a wrong number, because there is no second copy to forget.
 *
 * ── There was a second copy ────────────────────────────────────────────
 * The progress rail printed its own `String(i).padStart(2, '0')` beside each
 * tick label, so the page had two independent expressions for one number. They
 * agreed, and only by accident: this function used to read
 * `i <= 0 ? '01' : padStart(i)`, and that `i <= 0` branch shifted exactly the
 * one row — `boot` — that the rail numbers `00`. Every other section landed on
 * the same string down both paths. Insert a section anywhere above `core` and
 * the accident ends: the rail would number every destination one below what the
 * section itself prints at the top of the screen, on a page whose entire
 * premise is that the interface agrees with itself.
 *
 * So the offset is gone and the rail reads this instead. `Math.max` covers the
 * `findIndex` miss, and returns `'00'` for it rather than the old `'01'`: an id
 * that is not in the registry is a mistake in the caller, and it should surface
 * as a number no real section has instead of impersonating the first one.
 *
 * `boot` is the standby screen. It renders its own markup rather than `Section`
 * (see `Experience.tsx`) and its heading is screen-reader-only, so `00` reaches
 * the page in exactly one place — the rail's hover label — and the first
 * numbered section a visitor reads is `core` at 01.
 */
export function sectionIndex(id: string): string {
  const i = sections.findIndex((s) => s.id === id);
  return String(Math.max(0, i)).padStart(2, '0');
}

/** Nearest section for a given normalised scroll position. */
export function sectionAt(t: number): SectionDef {
  let best = sections[0];
  let bestDist = Infinity;
  for (let i = 0; i < sections.length; i++) {
    const d = Math.abs(stationT[i] - t);
    if (d < bestDist) {
      bestDist = d;
      best = sections[i];
    }
  }
  return best;
}
