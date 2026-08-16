import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';
import { profile } from '@/lib/data/profile';

/**
 * A one-page site, so there is one page. Section anchors (#core, #projects, …)
 * are not separate documents and listing them would only teach a crawler to
 * expect URLs that resolve to the same HTML.
 *
 * The CV is listed alongside it because a PDF *is* a separately indexable
 * document — one whose text is the name, the degree, and the roles, which is
 * exactly the corroboration a name query benefits from.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl('/'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: absoluteUrl(profile.contact.cv),
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];
}
