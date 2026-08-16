'use client';

import { useEffect } from 'react';
import { useMachine } from '@/store/machine';
import { audio } from '@/lib/audio/engine';
import { sections } from '@/lib/data/sections';

/**
 * THE SCORE — one place that decides what the site sounds like.
 *
 * Every cue is derived here, from state, rather than being fired by whichever
 * component happened to cause the change. That is the difference between a site
 * with sounds on some of its controls and a site that sounds like one machine:
 *
 *   - A cue fires on the *state transition*, so it plays no matter which path
 *     caused it. Powering up by clicking the button and powering up by
 *     scrolling are the same event to a visitor, and now sound the same.
 *   - Nothing can be silently forgotten. A new control gets interface feedback
 *     from the delegated listeners below without touching this file at all.
 *   - Every cue is in one place to balance against the others, which is the
 *     only way a mix stays coherent.
 *
 * Renders nothing.
 */

/** Anything a visitor can act on. Delegation means new controls are covered
 *  automatically — opt out with `data-sound="off"`. */
const INTERACTIVE =
  'a[href], button, [role="button"], [role="option"], [role="tab"], summary, input, select, textarea, [data-sound]';

const STORAGE_KEY = 'bakul:sound';

function isSilenced(el: Element): boolean {
  return (
    el.getAttribute('data-sound') === 'off' ||
    el.hasAttribute('disabled') ||
    el.getAttribute('aria-disabled') === 'true'
  );
}

export function SoundBridge() {
  const audioEnabled = useMachine((s) => s.audioEnabled);
  const reducedMotion = useMachine((s) => s.reducedMotion);

  /* Keep the engine in step with the store, and tear it down on unmount. */
  useEffect(() => {
    audio.setEnabled(audioEnabled);
    try {
      window.localStorage.setItem(STORAGE_KEY, audioEnabled ? '1' : '0');
    } catch {
      /* private mode / storage disabled — the preference simply won't persist */
    }
  }, [audioEnabled]);

  useEffect(() => () => audio.dispose(), []);

  useEffect(() => {
    audio.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  /*
   * Restore a returning visitor's choice.
   *
   * The preference can be restored immediately, but the AudioContext cannot:
   * every browser requires a real user gesture before audio may start, and a
   * page load is not one. So the toggle is put back into its remembered state
   * and the context is resumed on the first interaction of any kind — which
   * means a returning visitor gets their sound back without being asked twice,
   * and a browser that would have blocked it still never gets violated.
   */
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (stored !== '1') return;

    useMachine.setState({ audioEnabled: true });

    const resume = () => {
      audio.setEnabled(true);
      for (const ev of ['pointerdown', 'keydown', 'touchstart']) {
        window.removeEventListener(ev, resume);
      }
    };
    for (const ev of ['pointerdown', 'keydown', 'touchstart']) {
      window.addEventListener(ev, resume, { once: false, passive: true });
    }
    return () => {
      for (const ev of ['pointerdown', 'keydown', 'touchstart']) {
        window.removeEventListener(ev, resume);
      }
    };
  }, []);

  /* ---------------- state → sound ---------------- */

  useEffect(() => {
    /*
     * Subscribed to the vanilla store rather than read through hooks: these
     * cues care about transitions, and a subscription gives both the new and
     * previous state without re-rendering anything.
     */
    return useMachine.subscribe((s, prev) => {
      if (!audio.isEnabled()) return;

      /* Boot. Fires for the button and for scroll-to-activate alike. */
      if (s.powerState !== prev.powerState) {
        if (s.powerState === 'ACTIVATING') audio.play('power');
        else if (s.powerState === 'ONLINE') audio.play('online');
      }

      /* Section changes re-voice the pad as well as announcing themselves, so
         the bed develops across a visit instead of holding one chord. */
      if (s.activeSection !== prev.activeSection && s.powerState === 'ONLINE') {
        audio.play('navigate');
        const i = sections.findIndex((sec) => sec.id === s.activeSection);
        if (i >= 0) audio.setTone(i);
      }

      /* Mechanisms responding. */
      if (s.activeProject !== prev.activeProject) audio.play('lock');
      if (s.activeSubsystem !== prev.activeSubsystem && s.activeSubsystem) audio.play('lock');

      /* A project breaking out through the monitor is the site's biggest
         single gesture, so it gets the brightest voice. */
      if (s.projectEmerged !== prev.projectEmerged && s.projectEmerged) audio.play('activate');

      if (s.paletteOpen !== prev.paletteOpen) audio.play(s.paletteOpen ? 'open' : 'close');

      /* Kernel panic, from either entry point. */
      if (s.debug !== prev.debug && s.debug) audio.play('glitch');
    });
  }, []);

  /* ---------------- interface feedback ---------------- */

  useEffect(() => {
    /*
     * Delegated at the document, so every control on the site — including ones
     * added later — has consistent feedback without a single call site.
     *
     * Hover is gated behind a real hover-capable pointer: on touch,
     * `pointerover` fires immediately before `pointerdown`, so without this
     * every tap would play two sounds a few milliseconds apart, which is heard
     * as a flam rather than as two cues.
     */
    const canHover =
      typeof window.matchMedia === 'function' && window.matchMedia('(hover: hover)').matches;

    let lastHovered: Element | null = null;

    const onOver = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const el = target.closest(INTERACTIVE);
      if (!el || isSilenced(el)) return;
      // Moving between a control's own children re-fires pointerover with a
      // different target; only a genuinely different control should sound.
      if (el === lastHovered) return;
      lastHovered = el;
      audio.play('hover');
    };

    const onOut = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (lastHovered && target.closest(INTERACTIVE) === lastHovered) lastHovered = null;
    };

    const onDown = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const el = target.closest(INTERACTIVE);
      if (!el || isSilenced(el)) return;
      audio.play('press');
    };

    /* Keyboard activation deserves the same confirmation a click gets. */
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.repeat) return;
      const el = document.activeElement;
      if (!el || !el.matches(INTERACTIVE) || isSilenced(el)) return;
      audio.play('press');
    };

    if (canHover) {
      document.addEventListener('pointerover', onOver, { passive: true, capture: true });
      document.addEventListener('pointerout', onOut, { passive: true, capture: true });
    }
    document.addEventListener('pointerdown', onDown, { passive: true, capture: true });
    document.addEventListener('keydown', onKey, { passive: true, capture: true });

    return () => {
      document.removeEventListener('pointerover', onOver, true);
      document.removeEventListener('pointerout', onOut, true);
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, []);

  /* ---------------- page visibility ---------------- */

  useEffect(() => {
    // A backgrounded tab that is still humming is the most-complained-about
    // behaviour any audio-enabled site has, and the visitor often cannot even
    // find which tab to mute.
    //
    // Keyed to visibility only, deliberately — window `blur` also fires for
    // devtools and for another window taking focus, neither of which means the
    // visitor has left the page.
    const sync = () => audio.setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  return null;
}
