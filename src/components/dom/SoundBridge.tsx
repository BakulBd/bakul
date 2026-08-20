'use client';

import { useEffect } from 'react';
import { frame, useMachine } from '@/store/machine';
import { audio } from '@/lib/audio/engine';
import { haptic, silenceHaptics } from '@/lib/haptics';
import { sections, timeline } from '@/lib/data/sections';
import { BOOT_STAGES } from '@/components/machine/lib/blueprint';

/**
 * THE SCORE — one place that decides what the site sounds like, and what it
 * feels like on a device that can be felt.
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
      /*
       * Haptics are NOT gated on audio being enabled.
       *
       * That gate would defeat the entire purpose: sound is muted by default,
       * and the reason a phone needs a haptic channel at all is that a muted
       * phone with no hover state currently receives no response to operating
       * the machine. `haptic()` carries its own support and reduced-motion
       * gates, so calling it unconditionally is safe — on a desktop and on iOS
       * it does nothing at all.
       *
       * Only the mechanical events get a pulse. `hover`, `navigate` and
       * `open`/`close` deliberately do not: they fire while scrolling and while
       * moving through chrome, and a phone that buzzes continuously through a
       * scroll is worse than one that never buzzes.
       */
      const soundOn = audio.isEnabled();

      /* Boot. Fires for the button and for scroll-to-activate alike. */
      if (s.powerState !== prev.powerState) {
        if (s.powerState === 'ACTIVATING') {
          if (soundOn) audio.play('power');
        } else if (s.powerState === 'ONLINE') {
          if (soundOn) audio.play('online');
          // The machine finishing its boot is the first thing worth feeling.
          haptic('online');
        }
      }

      /* Section changes re-voice the pad as well as announcing themselves, so
         the bed develops across a visit instead of holding one chord. */
      if (soundOn && s.activeSection !== prev.activeSection && s.powerState === 'ONLINE') {
        audio.play('navigate');
        const i = sections.findIndex((sec) => sec.id === s.activeSection);
        if (i >= 0) audio.setTone(i);
      }

      /* Mechanisms responding — a bay locking into the rack, a subsystem
         engaging, a milestone passing the reader head. One voice for all
         three, because to a visitor they are the same class of event: a part
         of the machine answering a selection. */
      if (
        s.activeProject !== prev.activeProject ||
        (s.activeSubsystem !== prev.activeSubsystem && s.activeSubsystem) ||
        s.activeMilestone !== prev.activeMilestone
      ) {
        if (soundOn) audio.play('lock');
        haptic('lock');
      }

      /* A project breaking out through the monitor is the site's biggest
         single gesture, so it gets the brightest voice. */
      if (s.projectEmerged !== prev.projectEmerged && s.projectEmerged) {
        if (soundOn) audio.play('activate');
        haptic('activate');
      }

      if (soundOn && s.paletteOpen !== prev.paletteOpen) {
        audio.play(s.paletteOpen ? 'open' : 'close');
      }

      /* Kernel panic, from either entry point. */
      if (s.debug !== prev.debug && s.debug) {
        if (soundOn) audio.play('glitch');
        haptic('error');
      }
    });
  }, []);

  /* ---------------- continuous score ---------------- */

  /*
   * THE BED, AND THE CUES THAT RIDE THE SCROLL.
   *
   * These three used to live in the 3D render loop (`Scene.tsx`'s Driver), and
   * that was a real architectural fault rather than a tidiness question: the
   * canvas is *optional by design* everywhere else in this codebase. It is
   * deferred until power-on on a phone, its `frameloop` is set to 'never' when
   * the tab is hidden, and it is never mounted at all when WebGL fails or the
   * boundary catches. Every one of those states left the audio engine with no
   * driver at all:
   *
   *   - Before the canvas mounted on mobile, `setLoad` was never called, so
   *     the pad's filter sat at its resting cutoff no matter how hard the
   *     visitor scrolled. The bed was deaf to the page.
   *   - With `webglFailed`, it stayed deaf permanently — the content still
   *     scrolled, the sound simply stopped answering it.
   *
   * Sound is a sibling of the visual layer, not a passenger in it. This loop
   * owns the score, reads the same `frame` singleton the renderer reads, and
   * behaves identically with or without a canvas.
   *
   * It runs only while sound is on: with audio muted there is nothing for it
   * to drive, and an idle rAF on every visit is exactly the kind of cost this
   * project measures rather than assumes.
   */
  useEffect(() => {
    if (!audioEnabled) return;

    let raf = 0;
    /** Boot thresholds already crossed, so each relay clicks exactly once. */
    const relayFired = new Set<number>();
    let morphWasBelow = true;

    const tick = () => {
      raf = requestAnimationFrame(tick);

      /*
       * Scroll energy opens the pad's filter and lifts its air. `frame.velocity`
       * is written by the scroll engine, which is pure DOM — so this is live
       * from the first scroll, long before any canvas exists.
       */
      audio.setLoad(frame.velocity);

      const { powerState, webglFailed } = useMachine.getState();

      /*
       * A relay clicks as each subsystem comes online, read from the same
       * BOOT_STAGES list the POST screen prints its rows from and the 3D
       * subsystems illuminate on — so the click, the light and the "OK" land
       * on one frame instead of a beat apart.
       *
       * Skipped entirely without WebGL: there is no power ramp to cross those
       * thresholds (the boot completes immediately instead), so firing them
       * would mean eight relay clicks in a single frame for a boot the visitor
       * never saw.
       */
      if (!webglFailed && powerState !== 'STANDBY' && !reducedMotion) {
        for (const stage of BOOT_STAGES) {
          if (frame.power >= stage.at && !relayFired.has(stage.at)) {
            relayFired.add(stage.at);
            audio.play('tick');
          }
        }
      }

      /*
       * The signature transformation gets its own long filter sweep.
       *
       * Derived from the scroll position against the measured morph window
       * rather than read from `frame.morph` — that value is computed by the
       * renderer, so depending on it would put this cue straight back inside
       * the canvas's lifetime. The window itself is measured DOM geometry, so
       * the sound fires at exactly the scroll position the machine comes apart
       * at, canvas or no canvas.
       *
       * Fired once, on the way in only: scrolling back up must not retrigger a
       * two-and-a-half-second sweep, and scrubbing across the threshold would
       * otherwise stack them.
       */
      const span = timeline.morphEnd - timeline.morphStart;
      const morph = span > 0 ? (frame.t - timeline.morphStart) / span : 0;
      if (!reducedMotion) {
        if (morphWasBelow && morph >= 0.02) {
          morphWasBelow = false;
          audio.play('morph');
        } else if (morph < 0.01) {
          // Re-arm only after leaving the window properly, so a jitter either
          // side of the threshold cannot fire it twice.
          morphWasBelow = true;
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioEnabled, reducedMotion]);

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
      /*
       * The tap itself, felt. Outside the audio gate for the same reason the
       * state cues above are: this is the response a muted phone would
       * otherwise never get. Only on a device without hover — a mouse already
       * has the cursor, the hover cue and the panel lift to confirm a target,
       * and a buzzing desktop would be a novelty rather than information.
       */
      if (!canHover) haptic('press');
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
    const sync = () => {
      const visible = document.visibilityState === 'visible';
      audio.setPageVisible(visible);
      // A pattern still running as the visitor switches apps would buzz a
      // pocket for a page that is no longer on screen — the tactile version of
      // the background-audio problem above, and less forgivable because there
      // is no tab to go and mute.
      if (!visible) silenceHaptics();
    };
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  return null;
}
