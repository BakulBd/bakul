'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useMachine } from '@/store/machine';
import { audio } from '@/lib/audio/engine';
import { haptic } from '@/lib/haptics';

/**
 * THE IDENTITY REVEAL — a precision typographic reveal of the name.
 *
 * A self-contained, one-shot enhancement to the Power On moment. For about
 * two seconds after the visitor powers the machine on, the name is revealed
 * one letter at a time: each glyph rises into place from behind its own
 * baseline, pulling from soft focus into sharp, with a specular highlight
 * raking across the finished word. Then control is handed back to the real
 * heading exactly as it already existed.
 *
 * ── Why crisp type, and not a particle field ──────────────────────────────
 * The first version of this file built the name out of ~760 orbiting
 * particles that converged onto sampled letterform positions. It was
 * replaced, and the reason is worth recording, because "particles form the
 * text" is the obvious idea and it is the wrong one.
 *
 * A particle can only ever *approximate* a letterform. Space Grotesk at
 * 136px Bold has crisp vertical stems, precise optical curves and a specific
 * stroke contrast; a cloud of discrete dots resolves that into something
 * fuzzy and slightly wrong, no matter how many dots there are. Worse, the
 * approximation has to end: at some point the particles hand off to the real
 * `<h1>`, and because the two never look identical, that moment is a visible
 * pop — the exact opposite of the polish the effect is reaching for.
 *
 * So the type is never degraded here. Every frame this file draws is the
 * real string, in the real font, at the real size, with real kerning — the
 * motion lives entirely in *what is revealed of it* (per-glyph masks), *how
 * sharply it is in focus* (a blur that resolves), and *how light falls
 * across it* (a specular sweep). That is how a reveal reads as designed
 * rather than as a demo, and it is why the handoff at the end is invisible:
 * the last frame this canvas paints is the heading that replaces it.
 *
 * ── Why the real `<h1>` is never touched, only hidden and shown ──────────
 * `BootSequence.tsx` carries a hard-won guarantee: one `<h1>`, visible and in
 * the accessible tree from the first frame, never a decorative stand-in with
 * the real text hidden elsewhere. This component does not weaken that. The
 * heading passed in as `nameRef` keeps its own markup, its own classes, its
 * own text — completely unedited. All this component does to it is toggle
 * `style.opacity`, which is a paint property: it never leaves the DOM, never
 * leaves the accessibility tree, is still selectable and still crawlable in
 * the server-rendered HTML the whole time. A screen reader visiting
 * mid-animation reads the real name, not silence. A crawler that never
 * executes this component's JavaScript sees the name at `opacity: 1`,
 * because that is the element's own default with no inline style at all —
 * this file adds the override only once it is actually running, and removes
 * it again the moment it finishes, so "this script never ran" and "this
 * script ran and completed" converge on the identical DOM.
 *
 * ── Why the geometry is measured from the DOM, never assumed ─────────────
 * Everything this canvas draws has to land on top of where the browser
 * already laid the heading out, to the pixel — the font size is a `clamp()`
 * against viewport width, the tracking is negative, and the line-height is
 * *smaller* than the font size, so none of it can be hard-coded. The
 * measurements that matter are taken live: a `Range` over the heading's own
 * text nodes gives the inline box the glyphs actually occupy (not the block,
 * which is full-column-width), `getComputedStyle` gives the exact font
 * shorthand to hand to the canvas, and `TextMetrics.fontBoundingBox*` gives
 * the ascent and descent needed to place the alphabetic baseline inside that
 * box under CSS's half-leading rule. See `measure()` for the derivation.
 */

/* ------------------------------------------------------------------ *
 * TIMING — in milliseconds from the moment the sequence starts.
 *
 * The whole reveal is ~2s, deliberately. The version this replaced ran for
 * 4.8s, which is far longer than a name reveal can hold attention: past
 * about two and a half seconds the visitor has already read the word and is
 * waiting for the animation to be done with them. Every phase below is sized
 * to be *perceptible* rather than *leisurely*.
 * ------------------------------------------------------------------ */
const T_ANTICIPATION = 260; // the filament ignites and draws itself along the line
const CHAR_STAGGER = 58; // between one glyph starting and the next
const CHAR_DUR = 540; // one glyph's own rise, focus pull and fade-in

/** Rise distance as a fraction of the font size — the glyph starts this far
 *  below its final position, hidden behind the baseline mask. Small on
 *  purpose: a long throw reads as a slide transition, a short one reads as
 *  the letter settling into a slot that was already there. */
const RISE_RATIO = 0.3;

/** Peak blur, as a fraction of font size, so the focus pull looks the same
 *  on a phone as on a desktop. */
const BLUR_RATIO = 0.085;

/*
 * Room around the text box, as fractions of font size, for the blur, the
 * ignition glow and the incoming starlight to live in without being clipped
 * by the canvas edge.
 *
 * Split rather than uniform, and deliberately tight at the bottom: the
 * heading has a tagline directly beneath it, and a generous bottom pad would
 * put additive light on top of it. The glyphs themselves are masked at the
 * baseline anyway, so the space below the text box only ever needs to hold a
 * little of the ambient bloom's falloff.
 */
const PAD_X_RATIO = 0.8;
const PAD_TOP_RATIO = 0.8;
const PAD_BOTTOM_RATIO = 0.22;

/**
 * Starlight motes per glyph, by capability tier.
 *
 * Enough to read as a field converging, few enough that the letter underneath
 * is never obscured. The count is the main thing this effect can be charged
 * for — 15 a glyph is ~150 sprite draws every frame — so the weaker tiers get
 * a thinner field rather than a dropped one. `low` never reaches here at all.
 */
const STARS_BY_QUALITY: Record<'high' | 'medium' | 'mobile', number> = {
  high: 15,
  medium: 10,
  mobile: 6,
};

/** How far out a mote begins from the point it is travelling to, as a
 *  fraction of font size. */
const STAR_SPREAD = 0.85;

/*
 * THE LIGHT IS GOLD, and it is gold for a reason beyond preference.
 *
 * The machine behind this heading is lit amber — its turbines, its bus traffic
 * and its bloom are all in the warm half of the site's palette, and the frame
 * grabs of the reveal show a field of orange bokeh directly behind the name.
 * An earlier pass lit the reveal cyan, which is the site's *other* accent and
 * is correct on instruments and labels, but sitting in front of that warm
 * scene it read as a separate effect pasted over the render rather than as
 * light belonging to it.
 *
 * Gold sits the reveal inside its own scene. The values below are the amber
 * ramp from `globals.css` (#ff8c00) lifted toward white at the core, so a mote
 * reads as a hot point rather than a coloured dot.
 */
const GOLD = {
  /** Mote core — near-white, so points of light stay points of light. */
  starCore: 'rgba(255,246,226,1)',
  starMid: 'rgba(255,206,128,0.85)',
  starFalloff: 'rgba(255,166,58,0.26)',
  starEdge: 'rgba(255,140,0,0)',
  /** Ignition bloom behind a landing glyph. */
  glowCore: 'rgba(255,196,110,0.5)',
  glowMid: 'rgba(255,158,52,0.2)',
  glowEdge: 'rgba(255,140,0,0)',
  /** The landing strike, drawn additively onto the glyph itself. */
  flash: '#ffdcae',
  /** The shadow the word casts once it is standing. */
  shadow: 'rgba(255,150,40,0.5)',
  /** The filament that ignites along the baseline before the first letter. */
  filamentCore: 'rgba(255,244,214,',
  filamentEdge: 'rgba(255,150,40,',
  /** The specular rake across the finished word. */
  sweepHot: 'rgba(255,248,228,',
  sweepWarm: 'rgba(255,196,116,',
} as const;

/**
 * Sound one tick every Nth glyph, not every glyph.
 *
 * One-per-glyph was the first version and it was wrong twice over. Musically,
 * ten ticks across 522ms is seventeen a second — past the rate at which
 * separate events can be heard as separate, so it reads as a buzz rather than
 * as letters landing, and it lands on top of `power`'s three-second swell,
 * which is the busiest moment in the whole site's mix.
 *
 * Mechanically, it did not even survive: `AudioEngine` sheds non-priority
 * voices once fourteen are live (and throttles `tick` to 35ms), so most of
 * them were being dropped anyway — measured, only two of ten ever sounded.
 * Raising either limit would mean degrading a mix the engine is deliberately
 * built to protect.
 *
 * Every third glyph gives four ticks about 174ms apart: slow enough to be
 * heard as individual events, sparse enough to sit inside the polyphony
 * budget, and still locked to the same beats the eye is being given.
 */
const TICK_EVERY = 3;

/*
 * The landing strike, as a window inside one glyph's arrival.
 *
 * These three exist as named constants because the *sound* is scored against
 * them, not merely the picture. The flash is the visible moment a letter
 * arrives, so the tick for that letter has to land on the same instant — an
 * earlier version fired ticks at 42% of a glyph's travel while the flash
 * peaked at 81%, which put roughly 200ms of daylight between the thing you
 * hear and the thing you see. Close enough to feel wrong and not close enough
 * to notice why.
 */
const FLASH_FROM = 0.62;
const FLASH_SPAN = 0.38;
/** Where the strike is brightest — and therefore where the tick belongs. */
const FLASH_PEAK = FLASH_FROM + FLASH_SPAN / 2;

/** Alpha at which an offscreen pixel counts as ink when sampling the glyphs
 *  for starlight targets. Below full opacity so anti-aliased edges count —
 *  motes landing only on stroke centres would trace a thinner letter than the
 *  one actually on screen. */
const INK_ALPHA_THRESHOLD = 96;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
/** The rise easing. Expo-out is the right curve for something arriving into
 *  a final position: almost all the distance is covered early, and the last
 *  few pixels take long enough to read as deceleration rather than a stop. */
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

interface Measurement {
  /** Canvas box in wrapper-local CSS px. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Where the string starts, in canvas-local CSS px. */
  originX: number;
  baselineY: number;
  font: string;
  letterSpacing: string;
  fontSize: number;
  /** Cumulative advance to the start of each character, canvas-local px. */
  charStarts: number[];
  /** Total advance of the whole string, as the DOM lays it out. */
  textWidth: number;
  /** Horizontal correction if the canvas lays the string out fractionally
   *  differently from the DOM (see `measure()`). 1 when they agree. */
  scaleX: number;
  text: string;
  /** Points on each glyph's own ink, canvas-local px, for the starlight to
   *  converge onto. Indexed by character. */
  inkByChar: { x: number; y: number }[][];
  /** Index at which the ash-toned surname begins. */
  splitAt: number;
  colorHead: string;
  colorTail: string;
  ascent: number;
}

export function IdentityReveal({
  nameRef,
}: {
  nameRef: RefObject<HTMLHeadingElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasPlayedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  /*
   * One effect, empty dependency array, running exactly once for the life
   * of this component — and that emptiness is load-bearing, not incidental.
   *
   * The natural-looking alternative is `useMachine((s) => s.powerState)` as
   * a reactive selector with `[powerState]` as the effect's own dependency
   * array. That was the first draft, and it had a real bug hiding in
   * ordinary React semantics: an effect re-runs its *cleanup* every time its
   * dependency changes, before the new invocation's body executes — so the
   * moment `powerState` moved a second time (ACTIVATING → ONLINE, which on
   * a slow device can land seconds into an animation still in flight), React
   * tore down this effect first. The cleanup below correctly notices an
   * animation is active and hands the real heading back immediately, as a
   * safety net against being unmounted mid-sequence — which is exactly right
   * for a genuine unmount, and exactly wrong here: it fired on a state change
   * this component was never trying to react to a second time, aborting the
   * sequence after a few hundred milliseconds. The letters never finished
   * arriving; they simply vanished and were replaced by the plain name.
   *
   * Watching the store imperatively — the same `useMachine.subscribe(...)`
   * pattern `Experience.tsx` uses for the identical shape of problem
   * (mounting the 3D canvas once, off the same STANDBY exit) — sidesteps the
   * whole class of bug. This effect runs once, subscribes once, and the
   * subscription callback decides for itself whether to act; no dependency
   * array is ever re-evaluated because there is only one.
   */
  useEffect(() => {
    const heading = nameRef.current;
    const canvas = canvasRef.current;
    if (!heading || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const unsubscribe = useMachine.subscribe((s) => {
      if (s.powerState === 'STANDBY' || hasPlayedRef.current) return;
      hasPlayedRef.current = true;
      play();
    });

    // The visitor may already be past STANDBY by the time this mounts (an
    // inbound `#section-…` link powers the machine before any component
    // downstream has had a chance to subscribe) — `subscribe` alone only
    // fires on the *next* change, so the current value needs one manual
    // check the same way `Experience.tsx`'s own mount effect does.
    if (useMachine.getState().powerState !== 'STANDBY') {
      hasPlayedRef.current = true;
      play();
    }

    function play() {
      /*
       * Skip outright rather than degrade — reduced motion and the lowest
       * capability tier both mean the same thing here: spend nothing extra.
       * The real heading was never touched, so there is nothing to undo; the
       * name a visitor in either case gets is the one that has always been
       * there, at its permanent opacity, on the very first frame.
       *
       * Read once, here, rather than subscribed to — a device's capability
       * does not need re-checking once a sequence has already started, for
       * the same reason `powerState` itself is watched imperatively above.
       */
      const { reducedMotion, quality } = useMachine.getState();
      if (reducedMotion || quality === 'low') return;

      if (!heading || !canvas || !ctx) return;

      // Rebound to definitely-non-null locals: the narrowing at the top of
      // the effect does not carry into this function (it is hoisted, and
      // called from a subscription), nor from here into the nested functions
      // below, which escape this control-flow path entirely — they run later,
      // from `requestAnimationFrame`. These three names are what every line
      // from this point on actually closes over.
      const headingEl: HTMLHeadingElement = heading;
      const canvasEl: HTMLCanvasElement = canvas;
      const ctx2d: CanvasRenderingContext2D = ctx;

      /*
       * Two frames of deferral before measuring.
       *
       * The sequence starts on a `powerState` transition, which React is in
       * the middle of rendering the consequences of — `BootSequence` swaps
       * its own status line and POST panel in the same commit, and the
       * identity block is a `justify-center` column, so adding content below
       * it moves the heading. Measuring during that commit reads a layout
       * that is about to change. One `requestAnimationFrame` gets past the
       * commit; the second gets past the style/layout flush it triggers,
       * which is where the `clamp()` font size actually resolves.
       *
       * Hiding the heading, by contrast, cannot wait: the whole point of an
       * instant hide is that it lands in the same tick as the click, so the
       * name does not sit there for two frames after power is pressed.
       */
      headingEl.style.opacity = '0';
      activeRef.current = true;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const m = measure();
          if (!m) {
            // Nothing measurable to draw on top of — a zero-size box, or a
            // heading with no text. Give the name straight back rather than
            // leaving a hidden heading behind.
            headingEl.style.opacity = '';
            activeRef.current = false;
            return;
          }
          runSequence(m);
        });
      });

      /**
       * Everything the reveal needs in order to land exactly on top of the
       * real heading, derived from the live DOM rather than assumed.
       */
      function measure(): Measurement | null {
        const cs = getComputedStyle(headingEl);

        /*
         * A `Range` over the heading's contents, not the heading's own box.
         *
         * `getBoundingClientRect()` on the `<h1>` returns the *block*, which
         * is the full width of the column — 1108px for a word nowhere near
         * that wide. Sizing the canvas to that would place the string at the
         * wrong x and waste most of the surface. A range selecting the text
         * nodes returns the inline box the glyphs genuinely occupy, which is
         * the thing to align to.
         */
        const range = document.createRange();
        range.selectNodeContents(headingEl);
        const textRect = range.getBoundingClientRect();
        if (textRect.width < 1 || textRect.height < 1) return null;

        const wrapper = canvasEl.parentElement;
        if (!wrapper) return null;
        const wrapperRect = wrapper.getBoundingClientRect();

        const fontSize = parseFloat(cs.fontSize) || 16;
        const padX = fontSize * PAD_X_RATIO;
        const padTop = fontSize * PAD_TOP_RATIO;
        const padBottom = fontSize * PAD_BOTTOM_RATIO;

        const text = headingEl.textContent ?? '';
        if (!text.trim()) return null;

        /*
         * The font shorthand straight off the element, so the canvas draws
         * the same face at the same weight and size the browser is — the
         * whole fallback stack included, which matters if Space Grotesk has
         * not finished loading.
         */
        ctx2d.font = cs.font;
        const letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
        /*
         * Canvas `letterSpacing` is supported across current Chromium,
         * Firefox and Safari, but is still worth feature-detecting rather
         * than assuming: this heading's tracking is a visible -3px, and
         * silently dropping it would draw a string measurably wider than the
         * heading underneath. `scaleX` below is the safety net if it is not
         * there.
         */
        if ('letterSpacing' in ctx2d) {
          (ctx2d as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
            letterSpacing;
        }

        const metrics = ctx2d.measureText(text);
        const measured = metrics.width;
        if (!(measured > 0)) return null;

        /*
         * If the canvas and the DOM disagree about how wide the string is —
         * because `letterSpacing` was unsupported, or a fallback font
         * resolved differently — scale horizontally to match rather than
         * letting the reveal sit a few px off the heading it hands over to.
         * Agreement is the normal case and this is 1.
         */
        const scaleX = textRect.width / measured;

        /*
         * The alphabetic baseline.
         *
         * A `Range` over text returns the *font's inline box* — not the line
         * box — so its top is exactly one font ascent above the baseline and
         * the line-height plays no part. Measured against this heading to be
         * sure, because the two boxes are genuinely different here (ascent +
         * descent is 174px against a 133.28px line-height, the glyphs
         * overflowing their line by design):
         *
         *   range height          174px  ==  ascent (134) + descent (40)
         *   baseline - range top  134px  ==  ascent
         *
         * An earlier version of this applied CSS's half-leading rule on the
         * assumption that the rect was the line box, which put the whole word
         * 20px too high — visible immediately as a doubled name the moment
         * the canvas and the heading were on screen together.
         *
         * `fontBoundingBox*` is the font's declared ascent/descent —
         * deliberately not `actualBoundingBox*`, which describes the ink of
         * this particular string and would move the baseline depending on
         * which letters happen to be in the name.
         */
        const ascent = metrics.fontBoundingBoxAscent;
        const descent = metrics.fontBoundingBoxDescent;
        const baselineY = padTop + ascent;

        /*
         * Where each glyph starts, so each can be masked independently.
         *
         * Cumulative `measureText` over prefixes rather than a sum of
         * per-character widths: prefix advances carry the font's kerning, and
         * these values are only ever used as *mask boundaries* — they fall in
         * the gaps between letters, where a sub-pixel disagreement with the
         * real layout is invisible. No glyph is ever positioned from this;
         * the whole string is drawn in one call and clipped, so what is on
         * screen is the browser's own layout.
         */
        const charStarts: number[] = [];
        for (let i = 0; i < text.length; i++) {
          charStarts.push(ctx2d.measureText(text.slice(0, i)).width * scaleX);
        }

        /*
         * Where the starlight is going.
         *
         * The motes converge onto points that are genuinely *on* the letter's
         * strokes, not onto its bounding box — light gathering into the shape
         * of a letter reads as the letter forming; light gathering into a
         * rectangle reads as a rectangle. So the string is rasterised once,
         * offscreen, and its opaque pixels are sampled.
         *
         * This is the one idea worth keeping from the particle version this
         * file replaced. The difference is what the points are *for*: there,
         * they were the letter, and the letter was therefore never sharp.
         * Here the letter is drawn properly and the motes are additive light
         * on top, extinguished by the time it finishes resolving — so they
         * can only ever add to a glyph that is already correct.
         *
         * Sampled at 40% scale and strided: the exact positions do not matter
         * (a mote is a point of light, not a pixel of type) and a full-size
         * per-pixel walk of a 819x174 bitmap is pure waste.
         */
        const inkByChar: { x: number; y: number }[][] = text.split('').map(() => []);
        const SAMPLE_SCALE = 0.4;
        const sampleW = Math.max(1, Math.ceil(textRect.width * SAMPLE_SCALE));
        const sampleH = Math.max(1, Math.ceil((ascent + descent) * SAMPLE_SCALE));
        const sampler = document.createElement('canvas');
        sampler.width = sampleW;
        sampler.height = sampleH;
        const sctx = sampler.getContext('2d', { willReadFrequently: true });
        if (sctx) {
          sctx.scale(SAMPLE_SCALE, SAMPLE_SCALE);
          sctx.font = cs.font;
          if ('letterSpacing' in sctx) {
            (sctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
              letterSpacing;
          }
          sctx.textBaseline = 'alphabetic';
          sctx.textAlign = 'left';
          sctx.fillStyle = '#fff';
          if (scaleX !== 1) sctx.scale(scaleX, 1);
          sctx.fillText(text, 0, ascent);

          const data = sctx.getImageData(0, 0, sampleW, sampleH).data;
          // Which character a given x falls inside, walked in step with the
          // scan so the boundaries are found once rather than per pixel.
          let charAt = 0;
          for (let sy = 0; sy < sampleH; sy += 2) {
            charAt = 0;
            for (let sx = 0; sx < sampleW; sx += 2) {
              if (data[(sy * sampleW + sx) * 4 + 3] < INK_ALPHA_THRESHOLD) continue;
              const tx = sx / SAMPLE_SCALE;
              while (
                charAt + 1 < charStarts.length &&
                tx >= charStarts[charAt + 1]
              ) {
                charAt++;
              }
              inkByChar[charAt].push({
                x: padX + tx,
                y: padTop + sy / SAMPLE_SCALE,
              });
            }
          }
        }

        /*
         * The two-tone split. `BootSequence` renders the surname inside a
         * `<span>` with the ash colour; reading that span's own computed
         * colour and the length of its text keeps this file from having to
         * know anything about how the name is split.
         */
        const span = headingEl.querySelector('span');
        const tailText = span?.textContent ?? '';
        const splitAt = tailText ? text.length - tailText.length : text.length;

        return {
          left: textRect.left - wrapperRect.left - padX,
          top: textRect.top - wrapperRect.top - padTop,
          width: textRect.width + padX * 2,
          height: textRect.height + padTop + padBottom,
          originX: padX,
          inkByChar,
          baselineY,
          font: cs.font,
          letterSpacing,
          fontSize,
          charStarts,
          textWidth: textRect.width,
          scaleX,
          text,
          splitAt,
          colorHead: cs.color,
          colorTail: span ? getComputedStyle(span).color : cs.color,
          ascent,
        };
      }

      function runSequence(m: Measurement) {
        // Capped at 2: past that the surface area quadruples for a
        // difference nobody can see on type this large.
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const tier: 'high' | 'medium' | 'mobile' =
          quality === 'high' || quality === 'medium' ? quality : 'mobile';
        const starsPerGlyph = STARS_BY_QUALITY[tier];
        /*
         * The per-glyph focus pull is the one genuinely expensive thing here:
         * a canvas `filter: blur()` allocates an intermediate surface per
         * call, and there is one call per still-arriving glyph per frame. A
         * phone gets the reveal without it — the rise, the starlight and the
         * ignition glow carry the same beat, and a dropped frame would cost
         * more than the softness buys.
         */
        const allowBlur = tier !== 'mobile';

        canvasEl.style.left = `${m.left}px`;
        canvasEl.style.top = `${m.top}px`;
        canvasEl.style.width = `${m.width}px`;
        canvasEl.style.height = `${m.height}px`;
        canvasEl.width = Math.ceil(m.width * dpr);
        canvasEl.height = Math.ceil(m.height * dpr);
        canvasEl.style.display = 'block';

        /*
         * A scratch surface for the blurred-glyph path below, allocated once
         * rather than per frame per letter. It only ever has to hold a single
         * column plus the room its blur halo spreads into, so it stays small
         * regardless of how long the name is.
         */
        const blurPad = Math.ceil(m.fontSize * BLUR_RATIO) + 2;
        let widestCol = 0;
        for (let i = 0; i < m.charStarts.length; i++) {
          const a = m.charStarts[i];
          const bnd = i + 1 < m.charStarts.length ? m.charStarts[i + 1] : m.textWidth;
          if (bnd - a > widestCol) widestCol = bnd - a;
        }
        const offCanvas = document.createElement('canvas');
        offCanvas.width = Math.ceil((widestCol + blurPad * 2) * dpr);
        offCanvas.height = Math.ceil(m.height * dpr);
        const offCtx = offCanvas.getContext('2d');
        if (!offCtx) {
          headingEl.style.opacity = '';
          activeRef.current = false;
          return;
        }

        /*
         * Which characters get their own beat.
         *
         * The space in "Bakul Ahmed" is not a glyph and must not consume a
         * stagger slot — if it did there would be a 58ms hole in the middle
         * of the cadence, and the tick scored against that slot would sound
         * for a letter nobody can see arriving.
         */
        const beats: number[] = [];
        for (let i = 0; i < m.text.length; i++) {
          if (m.text[i].trim()) beats.push(i);
        }
        if (beats.length === 0) {
          headingEl.style.opacity = '';
          activeRef.current = false;
          return;
        }

        const beatOf = new Map<number, number>();
        beats.forEach((charIndex, beat) => beatOf.set(charIndex, beat));

        const lastStart = T_ANTICIPATION + (beats.length - 1) * CHAR_STAGGER;
        const T_RISE_END = lastStart + CHAR_DUR;
        // The sweep starts before the last letters have finished settling so
        // the two phases overlap rather than queue — the word is never
        // sitting motionless waiting for the next thing to begin.
        const T_SWEEP_START = T_RISE_END - 420;
        const T_SWEEP_END = T_SWEEP_START + 620;
        const T_DONE = T_SWEEP_END;

        /*
         * Two pre-rendered light sprites, drawn once and then only ever
         * scaled and blended.
         *
         * A radial gradient object per mote per frame would be ~150 gradient
         * allocations every frame for the whole reveal; a sprite is one
         * allocation total and `drawImage` is the cheapest call on the
         * surface. Both are pure white so they can be tinted at draw time by
         * compositing rather than by re-rendering.
         */
        const makeSprite = (size: number, stops: [number, string][]) => {
          const c = document.createElement('canvas');
          c.width = size;
          c.height = size;
          const g2 = c.getContext('2d');
          if (g2) {
            const grad = g2.createRadialGradient(
              size / 2, size / 2, 0, size / 2, size / 2, size / 2,
            );
            for (const [at, col] of stops) grad.addColorStop(at, col);
            g2.fillStyle = grad;
            g2.fillRect(0, 0, size, size);
          }
          return c;
        };

        // A mote: a hot centre with a short falloff, so it reads as a point
        // of light rather than a soft blob.
        const dotSprite = makeSprite(64, [
          [0, GOLD.starCore],
          [0.22, GOLD.starMid],
          [0.5, GOLD.starFalloff],
          [1, GOLD.starEdge],
        ]);
        // The ignition bloom behind a landing glyph: wide, soft, no hot core.
        const glowSprite = makeSprite(128, [
          [0, GOLD.glowCore],
          [0.35, GOLD.glowMid],
          [1, GOLD.glowEdge],
        ]);

        /*
         * The starlight, laid out once.
         *
         * Each mote is given a point on its glyph's ink to arrive at and a
         * departure point out on a ring around it — the angle biased upward
         * (the -0.15 turn and the vertical squash) so the field reads as
         * light settling down onto the word rather than closing in on it
         * evenly from all sides, which looks like an implosion.
         */
        const stars: {
          ch: number;
          tx: number;
          ty: number;
          sx: number;
          sy: number;
          size: number;
          lead: number;
          /** Direction of travel, for the streak to lie along. */
          angle: number;
          /** 0 = far, 1 = near. Scales size and brightness together, which is
           *  the whole of what makes a flat scatter read as a volume. */
          depth: number;
        }[] = [];
        for (let i = 0; i < m.text.length; i++) {
          const ink = m.inkByChar[i];
          if (!ink || ink.length === 0) continue;
          for (let n = 0; n < starsPerGlyph; n++) {
            const target = ink[Math.floor(Math.random() * ink.length)];
            const angle = Math.random() * Math.PI * 2 - 0.15;
            const depth = Math.random();
            // Nearer motes start further out, so they sweep a longer arc and
            // read as passing closer to the viewer.
            const dist =
              m.fontSize * STAR_SPREAD * (0.4 + Math.random() * 0.6) * (0.75 + depth * 0.6);
            const sx = target.x + Math.cos(angle) * dist;
            const sy = target.y + Math.sin(angle) * dist * 0.62;
            stars.push({
              ch: i,
              tx: target.x,
              ty: target.y,
              sx,
              sy,
              size: m.fontSize * (0.016 + Math.random() * 0.022) * (0.55 + depth * 0.95),
              // Staggers motes within one glyph so they do not all arrive on
              // the same frame.
              lead: Math.random() * 0.35,
              angle: Math.atan2(target.y - sy, target.x - sx),
              depth,
            });
          }
        }

        // Far motes first, so the near ones lie over them.
        stars.sort((a, b) => a.depth - b.depth);

        const start = performance.now();

        /* ---- Sound, scored against the same beats the eye is given ---- */
        let firedActivate = false;
        let firedLock = false;
        const tickFired = beats.map(() => false);

        const frame = (now: number) => {
          const t = now - start;

          /* ---- Cues ---------------------------------------------------
           * `power` and `online` are deliberately not played here:
           * `SoundBridge` already fires them off the same `powerState`
           * transitions this sequence watches, and playing them again would
           * simply double the sound. What is added is the layer only this
           * animation knows about — the moment light enters, one tick per
           * glyph arriving, and the lock as the word finishes.
           */
          if (!firedActivate && t >= T_ANTICIPATION) {
            firedActivate = true;
            audio.play('activate');
            haptic('activate');
          }
          for (let b = 0; b < beats.length; b += TICK_EVERY) {
            // On the glyph's own landing strike, not on the frame it starts
            // moving — the tick marks a letter *arriving*, and that is the
            // instant the flash is brightest.
            if (
              !tickFired[b] &&
              t >= T_ANTICIPATION + b * CHAR_STAGGER + CHAR_DUR * FLASH_PEAK
            ) {
              tickFired[b] = true;
              audio.play('tick');
            }
          }
          // On the last letter's strike rather than at the end of its travel:
          // the word is finished when the final glyph lands, not ~100ms later
          // when its last sub-pixel of easing has run out.
          if (!firedLock && t >= lastStart + CHAR_DUR * FLASH_PEAK) {
            firedLock = true;
            audio.play('lock');
            haptic('lock');
          }

          ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx2d.clearRect(0, 0, m.width, m.height);

          /* ---- The filament ------------------------------------------
           * Before any letter exists, a thread of light draws itself along
           * the baseline the name is about to occupy — a point at the left
           * that stretches out to the full width of the word, brightening as
           * it goes, then burning down as the first glyphs start to arrive.
           *
           * This is what the anticipation beat is *for*. Holding an empty line
           * for a quarter second and calling it tension only works if there is
           * something to watch; without it the reveal simply started, and the
           * first letter had to do the work of announcing that anything was
           * happening at all. The filament announces it, and the letters then
           * appear to come up out of the line rather than out of nothing.
           *
           * Drawn additively and *before* the glyphs, so the type paints over
           * it normally and the light reads as being behind the word.
           */
          {
            const grow = easeOutCubic(clamp01(t / T_ANTICIPATION));
            // Burns down over the first few glyph arrivals rather than cutting
            // out the moment the letters start.
            const burn = 1 - clamp01((t - T_ANTICIPATION) / 460);
            const fa = grow * burn;
            if (fa > 0.004) {
              const half = (m.textWidth * grow) / 2;
              const cx = m.originX + half;
              const y = m.baselineY;
              ctx2d.save();
              ctx2d.globalCompositeOperation = 'lighter';

              // A soft bed of light around the thread.
              const bedH = m.fontSize * 0.13;
              const bed = ctx2d.createLinearGradient(cx - half, 0, cx + half, 0);
              bed.addColorStop(0, `${GOLD.filamentEdge}0)`);
              bed.addColorStop(0.5, `${GOLD.filamentEdge}${(0.34 * fa).toFixed(3)})`);
              bed.addColorStop(1, `${GOLD.filamentEdge}0)`);
              ctx2d.fillStyle = bed;
              ctx2d.fillRect(cx - half, y - bedH, half * 2, bedH * 2);

              // The thread itself: hot, and no thicker than a hairline.
              const coreH = Math.max(1, m.fontSize * 0.012);
              const core = ctx2d.createLinearGradient(cx - half, 0, cx + half, 0);
              core.addColorStop(0, `${GOLD.filamentCore}0)`);
              core.addColorStop(0.5, `${GOLD.filamentCore}${(0.9 * fa).toFixed(3)})`);
              core.addColorStop(1, `${GOLD.filamentCore}0)`);
              ctx2d.fillStyle = core;
              ctx2d.fillRect(cx - half, y - coreH / 2, half * 2, coreH);
              ctx2d.restore();
            }
          }

          ctx2d.font = m.font;
          if ('letterSpacing' in ctx2d) {
            (ctx2d as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
              m.letterSpacing;
          }
          ctx2d.textBaseline = 'alphabetic';
          ctx2d.textAlign = 'left';

          const canBlur = allowBlur && 'filter' in ctx2d;

          /** One glyph's progress through its own arrival, 0..1. */
          const progressOf = (charIndex: number) => {
            const bt = beatOf.get(charIndex);
            if (bt === undefined) return 0;
            return clamp01((t - (T_ANTICIPATION + bt * CHAR_STAGGER)) / CHAR_DUR);
          };

          /* ---- The glyphs -------------------------------------------- */
          for (let i = 0; i < m.text.length; i++) {
            if (!m.text[i].trim()) continue;

            const b = beatOf.get(i) ?? 0;
            const p = clamp01((t - (T_ANTICIPATION + b * CHAR_STAGGER)) / CHAR_DUR);
            if (p <= 0) continue;

            const rise = (1 - easeOutExpo(p)) * m.fontSize * RISE_RATIO;
            // Opacity resolves faster than position, so the letter is fully
            // present while still visibly settling. Fading and moving in
            // lockstep is what makes a reveal read as a slide transition.
            const alpha = easeOutCubic(clamp01(p * 1.6));
            const blur = (1 - easeOutCubic(p)) * m.fontSize * BLUR_RATIO;

            /*
             * This glyph's own column. The boundaries fall in the gaps
             * between letters, so isolating one letter is a matter of
             * clipping the whole string to its slice.
             */
            const x0 = m.originX + m.charStarts[i];
            const x1 =
              i + 1 < m.charStarts.length
                ? m.originX + m.charStarts[i + 1]
                : m.originX + m.textWidth;

            /*
             * The baseline mask, applied to every glyph alike: everything
             * below the baseline is cut. Because the glyph starts below that
             * line and rises through it, the letter is genuinely hidden and
             * emerges *out from behind* the baseline — the reveal reads as
             * uncovering rather than as a fade-in with a y-offset.
             *
             * "Bakul Ahmed" has no descenders, which is what makes a flat cut
             * at the baseline safe here. A name that did would need the mask
             * dropped by `fontBoundingBoxDescent`, and would lose exactly this
             * quality in exchange.
             */
            const maskBottom = m.baselineY;

            if (!canBlur || blur <= 0.25) {
              /*
               * The cheap path, and the one every glyph ends on: no blur, so
               * the column clip can be applied directly to the main surface.
               */
              ctx2d.save();
              ctx2d.beginPath();
              ctx2d.rect(x0 - 1, 0, x1 - x0 + 2, maskBottom);
              ctx2d.clip();
              ctx2d.globalAlpha = alpha;
              ctx2d.fillStyle = i < m.splitAt ? m.colorHead : m.colorTail;
              ctx2d.translate(0, rise);
              /*
               * The *whole* string is drawn, and the clip decides which letter
               * you see. Drawing per-character substrings instead would
               * re-lay-out each glyph in isolation and throw away the kerning
               * between it and its neighbours — the word would come out subtly
               * wider than the heading it hands over to. This way what is on
               * screen is always the browser's own layout of the real string.
               */
              if (m.scaleX !== 1) {
                ctx2d.scale(m.scaleX, 1);
                ctx2d.fillText(m.text, m.originX / m.scaleX, m.baselineY);
              } else {
                ctx2d.fillText(m.text, m.originX, m.baselineY);
              }
              ctx2d.restore();

              /*
               * The landing flash: the glyph re-drawn over itself additively
               * for the last fraction of its arrival. It is what gives each
               * letter a moment of impact instead of merely stopping, and it
               * is scored to the same instant the ear is given — the tick for
               * this glyph, and for the final letter the `lock`.
               */
              const flash = Math.sin(clamp01((p - FLASH_FROM) / FLASH_SPAN) * Math.PI) * 0.4;
              if (flash > 0.01) {
                ctx2d.save();
                ctx2d.beginPath();
                ctx2d.rect(x0 - 1, 0, x1 - x0 + 2, maskBottom);
                ctx2d.clip();
                ctx2d.globalCompositeOperation = 'lighter';
                ctx2d.globalAlpha = flash;
                ctx2d.fillStyle = GOLD.flash;
                ctx2d.translate(0, rise);
                if (m.scaleX !== 1) {
                  ctx2d.scale(m.scaleX, 1);
                  ctx2d.fillText(m.text, m.originX / m.scaleX, m.baselineY);
                } else {
                  ctx2d.fillText(m.text, m.originX, m.baselineY);
                }
                ctx2d.restore();
              }
              continue;
            }

            /*
             * The blurred path — isolate first, blur second.
             *
             * Blurring *inside* the column clip is the obvious way to write
             * this and it is visibly wrong: the blur halo spreads past the
             * column boundary, the clip slices it off, and every
             * still-arriving letter picks up a hard-edged grey rectangle
             * around it. (That artifact was clearly visible on the "k", "A"
             * and "h" before this was restructured.)
             *
             * So the glyph is isolated on its own small surface *unblurred*,
             * where the clip cuts nothing but crisp type, and the blur is
             * applied when that surface is composited onto the main canvas —
             * at which point the halo has empty space to spread into and
             * falls off naturally in every direction.
             */
            const colW = x1 - x0;
            const ow = colW + blurPad * 2;
            const ox = x0 - blurPad;
            offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
            offCtx.clearRect(0, 0, ow, m.height);
            offCtx.save();
            offCtx.beginPath();
            offCtx.rect(blurPad, 0, colW, m.height);
            offCtx.clip();
            offCtx.font = m.font;
            if ('letterSpacing' in offCtx) {
              (offCtx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
                m.letterSpacing;
            }
            offCtx.textBaseline = 'alphabetic';
            offCtx.textAlign = 'left';
            offCtx.fillStyle = i < m.splitAt ? m.colorHead : m.colorTail;
            if (m.scaleX !== 1) {
              offCtx.scale(m.scaleX, 1);
              offCtx.fillText(m.text, (m.originX - ox) / m.scaleX, m.baselineY);
            } else {
              offCtx.fillText(m.text, m.originX - ox, m.baselineY);
            }
            offCtx.restore();

            ctx2d.save();
            ctx2d.beginPath();
            ctx2d.rect(0, 0, m.width, maskBottom);
            ctx2d.clip();
            ctx2d.globalAlpha = alpha;
            ctx2d.filter = `blur(${blur.toFixed(2)}px)`;
            ctx2d.drawImage(
              offCanvas,
              0,
              0,
              Math.max(1, Math.ceil(ow * dpr)),
              Math.max(1, Math.ceil(m.height * dpr)),
              ox,
              rise,
              ow,
              m.height,
            );
            ctx2d.restore();
          }

          /* ---- The specular sweep ------------------------------------ */
          if (t >= T_SWEEP_START && t < T_SWEEP_END) {
            const sw = clamp01((t - T_SWEEP_START) / (T_SWEEP_END - T_SWEEP_START));
            // Eased, so the highlight decelerates as it leaves rather than
            // running off the end of the word at full speed.
            const travel = easeOutCubic(sw);
            const bandW = m.fontSize * 1.5;
            const cx = -bandW + travel * (m.width + bandW * 2);
            // Fades in and out across its own traverse, so the band never
            // pops on at the left edge or cuts off at the right.
            const intensity = Math.sin(sw * Math.PI) * 0.55;

            ctx2d.save();
            /*
             * `source-atop` is what makes this read as light *on the letters*
             * rather than a bar drawn over the page: the highlight paints only
             * where glyph pixels already exist, so it is shaped by the type
             * itself.
             */
            ctx2d.globalCompositeOperation = 'source-atop';
            /*
             * Warm, and hottest at its centre — a rake of light off gold metal
             * rather than a white bar. The two warm stops either side of the
             * hot core are what give the highlight a colour temperature instead
             * of just a brightness.
             */
            const g = ctx2d.createLinearGradient(cx - bandW, 0, cx + bandW, 0);
            g.addColorStop(0, `${GOLD.sweepWarm}0)`);
            g.addColorStop(0.34, `${GOLD.sweepWarm}${(intensity * 0.42).toFixed(3)})`);
            g.addColorStop(0.5, `${GOLD.sweepHot}${intensity.toFixed(3)})`);
            g.addColorStop(0.66, `${GOLD.sweepWarm}${(intensity * 0.42).toFixed(3)})`);
            g.addColorStop(1, `${GOLD.sweepWarm}0)`);
            ctx2d.fillStyle = g;
            ctx2d.fillRect(0, 0, m.width, m.height);
            ctx2d.restore();
          }

          /* ---- Starlight ---------------------------------------------
           * Motes converge onto their glyph's own strokes and are
           * extinguished as they arrive: brightest in flight, gone at the
           * moment of landing. Drawn additively and last, so they read as
           * light in front of the type rather than as objects near it.
           *
           * Because they die on arrival, they can never obscure the letter —
           * which is the whole reason this is safe to do over crisp type when
           * building the type out of particles was not.
           */
          ctx2d.save();
          ctx2d.globalCompositeOperation = 'lighter';
          for (let n = 0; n < stars.length; n++) {
            const st = stars[n];
            const p = progressOf(st.ch);
            if (p <= 0) continue;
            // Each mote runs slightly ahead of or behind its glyph.
            const sp = clamp01((p - st.lead * 0.25) / 0.82);
            if (sp <= 0 || sp >= 1) continue;
            const e = easeOutCubic(sp);
            const x = st.sx + (st.tx - st.sx) * e;
            const y = st.sy + (st.ty - st.sy) * e;
            // Nearer motes carry more light, the same way they carry more size.
            // The `speed` term dims a mote in proportion to how far it is being
            // smeared: a long streak spreads the same light over several times
            // the area, so leaving its peak alpha alone made mid-flight read as
            // fireworks going off in front of the word rather than as light
            // arriving at it. Dimmest when longest, brightest as it lands.
            const speed = 1 - e;
            const a =
              Math.sin(sp * Math.PI) * (0.4 + st.depth * 0.6) * (1 - speed * 0.45);
            if (a <= 0.01) continue;
            // A little larger in flight, contracting to a point as it lands.
            const sz = st.size * (1 + (1 - e) * 1.6);
            ctx2d.globalAlpha = a;

            /*
             * A streak while it is travelling, a point once it has arrived.
             *
             * The sprite is round; stretching it along the direction of travel
             * turns each mote into a comet whose tail length falls off with its
             * own speed. Without this the field reads as dots being slid into
             * position — every mote the same shape whether it is crossing half
             * an em or sitting still — and it is the single change that makes
             * the starlight look like it is moving rather than being moved.
             *
             * Only while there is real speed left to describe: past ~85% of the
             * journey the stretch is under a pixel, and a rotate/translate per
             * mote is not worth paying for to draw a circle as a circle.
             */
            if (speed > 0.15) {
              const stretch = 1 + speed * 4;
              ctx2d.save();
              ctx2d.translate(x, y);
              ctx2d.rotate(st.angle);
              ctx2d.drawImage(dotSprite, -sz * stretch, -sz, sz * 2 * stretch, sz * 2);
              ctx2d.restore();
            } else {
              ctx2d.drawImage(dotSprite, x - sz, y - sz, sz * 2, sz * 2);
            }
          }
          ctx2d.restore();

          /* ---- The golden shadow -------------------------------------
           * The word is lit from in front and above, so it should cast
           * something. This is that cast: the real letterforms, in amber,
           * blurred and dropped a little below the type they belong to.
           *
           * Three things make it cheap and make it correct:
           *
           * · It is drawn with the canvas's own `shadow*` properties in a
           *   single `fillText` of the whole string, not per glyph — one call
           *   a frame rather than eleven.
           * · `destination-over` means the glyph re-drawn here lands
           *   *underneath* the type already on the surface, so the letter
           *   bodies are hidden by the letters themselves and only the shadow
           *   spreading past their edges is ever visible.
           * · The clip stops at the last glyph that has substantially landed,
           *   so letters still in flight cast nothing. Its edge falls in the
           *   gap between two letters, where a vertical boundary cannot be
           *   seen — the same reason the per-glyph masks cut where they do.
           */
          {
            let shadowRight = 0;
            for (let i = 0; i < m.text.length; i++) {
              if (!m.text[i].trim()) continue;
              if (progressOf(i) < 0.55) continue;
              shadowRight =
                i + 1 < m.charStarts.length
                  ? m.originX + m.charStarts[i + 1]
                  : m.originX + m.textWidth;
            }
            if (shadowRight > 0) {
              ctx2d.save();
              ctx2d.beginPath();
              ctx2d.rect(0, 0, shadowRight, m.height);
              ctx2d.clip();
              ctx2d.globalCompositeOperation = 'destination-over';
              ctx2d.shadowColor = GOLD.shadow;
              ctx2d.shadowBlur = m.fontSize * 0.2;
              ctx2d.shadowOffsetY = m.fontSize * 0.055;
              ctx2d.fillStyle = GOLD.shadow;
              if (m.scaleX !== 1) {
                ctx2d.scale(m.scaleX, 1);
                ctx2d.fillText(m.text, m.originX / m.scaleX, m.baselineY);
              } else {
                ctx2d.fillText(m.text, m.originX, m.baselineY);
              }
              ctx2d.restore();
            }
          }

          /* ---- Light, placed strictly behind the type -----------------
           * Drawn last but composited *underneath* everything already on the
           * surface, which is the whole reason this works at all.
           *
           * The first version drew these first, additively, and the letters
           * disappeared: `lighter` accumulates, several overlapping glows
           * saturate their patch of canvas to near-white, and the heading's
           * own colour is near-white too — so mid-reveal the word was white
           * type on a white glow. (Only the "B" survived, because its own
           * glow had already decayed and the travelling bloom had moved off
           * it, which is exactly the shape of the bug in a frame grab.)
           *
           * `destination-over` fills only where the canvas is still
           * transparent, so the light can be as bright as it likes and can
           * never touch a pixel of a letter. It surrounds the type instead of
           * competing with it.
           */
          /* ---- Ambient bloom ------------------------------------------
           * A single wide wash behind the whole word, following the reveal
           * across and fading out as the name finishes. It is what keeps the
           * letters from looking like they are sitting on nothing: the word
           * arrives with its own light, and the light leaves before the
           * heading is handed back.
           */
          {
            const overall = clamp01((t - T_ANTICIPATION) / (T_RISE_END - T_ANTICIPATION));
            const bloom = Math.sin(clamp01(overall * 1.05) * Math.PI) * 0.5;
            if (bloom > 0.004) {
              ctx2d.save();
              ctx2d.globalCompositeOperation = 'destination-over';
              ctx2d.globalAlpha = bloom;
              // Tracks the leading edge of the reveal rather than sitting
              // centred, so the light moves with the letters.
              const cx = m.originX + m.textWidth * (0.12 + overall * 0.78);
              const rw = m.fontSize * 3.4;
              const rh = m.fontSize * 1.5;
              ctx2d.drawImage(
                glowSprite,
                cx - rw,
                m.baselineY - m.ascent * 0.55 - rh,
                rw * 2,
                rh * 2,
              );
              ctx2d.restore();
            }
          }

          /* ---- Ignition glow, per glyph ------------------------------- */
          for (let i = 0; i < m.text.length; i++) {
            if (!m.text[i].trim()) continue;
            const p = progressOf(i);
            if (p <= 0 || p >= 0.92) continue;
            // Peaks while the letter is still resolving and is gone by the
            // time it is sharp, so the glow reads as the cause of the letter
            // rather than as a halo stuck to it.
            const g = Math.sin(clamp01((p - 0.06) / 0.72) * Math.PI);
            if (g <= 0.01) continue;
            const x0g = m.originX + m.charStarts[i];
            const x1g =
              i + 1 < m.charStarts.length
                ? m.originX + m.charStarts[i + 1]
                : m.originX + m.textWidth;
            const r = m.fontSize * 1.05;
            ctx2d.save();
            ctx2d.globalCompositeOperation = 'destination-over';
            ctx2d.globalAlpha = g * 0.5;
            ctx2d.drawImage(
              glowSprite,
              (x0g + x1g) / 2 - r,
              m.baselineY - m.ascent * 0.46 - r,
              r * 2,
              r * 2,
            );
            ctx2d.restore();
          }

          if (t < T_DONE) {
            rafRef.current = requestAnimationFrame(frame);
            return;
          }

          /* ---- Done. One atomic swap, then leave nothing behind. -----
           * The heading is shown and the canvas is hidden in the same task,
           * so they are never both on screen and never both off it: the
           * browser composites one frame containing exactly one of them.
           *
           * Two earlier attempts at this are worth not repeating. A
           * cross-fade washed the name out halfway through, because two
           * layers of the same artwork at 50% compose to 75%, not 100%. An
           * overlap — both fully opaque for a few frames — then depends on
           * the two being pixel-identical, which is a promise this file
           * cannot quite keep: canvas text is grayscale-antialiased and DOM
           * text is not, so the overlap reads as a faint bolding that thins
           * again when the canvas goes. Swapping atomically needs neither
           * promise, and the geometry is measured accurately enough
           * (verified: ink bounding boxes within 1px, per-glyph advances
           * within ~1px) that nothing moves at the swap.
           */
          activeRef.current = false;
          rafRef.current = null;
          canvasEl.style.display = 'none';
          canvasEl.style.opacity = '';
          // Removed, not set to '1' — the heading's correct resting state is
          // *no inline style at all*, which is what it had before this ran and
          // what a visitor who never triggered the sequence sees.
          headingEl.style.opacity = '';
        };

        rafRef.current = requestAnimationFrame(frame);
      } // end runSequence()
    } // end play()

    return () => {
      unsubscribe();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      // If unmounted mid-sequence for any reason — a real unmount, not the
      // `powerState` churn this structure exists to be immune to — the real
      // heading must not be left invisible: hand it back immediately rather
      // than leaving a blank space where a name should be.
      if (activeRef.current) {
        heading.style.opacity = '';
      }
      activeRef.current = false;
    };
    // Empty on purpose — see the comment above this effect for what runs on
    // every re-render if this is ever changed back to `[powerState]`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Always rendered, never conditionally on `reducedMotion`/`quality` — see
   * the long note above the `powerState` subscription for why. When the
   * effect's own one-time capability check decides to skip the sequence, this
   * element simply never receives a size or a draw call and sits at its
   * default `display: none`: present in the DOM, inert, and exactly as
   * invisible as if this component had never mounted at all.
   */
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute z-10"
      style={{ display: 'none' }}
    />
  );
}
