import type { MetadataRoute } from 'next';
import { SITE_URL, IS_PRODUCTION_DEPLOY, absoluteUrl } from '@/lib/site';

/**
 * Crawl policy.
 *
 * Preview and branch deployments are excluded outright: they serve identical
 * content on a throwaway hostname, and a crawler that indexes them ends up
 * choosing between near-duplicate documents for the owner's own name. The
 * `robots` meta tag in layout.tsx says the same thing — belt and braces,
 * because robots.txt controls crawling while the meta tag controls indexing,
 * and a URL discovered through an inbound link can be indexed without ever
 * being crawled.
 */
export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION_DEPLOY) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The contact endpoint is a POST-only mailer with nothing to index.
        disallow: ['/api/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    // Names the preferred hostname for the crawlers that honour it, which is
    // one more signal pointing at a single canonical origin.
    host: SITE_URL,
  };
}
