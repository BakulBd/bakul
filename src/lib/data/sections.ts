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

/** Section order and lengths — the only numbers that need maintaining. */
const LAYOUT: Omit<SectionDef, 't'>[] = [
  { id: 'boot', phase: 'BOOT', label: 'Standby', hint: 'System power-on', height: 1 },
  { id: 'core', phase: 'CORE', label: 'Core', hint: 'Engineering identity and subsystems', height: 2 },
  // 2.25 screens for 3 curated flagship bays — same ~0.75-screen-per-bay
  // dwell time used throughout this rack's history at every bay count.
  { id: 'projects', phase: 'PROJECTS', label: 'Projects', hint: 'Project rack — flagship work', height: 2.25 },
  { id: 'experience', phase: 'EXPERIENCE', label: 'Experience', hint: 'Assembly line — roles and milestones', height: 2.5 },
  { id: 'impact', phase: 'IMPACT', label: 'Impact', hint: 'Verified figures and contributions', height: 1.5 },
  { id: 'contact', phase: 'CONTACT', label: 'Contact', hint: 'Transmission terminal', height: 1.5 },
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

export const sectionById = (id: string) => sections.find((s) => s.id === id);

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
