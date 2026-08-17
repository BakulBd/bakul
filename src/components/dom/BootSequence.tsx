'use client';

import { useEffect, useState } from 'react';
import { Power, ArrowRight, Download, Github } from 'lucide-react';
import { frame, useMachine } from '@/store/machine';
import { profile } from '@/lib/data/profile';
import {
  BOOT_STAGES,
  BUS_TRACES,
  MEMORY_SLOTS,
  RACK_MODULE_COUNT,
  TURBINE_BLADES,
  TURBINE_PIVOTS,
  type Group,
} from '@/components/machine/lib/blueprint';

/**
 * FIRST 10 SECONDS (§3) — power-on self test.
 *
 * Presented as a machine's POST screen: each subsystem is probed in turn and
 * reports back, the way a computer enumerates its hardware before handing
 * over to the OS. That framing is doing real work rather than being a
 * costume — the visitor learns what the machine is made of while they wait
 * for it, instead of watching a decorative progress bar.
 *
 * Critically: this never traps the visitor. The skip link, the quick-nav rail,
 * and the command palette are all live during standby, and scrolling powers the
 * system automatically — so a recruiter is never held at a gate.
 */

/**
 * What each subsystem reports. Keyed by the same `Group` the 3D scene lights,
 * and the counts are read from the blueprint's own constants rather than
 * retyped — a POST screen that claims four rails while the machine renders
 * six is worse than no POST screen at all.
 */
const STAGE_REPORT: Record<Group, { device: string; detail: string }> = {
  board: { device: 'BOARD', detail: 'mainboard + power rails' },
  core: { device: 'CPU', detail: 'processor die + heatsink' },
  memory: { device: 'MEM', detail: `${MEMORY_SLOTS} DIMM slots populated` },
  bus: { device: 'BUS', detail: `${BUS_TRACES.length} data lanes routed` },
  gpu: { device: 'GPU', detail: 'graphics card in slot' },
  cooling: { device: 'FAN', detail: `${TURBINE_PIVOTS.length} fans × ${TURBINE_BLADES} blades` },
  storage: { device: 'DISK', detail: `${RACK_MODULE_COUNT} project bays mounted` },
  monitor: { device: 'VIDEO', detail: 'BAKUL OS — display online' },
};

export function BootSequence() {
  const powerState = useMachine((s) => s.powerState);
  const beginActivation = useMachine((s) => s.beginActivation);
  const reducedMotion = useMachine((s) => s.reducedMotion);

  const [power, setPower] = useState(0);

  // Mirror the frame-loop power value into React at a low rate. Reading it
  // every frame in state would defeat the point of the frame singleton, so we
  // sample on an interval instead — the DOM only needs coarse resolution here.
  useEffect(() => {
    if (powerState === 'STANDBY') return;

    const id = window.setInterval(() => setPower(frame.power), 90);
    return () => window.clearInterval(id);
  }, [powerState]);

  /* SoundBridge plays the power-up off the state transition, so clicking this
     button and simply scrolling to activate now sound the same — they are the
     same event as far as a visitor is concerned. */
  const handlePower = () => {
    beginActivation();
  };

  const online = powerState === 'ONLINE';
  // Fade the standby panel out as the machine takes over the screen.
  const standbyOpacity = powerState === 'STANDBY' ? 1 : Math.max(0, 1 - power * 1.8);
  const pct = Math.round(power * 100);

  return (
    /*
     * `dvh`, matching the section around it.
     *
     * `min-h-screen` is `100vh`, which on mobile Safari and Chrome means the
     * viewport with the URL bar hidden — taller than what is actually on
     * screen at load. Nested inside a section already capped at `100dvh`,
     * that pushed the bottom of this block (the Power System button, the
     * whole reason the first screen exists) below the fold on exactly the
     * devices where the first screen matters most.
     *
     * The bottom padding is clearance for the mobile nav: this block is
     * vertically centred, and without it the centring is computed against a
     * box whose last 56px are covered by the bar.
     */
    <div className="relative flex min-h-[100dvh] flex-col justify-center pb-[calc(var(--nav-h)+1rem)] lg:pb-0">
      {/* ---------- STANDBY ---------- */}
      <div
        style={{
          opacity: standbyOpacity,
          pointerEvents: standbyOpacity < 0.05 ? 'none' : 'auto',
          transition: 'opacity 0.5s linear',
        }}
        aria-hidden={online}
      >
        <div className="flex items-center gap-3">
          <span
            className="led"
            style={{
              background: powerState === 'STANDBY' ? '#8a4c00' : '#ff8c00',
              boxShadow: powerState === 'STANDBY' ? 'none' : '0 0 12px #ff8c00',
            }}
            aria-hidden="true"
          />
          <p className="t-label m-0">
            {powerState === 'STANDBY' ? 'System Standby' : 'Power-On Self Test'}
          </p>
        </div>

        {/*
          The name leads from the very first frame.

          It used to appear only as a six-word status label until the boot
          finished, which meant the single most important word on the site was
          the smallest thing on screen for the first several seconds — and for
          anyone who never scrolled, permanently. Marked aria-hidden because
          the real <h1> lives in the reveal block below and is in the DOM from
          the first byte; this is the visual treatment of a name a screen
          reader has already been given, not a second copy of it.
        */}
        {/* 14vw rather than 12vw: on a phone this is the largest thing on the
            most important screen of the site, and at 12vw it was setting the
            name at 47px on a 390px viewport — smaller than the display size
            the same clamp gives a laptop, for a screen with far less
            competing for attention. */}
        <p
          aria-hidden="true"
          className="t-display mt-5 text-[clamp(3rem,13vw,8.5rem)] leading-[0.92] text-[color:var(--color-ceramic)]"
        >
          {profile.name.split(' ')[0]}
          <span className="text-[color:var(--color-ash)]"> {profile.name.split(' ')[1]}</span>
        </p>

        <p className="t-mono mt-4 text-[clamp(0.85rem,2.2vw,1.15rem)] emissive-cyan">
          {profile.title}
        </p>

        {/*
          The disciplines belong on the standby screen, not only in the reveal
          behind it.

          A phone's first screen was the name, the job title, a status line
          and a button — four short lines centred in an 844px viewport, with
          roughly 460px of empty space above them and 500px below. Nothing was
          wrong with any single element; there was simply not enough on screen
          to compose. These four words are already written, already true, and
          are exactly what a visitor wants next after the title.
        */}
        <p className="t-label mt-4">{profile.disciplines.join(' • ')}</p>

        <p className="t-label mt-5 text-[color:var(--color-ash-dim)]">
          {powerState === 'STANDBY' ? 'Computing engine offline' : 'Bringing subsystems online…'}
        </p>

        {powerState === 'STANDBY' && (
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <button type="button" onClick={handlePower} className="btn btn-primary">
              <Power aria-hidden="true" />
              Power System
            </button>
            <p className="t-label m-0">or scroll to activate</p>
          </div>
        )}
      </div>

      {/* ---------- POST ---------- */}
      {powerState !== 'STANDBY' && !online && (
        <div
          /* `bracketed` draws registration marks at the four corners — the
             convention for a measured readout on a technical drawing, and the
             detail that makes this read as an instrument rather than a card. */
          className="panel-flat bracketed mt-10 w-full max-w-[34rem] p-5 sm:p-6"
          role="status"
          aria-live="polite"
          aria-label="Power-on self test progress"
        >
          <div className="flex items-baseline justify-between gap-4 border-b border-[#24272f] pb-3">
            <span className="t-label emissive-amber">BAKUL BIOS — POST</span>
            <span className="font-[family-name:var(--font-fira)] text-xs tabular-nums text-[color:var(--color-ash)]">
              {pct}%
            </span>
          </div>

          <div className="mt-3 h-[3px] w-full bg-[#1a1c23]">
            <div
              className="h-full bg-[color:var(--color-amber)]"
              style={{
                width: `${pct}%`,
                boxShadow: '0 0 12px #ff8c00',
                transition: 'width 0.1s linear',
              }}
            />
          </div>

          {/* Device table. Each row resolves the moment the 3D subsystem it
              names starts drawing power — same constant, same frame. */}
          <ul className="mt-4 list-none space-y-1.5 p-0">
            {BOOT_STAGES.map((stage, i) => {
              const report = STAGE_REPORT[stage.group];
              const done = power >= stage.at;
              const isLatest =
                done && (i === BOOT_STAGES.length - 1 || power < BOOT_STAGES[i + 1].at);
              return (
                <li
                  key={stage.group}
                  className="grid grid-cols-[4.2rem_1fr_auto] items-baseline gap-3 font-[family-name:var(--font-fira)] text-xs"
                  style={{
                    opacity: done ? 1 : 0.32,
                    transition: 'opacity 0.25s linear',
                  }}
                >
                  <span className="text-[color:var(--color-cyan)]">{report.device}</span>
                  <span className="truncate text-[color:var(--color-ash)]">{report.detail}</span>
                  <span
                    style={{
                      color: done ? 'var(--color-amber)' : 'var(--color-ash-dim)',
                    }}
                  >
                    {done ? 'OK' : '····'}
                    {isLatest && (
                      <span className="caret ml-1" aria-hidden="true">
                        ▌
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="t-label mt-4 border-t border-[#24272f] pt-3 normal-case tracking-normal">
            {pct >= 99 ? 'Handing off to BAKUL OS…' : 'Enumerating subsystems…'}
          </p>
        </div>
      )}

      {/* ---------- REVEAL ---------- */}
      {/*
        The identity is always present in the DOM — only its visual presentation
        waits for the boot. Search engines and screen readers get the h1
        immediately regardless of power state.
      */}
      <div
        style={{
          opacity: online ? 1 : 0,
          transform: online || reducedMotion ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 1.1s ease-out 0.15s, transform 1.1s cubic-bezier(0.16,1,0.3,1) 0.15s',
          position: online ? 'relative' : 'absolute',
          pointerEvents: online ? 'auto' : 'none',
        }}
        className={online ? '' : 'sr-only'}
      >
        {/* Same clamp as the standby treatment above — these two are the same
            word in the same place, and a different scale on each makes the
            name visibly jump size at the moment the boot completes. */}
        <h1 className="t-display text-[clamp(3rem,13vw,8.5rem)] leading-[0.92]">
          {profile.name.split(' ')[0]}
          <span className="text-[color:var(--color-ash)]"> {profile.name.split(' ')[1]}</span>
        </h1>

        <p className="t-mono mt-4 text-[clamp(0.85rem,2.2vw,1.15rem)] emissive-cyan">
          {profile.title}
        </p>

        <p className="t-label mt-3">{profile.disciplines.join(' • ')}</p>

        <p className="t-body mt-7 max-w-[54ch]">{profile.summary}</p>

        <div className="mt-9 flex flex-wrap gap-3">
          <a href="#section-projects" className="btn btn-primary">
            View Projects
            <ArrowRight aria-hidden="true" />
          </a>
          <a href={profile.contact.cv} className="btn" download>
            <Download aria-hidden="true" />
            Download CV
          </a>
          <a
            href={profile.contact.github}
            className="btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github aria-hidden="true" />
            GitHub
          </a>
        </div>
      </div>

      {/*
        Scroll affordance, standby only.

        "or scroll to activate" is already written next to the button, but on
        a touch screen the instruction and the gesture are in different
        places — the words are mid-screen and the gesture happens anywhere.
        A moving mark at the foot of the first screen is the conventional
        signal that there is more below, and it doubles as the answer to
        "what does scrolling do here". It disappears the moment the machine
        starts powering on, because by then it has been answered.
      */}
      {powerState === 'STANDBY' && (
        <div
          aria-hidden="true"
          /* Clear of the bottom bar. The container's own bottom edge is the
             full 100dvh, whose last stretch the fixed nav sits on top of —
             anchoring to bottom-0 would put the cue underneath it. */
          className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--nav-h)+0.5rem)] flex flex-col items-center gap-2 lg:hidden"
        >
          <span className="t-label text-[0.55rem] text-[color:var(--color-ash-dim)]">Scroll</span>
          <span className="scroll-cue" />
        </div>
      )}
    </div>
  );
}
