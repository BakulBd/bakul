import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';
import { profile } from '@/lib/data/profile';
import { SITE_MODIFIED } from '@/lib/seo';

/**
 * Three URLs, because three things are separately fetchable.
 *
 * Section anchors (#core, #projects, …) are not among them: they are not
 * separate documents, and listing them would only teach a crawler to expect
 * URLs that resolve to the same HTML.
 *
 * `/lab` is, though — a different document, different content, its own title
 * and description. It sits below the home page in priority rather than beside
 * it because it is a demonstration, not the thing a name query is looking for;
 * the home page is what should win "Bakul Ahmed".
 *
 * The CV is listed because a PDF *is* a separately indexable document — one
 * whose text is the name, the degree, and the roles, which is exactly the
 * corroboration a name query benefits from.
 *
 * `/llms.txt` and `/.well-known/security.txt` are deliberately absent. Both are
 * machine-readable metadata fetched directly by the agents that want them, not
 * pages a search engine should be indexing as results.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  /*
   * The same build-time constant the JSON-LD `dateModified` uses.
   *
   * This was `new Date()`, evaluated whenever the sitemap was requested — so it
   * reported "modified: now" on every fetch while the structured data reported
   * the build date, and a crawler comparing the two got a contradiction. Worse,
   * a `lastmod` that always says *now* carries no information at all: it is the
   * signal a crawler uses to skip a document it already has, and a value that
   * never stops changing simply gets ignored. One source, one answer.
   */
  const lastModified = SITE_MODIFIED;

  return [
    {
      url: absoluteUrl('/'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
      /*
       * Image sitemap extension. Google discovers OG cards from the page's own
       * meta tags well enough, so this is not about discovery — it is that a
       * `<image:loc>` in the sitemap is the one place the association between
       * *this URL* and *this image* is stated without the crawler having to
       * render anything, which is what gets the card considered for the image
       * result and the Discover card rather than only the unfurl.
       */
      images: [absoluteUrl('/opengraph-image')],
    },
    {
      url: absoluteUrl('/lab'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
      images: [absoluteUrl('/lab/opengraph-image')],
    },
    {
      url: absoluteUrl(profile.contact.cv),
      lastModified,
      // A PDF has no OG card and no images worth listing — the document is the
      // asset. Its own `changeFrequency` is honest: a CV changes yearly.
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];
}

