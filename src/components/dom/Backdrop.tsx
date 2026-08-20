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
 * ── What makes it read as a floor rather than a pattern ───────────────────
 * Four things, in the order the eye resolves them:
 *
 *   1. CONVERGENCE. A short perspective focal length, so the lines actually
 *      meet. This is the only one of the four that a flat grid also has.
 *   2. SUBDIVISION. Minor cells inside major blocks, five to one — drafting
 *      convention. It gives the eye two scales to judge distance by instead
 *      of one, which is what separates a surveyed surface from graph paper.
 *   3. CONTACT. Light pools where a receding surface meets the horizon it
 *      vanishes into. Without that pooling the grid does not recede, it
 *      simply stops being drawn.
 *   4. TRAVEL. The floor streams at the speed the visitor is scrolling, not
 *      at a rate fixed at design time — see below.
 *
 * ── Synced, not merely simultaneous ──────────────────────────────────────
 * Nothing here is decoration laid over the machine; every value it draws with
 * comes from the same state the rest of the site reads:
 *
 *   `--tone`  the narrative scalar (amber → cyan) that the 3D light rig and
 *             every section wash are mixed from. The floor's lines and its
 *             horizon are mixed from it too, so the ground changes temperature
 *             with the story instead of contradicting it — this layer used to
 *             be hardcoded cyan while everything around it was cross-fading.
 *   `--flow`  smoothed scroll velocity — `frame.velocity`, the identical
 *             number the scene's own motion is driven by. It scales the grid's
 *             animation duration, so the floor crawls at rest and streams
 *             under speed.
 *   `--power` the boot ramp. The contact glow swells with it, so powering the
 *             machine on lights the floor rather than just revealing it.
 *
 * All three are plain custom properties on the root element, published by the
 * scroll engine and the boot sequence and quantised to twenty steps before
 * they are written. That is the entire bridge: no observer, no subscription,
 * no re-render, and no JavaScript at all in this file.
 *
 * ── Cost ────────────────────────────────────────────────────────────────
 * Six elements and no JavaScript. Every line, rail, band and glow is a
 * gradient painted once; the motion is `translate3d` and `background-position`
 * on composited layers, looping by exactly one major block so it is seamless
 * at both grid scales. Nothing here invalidates layout or repaints per frame,
 * which is why it can run alongside a WebGL scene without taking anything
 * from it, and `contain: strict` states that to the engine formally. The
 * global reduced-motion rule in globals.css freezes every drift to its opening
 * frame automatically — each keyframe set's 0% is deliberately the intended
 * still composition.
 */
export function Backdrop() {
  return (
    <div aria-hidden="true" className="no-print substrate">
      {/* The floor plane, laid down in 3D and faded out towards the horizon.
          Both children are inside it so they share its foreshortening — a band
          of light that ignored the perspective would read as a bar drawn on
          the screen rather than as light falling on the floor. */}
      <div className="substrate__plane">
        {/* Minor + major lattice, carried on one element so the two scales can
            never drift out of registration. */}
        <div className="substrate__grid" />
        {/* Raking light crossing the floor, on a period coprime with the
            grid's so the two never fall into a visible beat. */}
        <div className="substrate__sweep" />
      </div>

      {/* Light pooling at the far edge. Under the hairline in the DOM so the
          line stays the crisp thing and the glow stays the soft thing. */}
      <div className="substrate__contact" />

      {/* Where the floor meets the light. A single hairline, hottest at the
          vanishing point: it is what tells the eye the grid is a ground plane
          and not a pattern on glass. */}
      <div className="substrate__horizon" />

      {/* Corner darkening, over everything decorative. The canvas has its own
          post-process vignette, but the scrim sits on top of that and flattens
          it back out — so the framing has to be re-applied above the scrim. */}
      <div className="substrate__vignette" />
    </div>
  );
}
