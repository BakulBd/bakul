/**
 * THE ATMOSPHERE
 *
 * Six divs. No state, no effects, no hooks, no client directive — every value
 * this layer animates is either a keyframe or a CSS custom property published
 * by something else. That is the whole point of it.
 *
 * WHY IT EXISTS
 *
 * The background used to be two things: a WebGL scene, and a flat grid
 * (`.substrate`) drawn over a solid colour. Between them sat nothing. On a
 * phone that gap was the entire visual experience, because the canvas does not
 * even mount until the machine powers on, and once it does it sits behind a
 * near-opaque readability scrim. So the most common first impression of the
 * site was a grid on a dark rectangle.
 *
 * This layer is what fills that gap. It is deliberately not a second attempt
 * at the 3D scene — it is the room the machine is standing in: large slow
 * masses of light, a fine drift of dust, a pool of glow at the horizon, and
 * depth fog. Cheap enough to run on a phone that has decided WebGL is not
 * worth its battery, and good enough that such a phone is not visibly getting
 * the consolation prize.
 *
 * WHY IT IS NOT A CANVAS
 *
 * Everything here composites on the GPU: `transform` and `opacity` only, no
 * layout, no paint, no per-frame JavaScript, and no main-thread work at all
 * once the styles are resolved. A `<canvas>` doing the same job would have to
 * be driven from a rAF loop competing with the render loop the real machine
 * already runs. Four gradients and a set of keyframes cost nothing by
 * comparison, and they keep working while the main thread is busy parsing
 * Three.js — which is exactly the moment the page most needs to look alive.
 *
 * HOW IT STAYS IN STEP WITH THE MACHINE
 *
 * Two custom properties, both published elsewhere, both read here:
 *
 *   --power  the boot ramp, mirrored from `frame.power` by Experience.tsx.
 *            Drives this layer's opacity, so the room brightens with the
 *            machine instead of on a timer that approximates it.
 *
 *   --tone   [0,1], mechanical amber -> computational cyan, published by the
 *            scroll engine from `toneAt()`. The aurora and the horizon bloom
 *            mix their colour from it, so the room's light changes hue as the
 *            visitor moves through the argument. It is the same scalar the 3D
 *            light rig reads: one source of truth for "where are we".
 *
 * Neither is a prop. Passing them through React would mean re-rendering this
 * component to change them, at which point it would stop being free.
 *
 * The element order below is load-bearing and matches the paint order the CSS
 * assumes: masses first, then dust over them, then the bloom, then fog last so
 * it sits in front of everything and pushes it all back. See `THE ATMOSPHERE`
 * in globals.css for the geometry and the reduced-motion, reduced-transparency
 * and small-viewport handling.
 */
export function Atmosphere() {
  return (
    <div aria-hidden="true" className="atmos no-print">
      {/* Three masses of light, on coprime-ish durations (47s / 61s / 38s) so
          the composition never visibly repeats. */}
      <div className="atmos__aurora atmos__aurora--1" />
      <div className="atmos__aurora atmos__aurora--2" />
      <div className="atmos__aurora atmos__aurora--3" />

      {/* Fine drift. Pans its own background-position, never the element —
          transforming this would inflate document.scrollWidth. */}
      <div className="atmos__dust" />

      {/* Light pooling at the horizon, where the ground plane meets the dark. */}
      <div className="atmos__bloom" />

      {/* Depth fog. Last, so it is in front of the rest of the layer. */}
      <div className="atmos__fog" />
    </div>
  );
}
