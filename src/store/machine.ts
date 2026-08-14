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
  /** Pointer in normalised device coordinates, [-1,1]. */
  pointer: { x: number; y: number };
  /** Activation wave triggered by clicking the neural field. */
  pulse: number;
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
  pointer: { x: 0, y: 0 },
  pulse: 0,
  fps: 0,
  drawCalls: 0,
  triangles: 0,
  particles: 0,
};

/* ------------------------------------------------------------------ *
 * QUALITY TIERS
 * ------------------------------------------------------------------ */

export type Quality = 'high' | 'medium' | 'low';

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
  low: { particles: 4000, dpr: [0.75, 1], bloom: false, rackDetail: 0, neuralLinks: 160 },
};

/* ------------------------------------------------------------------ *
 * DISCRETE STATE
 * ------------------------------------------------------------------ */

export type PowerState = 'STANDBY' | 'ACTIVATING' | 'ONLINE';

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
    });
  },
}));

/** Convenience selector — the active quality profile. */
export const useQualityProfile = (): QualityProfile =>
  qualityProfiles[useMachine((s) => s.quality)];
