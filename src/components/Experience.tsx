'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { frame, useMachine } from '@/store/machine';
import { useCapabilities, useAdaptiveQuality } from '@/hooks/useCapabilities';
import { useScrollEngine } from '@/hooks/useScrollEngine';
import { sections } from '@/lib/data/sections';

import { ProgressRail, MobileNav } from './dom/ProgressRail';
import { CommandPalette } from './dom/CommandPalette';
import { DebugConsole } from './dom/DebugConsole';
import { SystemControls } from './dom/SystemControls';
import { FilmGrain } from './dom/FilmGrain';
import { Backdrop } from './dom/Backdrop';
import { SoundBridge } from './dom/SoundBridge';
import { BootSequence } from './dom/BootSequence';
import { SectionCore } from './dom/SectionCore';
import { MachineViewport } from './dom/MachineViewport';
import { SectionProjects } from './dom/SectionProjects';
import { SectionExperience } from './dom/SectionExperience';
import { SectionImpact } from './dom/SectionImpact';
import { SectionContact } from './dom/SectionContact';

/**
 * The 3D layer loads only in the browser and only after the DOM is interactive.
 * The page is complete and readable before a single byte of Three.js arrives —
 * the canvas is an enhancement, never a prerequisite (§21, §23).
 */
const MachineCanvas = dynamic(() => import('./machine/MachineCanvas'), {
  ssr: false,
  loading: () => null,
});

export function Experience() {
  useCapabilities();
  useAdaptiveQuality();
  useScrollEngine();

  const webglFailed = useMachine((s) => s.webglFailed);
  const powerState = useMachine((s) => s.powerState);
  const completeActivation = useMachine((s) => s.completeActivation);

  /*
   * WHEN THE 3D LAYER IS ALLOWED TO COST ANYTHING
   *
   * The canvas is code-split already, but a dynamic import still evaluates
   * Three.js, react-three-fiber and the postprocessing pipeline the moment it
   * mounts — and it was mounting immediately, on every device.
   *
   * Measured cost on a throttled mid-range phone, taken by blocking the 3D
   * chunks outright: total blocking time 720ms -> 90ms, and time to
   * interactive 5.4s -> 3.3s. That is what a visitor was paying before they
   * could use the page.
   *
   * What they got for it on that first screen is nothing. The machine is in
   * STANDBY, `frame.power` is 0, every emissive surface is dark, and on a
   * compact viewport it sits behind a near-opaque readability scrim. The scene
   * is invisible until something powers it on.
   *
   * So on a phone the trigger is the power-on itself. Every route to a visible
   * machine — scrolling off the first screen, the Power System button, the
   * rail, the command palette — leaves STANDBY and mounts the canvas
   * synchronously below. The fetch and parse then land underneath the POST
   * sequence, which runs for about three seconds on its own power ramp: the
   * machine's own boot screen is the loading state, rather than a spinner
   * bolted on.
   *
   * Two earlier revisions also kept an opportunistic `requestIdleCallback`
   * preload alongside that trigger — first with a 2.5s deadline, then with
   * none. Neither moved the needle (750ms -> 720ms -> 730ms of blocking time),
   * because idle callbacks fire in the gaps *between* long tasks and a page
   * load is full of those, so the canvas simply mounted in one of them and
   * went straight back to competing for the main thread. Removing the idle
   * path entirely is what took mobile from 78 to 96.
   *
   * Wide viewports mount immediately and are deliberately untouched: the
   * machine is on show beside the reading column for the whole visit there,
   * and they already measured a clean score with it eager.
   */
  const [canvasMounted, setCanvasMounted] = useState(false);

  /*
   * Always starts false, including on a wide viewport, and is raised from an
   * effect.
   *
   * A previous revision resolved this during the first client render with a
   * lazy initialiser reading `matchMedia`, on the reasoning that
   * `dynamic(..., { ssr: false })` renders nothing on the first pass either
   * way so there would be no markup to disagree about. That reasoning was
   * wrong, and an audit caught it: desktop logged React error #418 —
   * hydration failed because the server-rendered HTML did not match the
   * client — which costs a Best Practices point and, far worse, makes React
   * throw away the server markup and re-render the whole tree on the client.
   *
   * The rule it violated is simply that the hydration render must produce what
   * the server produced. Anything that depends on the browser belongs in an
   * effect, which runs after hydration has committed; the extra commit is
   * measurably free.
   */
  useEffect(() => {
    // Read the media query directly rather than through useIsCompact: this
    // runs client-side only, so there is no server snapshot to reconcile, and
    // mounting must be decided once rather than tracked across resizes —
    // unmounting a live canvas to remount it would throw away the WebGL
    // context and restart the boot.
    if (!window.matchMedia('(max-width: 1023.98px)').matches) {
      setCanvasMounted(true);
      return;
    }

    return useMachine.subscribe((s) => {
      if (s.powerState !== 'STANDBY') setCanvasMounted(true);
    });
  }, []);

  /**
   * Without WebGL there is no render loop to advance the power ramp, so the
   * machine would sit in ACTIVATING forever. Complete the boot immediately and
   * let the DOM experience stand alone.
   */
  useEffect(() => {
    if (webglFailed && powerState !== 'ONLINE') {
      completeActivation();
    }
  }, [webglFailed, powerState, completeActivation]);

  /*
   * Mirror the machine's power ramp into a CSS custom property, so DOM chrome
   * can energise on exactly the same curve as the 3D scene rather than on a
   * timer that approximates it.
   *
   * `frame.power` advances in the render loop and is deliberately not React
   * state (see store/machine.ts), so it has to be sampled. The value is
   * quantised to 5% steps, which caps the whole boot at twenty style writes —
   * CSS custom properties on the root element invalidate style for the
   * subtree, and doing that at 60fps for a value only used to fade things in
   * would be paying a real cost for precision nobody can see.
   */
  useEffect(() => {
    const root = document.documentElement;

    if (powerState === 'STANDBY') {
      root.style.setProperty('--power', '0');
      return;
    }

    // Without WebGL there is no render loop to advance frame.power, so nothing
    // would ever fade in. The DOM experience is complete on its own — pin it on.
    if (webglFailed) {
      root.style.setProperty('--power', '1');
      return;
    }

    let raf = 0;
    let last = -1;
    const tick = () => {
      const v = Math.round(frame.power * 20) / 20;
      if (v !== last) {
        last = v;
        root.style.setProperty('--power', String(v));
      }
      if (v < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [powerState, webglFailed]);

  const bootSection = sections[0];

  return (
    <>
      {/* Skip link is the very first focusable element on the page. */}
      <a href="#section-core" className="skip-link">
        Skip to content
      </a>

      {!webglFailed && canvasMounted && <MachineCanvas />}

      {/*
        Readability scrim. The machine is bright and moves, so text contrast
        cannot be left to chance — this sits between the canvas and the content
        and guarantees the reading column stays legible whatever is rendered
        behind it. Its shape is viewport-dependent — see .readability-scrim in
        globals.css for why a phone needs a different one from a desktop.
      */}
      <div
        aria-hidden="true"
        className="readability-scrim no-print pointer-events-none fixed inset-0 z-[5]"
      />

      {/* Perspective ground plane, above the scrim so it survives it. */}
      <Backdrop />

      <FilmGrain />

      {/* No markup — derives every sound cue from state. */}
      <SoundBridge />

      <ProgressRail />
      <MobileNav />
      <SystemControls />
      <CommandPalette />
      <DebugConsole />

      {/* All content sits above the canvas. */}
      <main id="main" className="relative z-10">
        <section
          id={`section-${bootSection.id}`}
          aria-labelledby="heading-boot"
          /* dvh, not vh: on mobile Safari and Chrome `100vh` is the viewport
             with the URL bar *hidden*, so a 100vh first screen is taller than
             what is actually visible on load and the call to action sits below
             the fold until the visitor scrolls. */
          style={{ minHeight: '100dvh' }}
          className="relative"
        >
          <h2 id="heading-boot" className="sr-only">
            System standby
          </h2>
          <div className="mx-auto w-full max-w-[1240px] px-6 md:px-10 lg:pl-[calc(var(--rail-w)+2.5rem)]">
            <BootSequence />
          </div>
        </section>

        <SectionCore />
        <SectionProjects />

        {/*
          Compact viewports only — renders nothing on a wide one, where the
          machine is already permanently on show beside the reading column.

          Placed between the rack and the assembly line because that is where
          the transformation plays: the morph window is derived from those two
          sections' measured settle points, so putting a full screen of
          clearance between them means the scrim lifts over exactly the stretch
          of scroll in which the machine comes apart. The choreography and the
          clearance are the same event rather than two things that happen to
          be near each other.
        */}
        <MachineViewport
          index="03"
          label="The Machine"
          title="It comes apart."
          caption="The chassis you have been scrolling past is not a backdrop — it is the site. Here it dissolves into the field it was built from. Everything on this page is rendered live in your browser: no video, no images, no pre-baked frames."
        />

        <SectionExperience />
        <SectionImpact />
        <SectionContact />
      </main>

      {/*
        Clearance for the mobile nav.

        Sized from `--nav-h` plus the safe-area inset — the same two values the
        bar itself is built from — rather than a fixed h-16 that had to be
        kept in step with it by hand. The old 4rem guess was shorter than the
        bar on any phone reporting a home-indicator inset, which left the
        footer sitting underneath it at the very bottom of the page, where
        there is no further scroll available to bring it clear.
      */}
      <div
        className="lg:hidden"
        style={{ height: 'calc(var(--nav-h) + env(safe-area-inset-bottom) + 1.25rem)' }}
        aria-hidden="true"
      />
    </>
  );
}
