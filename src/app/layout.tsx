import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { profile } from '@/lib/data/profile';
import { SITE_URL, IS_PRODUCTION_DEPLOY, GOOGLE_SITE_VERIFICATION } from '@/lib/site';
import { structuredDataJson } from '@/lib/seo';

/*
 * Three faces, three jobs: sans carries the reading and display type (as a
 * variable font — every weight in one file), mono is chrome/labels, code is
 * literal code/data. Both static faces load only weight 400: nothing in the
 * site sets a heavier weight on either, so a 500 or 700 instance would be a
 * font file downloaded and never painted.
 */
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

/*
 * Display face — headings and the hero only.
 *
 * Inter is an outstanding interface and reading face and stays exactly where
 * it is for body copy. What it is not is distinctive: Inter + JetBrains Mono
 * is the default developer-portfolio stack, and setting the largest words on
 * the page in it means the one element a visitor sees first says nothing
 * about this site that it does not also say about a thousand others.
 *
 * Space Grotesk earns the slot on its own terms rather than for novelty. It
 * is a grotesque drawn from proportional-drawing roots, so its skeleton is
 * the same engineering-drawing lineage the whole site is built on, and its
 * quirks — the flat-sided 'a', the angular 'k', the squared terminals — read
 * as machined rather than humanist. At hero size those details are what make
 * the name look set rather than typed.
 *
 * Only weight 700: `.t-display` is the sole consumer and asks for one weight,
 * so shipping the variable range would be downloading instances that are
 * never painted.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['700'],
});

/*
 * Fira Code used to be loaded here as a fourth family, mapped to `--font-code`
 * for inputs, code and tabular readouts.
 *
 * It was a redundant download. JetBrains Mono was already carrying every piece
 * of monospaced chrome on the site — labels, buttons, readouts — and the two
 * faces were doing the same job at the same sizes: both are programming
 * monospaces of near-identical width and x-height, so the distinction was
 * invisible to a reader and cost a whole extra face on first load.
 *
 * Three families, one job each: Space Grotesk displays, Inter reads, JetBrains
 * Mono instruments. `--font-code` still exists and still means "monospace for
 * data" — it now resolves to JetBrains Mono, so nothing had to change at the
 * call sites.
 */

/*
 * Two descriptions, because the two surfaces have different limits and
 * different jobs.
 *
 * SEARCH_DESCRIPTION is written to survive Google's ~155-character snippet
 * truncation with the name, the role, the place, and the proof still intact —
 * a description that gets cut mid-clause has thrown away its last third. It
 * leads with the full name because that is the query this page most needs to
 * answer.
 *
 * SOCIAL_DESCRIPTION runs longer: Open Graph unfurls in Slack, LinkedIn and
 * Discord render appreciably more text, so truncating to Google's budget there
 * would be discarding space that was free.
 */
const SEARCH_DESCRIPTION =
  'Bakul Ahmed — Computer Science Engineer in Dhaka, Bangladesh. B.Sc. CSE at Green University, CGPA 3.96/4.00. Builds AI and real-time systems.';

const SOCIAL_DESCRIPTION =
  'Bakul Ahmed — Computer Science Engineer. An interactive machine presenting real, shipped software: an AI exam-proctoring platform, a real-time multiplayer game server, and AI-scaffolded learning research. B.Sc. CSE at Green University of Bangladesh, CGPA 3.96/4.00.';

/** Brand title — used where personality reads better than keywords. */
const BRAND_TITLE = 'Bakul Ahmed — The Living Machine';

/**
 * Search title leads with the name and states the profession plainly.
 *
 * The brand line lives on the Open Graph card instead. A `<title>` is answering
 * "is this the Bakul Ahmed I searched for?" in a list of ten blue links, and
 * "The Living Machine" does not answer that — it is the right words in the
 * wrong slot.
 */
const SEARCH_TITLE = `${profile.name} — ${profile.title}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEARCH_TITLE,
    template: `%s | ${profile.name}`,
  },
  description: SEARCH_DESCRIPTION,
  applicationName: profile.name,
  // Self-referencing canonical. Resolved against metadataBase, so it tracks the
  // deployment's own domain — and it is what stops the same page being indexed
  // separately under a `www.` host, a trailing slash, or a tracking parameter.
  alternates: {
    canonical: '/',
  },
  // Honest, specific keywords only. Modern engines largely ignore this tag;
  // it stays because some smaller crawlers and AI indexers still read it, and
  // it costs nothing.
  keywords: [
    'Bakul Ahmed',
    'Bakul Ahmed portfolio',
    'Bakul Ahmed CSE',
    'Computer Science Engineer',
    'Green University of Bangladesh',
    'Dhaka software engineer',
    'AI',
    'Machine Learning',
    'Java',
    'Python',
    'TypeScript',
    'React',
    'Next.js',
    'Three.js',
    'Algorithms',
    'Portfolio',
  ],
  authors: [{ name: profile.name, url: SITE_URL }],
  creator: profile.name,
  /*
   * iOS Safari autolinks anything that looks like a phone number, an address or
   * an email, and it restyles what it linkifies with its own blue — inside a
   * design that has exactly two accent colours and sets its contact details as
   * deliberate typography. The real contact affordances are explicit anchors in
   * the Transmission section, so nothing is lost by switching the guessing off;
   * what is gained is that a CGPA, a phone-shaped project stat and a date
   * range stop being turned into links on one platform only.
   */
  formatDetection: { telephone: false, address: false, email: false },
  publisher: profile.name,
  category: 'technology',
  /*
   * `profile` rather than `website` — Open Graph defines this exact type for a
   * page about a person, and every major unfurler (Slack, LinkedIn, Discord,
   * WhatsApp, Facebook, iMessage) renders the card from title/description/image
   * regardless of type, so the more accurate value costs nothing.
   *
   * The image tags themselves come from opengraph-image.tsx via Next's file
   * convention, including width, height and alt.
   */
  openGraph: {
    type: 'profile',
    firstName: profile.name.split(' ')[0],
    lastName: profile.name.split(' ').slice(1).join(' '),
    username: profile.contact.githubHandle,
    url: SITE_URL,
    title: BRAND_TITLE,
    description: SOCIAL_DESCRIPTION,
    siteName: profile.name,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND_TITLE,
    description: SOCIAL_DESCRIPTION,
  },
  /*
   * Preview and branch deployments serve byte-identical content on a throwaway
   * hostname. Indexed, they become duplicate-content rivals to the real domain
   * for the owner's own name — so only the production deploy invites crawlers.
   *
   * `max-image-preview: large` is the directive that lets the generated Open
   * Graph card appear at full width in search results and Discover instead of
   * as a thumbnail; without it the card is built and then shown small.
   */
  robots: IS_PRODUCTION_DEPLOY
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-snippet': -1,
          'max-image-preview': 'large',
          'max-video-preview': -1,
        },
      }
    : { index: false, follow: false, nocache: true },
  ...(GOOGLE_SITE_VERIFICATION
    ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
    : {}),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#090a0f',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  // Never block pinch-zoom — it is an accessibility requirement, not a polish detail.
  maximumScale: 5,
  // Paint into the display cutout on notched phones; the safe-area insets in
  // globals.css keep controls out from under the notch and home indicator.
  viewportFit: 'cover',
  /*
   * When the on-screen keyboard opens, resize the visual viewport rather than
   * the layout viewport.
   *
   * This matters here more than on a typical page: the entire scene is sized in
   * `vh` and the scroll engine derives its progress from `scrollHeight`. Under
   * the default `resizes-content`, opening the keyboard in the contact form or
   * the compiler's expression input would shrink the layout viewport, re-run
   * every `vh` calculation, change the document height and therefore jump the
   * camera — mid-typing, on phones only. `resizes-visual` leaves the layout
   * alone and merely pans what is visible, which is the behaviour every fixed
   * layer on this site already assumes.
   */
  interactiveWidget: 'resizes-visual',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jetbrains.variable} ${inter.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        {/*
          rel="me" is the IndieWeb/Google identity signal: it states that the
          person behind this domain is the same person behind these profiles.
          Paired with the `sameAs` array in the JSON-LD graph, it gives a
          crawler the link in both directions.
        */}
        <link rel="me" href={profile.contact.github} />
        <link rel="me" href={profile.contact.linkedin} />
        <link rel="me" href={`mailto:${profile.contact.email}`} />
        {/*
          No font preconnect here, deliberately.

          There used to be a `preconnect` to fonts.gstatic.com, which is the
          correct tag for a site that loads Google Fonts over the network. This
          one does not: `next/font/google` downloads all three faces at build
          time and serves them from this origin, so the browser never contacts
          Google at runtime. The tag was costing a DNS lookup plus a TLS
          handshake to a host that is never asked for anything — worst on the
          cold, high-latency mobile connections it looks like it should help,
          because it competes for the first few connections in the pool with the
          requests that are actually on the critical path.
        */}
      </head>
      <body>
        <script
          type="application/ld+json"
          // Pre-serialised and `<`-escaped in @/lib/seo.
          dangerouslySetInnerHTML={{ __html: structuredDataJson }}
        />
        {children}
      </body>
    </html>
  );
}
