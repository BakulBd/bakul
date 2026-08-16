/**
 * STRUCTURED DATA — the machine-readable version of the same facts the page
 * shows a human.
 *
 * Emitted as a single schema.org `@graph` rather than a pile of loose scripts,
 * so every node can reference every other by `@id` and a crawler resolves one
 * connected identity instead of several disconnected fragments. That
 * connectedness is the entire point: a search engine ranking a person's name
 * is deciding "is this document *about* the entity called Bakul Ahmed?", and a
 * `ProfilePage` whose `mainEntity` is a `Person` who `authored` the software
 * listed on the same page answers that far more directly than prose can.
 *
 * Every claim below is CV-backed and already visible on the page. Structured
 * data that asserts more than the rendered content is a manual-action risk,
 * not a ranking trick.
 */

import { profile, credentials } from '@/lib/data/profile';
import { projects } from '@/lib/data/projects';
import { milestones } from '@/lib/data/experience';
import { SITE_URL, absoluteUrl } from '@/lib/site';

/* Stable node identifiers. Relative to the resolved origin, so they follow the
 * site to a new domain along with everything else. */
const ID = {
  person: absoluteUrl('/#person'),
  website: absoluteUrl('/#website'),
  page: absoluteUrl('/#webpage'),
  university: absoluteUrl('/#green-university'),
  club: absoluteUrl('/#gucc'),
  image: absoluteUrl('/opengraph-image'),
} as const;

/** Organisations Bakul currently holds a named role in, drawn from the CV. */
const currentRoles = milestones.filter((m) => m.ongoing && !m.projected && m.org);

/**
 * `sameAs` is how a search engine confirms that the Bakul Ahmed on this domain
 * is the same Bakul Ahmed on GitHub and LinkedIn. It is the single highest-value
 * property here for a name query — entity consolidation, not decoration — so it
 * carries only profiles that are genuinely the same person and genuinely
 * link back.
 */
const sameAs = [profile.contact.github, profile.contact.linkedin];

const university = {
  '@type': 'CollegeOrUniversity',
  '@id': ID.university,
  name: profile.education.institution,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Dhaka',
    addressCountry: 'BD',
  },
};

const club = {
  '@type': 'Organization',
  '@id': ID.club,
  name: 'Green University Computer Club',
  alternateName: 'GUCC',
  parentOrganization: { '@id': ID.university },
};

const person = {
  '@type': 'Person',
  '@id': ID.person,
  name: profile.name,
  givenName: profile.name.split(' ')[0],
  familyName: profile.name.split(' ').slice(1).join(' '),
  jobTitle: profile.title,
  description: profile.summary,
  url: SITE_URL,
  mainEntityOfPage: { '@id': ID.page },
  image: ID.image,
  email: `mailto:${profile.contact.email}`,
  telephone: profile.contact.phone,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Dhaka',
    addressCountry: 'BD',
  },
  homeLocation: {
    '@type': 'Place',
    name: profile.location,
  },
  nationality: { '@type': 'Country', name: 'Bangladesh' },
  alumniOf: { '@id': ID.university },
  // Currently enrolled, so the relationship is present-tense as well.
  affiliation: [{ '@id': ID.university }, { '@id': ID.club }],
  memberOf: currentRoles
    .filter((m) => m.org?.includes('GUCC') || m.org?.includes('Computer Club'))
    .map(() => ({ '@id': ID.club }))
    .slice(0, 1),
  hasOccupation: currentRoles.map((m) => ({
    '@type': 'Occupation',
    name: m.title,
    occupationLocation: { '@type': 'City', name: 'Dhaka' },
  })),
  knowsAbout: [
    ...new Set([
      'Computer Science',
      'Software Engineering',
      'Artificial Intelligence',
      'Machine Learning',
      'Natural Language Processing',
      'Data Mining',
      'Data Structures and Algorithms',
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
      'Docker',
      'Linux',
    ]),
  ],
  knowsLanguage: [
    { '@type': 'Language', name: 'Bengali' },
    { '@type': 'Language', name: 'English' },
  ],
  hasCredential: credentials.map((c) => ({
    '@type': 'EducationalOccupationalCredential',
    name: c.label,
    description: c.detail,
    ...(c.year ? { dateCreated: c.year } : {}),
    recognizedBy: { '@type': 'Organization', name: c.issuer },
  })),
  sameAs,
};

/**
 * Each shipped project as `SoftwareSourceCode` — the type that actually matches
 * what these are. Ties the work to the person via `author`, so the projects
 * reinforce the identity rather than floating free of it.
 */
const softwareNodes = projects
  .filter((p) => p.status === 'online')
  .map((p) => ({
    '@type': 'SoftwareSourceCode',
    '@id': absoluteUrl(`/#project-${p.slot}`),
    name: p.title,
    headline: p.kind,
    description: p.solution,
    author: { '@id': ID.person },
    creator: { '@id': ID.person },
    programmingLanguage: p.stack,
    keywords: p.stack.join(', '),
    ...(p.github ? { codeRepository: p.github } : {}),
    ...(p.live ? { url: p.live } : {}),
    isPartOf: { '@id': ID.page },
  }));

const website = {
  '@type': 'WebSite',
  '@id': ID.website,
  url: SITE_URL,
  name: `${profile.name} — Portfolio`,
  alternateName: profile.name,
  description: profile.summary,
  inLanguage: 'en',
  publisher: { '@id': ID.person },
  author: { '@id': ID.person },
  copyrightHolder: { '@id': ID.person },
};

/**
 * `ProfilePage` rather than the generic `WebPage`: schema.org defines it as
 * "a page describing a single person", which is exactly the claim this site
 * needs a crawler to accept.
 */
const profilePage = {
  '@type': 'ProfilePage',
  '@id': ID.page,
  url: SITE_URL,
  name: `${profile.name} — ${profile.title}`,
  isPartOf: { '@id': ID.website },
  about: { '@id': ID.person },
  mainEntity: { '@id': ID.person },
  primaryImageOfPage: { '@type': 'ImageObject', url: ID.image },
  inLanguage: 'en',
};

/** The complete graph, ready to serialise into one ld+json script. */
export const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [profilePage, website, person, university, club, ...softwareNodes],
};

/**
 * Serialised once at module scope. `<` is escaped so the payload can never
 * terminate the surrounding `<script>` element early — the standard injection
 * guard for inlined JSON-LD.
 */
export const structuredDataJson = JSON.stringify(structuredData).replace(/</g, '\\u003c');
