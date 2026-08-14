'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useMachine } from '@/store/machine';
import { useCapabilities, useAdaptiveQuality } from '@/hooks/useCapabilities';
import { useScrollEngine } from '@/hooks/useScrollEngine';
import { sections } from '@/lib/data/sections';

import { ProgressRail, MobileNav } from './dom/ProgressRail';
import { CommandPalette } from './dom/CommandPalette';
import { DebugConsole } from './dom/DebugConsole';
import { SystemControls } from './dom/SystemControls';
import { FilmGrain } from './dom/FilmGrain';
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
        behind it. It fades out to the right so the machine is never boxed in.
      */}
      <div
        aria-hidden="true"
        className="no-print pointer-events-none fixed inset-0 z-[5]"
        style={{
          background:
            'linear-gradient(100deg, rgba(9,10,15,0.95) 0%, rgba(9,10,15,0.92) 42%, rgba(9,10,15,0.6) 58%, rgba(9,10,15,0) 78%)',
        }}
      />

      <FilmGrain />

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
          style={{ minHeight: '100vh' }}
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
