import { renderShareCard, OG_SIZE, OG_CONTENT_TYPE, OG_ALT } from '@/lib/og';

/**
 * Deliberately NOT `runtime = 'edge'`.
 *
 * On the edge runtime this route is excluded from static generation, so the
 * card is re-rendered — including a live Google Fonts round-trip — on every
 * single unfurl. Link previews are fetched by crawlers with short timeouts, and
 * a cold render that has to fetch two font files before it can rasterise is
 * exactly how a preview silently comes back blank. On the default runtime the
 * image is built once at build time and served as a static asset.
 */
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = OG_ALT;

export default function OpengraphImage() {
  return renderShareCard();
}
