import { renderShareCard, OG_SIZE, OG_CONTENT_TYPE, SHARE_CARDS } from '@/lib/og';

/**
 * The lab's own share card.
 *
 * Without this route `/lab` inherits the root card, so a link to two
 * interactive engines previewed as a CV — the right image for the wrong page.
 * The composition is identical (see `renderShareCard`); only the copy differs,
 * and it is declared in `SHARE_CARDS.lab` alongside the home card's so the two
 * cannot drift into being two designs.
 *
 * Not edge, for the same reason as the root card: on the default runtime this
 * is rasterised once at build time and served as a static asset, instead of
 * fetching fonts inside a crawler's timeout on every unfurl.
 */
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = SHARE_CARDS.lab.alt;

export default function LabOpengraphImage() {
  return renderShareCard('lab');
}
