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

/**
 * Scroll positions of the signature transformation — a pure background
 * flourish now, not anchored to a dedicated content section. It plays across
 * the gap between the project rack and the assembly line, the same
 * structural position it always occupied, then holds as a structured field
 * (see PRESENCE_FADE) for the rest of the visit.
 */
export const MORPH_START =
  sections.find((s) => s.id === 'projects')!.t +
  (sections.find((s) => s.id === 'experience')!.t -
    sections.find((s) => s.id === 'projects')!.t) *
    0.28;

export const MORPH_END = sections.find((s) => s.id === 'experience')!.t;

/**
 * Where the field steps back so the reading sections stay legible. Begins
 * once the transformation has been seen.
 */
export const PRESENCE_FADE_START = MORPH_END + 0.03;
export const PRESENCE_FADE_END = sections.find((s) => s.id === 'impact')!.t;

export const sectionById = (id: string) => sections.find((s) => s.id === id);

/** Nearest section for a given normalised scroll position. */
export function sectionAt(t: number): SectionDef {
  let best = sections[0];
  let bestDist = Infinity;
  for (const s of sections) {
    const d = Math.abs(s.t - t);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return best;
}
