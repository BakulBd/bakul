'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMachine } from '@/store/machine';
import { sections } from '@/lib/data/sections';
import { profile } from '@/lib/data/profile';
import {
  BENCHES,
  benchCountPhrase,
  benchList,
  benchPath,
} from '@/lib/lab/catalogue';
import { scrollToSection, setScrollLocked } from '@/hooks/useScrollEngine';
import { audio } from '@/lib/audio/engine';

/**
 * Cmd/Ctrl + K quick navigation (§5).
 *
 * Also the entry point for the debug Easter egg: typing `sudo override` here
 * triggers the kernel panic. That keeps the egg discoverable by someone who
 * would think to try it, without exposing it to a casual visitor.
 */

interface Command {
  id: string;
  label: string;
  hint: string;
  /**
   * Extra searchable text that is never rendered.
   *
   * The hint column is one short line, so it cannot carry every word someone
   * might type. A visitor hunting for the pathfinding bench types "dijkstra",
   * not "pathfinding" — the algorithm is the thing they remember, and the bench
   * is the container they do not know exists. This field is where the words that
   * should *find* an entry live, as distinct from the words that should
   * *describe* it.
   */
  terms?: string;
  run: () => void;
}

export function CommandPalette() {
  /*
   * `/lab` is a real route, so it is pushed through the router rather than
   * assigned to `location.href`. That keeps the navigation client-side — the
   * shared layout, fonts and CSS are already parsed, so the lab arrives without
   * a white flash and without re-downloading anything the main page loaded.
   */
  const router = useRouter();

  const open = useMachine((s) => s.paletteOpen);
  const setOpen = useMachine((s) => s.setPaletteOpen);
  const setDebug = useMachine((s) => s.setDebug);
  const toggleAudio = useMachine((s) => s.toggleAudio);
  const resetSystem = useMachine((s) => s.resetSystem);
  const audioEnabled = useMachine((s) => s.audioEnabled);

  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const commands = useMemo<Command[]>(
    () => [
      ...sections.map((s) => ({
        id: `goto-${s.id}`,
        label: `Go to ${s.label}`,
        hint: s.hint,
        run: () => scrollToSection(s.id),
      })),
      /*
       * The lab, then every bench by name.
       *
       * One entry per bench rather than a single "open the lab", because the
       * palette is searched by text: someone typing "sort" or "compiler" is
       * looking for an instrument and would never think to type "lab" to find
       * it. The generic entry stays as well, for the visitor who wants the room
       * rather than a particular bench in it.
       *
       * ── Why the catalogue and not the registry ────────────────────────
       * This is the main page's palette, and it imports `BENCHES` — plain data —
       * rather than `@/components/lab/registry`. The registry attaches an icon
       * and a `dynamic()` loader to every bench, so importing it here would make
       * the home page's bundle reference the whole lab component graph to render
       * three lines of text. The catalogue has everything a menu entry needs.
       *
       * `benchPath` decides the URL, so the palette and the JSON-LD agree on
       * where a bench lives, including the detail that the default bench is a
       * bare `/lab` with no query string.
       */
      {
        id: 'lab',
        label: 'Open the Lab',
        hint: benchCountPhrase({ lower: true }),
        terms: `lab benches ${benchList({ lower: true })}`.toLowerCase(),
        run: () => router.push('/lab'),
      },
      ...BENCHES.map((b) => ({
        id: `lab-${b.id}`,
        label: `Open the ${b.label.toLowerCase()} bench`,
        // The course, not a restated blurb. It is the shortest true label that
        // is also worth searching for, and it names the join to the CV.
        hint: b.course,
        terms: `${b.summary} ${b.features.join(' ')}`.toLowerCase(),
        run: () => router.push(benchPath(b.id)),
      })),
      {
        id: 'cv',
        label: 'Download CV',
        hint: 'PDF résumé',
        run: () => window.open(profile.contact.cv, '_blank'),
      },
      {
        id: 'github',
        label: 'Open GitHub',
        hint: profile.contact.githubHandle,
        run: () => window.open(profile.contact.github, '_blank', 'noopener'),
      },
      {
        id: 'linkedin',
        label: 'Open LinkedIn',
        hint: profile.contact.linkedinHandle,
        run: () => window.open(profile.contact.linkedin, '_blank', 'noopener'),
      },
      {
        id: 'email',
        label: 'Send email',
        hint: profile.contact.email,
        run: () => {
          window.location.href = `mailto:${profile.contact.email}`;
        },
      },
      {
        id: 'audio',
        label: audioEnabled ? 'Disable sound' : 'Enable sound',
        hint: 'Procedural machine audio',
        // Resume the AudioContext synchronously in this same click handler,
        // not via the SystemControls effect alone — WebKit/iOS requires the
        // gesture and the resume to share a call stack (see SystemControls).
        run: () => {
          audio.setEnabled(!audioEnabled);
          toggleAudio();
        },
      },
      {
        id: 'reset',
        label: 'Reset system',
        hint: 'Restore all parameters to defaults',
        run: resetSystem,
      },
    ],
    [audioEnabled, toggleAudio, resetSystem, router],
  );

  const isOverride = query.trim().toLowerCase() === 'sudo override';

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.hint.toLowerCase().includes(q) ||
        // Pre-lowercased at construction, so this is a plain substring test and
        // not a `toLowerCase()` over every summary on every keystroke.
        (c.terms !== undefined && c.terms.includes(q)),
    );
  }, [commands, query]);

  /*
   * This is a combobox, and it was not announcing itself as one.
   *
   * The pattern here — a text field that filters a list, where the arrow keys
   * move a highlight while focus stays in the field so typing keeps working —
   * is ARIA's combobox-with-list-autocomplete, and it has one hard requirement:
   * the highlighted option must be named by `aria-activedescendant` on the
   * field. Without it the arrows moved a *background colour* and nothing else.
   * A sighted visitor saw the selection travel; a screen-reader user pressed
   * Down six times, heard silence, pressed Enter, and was taken somewhere the
   * software had never told them about.
   *
   * `results[index]` is clamped rather than trusted so the id, the
   * `aria-selected` row and the Enter target can never disagree — three
   * readings of the same intent should come from one expression, not from
   * `index` being in range by luck.
   */
  const activeIndex = results.length > 0 ? Math.min(index, results.length - 1) : 0;
  const activeCommand = results[activeIndex];
  /** Every option needs a stable id for `aria-activedescendant` to point at. */
  const optionId = (id: string) => `palette-option-${id}`;

  /* ---- Global shortcut ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!useMachine.getState().paletteOpen);
      }
      if (e.key === 'Escape' && useMachine.getState().paletteOpen) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  /* ---- Focus management ---- */
  useEffect(() => {
    if (open) {
      restoreFocus.current = document.activeElement as HTMLElement;
      setQuery('');
      setIndex(0);
      // Wait a frame so the input exists before we reach for it.
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      restoreFocus.current?.focus?.();
    }
  }, [open]);

  /*
   * ---- Focus containment ----
   *
   * `aria-modal="true"` is a claim, and it was not being honoured: Tab from the
   * search field walked straight out of the dialog and into the page behind it,
   * where a keyboard visitor then traversed a rail, a nav and five sections of
   * links they could see no trace of — every one of them announced by a screen
   * reader as though it were reachable, while the overlay covered the screen.
   * `aria-modal` tells assistive technology to hide the rest of the document;
   * it does nothing whatsoever to the tab order. That part is ours.
   *
   * Listening on the document rather than the dialog, because the bug being
   * fixed is precisely the case where focus is already somewhere else.
   */
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      const inside = dialog.contains(document.activeElement);
      const edge = e.shiftKey ? first : last;
      // Wrap at the edge, and haul focus back if it ever escaped anyway.
      if (!inside || document.activeElement === edge) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  /*
   * ---- Scroll lock ----
   *
   * The overlay covered the viewport but the page underneath kept scrolling, so
   * a wheel notch over the palette moved the document, the camera and the whole
   * scroll-driven choreography behind the blur — then closing it left the
   * visitor somewhere they had not chosen to be. `setScrollLocked` stops both
   * Lenis and native scroll; see its own note for why one alone is not enough.
   *
   * The cleanup runs on unmount as well as on close, so the page cannot be left
   * frozen by a route change while the palette is open.
   */
  useEffect(() => {
    if (!open) return;
    setScrollLocked(true);
    return () => setScrollLocked(false);
  }, [open]);

  /*
   * ---- Keep the highlight in view ----
   *
   * The results list scrolls at about eight rows, and there are more commands
   * than that before any filtering. Arrowing down past the eighth moved the
   * selection to a row nobody could see, which reads as the palette having
   * stopped responding. `nearest` scrolls the list by the minimum amount and
   * leaves the window alone.
   */
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, results.length]);

  if (!open) return null;

  const execute = (cmd: Command) => {
    setOpen(false);
    cmd.run();
  };

  const triggerOverride = () => {
    setOpen(false);
    // The glitch sound plays from DebugConsole's own entry effect, which
    // fires for every path into debug mode — this only needs to flip the
    // switch, not duplicate the cue.
    setDebug(true);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => (i + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => (i - 1 + Math.max(1, results.length)) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOverride) triggerOverride();
      else if (activeCommand) execute(activeCommand);
    }
  };

  return (
    <div
      className="no-print fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: 'rgba(9,10,15,0.82)', backdropFilter: 'blur(6px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Quick navigation"
        className="panel w-full max-w-[560px]"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search sections and actions…"
          aria-label="Search sections and actions"
          /*
           * Combobox only while there is a list to be a combobox for.
           *
           * In override mode the results list is not rendered at all, and the
           * `aria-controls` here used to point at an id that no longer existed
           * — a dangling reference, which a screen reader resolves to nothing
           * and reports as a broken relationship. The honest description of
           * that state is a plain text field: what has been typed is a command,
           * not a query, and there is nothing to arrow through.
           */
          role={isOverride ? undefined : 'combobox'}
          aria-expanded={isOverride ? undefined : results.length > 0}
          aria-controls={isOverride ? undefined : 'palette-results'}
          aria-activedescendant={
            isOverride || !activeCommand ? undefined : optionId(activeCommand.id)
          }
          aria-autocomplete={isOverride ? undefined : 'list'}
          spellCheck={false}
          autoComplete="off"
          className="w-full border-0 border-b border-[#24272f] bg-transparent px-5 py-4 font-[family-name:var(--font-code)] text-sm text-[color:var(--color-ceramic)] outline-none placeholder:text-[color:var(--color-ash-dim)]"
        />

        {isOverride ? (
          <div className="p-5">
            <button
              type="button"
              onClick={triggerOverride}
              className="btn w-full justify-center"
              style={{ borderColor: 'var(--color-alert)', color: 'var(--color-alert)' }}
            >
              ⚠ Execute debug override
            </button>
            <p className="t-label mt-3 normal-case tracking-normal">
              Enters maintenance mode. Everything is reversible.
            </p>
          </div>
        ) : (
          <>
            {/*
              `li[role="option"]`, not `li > button[role="option"]`.

              A listbox owns options directly. Wrapping each one in a list item
              left an implicit `listitem` between the two, which breaks that
              contract — so position and count went unannounced ("option 3 of
              11" became just the label) in exactly the interface whose entire
              purpose is telling you where you are in a list.

              The buttons are gone rather than relabelled, and that is the
              point of the pattern: with `aria-activedescendant` driving the
              selection, focus must never leave the field above. A focusable
              option is a second, competing focus model — press Down, focus
              lands on a row, and the next keystroke of the search query goes
              nowhere. Clicks still work; they simply arrive on the option.
            */}
            <ul
              ref={listRef}
              id="palette-results"
              role="listbox"
              aria-label="Commands"
              /* Stop a flick at the end of the list from chaining into the
                 page behind the overlay. */
              className="m-0 max-h-[46vh] list-none overflow-y-auto overscroll-contain p-2"
            >
              {results.map((cmd, i) => {
                const isActive = i === activeIndex;
                return (
                  <li
                    key={cmd.id}
                    id={optionId(cmd.id)}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => execute(cmd)}
                    /* `cursor-pointer` is not decoration here: iOS only
                       dispatches click on a non-interactive element once it
                       considers it clickable, and this is no longer a button. */
                    className="flex cursor-pointer items-center justify-between gap-4 px-3 py-2.5"
                    style={{
                      background: isActive ? 'rgba(36,39,47,0.9)' : 'transparent',
                      borderLeft: `2px solid ${isActive ? 'var(--color-cyan)' : 'transparent'}`,
                    }}
                  >
                    <span
                      className="t-mono text-xs"
                      style={{ color: isActive ? 'var(--color-cyan)' : 'var(--color-ceramic)' }}
                    >
                      {cmd.label}
                    </span>
                    <span className="t-label shrink-0 normal-case tracking-normal">{cmd.hint}</span>
                  </li>
                );
              })}
            </ul>

            {/* Outside the listbox. A "no matches" notice is not an option
                someone can select, and inside it announced as one. */}
            {results.length === 0 && <p className="t-label m-0 px-5 py-4">No matches</p>}
          </>
        )}

        <div className="flex items-center justify-between border-t border-[#24272f] px-5 py-3">
          {isOverride ? (
            <span className="t-label">↵ execute · esc close</span>
          ) : (
            <>
              <span className="t-label">↑ ↓ navigate · ↵ select · esc close</span>
              <span className="t-label">{results.length} results</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
