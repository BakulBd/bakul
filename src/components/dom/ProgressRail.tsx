'use client';

import { Power, Cpu, Boxes, Route, BarChart3, Send, type LucideIcon } from 'lucide-react';
import { useMachine } from '@/store/machine';
import { sections } from '@/lib/data/sections';
import { scrollToSection } from '@/hooks/useScrollEngine';

/**
 * Always-available quick navigation (§2).
 *
 * A recruiter must reach any section in one click, at any time, including
 * during standby. This is a real <nav> with real links, so it also works with
 * JavaScript disabled and reads correctly in a screen reader.
 */
export function ProgressRail() {
  const activeSection = useMachine((s) => s.activeSection);

  return (
    <nav
      aria-label="Section navigation"
      className="no-print fixed left-0 top-0 z-40 hidden h-full w-[var(--rail-w)] flex-col items-center justify-center gap-1 border-r border-[#16181f] bg-[rgba(9,10,15,0.72)] backdrop-blur-md lg:flex"
    >
      <ol className="m-0 flex list-none flex-col items-center gap-1 p-0">
        {sections.map((s, i) => {
          const isActive = s.id === activeSection;
          return (
            <li key={s.id} className="group relative">
              <a
                href={`#section-${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(s.id);
                }}
                aria-current={isActive ? 'true' : undefined}
                className="flex h-9 w-9 items-center justify-center"
              >
                <span className="sr-only">{s.label}</span>
                <span
                  aria-hidden="true"
                  className="block transition-all duration-300"
                  style={{
                    width: isActive ? '2px' : '1px',
                    height: isActive ? '22px' : '12px',
                    background: isActive ? 'var(--color-amber)' : '#3a3f4a',
                    boxShadow: isActive ? '0 0 10px var(--color-amber)' : 'none',
                  }}
                />
              </a>

              {/* Label on hover/focus — the rail stays narrow until needed. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-[calc(100%+0.6rem)] top-1/2 -translate-y-1/2 translate-x-[-4px] whitespace-nowrap rounded-md border border-[#24272f] bg-[rgba(13,15,22,0.96)] px-2.5 py-1 opacity-0 shadow-[0_12px_28px_-14px_rgba(0,0,0,0.8)] transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100"
              >
                <span className="t-label" style={{ color: 'var(--color-ceramic)' }}>
                  {String(i).padStart(2, '0')} {s.label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * One glyph per destination. A six-cell bar has roughly 60px of width per
 * cell, which is not enough for a legible word — the icon is what makes a
 * destination recognisable at a glance, and the label underneath confirms it.
 */
const SECTION_ICON: Record<string, LucideIcon> = {
  boot: Power,
  core: Cpu,
  projects: Boxes,
  experience: Route,
  impact: BarChart3,
  contact: Send,
};

/**
 * Mobile navigation. The rail does not survive a narrow viewport, so quick
 * access becomes a bar pinned to the bottom — thumb-reachable, and showing
 * every destination at once (§22).
 *
 * It used to be a horizontal scroller, which quietly failed its one job: at
 * 390px the six items measured 542px wide, so Impact and Contact sat off the
 * right edge with no scrollbar, no fade, and no other affordance suggesting
 * they existed. A visitor on a phone simply could not see that the site had a
 * contact section. A fixed six-column grid cannot overflow by construction,
 * which is the whole reason to prefer it here over anything that scrolls.
 *
 * Sized from `--nav-h` so the page's bottom clearance is derived from the same
 * number rather than a magic constant that drifts out of step with it.
 */
export function MobileNav() {
  const activeSection = useMachine((s) => s.activeSection);
  const activeIndex = Math.max(
    0,
    sections.findIndex((s) => s.id === activeSection),
  );

  return (
    <nav
      aria-label="Section navigation"
      className="mobile-nav no-print lg:hidden"
    >
      {/* Position readout: which of the six you are in, as a filled track.
          Cheap, and it gives the bar a reason to feel like an instrument
          rather than a generic tab bar. */}
      <span
        aria-hidden="true"
        className="mobile-nav__indicator"
        style={{
          width: `${100 / sections.length}%`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      <ol
        className="m-0 grid list-none p-0"
        style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}
      >
        {sections.map((s) => {
          const isActive = s.id === activeSection;
          const Icon = SECTION_ICON[s.id] ?? Boxes;
          return (
            <li key={s.id} className="min-w-0">
              <a
                href={`#section-${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(s.id);
                }}
                aria-current={isActive ? 'true' : undefined}
                className="mobile-nav__item"
                style={{ color: isActive ? 'var(--color-amber)' : 'var(--color-ash)' }}
              >
                <Icon
                  aria-hidden="true"
                  className="h-[18px] w-[18px] shrink-0"
                  style={{
                    filter: isActive ? 'drop-shadow(0 0 8px var(--color-amber))' : 'none',
                  }}
                />
                {/* Not `.t-label`: that class's 0.2em tracking is what pushed
                    the longest label past its cell. Tracking is tightened
                    here so "Experience" fits at the narrowest width the bar
                    is ever laid out at. */}
                <span className="mobile-nav__label">{s.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
