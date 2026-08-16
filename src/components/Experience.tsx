'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
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

      {!webglFailed && <MachineCanvas />}

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
        <SectionExperience />
        <SectionImpact />
        <SectionContact />
      </main>

      {/* Bottom padding so the mobile nav never covers the final content. */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
    </>
  );
}
