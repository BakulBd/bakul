'use client';

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
 * Mobile navigation. The rail does not survive a narrow viewport, so quick
 * access becomes a horizontal scroller pinned to the bottom — thumb-reachable
 * and never covering content (§22).
 */
export function MobileNav() {
  const activeSection = useMachine((s) => s.activeSection);

  return (
    <nav
      aria-label="Section navigation"
      className="no-print fixed bottom-0 left-0 z-40 w-full rounded-t-2xl border-t border-[#16181f] bg-[rgba(9,10,15,0.94)] backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ol className="m-0 flex list-none gap-1 overflow-x-auto p-2">
        {sections.map((s) => {
          const isActive = s.id === activeSection;
          return (
            <li key={s.id} className="shrink-0">
              <a
                href={`#section-${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(s.id);
                }}
                aria-current={isActive ? 'true' : undefined}
                className="t-label block px-3 py-2"
                style={{
                  color: isActive ? 'var(--color-amber)' : 'var(--color-ash)',
                  borderBottom: `2px solid ${isActive ? 'var(--color-amber)' : 'transparent'}`,
                }}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
