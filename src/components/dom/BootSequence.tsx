'use client';

import { useEffect, useRef, useState } from 'react';
import { Power, ArrowRight, Download, Github } from 'lucide-react';
import { frame, useMachine } from '@/store/machine';
import { audio } from '@/lib/audio/engine';
import { profile } from '@/lib/data/profile';

/**
 * FIRST 10 SECONDS (§3)
 *
 * Starts almost completely dark with a standby core. Powers on via the button
 * or by scrolling. Reads as a cold industrial boot, not a title screen.
 *
 * Critically: this never traps the visitor. The skip link, the quick-nav rail,
 * and the command palette are all live during standby, and scrolling powers the
 * system automatically — so a recruiter is never held at a gate.
 */

/** Boot log lines, each tied to the power-ramp threshold it reports. */
const BOOT_LOG: { at: number; text: string }[] = [
  { at: 0.04, text: 'power signal detected — 3.3V rail nominal' },
  { at: 0.12, text: 'energising primary conduits' },
  { at: 0.22, text: 'circuit bus 0x01 .. 0x04 online' },
  { at: 0.34, text: 'vent actuators released' },
  { at: 0.46, text: 'thermal turbines spinning up' },
  { at: 0.58, text: 'mechanical relays engaged' },
  { at: 0.7, text: 'secondary subsystems awake' },
  { at: 0.82, text: 'project bay powered' },
  { at: 0.93, text: 'all systems nominal' },
];

export function BootSequence() {
  const powerState = useMachine((s) => s.powerState);
  const beginActivation = useMachine((s) => s.beginActivation);
  const audioEnabled = useMachine((s) => s.audioEnabled);
  const reducedMotion = useMachine((s) => s.reducedMotion);

  const [power, setPower] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const emitted = useRef(new Set<number>());

  // Mirror the frame-loop power value into React at a low rate. Reading it
  // every frame in state would defeat the point of the frame singleton, so we
  // sample on an interval instead — the DOM only needs coarse resolution here.
  useEffect(() => {
    if (powerState === 'STANDBY') return;

    const id = window.setInterval(() => {
      setPower(frame.power);
      document.documentElement.style.setProperty('--power', frame.power.toFixed(3));

      for (const line of BOOT_LOG) {
        if (frame.power >= line.at && !emitted.current.has(line.at)) {
          emitted.current.add(line.at);
          setLog((prev) => [...prev.slice(-6), line.text]);
        }
      }
    }, 90);

    return () => window.clearInterval(id);
  }, [powerState]);

  const handlePower = () => {
    beginActivation();
    if (audioEnabled) audio.play('power');
  };

  const online = powerState === 'ONLINE';
  // Fade the standby panel out as the machine takes over the screen.
  const standbyOpacity = powerState === 'STANDBY' ? 1 : Math.max(0, 1 - power * 1.8);

  return (
    <div className="relative flex min-h-screen flex-col justify-center">
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
            {powerState === 'STANDBY' ? 'Bakul // System Standby' : 'Bakul // Activating'}
          </p>
        </div>

        <p className="t-mono mt-6 text-[clamp(1.05rem,3vw,1.6rem)] text-[color:var(--color-ash)]">
          Computing engine offline
        </p>

        {powerState === 'STANDBY' && (
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <button type="button" onClick={handlePower} className="btn btn-primary">
              <Power aria-hidden="true" />
              Power System
            </button>
            <p className="t-label m-0">or scroll to activate</p>
          </div>
        )}
      </div>

      {/* ---------- BOOT LOG ---------- */}
      {powerState !== 'STANDBY' && !online && (
        <div
          className="panel-flat mt-10 max-w-[52ch] p-5"
          role="status"
          aria-live="polite"
          aria-label="System boot progress"
        >
          <div className="h-[3px] w-full bg-[#1a1c23]">
            <div
              className="h-full bg-[color:var(--color-amber)]"
              style={{
                width: `${power * 100}%`,
                boxShadow: '0 0 12px #ff8c00',
                transition: 'width 0.1s linear',
              }}
            />
          </div>
          <p className="t-label mt-3">
            Boot {Math.round(power * 100)}%
          </p>
          <ul className="mt-4 list-none space-y-1 p-0">
            {log.map((line, i) => {
              const isLast = i === log.length - 1;
              return (
                <li
                  key={`${line}-${i}`}
                  className="font-[family-name:var(--font-fira)] text-xs text-[color:var(--color-ash)]"
                  style={{ opacity: 0.35 + (i / Math.max(1, log.length - 1)) * 0.65 }}
                >
                  <span className="text-[color:var(--color-cyan)]">&gt;</span> {line}
                  {isLast && (
                    <span className="caret ml-1 text-[color:var(--color-amber)]" aria-hidden="true">
                      ▌
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
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
        <h1 className="t-display text-[clamp(2.6rem,10vw,7rem)]">
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
    </div>
  );
}
