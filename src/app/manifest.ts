import type { MetadataRoute } from 'next';
import { profile } from '@/lib/data/profile';

/**
 * Generated rather than a static public/site.webmanifest, so the installed-app
 * name and description are read from the same profile data the page renders
 * and cannot drift out of step with it.
 *
 * Every URL here is site-relative, which is what keeps the manifest portable:
 * it stays correct on a new domain with no edit.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${profile.name} — ${profile.title}`,
    short_name: profile.name,
    description: profile.summary,
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    theme_color: '#090a0f',
    background_color: '#090a0f',
    categories: ['portfolio', 'productivity', 'education'],
    lang: 'en',
    dir: 'ltr',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Declared maskable so Android crops to its own icon shape instead of
      // drawing the square inside a white circle.
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
