import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/data/profile';

/**
 * A single real page — this is a one-page site. Section anchors (#core,
 * #projects, …) aren't separate documents, so they don't belong here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
