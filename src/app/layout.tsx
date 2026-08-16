import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Inter, Fira_Code } from 'next/font/google';
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

const fira = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira',
  display: 'swap',
  weight: ['400'],
});

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jetbrains.variable} ${inter.variable} ${fira.variable}`}>
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
        {/* Warm up the font origins before the CSS that needs them is parsed. */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
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
