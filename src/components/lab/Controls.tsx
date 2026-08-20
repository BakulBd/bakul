'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight, Copy, Pause, Play, RotateCcw, X } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { ratio, type Verification } from '@/lib/lab/core/verify';

/**
 * SHARED BENCH CONTROLS
 *
 * The lab is a rack of very different instruments — a sorting visualiser, a
 * compiler pipeline — that have to feel like panels on one machine. That only
 * happens if the knobs are literally the same knobs, so every control more than
 * one bench uses lives here.
 *
 * ── Why these are not the DOM primitives from components/dom ─────────────
 * `Primitives.tsx` looks like it should supply these, and deliberately does
 * not. Its `Section` reads its own height from the section registry, which
 * derives the camera settle points from measured scroll geometry on the main
 * page. A route has no scroll position in that registry, so importing it here
 * would either return a fallback height or, worse, invite someone to add
 * `/lab` to the registry and quietly break the choreography of every section
 * after it. The lab shares the *design vocabulary* — `.panel`, `.panel-flat`,
 * `--color-*`, `--font-*` — and not the scroll machinery.
 *
 * ── A11y is the implementation, not a pass over it ──────────────────────
 * Every interactive pattern below is built to the WAI-ARIA pattern rather than
 * to a `div` with a click handler:
 *
 *   - `Segmented` is a real `radiogroup` with roving tabindex. It takes one
 *     Tab stop, arrow keys move *and* select (which is radio-group semantics,
 *     not a shortcut), and Home/End jump to the ends.
 *   - `Slider` is a native `<input type="range">`. Nothing hand-rolled can
 *     match what a browser already gives it: keyboard, touch, screen-reader
 *     value announcements, and platform gestures on both.
 *   - `VerifyBadge` is a `group` with an ordinary list inside it, not a
 *     `status`. Its result is computed during render, not announced later.
 *   - `CopyButton` reports its outcome into its own live region, because a
 *     clipboard write is the one action here whose result is invisible.
 */

/* ------------------------------------------------------------------ *
 * FORMATTING
 * ------------------------------------------------------------------ */

/**
 * Fixed locale, deliberately.
 *
 * `Number.prototype.toLocaleString()` with no argument resolves against the
 * host's locale — which is the server's during SSR and the visitor's during
 * hydration. A visitor in a locale that groups with `.` would have React throw
 * away the server markup over a thousands separator. Pinning the locale makes
 * the output a pure function of the number.
 */
const NUM = new Intl.NumberFormat('en-US');

/** Thousands-separated integer, safe to render on both sides of hydration. */
export function num(n: number): string {
  return NUM.format(n);
}

/* ------------------------------------------------------------------ *
 * SEGMENTED CONTROL
 * ------------------------------------------------------------------ */

export interface Option<T extends string> {
  id: T;
  label: string;
  /** Optional one-line explanation, surfaced under the group when selected. */
  hint?: string;
}

/**
 * A row of mutually exclusive choices — the lab's primary selector.
 *
 * Generic over the option id so a caller's `onChange` receives its own union
 * type back rather than `string`. That is what stops a typo in a bench's
 * option list from becoming a runtime lookup miss.
 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  columns,
}: {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Force a wrapping grid instead of a single row. Used when labels are long. */
  columns?: number;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  /*
   * The group's accessible name is wired by id, and the id has to come from
   * `useId` rather than from the `label` prop. A label is prose — "Input shape",
   * "Register budget" — so deriving an id from it produces values with spaces
   * in them, and two benches that both label something "Speed" would emit the
   * same id twice and hand every screen reader an ambiguous reference. `useId`
   * is stable across server and client render, which is the one property a
   * hand-rolled counter could not give us here.
   */
  const labelId = useId();

  /** Move selection by `delta`, wrapping, and take focus with it. */
  const move = (delta: number) => {
    const from = options.findIndex((o) => o.id === value);
    const to = (from + delta + options.length) % options.length;
    onChange(options[to].id);
    haptic('press');
    // Focus follows selection: in a radio group the two are the same act, so
    // leaving focus behind would strand the keyboard user on a stale control.
    groupRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      ?.[to]?.focus();
  };

  const jump = (to: number) => {
    onChange(options[to].id);
    haptic('press');
    groupRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      ?.[to]?.focus();
  };

  const selected = options.find((o) => o.id === value);

  return (
    <div className="lab-field">
      <span className="lab-field__label" id={labelId}>
        {label}
      </span>

      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={labelId}
        className="lab-seg"
        style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
        onKeyDown={(e) => {
          switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
              e.preventDefault();
              move(1);
              break;
            case 'ArrowLeft':
            case 'ArrowUp':
              e.preventDefault();
              move(-1);
              break;
            case 'Home':
              e.preventDefault();
              jump(0);
              break;
            case 'End':
              e.preventDefault();
              jump(options.length - 1);
              break;
          }
        }}
      >
        {options.map((o) => {
          const isOn = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={isOn}
              /* Roving tabindex: the group is one stop in the tab order, and
                 arrow keys navigate within it. A tab stop per option would
                 make a five-option group cost five tabs to walk past. */
              tabIndex={isOn ? 0 : -1}
              className={`lab-seg__opt${isOn ? ' is-on' : ''}`}
              onClick={() => {
                if (isOn) return;
                onChange(o.id);
                haptic('press');
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {selected?.hint && <p className="lab-field__hint">{selected.hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * SLIDER
 * ------------------------------------------------------------------ */

/**
 * A labelled native range input.
 *
 * The current value is rendered as text beside the label rather than left to
 * the thumb position. A slider whose value you can only estimate by looking at
 * it is a slider you cannot report a bug against.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  hint?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="lab-field">
      <label className="lab-field__label" htmlFor={id}>
        <span>{label}</span>
        <span className="lab-field__value">{format ? format(value) : num(value)}</span>
      </label>
      <input
        id={id}
        type="range"
        className="lab-range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-describedby={hint ? hintId : undefined}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
      />
      {hint && (
        <p className="lab-field__hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * TRANSPORT
 * ------------------------------------------------------------------ */

function IconButton({
  label,
  onClick,
  disabled,
  primary,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      /* The button's content is an icon, so the accessible name has to be
         supplied — and `title` as well, because a sighted mouse user gets no
         name from an aria-label. */
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`lab-icon-btn${primary ? ' is-primary' : ''}`}
      onClick={() => {
        onClick();
        haptic('press');
      }}
    >
      {children}
    </button>
  );
}

/**
 * Play / pause, single-step either way, reset, and a scrubbable position.
 *
 * The scrubber is a range input over step indices, which is only possible
 * because a trace is a random-access array and the view is a pure function of
 * `(trace, cursor)`. Scrubbing backwards is not implemented anywhere — it is
 * simply what indexing an array already does.
 */
export function Transport({
  playing,
  onPlayPause,
  cursor,
  total,
  onSeek,
  onReset,
  /** Rendered between the buttons and the scrubber — usually the step readout. */
  children,
}: {
  playing: boolean;
  onPlayPause: () => void;
  cursor: number;
  total: number;
  onSeek: (v: number) => void;
  onReset: () => void;
  children?: ReactNode;
}) {
  const id = useId();

  return (
    <div className="lab-transport">
      <div className="lab-transport__row">
        <IconButton label={playing ? 'Pause' : 'Play'} onClick={onPlayPause} primary>
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </IconButton>

        <IconButton
          label="Previous step"
          onClick={() => onSeek(Math.max(0, cursor - 1))}
          disabled={cursor <= 0}
        >
          <ChevronLeft aria-hidden="true" />
        </IconButton>

        <IconButton
          label="Next step"
          onClick={() => onSeek(Math.min(total, cursor + 1))}
          disabled={cursor >= total}
        >
          <ChevronRight aria-hidden="true" />
        </IconButton>

        <IconButton label="Reset" onClick={onReset} disabled={cursor === 0 && !playing}>
          <RotateCcw aria-hidden="true" />
        </IconButton>

        {children}
      </div>

      <label className="sr-only" htmlFor={id}>
        Step position
      </label>
      <input
        id={id}
        type="range"
        className="lab-range lab-range--scrub"
        min={0}
        max={Math.max(1, total)}
        step={1}
        value={cursor}
        aria-valuetext={`Step ${num(cursor)} of ${num(total)}`}
        onChange={(e) => onSeek(Number(e.currentTarget.value))}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * READOUTS
 * ------------------------------------------------------------------ */

/** A key/value pair in the instrument-panel voice: small caps label, mono value. */
export function Stat({
  k,
  v,
  tone,
}: {
  k: string;
  v: ReactNode;
  tone?: 'amber' | 'cyan';
}) {
  return (
    <div className="lab-stat">
      <dt className="lab-stat__k">{k}</dt>
      <dd className={`lab-stat__v${tone ? ` is-${tone}` : ''}`}>{v}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * VERIFICATION BADGE
 * ------------------------------------------------------------------ */

/**
 * The result of a bench checking its own output, rendered as evidence.
 *
 * ── Why a bench verifies itself at all ──────────────────────────────────
 * A subtly wrong sort looks exactly like a correct one. The bars still shrink
 * and settle, the counters still climb, the animation still ends — and an
 * off-by-one in a partition would produce a plausible-looking run with two
 * elements quietly transposed. There is nothing on screen that would betray it.
 *
 * So the engines assert their postconditions on real output — "the result is
 * ordered", "the result is a permutation of the input" — and this component
 * prints the answer. That converts the page's central claim from *trust me* into
 * *here is the check, and here is what it returned this run*.
 *
 * ── Why a failure renders instead of throwing ───────────────────────────
 * A thrown assertion would take the panel down and hit the route's error
 * boundary, replacing the evidence with an apology — the one state in which the
 * visitor learns nothing. A failing check is the most interesting thing this
 * lab could possibly display: it means the algorithm on screen is wrong and the
 * bench caught it. It stays on screen, in alert red, with the detail that
 * localises it.
 *
 * ── Why this is not a live region ───────────────────────────────────────
 * `role="status"` would announce on every re-verify — which is every keystroke
 * in the compiler bench and every slider drag in the sorting bench. The result
 * is not an event; it is a property of what is already rendered, so it is a
 * plain labelled `group` that a screen reader reaches by navigating to it.
 */
export function VerifyBadge({
  verification,
  /** Overrides the heading. Defaults to the neutral "Self-check". */
  label = 'Self-check',
}: {
  verification: Verification;
  label?: string;
}) {
  const labelId = useId();

  // Nothing asserted is not the same as everything passing, and must not be
  // dressed as a green tick. An empty box in the compiler bench has no
  // postcondition to check, so the badge says nothing rather than congratulating
  // itself on a vacuous truth.
  if (verification.checks.length === 0) return null;

  const { checks, pass } = verification;
  const passed = checks.filter((c) => c.pass).length;

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={`lab-verify${pass ? ' is-pass' : ' is-fail'}`}
    >
      <p className="lab-verify__head" id={labelId}>
        {/* The icon is decorative: the count beside it carries the same
            information as text, so announcing the glyph too would be a
            duplicate. */}
        {pass ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
        <span className="lab-verify__label">{label}</span>
        <span className="lab-verify__score">{ratio(passed, checks.length, 'passed')}</span>
      </p>

      <ul className="lab-verify__list">
        {checks.map((c) => (
          <li
            key={c.label}
            className={`lab-verify__item${c.pass ? ' is-pass' : ' is-fail'}`}
          >
            <span className="lab-verify__mark" aria-hidden="true">
              {c.pass ? '✓' : '✗'}
            </span>
            {/* The screen-reader equivalent of the mark. Without it a failing
                check and a passing one read as the same sentence. */}
            <span className="sr-only">{c.pass ? 'Passed: ' : 'Failed: '}</span>
            <span className="lab-verify__text">{c.label}</span>
            <span className="lab-verify__detail">{c.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * COPY BUTTON
 * ------------------------------------------------------------------ */

/** How long the confirmation stays up. Long enough to read, short enough to forget. */
const COPY_FEEDBACK_MS = 2000;

/**
 * Copies a string to the clipboard and says whether it worked.
 *
 * ── Why the outcome is reported in the UI and never in an alert ─────────
 * `alert()` is modal: it steals focus, blocks the rAF playhead, and has to be
 * dismissed before the page can be touched again — an enormous interruption for
 * an action whose entire point was to be incidental. Worse, it is the tell of a
 * page that has no design language for feedback. This one has: amber for a
 * pending act, cyan for a confirmed one, alert red for a refusal.
 *
 * ── Why failure is handled rather than assumed away ─────────────────────
 * `navigator.clipboard.writeText` rejects in more real situations than it
 * resolves in during development: any non-secure origin (so every LAN address
 * used to test on a phone), Safari when the call is not inside a user gesture,
 * and Firefox when `dom.events.asyncClipboard.clipboardItem` is off. Swallowing
 * that leaves a visitor clicking a button that does nothing forever. The
 * refusal is displayed, so the fallback — select the text and copy it — is at
 * least discoverable.
 *
 * ── Why the timer is cleared on unmount ────────────────────────────────
 * The benches are lazily mounted and swapped by the rack rail. A pending
 * `setTimeout` calling `setState` on a component the visitor has navigated away
 * from is the classic React leak warning, and here it is genuinely reachable:
 * copy a permalink, then switch bench inside two seconds.
 */
export function CopyButton({
  value,
  /** Button text. Say what is being copied — "Copy link" beats "Copy". */
  label = 'Copy',
  /** Announced and displayed on success. Defaults to a generic confirmation. */
  done = 'Copied',
}: {
  value: string;
  label?: string;
  done?: string;
}) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const flash = useCallback((next: 'done' | 'failed') => {
    setState(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), COPY_FEEDBACK_MS);
  }, []);

  const copy = useCallback(async () => {
    try {
      // Optional chaining rather than a feature test: on an insecure origin
      // `navigator.clipboard` is `undefined` outright, and reading `.writeText`
      // off it would throw a TypeError that has nothing to do with clipboards.
      if (!navigator.clipboard?.writeText) throw new Error('no clipboard');
      await navigator.clipboard.writeText(value);
      flash('done');
      haptic('lock');
    } catch {
      // The error object is deliberately unused. Every rejection here means the
      // same thing to the visitor — the browser refused — and printing a vendor
      // message would be noise in an interface this terse.
      flash('failed');
    }
  }, [value, flash]);

  return (
    <span className="lab-copy">
      <button type="button" className="btn lab-copy__btn" onClick={copy}>
        {state === 'done' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {state === 'done' ? done : label}
      </button>

      {/*
        The outcome, announced.

        This is a live region and the badge above is not, because the two are
        different kinds of information: a clipboard write is an event with no
        visible result, so it has to be announced when it happens. It is empty
        while idle so there is nothing to re-announce on an unrelated re-render.
      */}
      <span
        role="status"
        aria-live="polite"
        className={`lab-copy__said${state === 'failed' ? ' is-fail' : ''}`}
      >
        {state === 'failed' ? 'Clipboard blocked — select the text and copy it' : ''}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * LAYOUT
 * ------------------------------------------------------------------ */

/** Titled container for one stage of a bench. `n` prints as the stage number. */
export function Bay({
  n,
  title,
  note,
  children,
  className,
}: {
  n: string;
  title: string;
  note?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel lab-bay${className ? ` ${className}` : ''}`}>
      <header className="lab-bay__head">
        <span className="lab-bay__n" aria-hidden="true">
          {n}
        </span>
        <h3 className="lab-bay__title">{title}</h3>
      </header>
      {note && <p className="lab-bay__note">{note}</p>}
      <div className="lab-bay__body">{children}</div>
    </section>
  );
}
