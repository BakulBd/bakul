'use client';

import { create } from 'zustand';
import type { Phase } from '@/lib/data/sections';

/* ------------------------------------------------------------------ *
 * FRAME STATE (mutable singleton — deliberately NOT React state)
 *
 * These values change every animation frame. Routing them through React
 * would re-render the entire tree 60+ times a second for no benefit, so
 * the render loop reads and writes this object directly. Only discrete,
 * user-meaningful transitions go through the Zustand store below.
 * ------------------------------------------------------------------ */

export interface FrameState {
  /** Normalised scroll position across the whole experience, [0,1]. */
  t: number;
  /** Smoothed |d(t)/dt|, drives mechanical tempo. Roughly [0,1]. */
  velocity: number;
  /** Raw signed scroll delta for the current frame. */
  delta: number;
  /** Power-on ramp, [0,1]. Gates every emissive surface in the scene. */
  power: number;
  /** Signature transformation: 0 = mechanical, 1 = neural. */
  morph: number;
  /**
   * Narrative tone, [0,1]: 0 = mechanical (amber), 1 = computational (cyan).
   * The same value the DOM tints its section wash from — see toneAt in
   * lib/data/sections — so the lighting rig and the page agree on what the
   * visitor is currently reading about.
   */
  tone: number;
  /** Pointer in normalised device coordinates, [-1,1]. */
  pointer: { x: number; y: number };
  /** Activation wave triggered by clicking the neural field. */
  pulse: number;
  /**
   * Project emergence, [0,1]. 0 = the project sits flat inside the monitor,
   * 1 = it has broken fully through the screen into the machine's space.
   * Drives the screen's bulge and refraction, the emerging module's travel,
   * the escaping particles, and the camera's dolly — one value so every part
   * of the effect is, by construction, at the same point in the motion.
   */
  emerge: number;
  /** Live render telemetry, populated by the canvas — real values only. */
  fps: number;
  drawCalls: number;
  triangles: number;
  particles: number;
}

export const frame: FrameState = {
  t: 0,
  velocity: 0,
  delta: 0,
  power: 0,
  morph: 0,
  tone: 0,
  pointer: { x: 0, y: 0 },
  pulse: 0,
  emerge: 0,
  fps: 0,
  drawCalls: 0,
  triangles: 0,
  particles: 0,
};

/* ------------------------------------------------------------------ *
 * QUALITY TIERS
 * ------------------------------------------------------------------ */

/**
 * `mobile` sits between `medium` and `low` and is not simply "a smaller
 * medium" — it is tuned for a different bottleneck. A phone's constraint is
 * fill rate and thermal headroom, not geometry, so it trades particle count
 * away (the cheapest thing to lose on a small display) in order to keep bloom
 * (the most expensive thing to lose visually, since this scene is almost
 * entirely emissive surfaces).
 */
export type Quality = 'high' | 'medium' | 'mobile' | 'low';

export interface QualityProfile {
  particles: number;
  dpr: [number, number];
  bloom: boolean;
  /** Rack modules rendered with full geometry detail. */
  rackDetail: number;
  neuralLinks: number;
}

/*
 * Tuned against measured cost, not guessed. Additive-blended points are
 * fill-rate bound: doubling particle count or DPR both roughly double the
 * pixels the fragment shader has to touch, and they compound multiplicatively.
 * A 4K/retina display clamped to 1.75 DPR was pushing ~3x the fragment work of
 * a 1x display for a field that reads as "full" well before that ceiling —
 * capping DPR is a far cheaper way to buy headroom than cutting particles,
 * since it doesn't thin out the geometry the visitor is actually looking at.
 */
export const qualityProfiles: Record<Quality, QualityProfile> = {
  high: { particles: 20000, dpr: [1, 1.5], bloom: true, rackDetail: 2, neuralLinks: 700 },
  medium: { particles: 10000, dpr: [1, 1.25], bloom: true, rackDetail: 1, neuralLinks: 360 },
  /*
   * Phones. Bloom stays on; the particle budget pays for it.
   *
   * This tier previously did not exist and a phone was served `low`, which
   * switches bloom off entirely. On a scene built almost wholly from emissive
   * surfaces — the conduits, the core, the lattice the machine dissolves into
   * — that is the single most expensive thing to lose: without it the machine
   * reads as flat lit plastic rather than as something powered, which is the
   * whole subject of the site.
   *
   * It is affordable now for a reason that was not true before: the canvas no
   * longer mounts during page load on a phone (see Experience.tsx), so the 3D
   * layer is not competing with the main thread for time-to-interactive. Its
   * cost is now purely runtime frame time, which is exactly what
   * `useAdaptiveQuality` measures — and if a device cannot hold the rate, it
   * steps down to `low` and loses bloom after all. Fixed cost was the thing
   * worth avoiding; a measured, self-correcting one is not.
   *
   * DPR is capped at 1.15 rather than 1: a phone reports device pixel ratios
   * of 3 or more, and fragment cost scales with the square of that cap, so it
   * is the cheapest lever available and the one the visitor is least able to
   * see behind a readability scrim.
   */
  mobile: { particles: 6500, dpr: [1, 1.15], bloom: true, rackDetail: 1, neuralLinks: 260 },
  low: { particles: 4000, dpr: [0.75, 1], bloom: false, rackDetail: 0, neuralLinks: 160 },
};

/* ------------------------------------------------------------------ *
 * DISCRETE STATE
 * ------------------------------------------------------------------ */

type PowerState = 'STANDBY' | 'ACTIVATING' | 'ONLINE';

/** Neutral scene-drive settings — also the target of RESET SYSTEM. */
const LAB_DEFAULTS = {
  speed: 1,
  light: 1,
} as const;

interface MachineStore {
  /** Boot gate. The experience is inert until this reaches ONLINE. */
  powerState: PowerState;
  phase: Phase;
  activeSection: string;

  activeProject: number;
  activeSubsystem: string | null;

  quality: Quality;
  reducedMotion: boolean;
  /** True when WebGL could not be initialised — DOM-only fallback. */
  webglFailed: boolean;

  audioEnabled: boolean;
  debug: boolean;
  paletteOpen: boolean;

  /**
   * True while a project has been deliberately opened and should be pushed
   * out through the monitor. Set only by an explicit selection (a click or an
   * arrow key), never by the scroll-position sync — otherwise simply
   * scrolling through the rack would fire the whole cinematic repeatedly.
   */
  projectEmerged: boolean;
  setProjectEmerged: (v: boolean) => void;

  /** Debug-mode override. Applied only while `debug` is true. */
  debugSpeed: number;

  /** Scene-drive parameters — conduit pulse speed and the light rig's gain. */
  lab: {
    speed: number;
    light: number;
  };

  beginActivation: () => void;
  completeActivation: () => void;
  setPhase: (p: Phase) => void;
  setActiveSection: (id: string) => void;
  setActiveProject: (i: number) => void;
  setActiveSubsystem: (id: string | null) => void;
  setQuality: (q: Quality) => void;
  setReducedMotion: (v: boolean) => void;
  setWebglFailed: (v: boolean) => void;
  toggleAudio: () => void;
  setDebug: (v: boolean) => void;
  setPaletteOpen: (v: boolean) => void;
  setDebugSpeed: (v: number) => void;
  resetSystem: () => void;
}

export const useMachine = create<MachineStore>((set, get) => ({
  powerState: 'STANDBY',
  phase: 'BOOT',
  activeSection: 'boot',

  activeProject: 0,
  activeSubsystem: null,

  quality: 'high',
  reducedMotion: false,
  webglFailed: false,

  audioEnabled: false,
  debug: false,
  paletteOpen: false,

  projectEmerged: false,
  setProjectEmerged: (v) => {
    if (get().projectEmerged === v) return;
    set({ projectEmerged: v });
  },

  debugSpeed: 1,

  lab: LAB_DEFAULTS,

  beginActivation: () => {
    if (get().powerState !== 'STANDBY') return;
    set({ powerState: 'ACTIVATING', phase: 'ACTIVATING' });
  },

  completeActivation: () => {
    if (get().powerState === 'ONLINE') return;
    set({ powerState: 'ONLINE', phase: 'CORE' });
  },

  setPhase: (p) => {
    if (get().phase === p) return;
    set({ phase: p });
  },

  setActiveSection: (id) => {
    if (get().activeSection === id) return;
    set({ activeSection: id });
  },

  setActiveProject: (i) => {
    if (get().activeProject === i) return;
    set({ activeProject: i });
  },

  setActiveSubsystem: (id) => set({ activeSubsystem: id }),
  setQuality: (q) => set({ quality: q }),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  setWebglFailed: (v) => set({ webglFailed: v }),
  toggleAudio: () => set({ audioEnabled: !get().audioEnabled }),
  setDebug: (v) => set({ debug: v }),
  setPaletteOpen: (v) => set({ paletteOpen: v }),
  setDebugSpeed: (v) => set({ debugSpeed: v }),

  /** Easter-egg RESET SYSTEM — returns every override to a known-good state. */
  resetSystem: () => {
    frame.pulse = 0;
    set({
      debug: false,
      debugSpeed: 1,
      lab: LAB_DEFAULTS,
      activeSubsystem: null,
      paletteOpen: false,
      // Retracts anything currently pushed out through the screen — "reset"
      // has to mean the scene is back at rest, not just the debug panel.
      projectEmerged: false,
    });
  },
}));

/** Convenience selector — the active quality profile. */
export const useQualityProfile = (): QualityProfile =>
  qualityProfiles[useMachine((s) => s.quality)];
