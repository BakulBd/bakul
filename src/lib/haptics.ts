'use client';

/**
 * HAPTICS — the third channel, and the only one a phone always has.
 *
 * ── Why this exists ─────────────────────────────────────────────────────
 * This site gives feedback on three channels, and on a phone two of them are
 * unavailable by default:
 *
 *   - **Hover** does not exist on a touchscreen at all. Every `hover` cue and
 *     every `.panel-interactive` lift is dead weight there.
 *   - **Sound** is muted until the visitor explicitly enables it, which is the
 *     correct default and is not going to change.
 *
 * That left a phone visitor tapping a project bay, a subsystem, or a milestone
 * and receiving nothing but a colour change — on a site whose entire subject is
 * a machine responding to being operated. The mechanical response was there in
 * the 3D layer and in the score, and a muted phone got neither.
 *
 * Vibration is the one feedback channel a phone has that a desktop does not,
 * and it is the one that most directly says *mechanism*. A rack module locking
 * into place should be felt, and a phone can do that.
 *
 * ── Why it is safe ──────────────────────────────────────────────────────
 * `navigator.vibrate` is unsupported on iOS Safari and is a no-op there rather
 * than an error, so this degrades to nothing on roughly half of mobile traffic
 * without a special case. Chrome and Firefox on Android also require a prior
 * user gesture and silently ignore calls without one — which is exactly the
 * behaviour wanted: a page cannot buzz a pocket unprompted.
 *
 * ── Why it is derived from state, not from controls ─────────────────────
 * Same principle as `SoundBridge`: the cue belongs to the *event*, not to
 * whichever element happened to cause it. Selecting a bay by tapping it, by
 * arrow key, or by the command palette are one event to a visitor, so they get
 * one response. This module is the vocabulary; SoundBridge decides when.
 */

/**
 * The patterns, in milliseconds. Deliberately short.
 *
 * These are punctuation, not alerts — the phone equivalent of the `press` and
 * `lock` voices in the audio engine, which sit at 0.028s and 0.05s. A long
 * buzz reads as a notification (something wants attention elsewhere); a brief
 * tick reads as a surface responding to a finger, which is the whole point.
 *
 * Anything above roughly 30ms starts to feel like a phone ringing rather than
 * a mechanism moving, which is why nothing here approaches it except `morph`,
 * where the site genuinely is reporting a large change of state.
 */
const PATTERN = {
  /** A control accepting a press. The lightest thing the hardware can do. */
  press: 8,
  /** A mechanism answering: a bay locking in, a subsystem engaging. */
  lock: 16,
  /** Boot complete — two beats, so it reads as an arrival rather than a tap. */
  online: [14, 40, 22],
  /** The signature transformation. The one place a longer pattern is earned. */
  morph: [10, 30, 10, 30, 26],
  /** A project breaking out through the monitor. */
  activate: [12, 26, 18],
  /** Message sent. */
  transmit: [10, 24, 10, 24, 20],
  /** Something failed. Three sharp knocks — felt as wrong, not as informative. */
  error: [24, 40, 24, 40, 24],
} as const;

export type Haptic = keyof typeof PATTERN;

/**
 * Feature detection, resolved once.
 *
 * Guarded for SSR: this module is imported by a client component but Next still
 * evaluates the module graph on the server, where `navigator` does not exist.
 */
const supported = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

/**
 * Honoured for the same reason the audio engine honours it.
 *
 * `prefers-reduced-motion` is a request to reduce *physical* sensation, not
 * only on-screen movement — vestibular and sensory triggers are precisely what
 * the setting exists to protect against, and a vibrating device is a stronger
 * physical stimulus than anything this site draws. Read live rather than cached
 * so toggling the OS setting mid-visit takes effect without a reload.
 */
const reducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Minimum gap between pulses, in ms.
 *
 * The scroll-driven selections (a bay crossing the centre of the screen, a
 * milestone passing the reader head) can fire in quick succession during a
 * fast flick. Unthrottled, that is a continuous buzz rather than a series of
 * discrete responses — and a continuously vibrating phone is the single fastest
 * way to make someone close a tab. The audio engine throttles its own `lock`
 * voice at 60ms for the same reason; this is deliberately more conservative,
 * because vibration has no stereo field or decay to separate two events that
 * land close together.
 */
const MIN_GAP_MS = 120;

let lastAt = 0;

/**
 * Fire a haptic pattern, if the device can and the visitor has not asked not to.
 *
 * Safe to call unconditionally from anywhere: every gate is inside.
 */
export function haptic(kind: Haptic): void {
  if (!supported() || reducedMotion()) return;

  const now = Date.now();
  if (now - lastAt < MIN_GAP_MS) return;
  lastAt = now;

  try {
    // Spread required: the patterns are `as const`, so their array members are
    // readonly tuples and `vibrate` takes a mutable `number[]`.
    const p = PATTERN[kind];
    navigator.vibrate(typeof p === 'number' ? p : [...p]);
  } catch {
    /* Some browsers throw inside iframes or without a gesture. Never fatal. */
  }
}

/** Stops any in-flight pattern. Used when the page is backgrounded. */
export function silenceHaptics(): void {
  if (!supported()) return;
  try {
    navigator.vibrate(0);
  } catch {
    /* non-fatal */
  }
}
