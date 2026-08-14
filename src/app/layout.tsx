import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Inter, Fira_Code } from 'next/font/google';
import './globals.css';
import { profile, SITE_URL } from '@/lib/data/profile';

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

const DESCRIPTION =
  'Bakul Ahmed — Computer Science Engineer. An interactive machine presenting real, shipped software: an AI exam-proctoring platform, a real-time multiplayer game server, and AI-scaffolded learning research. B.Sc. CSE at Green University of Bangladesh, CGPA 3.96/4.00.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Bakul Ahmed — The Living Machine',
    template: '%s | Bakul Ahmed',
  },
  description: DESCRIPTION,
  applicationName: 'Bakul Ahmed',
  // Honest, specific keywords only. The old list claimed expertise that does not exist.
  keywords: [
    'Bakul Ahmed',
    'Computer Science Engineer',
    'Green University of Bangladesh',
    'Java',
    'Python',
    'TypeScript',
    'React',
    'Next.js',
    'Three.js',
    'Algorithms',
    'Artificial Intelligence',
    'Machine Learning',
    'Portfolio',
  ],
  authors: [{ name: profile.name, url: SITE_URL }],
  creator: profile.name,
  publisher: profile.name,
  // opengraph-image.tsx / twitter-image handling below generates the actual
  // image tags via Next's file convention; url/type/siteName here are what
  // Facebook's and Twitter's crawlers read alongside that image.
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: 'Bakul Ahmed — The Living Machine',
    description: DESCRIPTION,
    siteName: 'Bakul Ahmed',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bakul Ahmed — The Living Machine',
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
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
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#090a0f',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  // Never block pinch-zoom — it is an accessibility requirement, not a polish detail.
  maximumScale: 5,
};

/**
 * Structured data describes the real person. Every claim here is CV-backed.
 */
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  jobTitle: profile.title,
  email: `mailto:${profile.contact.email}`,
  url: SITE_URL,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Dhaka',
    addressCountry: 'BD',
  },
  alumniOf: {
    '@type': 'CollegeOrUniversity',
    name: profile.education.institution,
  },
  knowsAbout: [
    'Python',
    'Java',
    'C++',
    'TypeScript',
    'JavaScript',
    'SQL',
    'React',
    'Next.js',
    'Node.js',
    'Three.js',
    'Algorithms',
    'Artificial Intelligence',
    'Machine Learning',
  ],
  sameAs: [profile.contact.github, profile.contact.linkedin],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jetbrains.variable} ${inter.variable} ${fira.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
