'use client';

import { useIsCompact } from '@/hooks/useViewport';

/**
 * A whisper of film grain over the whole page.
 *
 * Procedural (SVG `feTurbulence`, no image download) and extremely subtle —
 * this is a cinematic-texture cue, not a visible effect. It's what keeps flat
 * dark panels from reading as a flat PNG mockup instead of a rendered scene.
 * Pure CSS/SVG: zero WebGL cost, so it costs nothing on top of the canvas.
 *
 * Animation is a slow background-position drift; the global reduced-motion
 * rule in globals.css already zeroes all animation durations, so this freezes
 * to a single still frame there automatically — no special-casing needed here.
 */
const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export function FilmGrain() {
  /*
   * Dropped on compact viewports.
   *
   * `mix-blend-mode: overlay` on a fixed, full-viewport, *animating* layer
   * forces the compositor to re-blend the entire screen every frame against
   * everything beneath it — the WebGL canvas included. On a desktop GPU that
   * is free; on a phone it is one of the most expensive things on the page,
   * spent on a 5%-opacity texture that a high-density display resolves as
   * nothing anyway. See globals.css for the rest of the compact-viewport
   * cost reductions.
   */
  const compact = useIsCompact();
  if (compact) return null;

  return (
    <div
      aria-hidden="true"
      className="no-print pointer-events-none fixed inset-0 z-[7] grain-drift"
      style={{
        backgroundImage: `url("${GRAIN_SVG}")`,
        backgroundSize: '180px 180px',
        opacity: 0.05,
        mixBlendMode: 'overlay',
      }}
    />
  );
}
