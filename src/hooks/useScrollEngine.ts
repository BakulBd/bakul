'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { frame, useMachine } from '@/store/machine';
import { measureStations, sectionAt, sections, toneAt } from '@/lib/data/sections';

/**
 * The live Lenis instance, module-scoped.
 *
 * Only `setScrollLocked` reads it. The instance is otherwise owned entirely by
 * the effect below, which is where it must stay — but a modal that covers the
 * screen has to be able to stop the page underneath it, and there was no handle
 * to do that with. See `setScrollLocked` for why nothing simpler works.
 */
let activeLenis: Lenis | null = null;

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
  const beginActivation = useMachine((s) => s.beginActivation);
  /*
   * `powerState` is deliberately NOT selected here.
   *
   * It was, and it was also listed in this effect's dependency array — while
   * the body never read it: the one place that needs it (the implicit power-on
   * near the bottom of `commit`) reads `useMachine.getState().powerState`
   * instead, because that check runs on a scroll frame and must see the live
   * value rather than one captured when the effect last ran.
   *
   * So the subscription bought nothing and the dependency cost a great deal.
   * Every power transition invalidated the effect, which meant destroying
   * Lenis, disconnecting the ResizeObserver, rebuilding both, and re-running
   * `measureStations()` over every section. STANDBY -> ACTIVATING -> ONLINE is
   * two of those during boot — precisely when the main thread is busiest and
   * the visitor is watching the POST sequence, and precisely the kind of work
   * the frame singleton exists to keep off the critical path. It also
   * re-rendered `Experience` on every transition for a value it never used.
   */

  useEffect(() => {
    let lenis: Lenis | null = null;
    let raf = 0;
    let lastT = 0;
    let lastTime = performance.now();
    /** Last `--tone` value written to the DOM, for change detection. */
    let lastToneStep = -1;
    /** Last `--flow` value written to the DOM. */
    let lastFlowStep = -1;
    /** Last `--scroll` value written to the DOM. */
    let lastScrollStep = -1;


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

      /*
       * Publish the tone to the DOM as well, so the ambient section wash can
       * cross-fade on the identical curve the 3D light rig uses.
       *
       * `toneAt` has always returned a smooth scalar and the lighting rig has
       * always consumed it as one — but the DOM was collapsing it to a binary
       * amber-or-cyan class per section phase. The result was a wash that
       * *snapped* at a phase boundary while the machine behind it was still
       * mid-crossfade: for a few hundred pixels of scroll the background and
       * the foreground disagreed about which half of the story the visitor was
       * in, which is exactly the seam this codebase's own comments say must not
       * exist. One number, read by both layers, cannot disagree with itself.
       *
       * Quantised to 5% steps for the same reason `--power` is: a custom
       * property on the root element invalidates style for the whole subtree,
       * and doing that on every scroll frame to move a soft 900px gradient by
       * an imperceptible amount would be paying real cost for precision nobody
       * can see. Twenty steps across the whole hand-off is smooth to the eye
       * and cheap to the compositor.
       */
      const toneStep = Math.round(frame.tone * 20) / 20;
      if (toneStep !== lastToneStep) {
        lastToneStep = toneStep;
        document.documentElement.style.setProperty('--tone', String(toneStep));
      }

      // Smooth the velocity so a single wheel notch does not spike the machine.
      const instantaneous = Math.min(1, (Math.abs(delta) / dt) * 2.2);
      frame.velocity += (instantaneous - frame.velocity) * 0.12;

      /*
       * TWO MORE SCALARS, SAME CONTRACT AS `--tone`.
       *
       * The background layers had exactly one thing to say about scroll:
       * nothing. `--tone` told them *where in the argument* the visitor was,
       * but the ground plane flowed at a fixed rate and the room drifted on
       * its own timer, so the whole background was indifferent to whether the
       * page was still or being flung. The 3D scene has read `frame.velocity`
       * and `frame.t` since the beginning; these two properties are simply
       * the same numbers made available to CSS, so both layers can respond to
       * one motion instead of two.
       *
       *   --flow    [0,1] smoothed scroll speed. The substrate multiplies its
       *             own animation duration by this, so the floor streams past
       *             faster the harder the visitor scrolls and settles back to
       *             an idle drift when they stop. That coupling is what makes
       *             the ground read as something being travelled over rather
       *             than a texture on a loop.
       *
       *   --scroll  [0,1] absolute position through the document. Drives slow
       *             parallax on the atmosphere's masses, so the room has a
       *             sense of having been moved through by the end of the page
       *             — depth that a keyframe alone cannot express, because a
       *             keyframe does not know where the visitor is.
       *
       * Both are quantised and change-detected exactly like `--tone` above,
       * for the same reason: writing a custom property on the root element
       * invalidates style for the entire subtree, so the cost is per *write*,
       * not per unique value. Twenty steps is finer than the eye can resolve
       * on a soft gradient or an animation-duration change, and it caps this
       * whole block at a handful of writes per scroll gesture rather than one
       * per frame.
       *
       * Neither is a React state update, and neither adds a listener or a
       * loop: both values are already being computed on this line, for the
       * scene. Publishing them costs one rounding and one comparison each.
       */
      const flowStep = Math.round(frame.velocity * 20) / 20;
      if (flowStep !== lastFlowStep) {
        lastFlowStep = flowStep;
        document.documentElement.style.setProperty('--flow', String(flowStep));
      }

      const scrollStep = Math.round(t * 20) / 20;
      if (scrollStep !== lastScrollStep) {
        lastScrollStep = scrollStep;
        document.documentElement.style.setProperty('--scroll', String(scrollStep));
      }

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
    activeLenis = lenis;

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
      activeLenis = null;
      ro.disconnect();
    };
  }, [reducedMotion, setActiveSection, setPhase, beginActivation]);
}

/**
 * Freezes the page while a modal owns the screen.
 *
 * Both halves are load-bearing, which is why this lives here rather than as an
 * `overflow: hidden` one-liner in the modal:
 *
 *   `lenis.stop()`  Lenis listens for wheel and touch on the *window* and
 *                   scrolls the document programmatically. `overflow: hidden`
 *                   does not stop that — a hidden overflow element is still a
 *                   scroll container, and `scrollTo` on it still works. So
 *                   without this, scrolling over a full-screen overlay drives
 *                   the page, the camera, and the whole choreography behind it.
 *
 *   `overflow`      Lenis is absent under prefers-reduced-motion, where scroll
 *                   is native. It also never sees keyboard paging (Space,
 *                   PageDown, Home) — the browser performs those itself and
 *                   Lenis merely follows. Clipping the root covers both.
 *
 * Restoring clears the inline property rather than writing a value, so the
 * stylesheet's `overflow-x: clip` comes back rather than being replaced by a
 * hardcoded copy of it.
 *
 * The lock does not shift the layout: `html` carries `scrollbar-gutter: stable`,
 * so the gutter is reserved whether or not a scrollbar is currently drawn in it.
 */
export function setScrollLocked(locked: boolean) {
  if (locked) activeLenis?.stop();
  else activeLenis?.start();
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}

/**
 * Scrolls to a section by id. Used by the rail, the palette, and skip links.
 *
 * `behavior` is an override, not a preference: the default is smooth (unless
 * the visitor asked for less motion), which is right for a click on the rail
 * because the travel *is* the feedback that something was pressed. It is wrong
 * for an arrival from another URL — see `useHashLanding` below.
 */
export function scrollToSection(id: string, options?: { behavior?: ScrollBehavior }) {
  const index = sections.findIndex((s) => s.id === id);
  if (index === -1) return;
  const el = document.getElementById(`section-${id}`);
  if (el) {
    el.scrollIntoView({
      behavior:
        options?.behavior ?? (useMachine.getState().reducedMotion ? 'auto' : 'smooth'),
      block: 'start',
    });
  }
  // Jumping past standby must also power the machine, or the visitor arrives
  // at a dark scene with no way to understand what happened.
  if (useMachine.getState().powerState === 'STANDBY' && id !== 'boot') {
    useMachine.getState().beginActivation();
  }
}

/** The section a `#section-…` fragment names, or null for anything else. */
function sectionFromHash(hash: string): string | null {
  const id = /^#section-(.+)$/.exec(hash)?.[1];
  return id && sections.some((s) => s.id === id) ? id : null;
}

/**
 * Honours an inbound `#section-…` fragment.
 *
 * ── The bug this fixes ─────────────────────────────────────────────────
 * Every section has always had an id, and the browser has always jumped to it
 * on load. What never happened is the *other half*: `powerState` stays at
 * `'STANDBY'`, so a visitor arriving at `/#section-projects` — from a search
 * result, a shared link, or the lab's way back — landed correctly positioned in
 * an unpowered scene. Every background layer fades with `--power`, which the
 * boot ramp publishes and which nothing had asked to ramp. The page looked
 * broken, and the visitor had no way to know that scrolling one notch would
 * fix it.
 *
 * `scrollToSection` has carried the power-on rule since the rail was built.
 * The fix is not new behaviour, then — it is routing arrivals through the same
 * door the rail already uses, so there is one definition of what reaching a
 * section means rather than two that disagree.
 *
 * ── Why 'auto' and never smooth ────────────────────────────────────────
 * By the time this runs the page has *already moved*: on a document load the
 * browser resolved the fragment itself, and on a client-side navigation the App
 * Router did. Animating from where we now are to where we already are is either
 * a no-op or a stutter. And on a cold arrival the honest reading is that the
 * visitor asked to be at Projects — not to be shown the four screens above it.
 *
 * ── Why it corrects itself after fonts land ────────────────────────────
 * The browser's own jump is measured against a document laid out in the
 * fallback face. When the real faces arrive every paragraph rewraps and each
 * section moves — by a few pixels near the top of the page and by a great deal
 * more near the bottom, since the drift accumulates. So the landing is checked
 * once more when `document.fonts.ready` settles, and re-issued only if the
 * target has actually drifted off the top edge. Measured, not assumed: a
 * second unconditional scroll would fight the visitor if they had already
 * started reading.
 */
export function useHashLanding() {
  useEffect(() => {
    let cancelled = false;

    const land = (id: string) => {
      if (cancelled) return;
      scrollToSection(id, { behavior: 'auto' });
    };

    const initial = sectionFromHash(window.location.hash);

    if (initial) {
      /*
       * One frame of delay, deliberately. This effect and the scroll engine's
       * are both mounted by `Experience`, so this one runs second — but Lenis
       * is constructed in that effect and takes over the scroll position, and
       * issuing a scroll in the same tick it is being wired up is a race with
       * no upside. A frame later the engine is running and `measureStations`
       * has read real geometry.
       */
      requestAnimationFrame(() => land(initial));

      /*
       * `document.fonts` is universally available in the browsers this site
       * targets; the guard is for the DOM-less renders this module is imported
       * into rather than for a real client.
       */
      document.fonts?.ready.then(() => {
        if (cancelled) return;
        const el = document.getElementById(`section-${initial}`);
        // 2px of tolerance: sub-pixel layout and a device pixel ratio that is
        // not an integer both land a correct scroll fractionally off zero.
        if (el && Math.abs(el.getBoundingClientRect().top) > 2) land(initial);
      });
    }

    /*
     * A fragment can also change without this component remounting — an anchor
     * clicked in the page body, or a same-route navigation that only alters the
     * hash. Without this listener those cases keep the positioning (the browser
     * does that part) and silently lose the power-on.
     */
    const onHashChange = () => {
      const id = sectionFromHash(window.location.hash);
      if (id) land(id);
    };

    window.addEventListener('hashchange', onHashChange);
    return () => {
      cancelled = true;
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);
}
