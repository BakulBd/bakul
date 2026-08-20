'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { sectionById, sectionIndex, type Phase } from '@/lib/data/sections';
import { useRafScroll } from '@/hooks/useRafScroll';
import { useIsCompact } from '@/hooks/useViewport';
import { useMachine } from '@/store/machine';

/**
 * Shared DOM primitives for the machine's interface layer.
 * Every one of these is a real semantic element first and a visual second.
 */

/**
 * Whether a section gets an ambient wash at all.
 *
 * The wash's *colour* is no longer decided here. It used to be: this returned
 * 'amber' or 'cyan' per phase and the CSS selected one of two fixed gradient
 * pairs, which made the hand-off a step change at a phase boundary while the
 * 3D lighting rig — reading the same narrative tone as a smooth scalar — was
 * still mid-crossfade. The colour is now interpolated in CSS from the `--tone`
 * custom property that the scroll engine publishes off `toneAt`, so both
 * layers move together by construction. See `.section-glow` in globals.css.
 *
 * What remains a per-phase decision is whether there is anything to report:
 * during boot nothing has been powered on yet, so a section in that state
 * deliberately has no wash rather than a wash at tone zero.
 */
function hasWash(phase: Phase): boolean {
  return phase !== 'BOOT' && phase !== 'ACTIVATING';
}

/**
 * A full section of the experience. Sections are real landmarks with real
 * headings, so the page outlines correctly in a screen reader and the 3D layer
 * is never the only source of information (§21).
 */
export function Section({
  id,
  label,
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
  narrow?: boolean;
  children: ReactNode;
}) {
  // Height comes from the section registry, which is also what derives the
  // camera settle points. Passing it separately would let the markup and the
  // choreography drift apart silently.
  const section = sectionById(id);
  const heightVh = (section?.height ?? 1) * 100;
  const wash = section ? hasWash(section.phase) : false;
  // Read from the registry rather than passed in — see `sectionIndex` for the
  // stale-numbering bug that made every section's number a derived value.
  const index = sectionIndex(id);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useMachine((s) => s.reducedMotion);

  /*
   * PINNING IS A WIDE-VIEWPORT AFFORDANCE, NOT A UNIVERSAL ONE.
   *
   * The pinned stage works on a wide screen because the content fits inside
   * one viewport there: it holds still, the machine reconfigures behind it,
   * and the scroll length of the section becomes dwell time.
   *
   * On a phone the same content is 900–2600px tall against an 844px viewport,
   * and the whole premise inverts. A sticky box taller than the viewport
   * sticks at top:0 with its bottom permanently clipped, then releases at the
   * end of its container — so the section renders as a truncated block
   * followed by several hundred pixels of nothing (measured: 806px of void
   * after Projects, 448px after Experience). The pinning is buying dwell time
   * for content that needs to be scrolled through, and paying for it by
   * hiding the bottom of that content.
   *
   * So: pinned when there is room to pin, a plain document flow when there
   * isn't. Nothing about the choreography is lost — the camera reads measured
   * settle points (see measureStations), so it stays synchronised with
   * whatever layout is actually on screen.
   */
  const compact = useIsCompact();

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
   *
   * Suppressed entirely when not pinned. The dissolve assumes the section is
   * held still while it is read; against a section you scroll *through*, the
   * same curve fades the copy out from under the reader mid-paragraph.
   * Entrance animation on a compact viewport is `Reveal`'s job instead.
   */
  useRafScroll(() => {
    const el = sectionRef.current;
    const stage = stageRef.current;
    if (!el || !stage) return;

    if (reducedMotion || compact) {
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
  }, [compact, reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id={`section-${id}`}
      aria-labelledby={`heading-${id}`}
      // Natural height when unpinned: the scroll length of a compact section
      // is however tall its content is, not a figure from the registry.
      style={compact ? undefined : { minHeight: `${heightVh}vh` }}
      className="relative w-full"
    >
      {wash && <div className="section-glow" aria-hidden="true" />}

      <div
        className={
          compact
            ? 'relative z-[1] py-14'
            : 'sticky top-0 z-[1] flex min-h-[100dvh] items-center py-24'
        }
      >
        <div
          ref={stageRef}
          // `will-change` is deliberate and scoped: this element's transform
          // and opacity genuinely change on most scroll frames — but only
          // while the dissolve is running. Promoting a layer per section on a
          // phone, where the dissolve is off, is pure memory for no motion.
          style={compact ? undefined : { willChange: 'opacity, transform' }}
          className={`w-full px-5 sm:px-6 md:px-10 lg:pl-[calc(var(--rail-w)+2.5rem)] ${
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
        transition: `opacity var(--dur-5) var(--ease-out-quart) ${delay}ms, transform var(--dur-5) var(--ease-out-quart) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Section heading. Consistent scale, always a real <h2>.
 *
 * The reveal is a mask, not a fade: the text rises into view from behind its
 * own baseline, the way a title card resolves. Every other reveal on this
 * page is the same 14px fade, and applying that to the one element the eye
 * lands on first is where a site stops reading as designed and starts reading
 * as templated — the headings are the page's punctuation and they should
 * arrive like it.
 *
 * The mechanism is an `overflow: hidden` wrapper with the text translated
 * fully below it, which composites as one transform on one layer. A per-word
 * or per-character split would be the fashionable version of this and costs a
 * DOM node per token plus a layout pass; at this type size the whole line
 * arriving as one object reads more deliberate anyway.
 *
 * The <h2> itself is never the animated element — the transform lives on an
 * inner span — so the heading's own box, which `aria-labelledby` and the skip
 * link both resolve against, is always its real size and position.
 */
export function Heading({ id, children }: { id: string; children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
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
        if (!entry.isIntersecting) return;
        setShown(true);
        io.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <h2
      ref={ref}
      id={`heading-${id}`}
      className="t-display text-[clamp(2.1rem,6vw,4.2rem)] text-[color:var(--color-ceramic)]"
    >
      {/* `pb`/`-mb` pair: descenders (g, y, j) sit below the baseline, and an
          overflow-hidden box drawn to the line box alone would clip them off
          for the whole animation and then pop them back. The padding gives
          the mask somewhere to put them; the negative margin keeps the
          heading's outer size unchanged. */}
      <span className="block overflow-hidden pb-[0.14em] mb-[-0.14em]">
        <span
          className="block"
          style={{
            transform: shown ? 'translateY(0)' : 'translateY(105%)',
            transition: 'transform var(--dur-6) var(--ease-out-quart)',
          }}
        >
          {children}
        </span>
      </span>
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
  /*
   * Starts at the real value, not at zero.
   *
   * This component is server-rendered like everything else, and `useState(0)`
   * meant the HTML Next.js actually sends read "0" for every figure in the
   * Impact section. So the five most quotable numbers on the site — the CGPA,
   * the award, the 300+ scholarships — did not exist for anything that does
   * not execute JavaScript, and did not exist for a visitor whose bundle
   * failed to load. The count-up is an enhancement layered on top of a correct
   * number, which is the same rule the 3D layer follows.
   */
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Already showing the true value, so there is nothing to do but leave it.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /*
     * `raf` lives here, in effect scope.
     *
     * It used to be declared inside the observer callback with the
     * `cancelAnimationFrame` returned from there — but a value returned from
     * an IntersectionObserver callback goes nowhere at all. React only ever
     * received the `io.disconnect()` below, so unmounting mid-count left the
     * loop running and calling setState on a dead component once per frame
     * until the animation happened to finish.
     */
    let raf = 0;
    /** Have we wound the readout back to zero, i.e. is a count-up owed? */
    let armed = false;

    const io = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;

      if (!entry.isIntersecting) {
        /*
         * Off screen. Reset to zero now, while nobody can see it happen, so
         * the count-up has somewhere to start from. This is the normal path:
         * Impact sits several screens down the page.
         */
        if (!armed) {
          armed = true;
          setDisplay(0);
        }
        return;
      }

      io.disconnect();

      /*
       * Visible without ever having been off screen — above the fold, or
       * landed on directly via a `#section-impact` fragment. Winding a number
       * the visitor has already read back to zero so it can count up again is
       * worse than not animating, so this leaves it settled.
       */
      if (!armed) return;

      const duration = 1250;
      const start = performance.now();

      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        // Ease-out cubic: fast then settling, like a gauge finding its value.
        setDisplay(value * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });

    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toFixed(precision)}
      {/*
        THE SUFFIX IS NOT THE FIGURE.

        Every suffix this takes is a unit or a scale — ' / 4.00', ' sem', '+' —
        and each was being set at the full headline size, which states that
        "4.00" carries the same weight as "3.96". It does not: one is the
        reading and the other is the reference it is read against. An instrument
        prints the value large and its scale small, and that is the whole reason
        this is a typographic rule here rather than a per-card override.

        It also fixes a measured overflow. `3.96 / 4.00` at 2.6rem needs about
        201px of Space Grotesk; the five-up cell's content box is 160.8px at the
        1240px container cap and 117.6px at 1024px, so the flagship number on
        the page — the one a recruiter scans this section for — wrapped onto two
        lines at every desktop width. At 0.5em the pair measures about 142px and
        sits on one line, without shrinking the value itself to get there.

        `tabular-nums` is on the parent, so `4.00` keeps its tabular advances.
        Baseline alignment is the default for an inline span and is what a unit
        wants — nothing here is a superscript.
      */}
      {suffix && <span style={{ fontSize: '0.5em' }}>{suffix}</span>}
    </span>
  );
}
