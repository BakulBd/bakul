'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * MAKE A SCROLL CONTAINER KEYBOARD-OPERABLE — BUT ONLY WHILE IT SCROLLS.
 *
 * ── The failure this fixes ──────────────────────────────────────────────
 * An element with `overflow: auto` and content past its edge can be scrolled
 * with a wheel, a trackpad and a finger. It cannot be scrolled with a keyboard
 * unless something inside it can take focus, because arrow keys scroll the
 * focused scroller and there is no way to focus one that contains only text.
 *
 * That is WCAG 2.1.1 (Keyboard), and axe reports it as `scrollable-region-
 * focusable` at serious impact. Audited against this build, it was failing in
 * two places that both hold the page's actual argument:
 *
 *   · The project case study. `ModuleDetail`'s `<dl>` is the panel's only
 *     `flex-1` child and scrolls internally on any window shorter than about
 *     1440px — so problem, solution, architecture, challenge and result were
 *     partly unreachable to a keyboard-only visitor on most laptops. This got
 *     *more* important after the pinned-stage budget fix, not less: that change
 *     enlarged the scroll box rather than removing it.
 *   · Every `.lab-table-wrap` in the Lab. Thirteen of them, each holding a
 *     table of measured results, each scrolling sideways on a phone.
 *
 * ── Why not just put `tabindex="0"` on them ─────────────────────────────
 * Because a tab stop is a promise that there is something here to do, and most
 * of these containers do not scroll most of the time. A bench page has up to
 * three tables; making all three permanent tab stops on a desktop where none of
 * them overflows adds three dead stops between the controls and the results,
 * for every keyboard user, forever. The stop has to appear exactly when the
 * scroll does.
 *
 * Chromium 127+ does this natively — a scroll container with no focusable
 * children becomes keyboard-focusable on its own. Firefox and Safari do not, so
 * this stays until they do; on Chromium it simply agrees with the browser.
 *
 * ── How the measurement stays correct ───────────────────────────────────
 * Overflow here is a function of two things that change independently: the
 * container's width (the window resizing, the Lab's sticky sidebar re-laying
 * out) and the content's width (a slider adding rows to a table, a different
 * algorithm producing a longer trace). One `ResizeObserver` watching both the
 * element and its first child catches both, and it fires on the initial layout
 * too, so there is no separate mount-time measurement to keep in step.
 *
 * `contentRect` is deliberately not read. The observer is used only as a signal
 * that *something* changed; the answer always comes from `scrollWidth` vs
 * `clientWidth` on the element itself, which is the only pair that accounts for
 * borders, padding and sub-pixel rounding the same way the browser's own
 * scrollability test does.
 */
export function useScrollableFocus<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [scrollable, setScrollable] = useState(false);

  /*
   * A callback ref rather than a plain one.
   *
   * These containers are mounted and unmounted by bench switches and by the
   * project rack's `hidden` panels, and a plain ref gives an effect no way to
   * know the node changed — it would measure whatever was there on mount and
   * never look again. The callback fires on every attach and detach.
   */
  const [node, setNode] = useState<T | null>(null);
  const attach = useCallback((el: T | null) => {
    ref.current = el;
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node) {
      setScrollable(false);
      return;
    }

    const measure = () => {
      // A one-pixel tolerance: sub-pixel layout regularly leaves scrollWidth a
      // fraction above clientWidth on an element that cannot actually scroll,
      // and a tab stop that flickers in and out at certain window widths is
      // worse than one that is slightly late to appear.
      setScrollable(
        node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1,
      );
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(node);
    // The content, not just the box. A table growing rows inside a fixed-width
    // wrapper changes nothing the wrapper's own observer would report.
    if (node.firstElementChild) ro.observe(node.firstElementChild);

    return () => ro.disconnect();
  }, [node]);

  /**
   * Spread onto the scroll container.
   *
   * The name is required, not optional — a focusable element with no accessible
   * name is a tab stop that announces nothing, which is a worse outcome than
   * the bug this fixes.
   *
   * ── Why `role` is a parameter and not a constant ────────────────────────
   * It defaulted to `'group'`, which is right for the generic `<div>` that
   * wraps a wide table: `group` names the box without claiming it is a section
   * of the document, where `region` would add a landmark for what is really a
   * layout accident — and a bench with three tables would add three.
   *
   * It is wrong for an element that already has a meaningful implicit role. The
   * project case study's scroll container *is* the `<dl>`, and `role="group"`
   * replaced its list semantics: its own `<dt>` and `<dd>` children were
   * immediately orphaned, which axe reports as `dlitem` at serious impact — a
   * worse violation than the one being fixed, introduced by fixing it.
   *
   * So the role is the caller's decision, and passing `null` keeps whatever the
   * element already is. `tabIndex` and the name are what the keyboard fix
   * actually needs; the role was never load-bearing.
   */
  const props = (label: string, role: 'group' | null = 'group') =>
    scrollable
      ? ({
          ref: attach,
          tabIndex: 0,
          'aria-label': label,
          ...(role ? { role } : {}),
        } as const)
      : ({ ref: attach } as const);

  return { ref, attach, scrollable, props };
}
