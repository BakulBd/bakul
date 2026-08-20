'use client';

import { useEffect, useRef, useState } from 'react';
import { useIsCompact } from '@/hooks/useViewport';
import { useRafScroll } from '@/hooks/useRafScroll';
import { frame, useMachine } from '@/store/machine';

/**
 * THE MACHINE, UNOBSTRUCTED — a compact-viewport moment.
 *
 * ── The problem this exists to solve ────────────────────────────────────
 * On a wide screen the machine is never hidden: the reading column occupies
 * the left of the viewport and the readability scrim clears to nothing on the
 * right, so the scene is on show for the entire visit. That composition has
 * no meaning on a phone, where the content is full-width — so the scrim there
 * is a near-flat 0.9-opacity wash across the whole screen, and above it sit
 * opaque panels. The result is a site whose entire premise is a living
 * machine, on which a phone visitor never actually sees one.
 *
 * Rather than weaken the scrim globally — which would cost the legibility it
 * exists to guarantee — the page gives the machine a room of its own. For one
 * full screen, the content steps aside, the scrim lifts, and the scene is the
 * only thing on the display. It is placed at the transformation, so the
 * moment the visitor is given is the one worth having.
 *
 * ── Why the scrim is driven from here ───────────────────────────────────
 * The scrim is a single fixed element shared by the whole page, so its
 * opacity is a page-level concern expressed as a custom property. This
 * component only reports how close it is to centre; globals.css decides what
 * that means. Written straight to the root element's style rather than
 * through React state so a scroll-linked value never re-renders the tree.
 */
/**
 * `index` is deliberately absent.
 *
 * Every numbered section on this page derives its ordinal from the section
 * registry (see `sectionIndex`), and this screen is not in that registry — it
 * is an interstitial that exists only on a compact viewport, inserted between
 * the project rack and the assembly line. It used to print a hard-coded "03",
 * which was correct only for the nine-section layout it was written for; once
 * the numbers became derived, that literal collided with the assembly line's
 * own 03 and a phone showed the same ordinal twice.
 *
 * Rather than invent a number for something that has no position in the
 * sequence — 02.5 is not a section, and renumbering the real sections around
 * an interlude would be worse — this screen carries its label alone. The rule
 * and the label keep it in the same visual family as its neighbours without
 * claiming to be one of them.
 */
export function MachineViewport({
  label,
  title,
  caption,
}: {
  label: string;
  title: string;
  caption: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const compact = useIsCompact();
  const reducedMotion = useMachine((s) => s.reducedMotion);
  const [visible, setVisible] = useState(false);

  /*
   * Ramp the scrim with how much of the screen this section actually
   * occupies — not with its own intersection ratio.
   *
   * The ratio is the fraction of *the section* that is visible, which stays
   * near 1.0 while the section is leaving and the next one is arriving. Drive
   * the scrim from that and the clearance persists over the top of the
   * following section: measured at 0.23 with 300px of Assembly Line already
   * on screen, which put a heading and a lead paragraph straight onto the
   * unprotected particle field.
   *
   * The fraction of the *viewport* this section covers is the quantity that
   * actually matters, because the scrim is only safe to lift while there is
   * nothing else on screen to protect. It reaches 1 only when this section
   * fills the display, and falls away as soon as it starts sharing.
   */
  useRafScroll(() => {
    const el = ref.current;
    if (!el || !compact) return;

    const vh = window.innerHeight;
    const rect = el.getBoundingClientRect();

    const covered = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
    const fraction = vh > 0 ? covered / vh : 0;

    // Nothing happens below 55% coverage; full clearance only near-total.
    const k = Math.min(1, Math.max(0, (fraction - 0.55) / 0.4));
    const clear = k * k * (3 - 2 * k);

    document.documentElement.style.setProperty('--scrim', String(1 - clear * 0.88));
    setVisible(fraction > 0.35);
  }, [compact]);

  useEffect(() => {
    // Never leave the page holding a lifted scrim — if this unmounts while
    // centred (a resize across the breakpoint, a route change), every section
    // below it would render over an unprotected canvas.
    return () => {
      document.documentElement.style.removeProperty('--scrim');
    };
  }, []);

  // Wide viewports already show the machine continuously; a dedicated screen
  // for it there would be a screen that repeats what is already on screen.
  if (!compact) return null;

  return (
    <section
      ref={ref}
      aria-labelledby="heading-viewport"
      className="relative flex min-h-[100dvh] flex-col justify-between px-5 py-16 sm:px-6"
    >
      <div>
        <div className="mb-6 flex items-center gap-3">
          <span className="h-px w-8 bg-[color:var(--color-amber-dim)]" aria-hidden="true" />
          <span className="t-label">{label}</span>
        </div>
        <h2
          id="heading-viewport"
          className="t-display max-w-[14ch] text-[clamp(2rem,9vw,3rem)]"
          style={{
            opacity: visible || reducedMotion ? 1 : 0,
            transform: visible || reducedMotion ? 'translateY(0)' : 'translateY(14px)',
            transition:
              'opacity var(--dur-5) var(--ease-standard), transform var(--dur-5) var(--ease-out-quart)',
          }}
        >
          {title}
        </h2>
      </div>

      {/*
        Nothing occupies the middle of this screen. That emptiness is the
        whole feature — it is the only place in the compact layout where the
        machine is the subject rather than the backdrop.

        It is also the only place a touch can reach it. The canvas itself is
        `pointer-events: none` (it must be, or it would swallow every scroll
        on the page), so on a phone the machine is the one thing on the site
        that cannot be touched — precisely here, on the screen built to make
        it the subject. This pad sits over that empty middle and sends the
        same activation wave a subsystem or a bay selection sends, so the
        field ripples under the finger.

        A plain div with a pointer handler rather than a button: it exposes no
        action, changes no state a visitor could need, and announcing it to a
        screen reader would be announcing a decoration. Everything this screen
        communicates is in the heading and caption around it.
      */}
      <div
        aria-hidden="true"
        onPointerDown={() => {
          frame.pulse = 1;
        }}
        className="absolute inset-x-0 top-1/4 h-1/2"
      />


      <p
        className="t-body max-w-[38ch] text-sm"
        style={{
          opacity: visible || reducedMotion ? 1 : 0,
          transition: 'opacity 1.1s ease-out 0.2s',
          // A local shadow instead of the page scrim: this text has to stay
          // readable precisely where the scrim has been taken away.
          textShadow: '0 1px 12px rgba(9,10,15,0.95), 0 0 3px rgba(9,10,15,0.9)',
        }}
      >
        {caption}
      </p>
    </section>
  );
}
