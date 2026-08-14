'use client';

import { useEffect, useRef, useState } from 'react';
import { GraduationCap, Code2, Cpu, Wrench, Rocket, Sparkles, type LucideIcon } from 'lucide-react';
import { frame, useMachine } from '@/store/machine';
import { audio } from '@/lib/audio/engine';
import { useRafScroll } from '@/hooks/useRafScroll';
import { milestones, stageOrder, type Stage } from '@/lib/data/experience';
import { Heading, Lead, Reveal, Section, Panel, Status } from './Primitives';

/**
 * EXPERIENCE (§11) — assembly line, not a vertical timeline.
 *
 * Milestones travel through a reader head; the selected one locks into place
 * and its detail appears in a readable panel. The whole list stays present as
 * real markup, so it scans instantly and works with a screen reader.
 */

const STAGE_ICON: Record<Stage, LucideIcon> = {
  STUDENT: GraduationCap,
  PROGRAMMER: Code2,
  DEVELOPER: Cpu,
  ENGINEER: Wrench,
  BUILDER: Rocket,
  FUTURE: Sparkles,
};

export function SectionExperience() {
  const [active, setActive] = useState(0);
  const [headTop, setHeadTop] = useState<number | null>(null);
  const audioEnabled = useMachine((s) => s.audioEnabled);
  const trackRef = useRef<HTMLDivElement>(null);

  const select = (i: number) => {
    setActive(i);
    /*
     * Ripple the field behind the section on every selection.
     *
     * By this point in the scroll the machine has finished coming apart, so
     * the lattice is what is actually on screen — sending the same activation
     * wave the particle shader already understands makes the background
     * visibly answer the click instead of drifting on independently. One
     * value, read by the shader on its next frame, so the ripple and the
     * relay click are simultaneous rather than merely close.
     */
    frame.pulse = 1;
    if (audioEnabled) audio.play('relay');
  };

  /* Advance the line as the section scrolls. Coalesced to one read per
     animation frame; see useRafScroll. */
  useRafScroll(() => {
    const el = document.getElementById('section-experience');
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) return;
    const p = Math.min(1, Math.max(0, -rect.top / total));
    setActive(Math.min(milestones.length - 1, Math.floor(p * milestones.length * 0.999)));
  });

  /* Keep the reader head aligned to the active row's measured centre. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const align = () => {
      const rows = track.querySelectorAll<HTMLButtonElement>('[role="option"]');
      const row = rows[active];
      if (!row) return;
      setHeadTop(row.offsetTop + row.offsetHeight / 2 - 5);
    };

    align();

    // Row heights change when text rewraps, so track the container's size.
    const ro = new ResizeObserver(align);
    ro.observe(track);
    return () => ro.disconnect();
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = (active + dir + milestones.length) % milestones.length;
    select(next);
    trackRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')[next]?.focus();
  };

  const current = milestones[active];
  const currentStageIndex = stageOrder.indexOf(current.stage);

  return (
    <Section id="experience" label="Assembly Line" index="04">
      <Reveal>
        <Heading id="experience">Assembly Line</Heading>
        <Lead>
          Progression from student to builder, in order. Each milestone passes through the reader —
          scroll to advance the line, or select any stage directly.
        </Lead>
      </Reveal>

      {/* ---------- Stage strip ---------- */}
      {/* A real rail, not just labels — the fill and each icon's own glow
          report exactly how far the line has advanced, at a glance. */}
      <Reveal delay={60}>
        <div className="mt-10">
          <ol className="relative flex list-none items-start justify-between gap-1 p-0">
            {/* Base rail + amber fill, sitting behind the icons at their vertical centre. */}
            <div
              className="absolute left-[18px] right-[18px] top-[18px] h-px bg-[#24272f]"
              aria-hidden="true"
            />
            <div
              className="absolute left-[18px] top-[18px] h-px bg-[color:var(--color-amber)]"
              style={{
                width: `calc((100% - 36px) * ${stageOrder.length > 1 ? currentStageIndex / (stageOrder.length - 1) : 0})`,
                boxShadow: '0 0 10px var(--color-amber)',
                transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
              }}
              aria-hidden="true"
            />

            {stageOrder.map((stage, i) => {
              const reached = currentStageIndex >= i;
              const isCurrent = currentStageIndex === i;
              const Icon = STAGE_ICON[stage];
              return (
                <li key={stage} className="relative z-10 flex flex-col items-center gap-2 text-center">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300"
                    style={{
                      borderColor: reached ? 'var(--color-amber)' : '#2c2f38',
                      background: reached ? 'rgba(255,140,0,0.12)' : 'rgba(13,15,22,0.9)',
                      boxShadow: isCurrent ? '0 0 18px -2px var(--color-amber)' : 'none',
                      transform: isCurrent ? 'scale(1.12)' : 'scale(1)',
                    }}
                  >
                    <Icon
                      aria-hidden="true"
                      className="h-4 w-4"
                      style={{ color: reached ? 'var(--color-amber)' : 'var(--color-ash-dim)' }}
                    />
                  </span>
                  <span
                    className="t-label hidden sm:inline"
                    style={{
                      color: reached ? 'var(--color-amber)' : 'var(--color-ash-dim)',
                      // A dark contact shadow first — this strip sits outside
                      // the readability scrim's coverage (it fades out toward
                      // the right, deliberately, so the machine is never
                      // boxed in), so without it the later stage labels get
                      // hard to read against the bright chassis behind them.
                      // The colour glow layers on top only when reached.
                      textShadow: reached
                        ? '0 1px 3px rgba(0,0,0,0.9), 0 0 14px rgba(255,140,0,0.4)'
                        : '0 1px 3px rgba(0,0,0,0.9)',
                    }}
                  >
                    {stage}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </Reveal>

      <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ---------- The line ---------- */}
        <Reveal delay={100}>
          <div
            ref={trackRef}
            role="listbox"
            aria-label="Career milestones"
            onKeyDown={onKeyDown}
            className="relative space-y-1.5 border-l border-[#24272f] pl-5"
          >
            {/* Reader head — measured from the live row, so it stays aligned
                at any font size, zoom level, or text-wrapping breakpoint. */}
            <span
              aria-hidden="true"
              className="absolute -left-[5px] h-2.5 w-2.5 rounded-full bg-[color:var(--color-amber)]"
              style={{
                top: headTop ?? 0,
                opacity: headTop === null ? 0 : 1,
                boxShadow: '0 0 14px var(--color-amber)',
                transition: 'top 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.3s',
              }}
            />

            {milestones.map((m, i) => {
              const isActive = i === active;
              const Icon = STAGE_ICON[m.stage];
              return (
                <button
                  key={m.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => select(i)}
                  className="flex w-full items-baseline gap-3 px-3 py-3 text-left"
                  style={{
                    background: isActive ? 'rgba(36,39,47,0.75)' : 'transparent',
                    borderLeft: `2px solid ${isActive ? 'var(--color-amber)' : 'transparent'}`,
                    transform: isActive ? 'translateX(6px)' : 'none',
                    transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 self-center"
                    style={{ color: isActive ? 'var(--color-amber)' : 'var(--color-ash-dim)' }}
                  />
                  <span className="t-label shrink-0" style={{ minWidth: '9.5rem' }}>
                    {m.period}
                  </span>
                  <span
                    className="t-mono text-xs"
                    style={{ color: isActive ? 'var(--color-amber)' : 'var(--color-ceramic)' }}
                  >
                    {m.title}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* ---------- Locked milestone detail ---------- */}
        <Reveal delay={160}>
          <div aria-live="polite">
            <Panel className="p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Status state={current.projected ? 'idle' : current.ongoing ? 'online' : 'amber'}>
                  {current.projected ? 'Projected' : current.ongoing ? 'Active' : 'Complete'}
                </Status>
                <span className="t-label">{current.stage}</span>
              </div>

              <h3 className="t-display mt-4 text-[clamp(1.35rem,3vw,2rem)]">{current.title}</h3>

              {current.org && <p className="t-mono mt-2 text-sm emissive-cyan">{current.org}</p>}
              <p className="t-label mt-2">{current.period}</p>

              <ul className="mt-6 list-none space-y-3 p-0">
                {current.points.map((point, i) => (
                  <li key={i} className="t-body flex gap-3 text-sm">
                    <span className="mt-2 h-px w-4 shrink-0 bg-[color:var(--color-amber-dim)]" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              {current.projected && (
                <p className="t-label mt-6 border-t border-[#24272f] pt-4 normal-case tracking-normal text-[color:var(--color-ash-dim)]">
                  This is a stated intention, not a completed milestone.
                </p>
              )}
            </Panel>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
