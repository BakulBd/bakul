import { renderShareCard, OG_SIZE, OG_CONTENT_TYPE, SHARE_CARDS } from '@/lib/og';

/**
 * The lab's X / Twitter card. See `app/twitter-image.tsx` for why the route is
 * declared separately from the Open Graph one rather than left to fall back —
 * the short version is `twitter:image:alt`, which is only emitted when this
 * file exists.
 */
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = SHARE_CARDS.lab.alt;

export default function LabTwitterImage() {
  return renderShareCard('lab');
}
