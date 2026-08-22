'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { haptic } from '@/lib/haptics';

import { DEFAULT_BENCH, benchFragment } from '@/lib/lab/catalogue';
import { RAIL_ORDER, REGISTERED_GROUPS, findRegistered } from './registry';

/**
 * THE LAB SHELL
 *
 * Owns the rack: which bench is showing, how it is reached, and how it is
 * addressed. Everything visual is deliberately quiet — the benches are the
 * subject, and a shell that competed with them would be decoration.
 *
 * ── Why a grouped rail instead of a strip of tabs ───────────────────────
 * The first version was a horizontal row of two tabs. Two is fine; the rack is
 * built to hold more, and a horizontal strip fails in a specific way as it
 * fills: on a phone the later tabs sit off-screen behind a scroll nobody knows
 * is there, and on a desktop eight equal-weight words in a line give a visitor
 * no way to tell which ones are related. Grouping into racks — Algorithms,
 * Systems, Languages, Intelligence — turns the list into a map of the subject
 * rather than a menu, so a recruiter looking for evidence of one course can find
 * it without reading all eight labels.
 *
 * ── Why the selection lives in the URL ──────────────────────────────────
 * `?bench=compiler` makes a bench a linkable thing. Without it, "look at this"
 * is "go here, then click the third tab", and a reload silently throws the
 * visitor back to the first bench. It is written with `history.replaceState`
 * rather than a router navigation for two reasons:
 *
 *   1. `router.replace` re-runs the App Router's navigation machinery for what
 *      is a purely client-side toggle, which on this page means re-rendering
 *      the server component tree to change one query parameter.
 *   2. `replaceState` does not add a history entry, so the browser Back button
 *      still means "leave the lab" rather than "undo my last tab click" five
 *      times over.
 *
 * Switching benches clears the rest of the query string. Every parameter other
 * than `bench` belongs to a bench — a seed, an input size, a register budget —
 * and carrying the sorting bench's `seed=4821` into the compiler bench would
 * leave a parameter in the URL that nothing reads and that a visitor would
 * reasonably assume meant something.
 *
 * ── Why the panel's id is `bench-<id>` ─────────────────────────────────
 * `src/lib/seo.ts` publishes each bench as a `SoftwareApplication` whose `@id`
 * is `/lab#bench-<id>`, and the page's `hasPart` points at those. A
 * structured-data `@id` that resolves to nothing in the document is a claim
 * with no referent, so the panel carries that exact id and the mount effect
 * accepts the fragment as a selector.
 *
 * ── Why the rail is one tablist with presentational groups ─────────────
 * WAI-ARIA's tabs pattern wants a `tablist` whose owned children are `tab`s,
 * which a naive nesting of group `<div>`s would break. The alternatives were
 * worse: four separate tablists controlling one panel gives a keyboard user
 * four tab stops to get to the last bench, and flattening the groups away loses
 * the information the grouping exists to carry. So the group wrappers are
 * `role="presentation"` — which makes the tabs the tablist's semantic children
 * — the group heading is `aria-hidden` because its text is not a control, and
 * each tab points at that heading with `aria-describedby`. `aria-describedby`
 * is explicitly allowed to reference hidden elements, so the rack name reaches
 * a screen reader as a description ("Sorting… Algorithms") without being
 * welded into every tab's accessible name.
 *
 * ── Why the inactive bench unmounts ────────────────────────────────────
 * Only the selected panel is rendered. Keeping them all mounted and hiding all
 * but one would leave every bench's rAF playhead running behind the visible
 * one — burning frames to animate things nobody can see. Unmounting also means
 * switching back gives a clean bench rather than a half-played sort, which is
 * what a visitor expects from picking up an instrument again.
 */

export function LabShell({
  /**
   * The bench `?bench=` asked for, resolved on the server.
   *
   * A prop rather than something read here, because reading it here is one
   * render too late: this component is server-rendered, and the panel header and
   * the rail's `aria-selected` are part of that output. See the note at the top
   * of `src/app/lab/page.tsx` for what that cost and why the route now pays for
   * dynamic rendering to fix it.
   */
  initialBench,
}: {
  initialBench: string;
}) {
  /*
   * Seeded from the server's answer, so the server render and the first client
   * render agree by construction rather than by both happening to default to the
   * same bench. That agreement is what the hydration match actually requires —
   * see the same rule and the React #418 error that taught it in
   * `Experience.tsx`.
   */
  const [benchId, setBenchId] = useState<string>(initialBench);
  const railRef = useRef<HTMLDivElement>(null);

  /*
   * The fragment, and only the fragment.
   *
   * `?bench=` is resolved before this component renders now, so reading it again
   * here would be a second implementation of one rule with a render's delay
   * attached — and the delay was the whole defect.
   *
   * The fragment still needs a client pass, because a fragment never reaches the
   * server. It matters for two shapes: the `#bench-…` anchors published by the
   * structured data and handed out by the command palette should *select* a
   * bench rather than point at an element that only exists once that bench is
   * already showing, and `/lab#bench-scheduler` with no query at all is a link a
   * person writes by hand.
   *
   * The guard keeps the old precedence: if the query already named a bench, the
   * server has applied it and a fragment disagreeing with it does not get to
   * flip the rack after paint.
   *
   * `useSearchParams` stays deliberately unused. Reading it would opt this
   * subtree into needing a `<Suspense>` boundary, and would put the query
   * parameter back a render late — both of the things this arrangement avoids.
   */
  useEffect(() => {
    if (findRegistered(new URLSearchParams(window.location.search).get('bench'))) return;

    const fromHash = window.location.hash.replace(/^#bench-/, '');
    if (findRegistered(fromHash)) setBenchId(fromHash);
  }, []);

  const select = useCallback((id: string, options?: { focus?: boolean }) => {
    setBenchId(id);
    haptic('lock');

    /*
     * Rebuilt rather than mutated: `new URL(...)` then `.searchParams.set()`
     * would preserve the previous bench's parameters, and the whole point is
     * that they do not survive the switch. The fragment goes with it, so a
     * shared link addresses the bench two ways that agree.
     */
    const path = id === DEFAULT_BENCH.id ? '/lab' : `/lab?bench=${id}`;
    window.history.replaceState(null, '', `${path}#${benchFragment(id)}`);

    if (options?.focus) {
      // Move focus into the panel, so a visitor who arrived by shortcut is
      // standing in the bench rather than wherever they were before.
      requestAnimationFrame(() => {
        document.getElementById(benchFragment(id))?.focus();
      });
    }
  }, []);

  /**
   * Arrow-key navigation within the rail, with focus following selection.
   *
   * Both axes are handled regardless of how the rail is currently laid out.
   * The rail is a vertical column on a desktop and a horizontal scroll strip on
   * a phone, and reading the layout back out of CSS to decide which keys count
   * would mean a media query in JavaScript to service a case — arrow keys on a
   * touch device — that barely exists. Accepting all four is smaller, and being
   * forgiving about which arrow a visitor reaches for is not a defect.
   */
  const onRailKeyDown = (e: React.KeyboardEvent) => {
    const from = RAIL_ORDER.findIndex((b) => b.id === benchId);
    let to = -1;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        to = (from + 1) % RAIL_ORDER.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        to = (from - 1 + RAIL_ORDER.length) % RAIL_ORDER.length;
        break;
      case 'Home':
        to = 0;
        break;
      case 'End':
        to = RAIL_ORDER.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    select(RAIL_ORDER[to].id);
    railRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')?.[to]?.focus();
  };

  /*
   * KEEP THE SELECTED BENCH IN VIEW IN THE RAIL.
   *
   * On a phone the rail is a horizontal strip, and it does not fit: measured at
   * 390px, its content is 772px wide inside a 355px box. So three of the six
   * benches are off the right edge at rest — and one of those three can be the
   * selected one.
   *
   * Every way of arriving at a bench without touching the rail produces exactly
   * that: `/lab?bench=scheduler` from the command palette or a shared link, a
   * `#bench-…` fragment, or a number-key shortcut. The page then opens with the
   * right bench loaded below and a rail in which nothing visible is selected,
   * which reads as "nothing is selected" rather than as "the selection is over
   * there". The scroll affordance added to `.lab-rail` says there is more to
   * see; it cannot say that what you are looking for is already among it.
   *
   * ── Why scrollLeft and not scrollIntoView ───────────────────────────────
   * `scrollIntoView` walks up to the nearest scrollable ancestor, and when it
   * finds no room there it escalates to the window — which on this page means
   * yanking the visitor down the document as a side effect of a tab being
   * selected. `SectionProjects` documents that exact bug at length. Writing
   * `scrollLeft` on the rail cannot touch anything but the rail.
   *
   * ── Why it does nothing on a desktop ────────────────────────────────────
   * The desktop rail is a column with no horizontal overflow, so `scrollWidth`
   * equals `clientWidth`, the clamp below resolves to 0, and the assignment is
   * a no-op. No media query, nothing to keep in step with the CSS.
   */
  const isFirstRailSync = useRef(true);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const tab = rail.querySelector<HTMLElement>(`#lab-tab-${CSS.escape(benchId)}`);
    if (!tab) return;

    // Centre the tab, then clamp so the strip never scrolls past either end —
    // otherwise selecting the first or last bench leaves a gap at the edge.
    const target = tab.offsetLeft - (rail.clientWidth - tab.offsetWidth) / 2;
    const max = rail.scrollWidth - rail.clientWidth;
    const left = Math.max(0, Math.min(target, max));

    /*
     * Instant on the first run, smooth after.
     *
     * The first run is the page arriving at a bench the visitor asked for by
     * URL: there is no "before" for a transition to explain, and animating the
     * rail during load is motion nobody initiated. Every later run follows an
     * arrow key or a number shortcut, where the movement is the feedback.
     */
    rail.scrollTo({
      left,
      behavior: isFirstRailSync.current ? 'auto' : 'smooth',
    });
    isFirstRailSync.current = false;
  }, [benchId]);

  /*
   * Number keys jump straight to a bench.
   *
   * The guard is the important part: the compiler bench is a text field the
   * visitor types arithmetic into, and every bench has sliders and inputs. A
   * document-level digit listener without it would make typing `x = 2 * 3`
   * silently navigate away mid-expression. So the listener stands down for any
   * editable target and for any modified keystroke, which also leaves the
   * browser's own ⌘1…⌘9 tab switching alone.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.isContentEditable ||
          t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'SELECT')
      ) {
        return;
      }

      const n = Number.parseInt(e.key, 10);
      if (!Number.isInteger(n) || n < 1 || n > RAIL_ORDER.length) return;

      const target = RAIL_ORDER[n - 1];
      if (target.id === benchId) return;

      e.preventDefault();
      select(target.id, { focus: true });
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [benchId, select]);

  const current = findRegistered(benchId) ?? RAIL_ORDER[0];

  /*
   * An empty rack is a real state, not an impossible one: `registry.tsx` drops
   * any catalogue entry whose view is not wired up, so a mistake there lands
   * here. Saying so beats rendering an empty rail and a blank stage.
   */
  if (!current) {
    return (
      <div className="lab">
        <p className="lab-empty">No benches are registered.</p>
      </div>
    );
  }

  const { View } = current;

  return (
    <div className="lab">
      {/*
        The way out used to be a link right here. It now lives in `LabMasthead`,
        mounted by the route above this shell, because a link inside the shell
        scrolled away the moment a bench was in use — see that file for the
        reasoning. The shell's job is the rack; leaving is the route's.
      */}
      <div className="lab-rack">
        <div
          ref={railRef}
          role="tablist"
          aria-label="Benches"
          aria-orientation="vertical"
          className="lab-rail"
          onKeyDown={onRailKeyDown}
        >
          {REGISTERED_GROUPS.map((group) => (
            /* Presentational, so the tabs are the tablist's semantic children —
               see the note at the top of this file. */
            <div key={group.id} role="presentation" className="lab-rail__group">
              <p
                id={`lab-rack-${group.id}`}
                className="lab-rail__label t-label"
                /* Referenced by every tab's `aria-describedby`, which is allowed
                   to point at hidden text. Visible, but not a control. */
                aria-hidden="true"
              >
                {group.label}
              </p>

              {group.benches.map((bench) => {
                const isOn = bench.id === benchId;
                const index = RAIL_ORDER.findIndex((b) => b.id === bench.id);
                return (
                  <button
                    key={bench.id}
                    type="button"
                    role="tab"
                    id={`lab-tab-${bench.id}`}
                    aria-selected={isOn}
                    aria-controls={benchFragment(bench.id)}
                    aria-describedby={`lab-rack-${group.id}`}
                    /* One tab stop for the whole rail; arrows move within it. */
                    tabIndex={isOn ? 0 : -1}
                    className={`lab-tab${isOn ? ' is-on' : ''}`}
                    onClick={() => {
                      if (!isOn) select(bench.id);
                    }}
                  >
                    <bench.Icon aria-hidden="true" />
                    <span className="lab-tab__label">{bench.label}</span>
                    {/* The shortcut digit, shown so the shortcut is
                        discoverable rather than folklore. Hidden from AT
                        because "2" read after every label is noise. */}
                    <span className="lab-tab__key t-mono" aria-hidden="true">
                      {index + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/*
          `key` on the panel is what makes switching benches a fresh mount
          rather than a re-render of one bench's state into another's shape.
          Without it React would try to reconcile the sorting bench's tree with
          the compiler bench's, and no two benches share structure.
        */}
        <div
          key={current.id}
          role="tabpanel"
          /* Also the anchor target published by the JSON-LD graph. */
          id={benchFragment(current.id)}
          aria-labelledby={`lab-tab-${current.id}`}
          /* Focusable so a keyboard user who Tabs out of the rail lands in the
             bench's content rather than skipping past the whole thing. -1 keeps
             it out of the tab order itself, which is what the pattern
             specifies for a panel containing its own focusable controls. */
          tabIndex={-1}
          className="lab-panel"
        >
          <header className="lab-panel__head">
            {/*
              THE BENCH'S OWN HEADING.

              The document outline used to go h1 "The Lab" -> h3 "Configure",
              skipping h2 entirely: the panel header named the course and the
              engine's source path but never the bench, so the only heading
              between the page title and the individual bays was a bay's own.
              axe reports it as `heading-order`, and it is the outline a screen
              reader user navigates the page by — six instruments, and the
              heading list named none of them.

              `sr-only` because the visible name is already unmissable: it is
              the selected tab in the rail beside this panel, and printing it
              again at the top of the panel would be the same word twice on one
              screen. What was missing was never the label, it was the level.

              Not `aria-level` on the existing course line, and not promoting a
              bay to h2 — the bays are parts of the bench, and making bay 01 the
              bench's heading would be inventing a hierarchy that does not match
              what is on screen.
            */}
            <h2 className="sr-only">{current.label}</h2>
            <p className="lab-panel__course t-label emissive-cyan">
              {current.course}
            </p>
            <p className="lab-blurb">{current.blurb}</p>
            {/*
              The engine's path, printed rather than linked. It is the thing a
              reader would open to check the claim, and naming it is honest;
              linking it would mean hardcoding a repository URL that nothing
              in `lib/data` provides and that this file cannot verify resolves.
            */}
            <p className="lab-panel__source t-mono">{current.source}</p>
          </header>

          <View />
        </div>
      </div>
    </div>
  );
}
