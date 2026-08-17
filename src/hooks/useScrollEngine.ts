'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { frame, useMachine } from '@/store/machine';
import { measureStations, sectionAt, sections, toneAt } from '@/lib/data/sections';

/**
 * Native scroll, smoothed — never hijacked.
 *
 * Lenis damps the wheel so camera motion reads as cinematic, but the page is
 * still a real scrollable document: the scrollbar works, keyboard paging works,
 * anchor links work, and Find-in-page works. Under prefers-reduced-motion we
 * skip Lenis entirely and read native scroll directly.
 */
export function useScrollEngine() {
  const reducedMotion = useMachine((s) => s.reducedMotion);
  const setActiveSection = useMachine((s) => s.setActiveSection);
  const setPhase = useMachine((s) => s.setPhase);
  const powerState = useMachine((s) => s.powerState);
  const beginActivation = useMachine((s) => s.beginActivation);

  useEffect(() => {
    let lenis: Lenis | null = null;
    let raf = 0;
    let lastT = 0;
    let lastTime = performance.now();

    // Cached once — the section elements don't remount while this effect is alive.
    const sectionEls = sections.map((s) => document.getElementById(`section-${s.id}`));

    /*
     * Camera settle points are measured from real geometry, not assumed from
     * the section registry's screen-height figures — see measureStations.
     *
     * Re-measured whenever the document's own size changes, which covers far
     * more than a window resize: a phone's URL bar collapsing, an orientation
     * flip, the boot sequence swapping the standby panel for the reveal, a
     * subsystem accordion opening, and web fonts landing and rewrapping every
     * paragraph on the page. Each of those moves every section below it, and
     * a `resize` listener alone sees none of them.
     */
    measureStations();
    const ro = new ResizeObserver(() => measureStations());
    ro.observe(document.documentElement);

    /*
     * The nav highlight has to match what is actually on screen, which is a
     * different question from where the camera settles. `sectionAt(t)` picks
     * the section whose pinned *centre* is nearest the scroll fraction — right
     * for the camera, which blends between settle points, but it votes the
     * boundary in at the midpoint between two centres, not at the real seam
     * between two <section> elements. With uneven section heights those two
     * boundaries can land far apart, so the rail could show "Projects" while
     * the visible content had already scrolled well into Intelligence.
     * Reading the real DOM geometry instead makes the label agree with the
     * screen unconditionally, regardless of how any section's height changes.
     */
    const findActiveSectionId = () => {
      for (let i = 0; i < sections.length; i++) {
        const r = sectionEls[i]?.getBoundingClientRect();
        if (r && r.top <= 1 && r.bottom > 1) return sections[i].id;
      }

      /*
       * No registered section straddles the top edge.
       *
       * That is not only the "scrolled past the end" case it used to be
       * treated as: the compact layout inserts a MachineViewport between two
       * sections, and it is not in the registry — while it is on screen, no
       * registered section crosses the top edge at all. Returning the last
       * section there lit "Contact" in the navigation for a full screen in
       * the middle of the page, which is worse than being slightly stale:
       * it tells the visitor they are somewhere they are not.
       *
       * The honest answer is the last section the visitor has actually
       * entered, so an unregistered block between two sections reads as
       * still being in the one above it.
       */
      let lastStarted = sections[0].id;
      for (let i = 0; i < sections.length; i++) {
        const r = sectionEls[i]?.getBoundingClientRect();
        if (r && r.top <= 1) lastStarted = sections[i].id;
      }
      return lastStarted;
    };

    const readProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };

    const commit = (t: number) => {
      const now = performance.now();
      const dt = Math.max(1, now - lastTime) / 1000;
      lastTime = now;

      const delta = t - lastT;
      lastT = t;

      frame.t = t;
      frame.delta = delta;
      // Narrative tone, from the same measured stations the camera uses, so
      // the lighting rig shifts colour on exactly the beat the camera moves.
      frame.tone = toneAt(t);

      // Smooth the velocity so a single wheel notch does not spike the machine.
      const instantaneous = Math.min(1, (Math.abs(delta) / dt) * 2.2);
      frame.velocity += (instantaneous - frame.velocity) * 0.12;

      setActiveSection(findActiveSectionId());
      const section = sectionAt(t);
      if (section.phase !== 'BOOT') setPhase(section.phase);

      // Scrolling away from standby is an implicit power-on request (§3).
      if (t > 0.012 && useMachine.getState().powerState === 'STANDBY') {
        beginActivation();
      }
    };

    if (reducedMotion) {
      const onScroll = () => commit(readProgress());
      window.addEventListener('scroll', onScroll, { passive: true });
      commit(readProgress());
      return () => {
        window.removeEventListener('scroll', onScroll);
        ro.disconnect();
      };
    }

    lenis = new Lenis({
      duration: 1.1,
      easing: (x: number) => 1 - Math.pow(1 - x, 3),
      // Touch devices keep native momentum — smoothing it feels wrong on mobile.
      syncTouch: false,
    });

    lenis.on('scroll', ({ progress }: { progress: number }) => {
      commit(Number.isFinite(progress) ? progress : readProgress());
    });

    const tick = (time: number) => {
      lenis?.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      ro.disconnect();
    };
  }, [reducedMotion, setActiveSection, setPhase, beginActivation, powerState]);
}

/** Scrolls to a section by id. Used by the rail, the palette, and skip links. */
export function scrollToSection(id: string) {
  const index = sections.findIndex((s) => s.id === id);
  if (index === -1) return;
  const el = document.getElementById(`section-${id}`);
  if (el) {
    el.scrollIntoView({
      behavior: useMachine.getState().reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }
  // Jumping past standby must also power the machine, or the visitor arrives
  // at a dark scene with no way to understand what happened.
  if (useMachine.getState().powerState === 'STANDBY' && id !== 'boot') {
    useMachine.getState().beginActivation();
  }
}
