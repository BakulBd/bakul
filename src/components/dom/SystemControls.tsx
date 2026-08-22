'use client';

import { useEffect, useRef, useState } from 'react';
import { Command, Volume2, VolumeX, Gauge } from 'lucide-react';
import { useMachine } from '@/store/machine';
import { audio } from '@/lib/audio/engine';

/**
 * Persistent system controls, grouped into a single floating dock.
 *
 * A row of separate boxy chips reads as a diagnostics strip; one rounded pill
 * housing icon controls reads as a product's command bar (the pattern used by
 * Arc, Linear, Raycast). Same functionality, different vocabulary.
 *
 * Audio is muted by default and only ever starts from an explicit click, which
 * respects both the visitor's attention and browser autoplay policy (§20).
 * The engine's lifecycle lives in SoundBridge — this component is the control
 * surface for it, nothing more.
 */

const VOLUME_KEY = 'bakul:volume';

export function SystemControls() {
  const audioEnabled = useMachine((s) => s.audioEnabled);
  const toggleAudio = useMachine((s) => s.toggleAudio);
  const setPaletteOpen = useMachine((s) => s.setPaletteOpen);
  const quality = useMachine((s) => s.quality);
  const reducedMotion = useMachine((s) => s.reducedMotion);

  const [volume, setVolume] = useState(0.7);
  const [showVolume, setShowVolume] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);

  /* Restore the saved level before anything can be heard at the wrong one. */
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VOLUME_KEY);
      if (stored !== null) {
        const v = Number(stored);
        if (Number.isFinite(v) && v >= 0 && v <= 1) {
          setVolume(v);
          audio.setVolume(v);
        }
      }
    } catch {
      /* storage unavailable — the default level is fine */
    }
  }, []);

  const changeVolume = (v: number) => {
    setVolume(v);
    audio.setVolume(v);
    try {
      window.localStorage.setItem(VOLUME_KEY, String(v));
    } catch {
      /* preference simply won't persist */
    }
  };

  /*
   * WebKit (every iOS browser, since Apple mandates it under the hood) only
   * lets an AudioContext start/resume when that call happens synchronously
   * inside a real user-gesture handler — a React effect reacting to the
   * resulting state change runs one tick later, after the gesture's own call
   * stack has already unwound, which WebKit treats as no gesture at all and
   * leaves the context silently suspended. SoundBridge's effect still runs and
   * keeps the engine correct for every other path (command palette, restore);
   * this direct call is only what makes the very first enable land on iOS.
   */
  const handleToggleAudio = () => {
    const next = !audioEnabled;
    audio.setEnabled(next);
    toggleAudio();
    // Reveal the level control the moment sound is turned on, so "it's too
    // loud" has an answer already on screen rather than being a reason to
    // turn it straight back off.
    if (next) revealVolume(2600);
  };

  const revealVolume = (ms: number) => {
    window.clearTimeout(hideTimer.current);
    setShowVolume(true);
    hideTimer.current = window.setTimeout(() => setShowVolume(false), ms);
  };

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  return (
    <div
      /*
       * A named landmark, not a bare div.
       *
       * This dock is `position: fixed` outside `<main>`, which is correct — it
       * is chrome, not content — but it left three controls sitting in no
       * landmark at all. For a screen-reader user navigating by landmark (the
       * primary way of moving around a page this long) the quality readout, the
       * command palette and the mute button were simply not on the map, and axe
       * flags it as `region`: "some page content is not contained by landmarks".
       *
       * `role="region"` with a name is the landmark; `aria-label` is what makes
       * it one — an unnamed region is not exposed as a landmark at all.
       *
       * `role="toolbar"` was the other candidate and is arguably the more
       * precise description of a row of buttons. It is not a landmark, so it
       * would have described the widget accurately and left it exactly as
       * unreachable as before. A toolbar also promises roving-tabindex arrow-key
       * navigation between its controls, which this dock does not implement —
       * claiming the role without the behaviour is worse than not claiming it.
       */
      role="region"
      aria-label="System controls"
      className="no-print fixed right-3 top-3 z-50 flex items-center gap-1 rounded-full border p-1 lg:right-5 lg:top-5"
      style={{
        borderColor: 'rgba(130,138,155,0.2)',
        background: 'rgba(13,15,22,0.72)',
        backdropFilter: 'blur(16px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.15)',
        boxShadow: '0 16px 40px -24px rgba(0,0,0,0.8)',
        // Clears the notch / status bar on phones that report an inset.
        top: 'max(0.75rem, env(safe-area-inset-top))',
        right: 'max(0.75rem, env(safe-area-inset-right))',
      }}
      onMouseLeave={() => setShowVolume(false)}
    >
      {/* Quality readout — honest about what the visitor is being served. */}
      <span
        className="t-label hidden items-center gap-1.5 px-3 py-1.5 sm:inline-flex"
        title={
          reducedMotion
            ? 'Reduced motion is enabled — animation is minimised'
            : `Rendering at ${quality} quality, selected from your device capability`
        }
      >
        <Gauge aria-hidden="true" className="h-3.5 w-3.5" />
        {reducedMotion ? 'reduced' : quality}
      </span>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--color-ceramic)] transition-colors hover:bg-white/[0.06] hover:text-[color:var(--color-cyan)]"
        aria-label="Open quick navigation"
        title="Quick navigation (⌘K)"
      >
        <Command aria-hidden="true" className="h-4 w-4" />
      </button>

      {/*
        Level control. Collapsed to nothing until sound is on and the visitor is
        actually at the dock — a slider permanently occupying the bar would be
        chrome for a feature that is off by default.
      */}
      <div
        className="grid transition-[grid-template-columns,opacity] duration-300 ease-out"
        style={{
          gridTemplateColumns: audioEnabled && showVolume ? '1fr' : '0fr',
          opacity: audioEnabled && showVolume ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            onFocus={() => revealVolume(9000)}
            aria-label="Sound level"
            tabIndex={audioEnabled ? 0 : -1}
            data-sound="off"
            className="volume-slider mx-2 w-20 align-middle"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleToggleAudio}
        onMouseEnter={() => audioEnabled && revealVolume(4000)}
        onFocus={() => audioEnabled && revealVolume(9000)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--color-ceramic)] transition-colors hover:bg-white/[0.06] hover:text-[color:var(--color-cyan)]"
        aria-pressed={audioEnabled}
        aria-label={audioEnabled ? 'Turn sound off' : 'Turn sound on'}
        title={audioEnabled ? 'Sound on' : 'Sound off'}
      >
        {audioEnabled ? (
          <Volume2 aria-hidden="true" className="h-4 w-4" />
        ) : (
          <VolumeX aria-hidden="true" className="h-4 w-4" />
        )}
        <span
          className={`led absolute right-1 top-1 ${audioEnabled ? 'led-on' : 'led-idle'}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
