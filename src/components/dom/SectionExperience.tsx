'use client';

import { useEffect, useRef, useState } from 'react';
import { GraduationCap, Code2, Cpu, Wrench, Rocket, Sparkles, type LucideIcon } from 'lucide-react';
import { frame, useMachine } from '@/store/machine';
import { useRafScroll } from '@/hooks/useRafScroll';
import { useIsCompact } from '@/hooks/useViewport';
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
  /*
   * The selection lives in the store, not in local state.
   *
   * It was `useState` here, which meant this component had to fire its own
   * `audio.play('lock')` — the single place on the site where a component
   * played a sound directly instead of SoundBridge deriving it from a
   * transition. Promoting it to the store gives the bridge the transition it
   * needs, so a click, an arrow key and the scroll-driven advance all sound
   * identical without this file knowing that audio exists.
   */
  const active = useMachine((s) => s.activeMilestone);
  const setActive = useMachine((s) => s.setActiveMilestone);
  const [headTop, setHeadTop] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const compact = useIsCompact();

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
  };

  /* Advance the line as the section scrolls. Coalesced to one read per
     animation frame; see useRafScroll. */
  useRafScroll(() => {
    // The reader-head line only exists on a wide viewport — the compact
    // layout prints every milestone in full instead, so there is no single
    // "active" one for the scroll position to choose.
    if (compact) return;

    const el = document.getElementById('section-experience');
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) return;
    const p = Math.min(1, Math.max(0, -rect.top / total));
    setActive(Math.min(milestones.length - 1, Math.floor(p * milestones.length * 0.999)));
  }, [compact]);

  /*
   * Compact layout: the milestone crossing the middle of the screen is the
   * active one, which is what keeps the stage strip above (and the machine
   * behind) reporting where in the progression the reader currently is.
   * Same band-across-the-centre approach as the project bays.
   */
  useEffect(() => {
    if (!compact) return;
    const track = trackRef.current;
    if (!track) return;

    const cards = Array.from(track.querySelectorAll<HTMLElement>('[data-milestone]'));
    if (cards.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = Number((entry.target as HTMLElement).dataset.milestone);
          if (Number.isInteger(i)) setActive(i);
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );

    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
    // `setActive` is a Zustand action — the same function reference for the
    // lifetime of the store, so listing it costs nothing and never re-runs the
    // effect. Listed anyway rather than silencing the rule, which would stop it
    // checking `compact` too.
  }, [compact, setActive]);

  /* Keep the reader head aligned to the active row's measured centre. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // No reader head in the compact layout; the query below would match the
    // milestone cards and misplace a dot that isn't rendered.
    if (compact) return;

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
  }, [active, compact]);

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
    <Section id="experience" label="Assembly Line">
      <Reveal>
        <Heading id="experience">Assembly Line</Heading>
        <Lead>
          {compact
            ? 'Progression from student to builder, in order — every milestone in full, oldest first.'
            : 'Progression from student to builder, in order. Each milestone passes through the reader — scroll to advance the line, or select any stage directly.'}
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
                transition: 'width var(--dur-4) var(--ease-out-quart)',
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

      {/*
        COMPACT: the whole line, printed.

        The wide layout is a reader head travelling a track, with the locked
        milestone's detail in the panel beside it. In one column that becomes
        a list of ten dates above the details of exactly one of them — and
        since the same scroll that advances the line also scrolls the panel,
        a reader on a phone watches the text they are reading get replaced
        underneath them. A timeline is already the natural shape for this on a
        phone, so it is rendered as one: every milestone, in order, complete.
      */}
      {compact ? (
        <div
          ref={trackRef}
          className="relative mt-9 space-y-4 border-l border-[#24272f] pl-4"
        >
          {milestones.map((m, i) => {
            const Icon = STAGE_ICON[m.stage];
            return (
              <Reveal key={m.id} delay={Math.min(i, 3) * 60}>
                <article data-milestone={i} className="relative">
                  {/* Node on the spine, aligned to the card's header row. */}
                  <span
                    aria-hidden="true"
                    className="absolute -left-[calc(1rem+5px)] top-6 h-2.5 w-2.5 rounded-full"
                    style={{
                      background: m.projected ? '#2a2e37' : 'var(--color-amber)',
                      boxShadow: m.projected ? 'none' : '0 0 12px var(--color-amber)',
                    }}
                  />
                  <Panel className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                      <Status state={m.projected ? 'idle' : m.ongoing ? 'online' : 'amber'}>
                        {m.projected ? 'Projected' : m.ongoing ? 'Active' : 'Complete'}
                      </Status>
                      <span className="t-label inline-flex items-center gap-1.5">
                        <Icon aria-hidden="true" className="h-3 w-3" />
                        {m.stage}
                      </span>
                    </div>

                    <h3 className="t-display mt-3 text-[1.15rem] leading-tight">{m.title}</h3>
                    {m.org && <p className="t-mono mt-1.5 text-xs emissive-cyan">{m.org}</p>}
                    <p className="t-label mt-1.5">{m.period}</p>

                    <ul className="mt-4 list-none space-y-2.5 p-0">
                      {m.points.map((point, pi) => (
                        <li key={pi} className="t-body flex gap-2.5 text-sm">
                          <span
                            className="mt-2 h-px w-3 shrink-0 bg-[color:var(--color-amber-dim)]"
                            aria-hidden="true"
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>

                    {m.projected && (
                      <p className="t-label mt-4 border-t border-[#24272f] pt-3 normal-case tracking-normal text-[color:var(--color-ash-dim)]">
                        A stated intention, not a completed milestone.
                      </p>
                    )}
                  </Panel>
                </article>
              </Reveal>
            );
          })}
        </div>
      ) : (
      <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ---------- The line ---------- */}
        <Reveal delay={100}>
          <div
            ref={trackRef}
            role="listbox"
            aria-label="Career milestones"
            /* States which region this line drives — see the note on that
               region for why it is a named landmark and not a live one. */
            aria-controls="milestone-detail"
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
                transition: 'top var(--dur-4) var(--ease-out-quart), opacity var(--dur-3) var(--ease-standard)',
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
                    transition:
                      'transform var(--dur-4) var(--ease-out-quart), background-color var(--dur-3) var(--ease-standard), border-color var(--dur-3) var(--ease-standard)',
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
          {/*
            Named region, not a live region.

            `active` is advanced by scroll position (see the useRafScroll
            above), so `aria-live="polite"` here meant scrolling through this
            section re-read the whole locked milestone — heading, organisation,
            period and every bullet — at a screen-reader user repeatedly, as a
            side effect of a gesture they did not aim at this panel. The
            selection itself is already announced where it is made: the rows are
            real `option`s carrying `aria-selected`, so arrow-key navigation
            reports the change the visitor actually initiated.
          */}
          <div
            id="milestone-detail"
            role="region"
            aria-label={`Milestone detail — ${current.title}`}
          >
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
      )}
    </Section>
  );
}
