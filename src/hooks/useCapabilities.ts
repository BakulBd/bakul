'use client';

import { useEffect } from 'react';
import { useMachine, type Quality } from '@/store/machine';

/**
 * Detects device capability once on mount and picks a starting quality tier.
 * Deliberately conservative: we would rather run a simplified scene smoothly
 * than a full scene at 20fps. `useAdaptiveQuality` below can still downgrade
 * later based on measured frame time.
 */
function detectQuality(): { quality: Quality; webglFailed: boolean } {
  if (typeof window === 'undefined') return { quality: 'medium', webglFailed: false };

  // Probe for a real WebGL2 context before committing to a 3D experience.
  let gl: WebGL2RenderingContext | null = null;
  let canvas: HTMLCanvasElement | null = null;
  try {
    canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
  } catch {
    gl = null;
  }

  if (!gl) return { quality: 'low', webglFailed: true };

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.innerWidth < 900;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  // Renderer string is a strong signal for software/low-power GPUs.
  let renderer = '';
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '');
  } catch {
    /* renderer info is optional; absence is not an error */
  }

  // Release the probe context immediately — browsers cap simultaneous contexts.
  try {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    /* non-fatal */
  }
  canvas = null;

  const software = /swiftshader|llvmpipe|software|microsoft basic/i.test(renderer);

  /*
   * An explicit request to spend less. Data Saver is not only about bytes —
   * every browser that exposes it treats it as "this visitor is on a
   * constrained device or connection", and honouring it costs one line.
   */
  const saveData = Boolean(
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
  );

  let quality: Quality = 'high';
  if (software || saveData || cores <= 2 || memory <= 2) quality = 'low';
  /*
   * A phone gets its own tier, not `medium` and not `low`.
   *
   * `medium` keeps 10,000 additive particles alive, which is fill-rate bound
   * and more than a small display can show. `low` switches bloom off, which
   * on a scene made of emissive surfaces costs more than it saves. The
   * `mobile` profile splits the difference deliberately — see the comment on
   * it in store/machine.ts.
   *
   * A coarse pointer on a wide screen (a touchscreen laptop, a TV) is not a
   * phone and keeps medium — hence both conditions, not either.
   */
  else if (coarse && narrow) quality = 'mobile';
  else if (coarse || narrow || cores <= 4 || memory <= 4) quality = 'medium';

  return { quality, webglFailed: false };
}

export function useCapabilities() {
  const setQuality = useMachine((s) => s.setQuality);
  const setWebglFailed = useMachine((s) => s.setWebglFailed);
  const setReducedMotion = useMachine((s) => s.setReducedMotion);

  useEffect(() => {
    const { quality, webglFailed } = detectQuality();
    setQuality(quality);
    setWebglFailed(webglFailed);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [setQuality, setWebglFailed, setReducedMotion]);
}

/**
 * The next tier down from each.
 *
 * Written as a table rather than a conditional so adding a tier cannot
 * silently skip a step — the previous `quality === 'high' ? 'medium' : 'low'`
 * would have sent a struggling phone from `mobile` straight past every
 * intermediate setting to the floor. `low` maps to itself, which is what
 * makes the guard below terminate.
 */
const DOWNGRADE: Record<Quality, Quality> = {
  high: 'medium',
  medium: 'mobile',
  mobile: 'low',
  low: 'low',
};

/**
 * Watches real frame timing and steps quality down if the machine cannot hold
 * a usable rate. One-way: we never step back up, because oscillating between
 * tiers is more distracting than running one tier lower.
 */
export function useAdaptiveQuality() {
  const quality = useMachine((s) => s.quality);
  const setQuality = useMachine((s) => s.setQuality);

  useEffect(() => {
    if (quality === 'low') return;

    let raf = 0;
    let frames = 0;
    let slowWindows = 0;
    let windowStart = performance.now();

    const tick = () => {
      frames++;
      const now = performance.now();
      const elapsed = now - windowStart;

      // Evaluate in ~1s windows so a single stutter cannot trigger a downgrade.
      if (elapsed >= 1000) {
        const fps = (frames * 1000) / elapsed;
        frames = 0;
        windowStart = now;

        if (fps < 32) {
          slowWindows++;
          // Three consecutive slow seconds is a real problem, not a hiccup.
          if (slowWindows >= 3) {
            setQuality(DOWNGRADE[quality]);
            return;
          }
        } else {
          slowWindows = 0;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [quality, setQuality]);
}
