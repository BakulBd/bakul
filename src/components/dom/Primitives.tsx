'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { sectionById, type Phase } from '@/lib/data/sections';
import { useRafScroll } from '@/hooks/useRafScroll';
import { useMachine } from '@/store/machine';

/**
 * Shared DOM primitives for the machine's interface layer.
 * Every one of these is a real semantic element first and a visual second.
 */

/**
 * Ambient wash per phase — amber while the copy is about the physical
 * machine, cyan once it turns to results and outcomes. Tied to the site's
 * own narrative rather than picked for decoration.
 */
const TONE_BY_PHASE: Partial<Record<Phase, 'amber' | 'cyan'>> = {
  CORE: 'amber',
  PROJECTS: 'amber',
  EXPERIENCE: 'cyan',
  IMPACT: 'cyan',
  CONTACT: 'cyan',
};

/**
 * A full section of the experience. Sections are real landmarks with real
 * headings, so the page outlines correctly in a screen reader and the 3D layer
 * is never the only source of information (§21).
 */
export function Section({
  id,
  label,
  index,
  /**
   * Narrow sections hold the content to a left column so the 3D layer stays
   * visible beside it. Used where the scene is the point — the signature
   * transformation is worthless if the DOM covers it.
   */
  narrow = false,
  children,
}: {
  id: string;
  label: string;
  index: string;
  narrow?: boolean;
  children: ReactNode;
}) {
  // Height comes from the section registry, which is also what derives the
  // camera settle points. Passing it separately would let the markup and the
  // choreography drift apart silently.
  const section = sectionById(id);
  const heightVh = (section?.height ?? 1) * 100;
  const tone = section ? TONE_BY_PHASE[section.phase] : undefined;

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useMachine((s) => s.reducedMotion);

  /*
   * Cross-dissolve between segments.
   *
   * Each section's content is pinned for the length of its own scroll window,
   * so without this it sits at full opacity right up until the moment it is
   * scrolled off and the next one hard-cuts in behind it. That reads as a
   * seam — a gap between segments rather than one continuous machine — and it
   * is the single most visible thing separating this from a piece of motion
   * design.
   *
   * Driven off the section's own rect rather than a shared scroll fraction so
   * it stays correct at any section height, and written straight to style: a
   * per-frame React state update here would re-render every section's whole
   * subtree on every scroll frame, which is exactly the cost the frame
   * singleton exists to avoid.
   */
  useRafScroll(() => {
    const el = sectionRef.current;
    const stage = stageRef.current;
    if (!el || !stage) return;

    if (reducedMotion) {
      stage.style.opacity = '1';
      stage.style.transform = 'none';
      return;
    }

    const vh = window.innerHeight;
    const rect = el.getBoundingClientRect();

    // Generous plateaus at both ends: fully settled for the whole time the
    // section is actually being read, moving only at the hand-off.
    const enter = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.55)));
    const exit = Math.min(1, Math.max(0, (vh * 0.5 - rect.bottom) / (vh * 0.5)));

    const ease = (k: number) => k * k * (3 - 2 * k);
    const inK = ease(enter);
    const outK = ease(exit);

    stage.style.opacity = String(inK * (1 - outK));
    stage.style.transform = `translate3d(0, ${(1 - inK) * 26 - outK * 26}px, 0)`;
  });

  return (
    <section
      ref={sectionRef}
      id={`section-${id}`}
      aria-labelledby={`heading-${id}`}
      style={{ minHeight: `${heightVh}vh` }}
      className="relative w-full"
    >
      {tone && <div className="section-glow" data-tone={tone} aria-hidden="true" />}

      <div className="sticky top-0 z-[1] flex min-h-screen items-center py-24">
        <div
          ref={stageRef}
          // `will-change` is deliberate and scoped: this element's transform
          // and opacity genuinely change on most scroll frames.
          style={{ willChange: 'opacity, transform' }}
          className={`w-full px-6 md:px-10 lg:pl-[calc(var(--rail-w)+2.5rem)] ${
            narrow ? 'max-w-[680px]' : 'mx-auto max-w-[1240px]'
          }`}
        >
          <div className="mb-7 flex items-center gap-3">
            <span className="t-label emissive-amber">{index}</span>
            <span className="h-px w-8 bg-[#33373f]" aria-hidden="true" />
            <span className="t-label">{label}</span>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

/** Reveals children once scrolled into view. Respects reduced motion. */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '-8% 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Section heading. Consistent scale, always a real <h2>. */
export function Heading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={`heading-${id}`}
      className="t-display text-[clamp(2.1rem,6vw,4.2rem)] text-[color:var(--color-ceramic)]"
    >
      {children}
    </h2>
  );
}

/** Lead paragraph under a heading. */
export function Lead({ children }: { children: ReactNode }) {
  return <p className="t-body mt-5 max-w-[62ch] text-[clamp(0.98rem,1.6vw,1.14rem)]">{children}</p>;
}

/** A titanium readout panel. */
export function Panel({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'li';
}) {
  return <Tag className={`panel ${className}`}>{children}</Tag>;
}

/**
 * Key/value readout row, used across Core, Projects, and Impact.
 *
 * The label column is fixed at 8rem rather than 10rem, and labels are kept to
 * a single word wherever possible: a two-word label wrapped onto a second
 * line inside a narrow column, which pushed its own value out of vertical
 * alignment with every other row and made a tidy table look ragged.
 */
export function Readout({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-t border-[#24272f] py-3 sm:flex-row sm:gap-6">
      <dt className="t-label shrink-0 pt-0.5 sm:w-32">{k}</dt>
      <dd className="t-body m-0 min-w-0 text-sm leading-relaxed">{v}</dd>
    </div>
  );
}

/** Status pill with an LED. */
export function Status({
  state,
  children,
}: {
  state: 'online' | 'idle' | 'amber';
  children: ReactNode;
}) {
  const led = state === 'online' ? 'led-on' : state === 'amber' ? 'led-amber' : 'led-idle';
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`led ${led}`} aria-hidden="true" />
      <span className="t-label">{children}</span>
    </span>
  );
}

/**
 * Animated counter. Counts real values only, and starts from the true value
 * when motion is reduced so the number is never wrong on screen.
 */
export function Counter({
  value,
  precision = 0,
  suffix = '',
}: {
  value: number;
  precision?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }

    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return;
      started.current = true;
      io.disconnect();

      const duration = 1250;
      const start = performance.now();
      let raf = 0;

      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        // Ease-out cubic: fast then settling, like a gauge finding its value.
        setDisplay(value * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    });

    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toFixed(precision)}
      {suffix}
    </span>
  );
}
