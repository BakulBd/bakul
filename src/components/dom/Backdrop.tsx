'use client';

/**
 * THE SUBSTRATE — the ground the whole site stands on.
 *
 * A grid in true perspective, receding to a horizon a little above the centre
 * of the viewport. It sits above the readability scrim and below the content,
 * so it reads as the floor the machine is bolted to rather than as wallpaper
 * behind it.
 *
 * Why this image, for this person: a receding grid is the oldest drawing in
 * computer graphics and still the most legible shorthand for "a coordinate
 * space, viewed from inside it" — which is what a computer science portfolio
 * is a tour of. It is also the exact figure the share card is built on, so the
 * preview in a recruiter's Slack and the page they land on are recognisably
 * the same object.
 *
 * ── Cost ────────────────────────────────────────────────────────────────
 * Two elements and no JavaScript. The grid is a repeating linear-gradient
 * painted once; the motion is a `translate3d` on a single composited layer,
 * looping by exactly one cell so it is seamless. Nothing here invalidates
 * layout or repaints per frame, which is why it can run alongside a WebGL
 * scene without taking anything from it. The global reduced-motion rule in
 * globals.css freezes the drift to a still frame automatically.
 */
export function Backdrop() {
  return (
    <div aria-hidden="true" className="no-print substrate">
      {/* The floor plane, laid down in 3D and faded out towards the horizon. */}
      <div className="substrate__plane">
        <div className="substrate__grid" />
      </div>

      {/* Where the floor meets the light. A single hairline: it is what tells
          the eye the grid is a ground plane and not a pattern on glass. */}
      <div className="substrate__horizon" />

      {/* Corner darkening, over everything decorative. The canvas has its own
          post-process vignette, but the scrim sits on top of that and flattens
          it back out — so the framing has to be re-applied above the scrim. */}
      <div className="substrate__vignette" />
    </div>
  );
}
