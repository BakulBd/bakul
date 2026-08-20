import type { MetadataRoute } from 'next';
import { profile } from '@/lib/data/profile';
import { benchList } from '@/lib/lab/catalogue';

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
    /*
     * Long-press the installed icon and these appear as jump targets.
     *
     * Both are real, separately addressable destinations — a route and an anchor
     * that exists in the served HTML — which is the bar for a shortcut. The
     * temptation is to list every section here; that would produce a menu of
     * eight entries where Android shows at most four or five, and would advertise
     * fragments of one document as if they were places. The two below are the
     * only things a returning visitor plausibly opens the app *for*.
     *
     * The lab shortcut points at `/lab` rather than at a bench, and deliberately
     * so: a shortcut naming one instrument would go stale the moment the rail
     * grew, and the default bench is already what `/lab` serves.
     *
     * The fragment is `#section-contact`, not `#contact`. Every section element
     * is emitted with a `section-` prefix (the bare id belongs to the heading
     * inside it), so the shorter, more obvious spelling would have been a
     * shortcut that silently landed at the top of the page — the kind of thing
     * that is invisible in review because a wrong fragment still resolves to a
     * valid document.
     */
    shortcuts: [
      {
        name: 'The Lab',
        short_name: 'Lab',
        description: `${benchList()} benches, running in the browser`,
        url: '/lab',
        icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Get in touch',
        short_name: 'Contact',
        description: 'Email, phone, and the CV',
        url: '/#section-contact',
        icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
    /*
     * The install prompt on Android renders a richer, card-style dialog when the
     * manifest offers screenshots, instead of the bare one-line banner. The
     * generated Open Graph cards are reused rather than shipping separate PNGs:
     * they are already 1200×630, already built at deploy time, already the exact
     * image the site shows everywhere else it is previewed, and adding two more
     * bitmaps to `public/` would mean two more files to redraw whenever the
     * design moves.
     *
     * `form_factor: 'wide'` is what the spec uses to say "this is the desktop
     * shape" — a 1200×630 landscape frame is not the narrow phone view, and
     * declaring it as such would get it letterboxed in the prompt.
     */
    screenshots: [
      {
        src: '/opengraph-image',
        sizes: '1200x630',
        type: 'image/png',
        form_factor: 'wide',
        label: `${profile.name} — ${profile.title}`,
      },
      {
        src: '/lab/opengraph-image',
        sizes: '1200x630',
        type: 'image/png',
        form_factor: 'wide',
        label: `The Lab — interactive ${benchList({ lower: true })} benches`,
      },
    ],
  };
}
