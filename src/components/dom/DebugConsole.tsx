'use client';

import { useEffect, useRef, useState } from 'react';
import { frame, useMachine, qualityProfiles, type Quality } from '@/store/machine';

/**
 * KERNEL PANIC / DEBUG OVERRIDE (§16)
 *
 * Activated by typing `sudo override` in the command palette, or the classic
 * key sequence. Shows genuine renderer telemetry — the FPS, draw calls, and
 * triangle counts are read from the live WebGL renderer, not simulated.
 *
 * Everything it exposes is sandbox-safe and reversible via RESET SYSTEM.
 */

const PANIC_LINES = [
  'kernel: [ 0.000000] BUG: unable to handle page request',
  'kernel: [ 0.000001] RIP: 0010:machine_render+0x1f/0x40',
  'kernel: [ 0.000002] Call Trace:',
  'kernel: [ 0.000003]   <TASK> compositor_flush()',
  'kernel: [ 0.000004]   <TASK> raf_dispatch()',
  'kernel: [ 0.000005] ---[ end trace 0000000000000000 ]---',
  'kernel: entering maintenance shell — override accepted',
];

export function DebugConsole() {
  const debug = useMachine((s) => s.debug);
  const setDebug = useMachine((s) => s.setDebug);
  const resetSystem = useMachine((s) => s.resetSystem);
  const quality = useMachine((s) => s.quality);
  const setQuality = useMachine((s) => s.setQuality);
  const debugSpeed = useMachine((s) => s.debugSpeed);
  const setDebugSpeed = useMachine((s) => s.setDebugSpeed);
  const lightGain = useMachine((s) => s.lightGain);
  const setLightGain = useMachine((s) => s.setLightGain);

  const [panicking, setPanicking] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [telemetry, setTelemetry] = useState({
    fps: 0,
    drawCalls: 0,
    triangles: 0,
    particles: 0,
    power: 0,
    morph: 0,
    t: 0,
  });

  const panelRef = useRef<HTMLDivElement>(null);

  /* ---- Panic animation on entry ---- */
  useEffect(() => {
    if (!debug) {
      setPanicking(false);
      setLines([]);
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // The panic cue is played by SoundBridge off the `debug` transition, so
    // both entry points (the command palette's "sudo override" and the `debug`
    // keyboard sequence) sound identical without either knowing about audio.

    if (reduced) {
      setLines(PANIC_LINES);
      return;
    }

    setPanicking(true);
    document.body.classList.add('panicking');

    const timers: number[] = [];
    PANIC_LINES.forEach((line, i) => {
      timers.push(
        window.setTimeout(() => setLines((prev) => [...prev, line]), 260 + i * 130),
      );
    });
    timers.push(
      window.setTimeout(() => {
        setPanicking(false);
        document.body.classList.remove('panicking');
      }, 900),
    );

    return () => {
      timers.forEach(clearTimeout);
      document.body.classList.remove('panicking');
    };
  }, [debug]);

  /* ---- Real telemetry poll ---- */
  useEffect(() => {
    if (!debug) return;
    const id = window.setInterval(() => {
      setTelemetry({
        fps: frame.fps,
        drawCalls: frame.drawCalls,
        triangles: frame.triangles,
        particles: frame.particles,
        power: frame.power,
        morph: frame.morph,
        t: frame.t,
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [debug]);

  /* ---- Konami-style fallback entry: type "debug" anywhere ---- */
  useEffect(() => {
    const buffer: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Never capture while the visitor is typing into a real field.
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key.length !== 1) return;

      buffer.push(e.key.toLowerCase());
      if (buffer.length > 5) buffer.shift();
      if (buffer.join('') === 'debug') {
        buffer.length = 0;
        useMachine.getState().setDebug(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ---- Escape closes ---- */
  useEffect(() => {
    if (!debug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDebug(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [debug, setDebug]);

  if (!debug) return null;

  const fpsColor =
    telemetry.fps >= 50
      ? 'var(--color-cyan)'
      : telemetry.fps >= 30
        ? 'var(--color-amber)'
        : 'var(--color-alert)';

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="Debug console"
      className="no-print scanlines fixed bottom-0 right-0 z-[90] m-3 w-[min(92vw,380px)] border border-[color:var(--color-alert)] bg-[rgba(9,10,15,0.96)] lg:m-4"
      style={{ boxShadow: '0 0 44px -12px rgba(255,59,48,0.55)' }}
    >
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between border-b border-[#24272f] px-4 py-2.5">
        <span className="t-label" style={{ color: 'var(--color-alert)' }}>
          ⚠ Kernel Panic — Debug Override
        </span>
        <button
          type="button"
          onClick={() => setDebug(false)}
          className="t-label px-1 text-[color:var(--color-ash)] hover:text-[color:var(--color-ceramic)]"
          aria-label="Close debug console"
        >
          ✕
        </button>
      </div>

      <div className="max-h-[62vh] overflow-y-auto p-4">
        {/* ---- Panic trace ---- */}
        {lines.length > 0 && (
          <pre className="m-0 mb-4 overflow-x-auto whitespace-pre-wrap font-[family-name:var(--font-code)] text-[0.62rem] leading-relaxed text-[color:var(--color-alert)]">
            {lines.join('\n')}
            {panicking && <span className="caret">▌</span>}
          </pre>
        )}

        {/* ---- Live telemetry ---- */}
        <p className="t-label m-0">Renderer — live</p>
        <dl className="m-0 mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
          {[
            ['FPS', String(telemetry.fps), fpsColor],
            ['Draw calls', String(telemetry.drawCalls), 'var(--color-ceramic)'],
            ['Triangles', telemetry.triangles.toLocaleString(), 'var(--color-ceramic)'],
            ['Particles', telemetry.particles.toLocaleString(), 'var(--color-ceramic)'],
            ['Power', telemetry.power.toFixed(3), 'var(--color-amber)'],
            ['Morph', telemetry.morph.toFixed(3), 'var(--color-cyan)'],
            ['Scroll t', telemetry.t.toFixed(3), 'var(--color-ceramic)'],
            ['Quality', quality, 'var(--color-ceramic)'],
          ].map(([k, v, color]) => (
            <div key={k} className="flex justify-between gap-2 border-b border-[#1a1c23] pb-1">
              <dt className="t-label m-0">{k}</dt>
              <dd
                className="m-0 font-[family-name:var(--font-code)] text-[0.68rem] tabular-nums"
                style={{ color }}
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>

        {/* ---- Overrides ---- */}
        <p className="t-label mt-5">Overrides</p>

        <div className="mt-2">
          <label htmlFor="dbg-quality" className="t-label">
            Quality tier
          </label>
          <select
            id="dbg-quality"
            value={quality}
            onChange={(e) => setQuality(e.target.value as Quality)}
            className="field mt-1.5 py-2 text-xs"
          >
            {(Object.keys(qualityProfiles) as Quality[]).map((q) => (
              <option key={q} value={q}>
                {q} — {qualityProfiles[q].particles.toLocaleString()} particles
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3">
          <label htmlFor="dbg-speed" className="t-label">
            Simulation speed — {debugSpeed.toFixed(2)}×
          </label>
          <input
            id="dbg-speed"
            type="range"
            min={0}
            max={4}
            step={0.05}
            value={debugSpeed}
            onChange={(e) => setDebugSpeed(Number(e.target.value))}
            className="mt-1.5 w-full accent-[color:var(--color-alert)]"
          />
        </div>

        {/*
          Light rig gain.

          This exists because the store already had the value and the renderer
          already read it, and nothing had ever written it — so the whole
          lighting rig ran at a hard-coded 1 behind a field that pretended to
          be adjustable. Two ways out: delete the value and inline the
          constant, or give it the control it was clearly built for. The
          control wins, because this panel's entire premise is that the
          numbers on it are real and the switches on it do something, and
          `Lights()` in Scene.tsx multiplies the key, fill, rim and core lamps
          by it together — one drag visibly relights the machine.

          Ceiling of 2, not 4: past roughly 2.2 the emissive surfaces clip
          against ACES filmic tone mapping and the metal goes flat white,
          which is not a state worth being able to reach. 0 is left reachable
          on purpose — a fully dark rig is how you see what the bloom and the
          self-illuminated particle field are contributing on their own.
        */}
        <div className="mt-3">
          <label htmlFor="dbg-light" className="t-label">
            Light rig gain — {lightGain.toFixed(2)}×
          </label>
          <input
            id="dbg-light"
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={lightGain}
            onChange={(e) => setLightGain(Number(e.target.value))}
            className="mt-1.5 w-full accent-[color:var(--color-alert)]"
          />
        </div>

        {/* ---- Recovery ---- */}
        <button
          type="button"
          onClick={resetSystem}
          className="btn mt-5 w-full justify-center"
          style={{ borderColor: 'var(--color-alert)', color: 'var(--color-alert)' }}
        >
          Reset System
        </button>

        <p className="t-label mt-3 normal-case tracking-normal">
          Esc closes. Reset restores every parameter and exits maintenance mode.
        </p>
      </div>
    </div>
  );
}
