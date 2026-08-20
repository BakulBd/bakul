import { renderShareCard, OG_SIZE, OG_CONTENT_TYPE, SHARE_CARDS } from '@/lib/og';

/**
 * The X / Twitter card, as its own route.
 *
 * ── Why this file exists when `opengraph-image` already does ──────────────
 * X's crawler prefers `twitter:image` and only falls back to `og:image`. The
 * fallback does work — but it is a fallback, and relying on it costs two things
 * that matter for the single most-seen artefact of the site:
 *
 *   1. `twitter:image:alt` is never emitted, because there is no
 *      `twitter-image` for Next.js to derive it from. The OG alt text does not
 *      substitute; X reads its own namespace. So the card had no alt text on
 *      the one platform where a preview is most often the *entire* impression.
 *   2. Several tools in the chain (X's own validator, Slack's unfurler when it
 *      sees a `twitter:card` declaration, a few link-preview services) treat a
 *      declared `summary_large_image` with no `twitter:image` as an incomplete
 *      card and degrade to the small variant — a 1200x630 composition rendered
 *      into a thumbnail.
 *
 * Declaring the route emits both tags explicitly. It costs nothing at runtime:
 * the layout, the fonts and the geometry are all shared through `renderShareCard`
 * — this is the same PNG, generated once at build time, under the second name
 * the crawler is actually looking for.
 */
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = SHARE_CARDS.home.alt;

export default function TwitterImage() {
  return renderShareCard('home');
}
