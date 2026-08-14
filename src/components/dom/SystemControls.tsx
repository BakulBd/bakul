'use client';

import { useEffect } from 'react';
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
 */
export function SystemControls() {
  const audioEnabled = useMachine((s) => s.audioEnabled);
  const toggleAudio = useMachine((s) => s.toggleAudio);
  const setPaletteOpen = useMachine((s) => s.setPaletteOpen);
  const quality = useMachine((s) => s.quality);
  const reducedMotion = useMachine((s) => s.reducedMotion);

  /* Keep the engine in step with the store, and tear it down on unmount. */
  useEffect(() => {
    audio.setEnabled(audioEnabled);
  }, [audioEnabled]);

  useEffect(() => () => audio.dispose(), []);

  /*
   * WebKit (every iOS browser, since Apple mandates it under the hood) only
   * lets an AudioContext start/resume when that call happens synchronously
   * inside a real user-gesture handler — a React effect reacting to the
   * resulting state change runs one tick later, after the gesture's own call
   * stack has already unwound, which WebKit treats as no gesture at all and
   * leaves the context silently suspended. The effect above still runs and
   * keeps the engine correct for every other path (command palette, resets);
   * this direct call is only what makes the very first enable land on iOS.
   */
  const handleToggleAudio = () => {
    audio.setEnabled(!audioEnabled);
    toggleAudio();
  };

  return (
    <div
      className="no-print fixed right-3 top-3 z-50 flex items-center gap-1 rounded-full border p-1 lg:right-5 lg:top-5"
      style={{
        borderColor: 'rgba(130,138,155,0.2)',
        background: 'rgba(13,15,22,0.72)',
        backdropFilter: 'blur(16px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.15)',
        boxShadow: '0 16px 40px -24px rgba(0,0,0,0.8)',
      }}
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

      <button
        type="button"
        onClick={handleToggleAudio}
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
