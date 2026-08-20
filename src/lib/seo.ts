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
import { faq } from '@/lib/data/faq';
import {
  BENCHES,
  type BenchEntry,
  benchCountPhrase,
  benchFragment,
  benchList,
} from '@/lib/lab/catalogue';
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
  faq: absoluteUrl('/#faq'),
  /* `/lab` is a second document, so it gets its own page node, its own trail
   * and its own image rather than borrowing the home page's. A crawler that
   * arrives at /lab from a shared link and never sees `/` must still be able to
   * resolve what the page is and who wrote the things on it. */
  labPage: absoluteUrl('/lab#webpage'),
  labTrail: absoluteUrl('/lab#breadcrumb'),
  labImage: absoluteUrl('/lab/opengraph-image'),
} as const;

/**
 * A bench's node id.
 *
 * Built from `benchFragment` — the same function the shell uses for the DOM id
 * and the palette uses for its deep links — so the `@id` a crawler resolves is
 * the anchor that actually exists on the page. These were previously two
 * hand-written entries in `ID` above, which is fine for two benches and a
 * silent omission waiting to happen for eight.
 */
const benchId = (id: string): string => absoluteUrl(`/lab#${benchFragment(id)}`);

/**
 * DATES — asserted, not guessed.
 *
 * `dateModified` is what a crawler consults to decide whether a document it
 * already holds is worth re-fetching, and its absence is the most common reason
 * a genuinely updated page keeps serving a stale snippet. It is also the easiest
 * property here to get *wrong*: `new Date()` evaluated per request would claim
 * the document changed on every crawl, which is a freshness lie and gets
 * discounted as one.
 *
 * Both values resolve **once, at module scope**, and every page embedding this
 * graph is statically generated — so the string baked into the HTML is the build
 * date, and it stays fixed until the site is actually rebuilt, which is exactly
 * when the content can have changed. `NEXT_PUBLIC_BUILD_DATE` exists so a
 * reproducible or deliberately back-dated build can pin it.
 *
 * Truncated to a calendar day on purpose: minute precision would imply a
 * revision history the site does not keep, and the day matches the granularity
 * the sitemap reports — both read this same constant, so the two signals cannot
 * contradict each other.
 */
export const SITE_PUBLISHED = '2025-05-07';

export const SITE_MODIFIED: string = (() => {
  const pinned = process.env.NEXT_PUBLIC_BUILD_DATE?.trim();
  const when = pinned && !Number.isNaN(Date.parse(pinned)) ? new Date(pinned) : new Date();
  return when.toISOString().slice(0, 10);
})();

/**
 * Mirrors `OG_SIZE` in `@/lib/og` — duplicated rather than imported on purpose.
 * That module pulls in `next/og` (Satori plus a WASM rasteriser), and this one
 * is imported by the root layout, so the import would drag a whole image
 * compiler into every page render for the sake of two integers.
 */
const IMAGE_SIZE = { width: 1200, height: 630 } as const;

/**
 * `<` is escaped so a payload can never terminate the surrounding `<script>`
 * element early — the standard injection guard for inlined JSON-LD.
 */
const serialise = (graph: unknown): string =>
  JSON.stringify(graph).replace(/</g, '\\u003c');

/**
 * The lab's one-sentence description, defined here and imported by the route so
 * the `<meta name="description">`, the share card copy and the `WebPage` node
 * are literally the same string. Structured data that paraphrases the metadata
 * is how the two quietly drift apart over a year of edits.
 *
 * ── Why it is composed rather than written ─────────────────────────────
 * This used to open with the words "Two interactive engines", which was true
 * when it was written and silently false the moment a third bench shipped. A
 * miscount is the worst kind of error for this particular string: it is the
 * sentence a search result quotes, so the page would advertise less than it
 * contains, in its own voice, to everyone who never opened it.
 *
 * The count and the names now come from the catalogue, and the rest of the
 * sentence is the claim that does not change with the rack — that these are
 * measurements taken while the code ran, in the visitor's own browser.
 */
export const LAB_DESCRIPTION = `${benchCountPhrase()} running live in your browser — ${benchList()} — each instrumented so every number on screen was measured during the run, not asserted.`;

/**
 * The same sentence, for one open bench.
 *
 * `?bench=scheduler` is a *view* of `/lab` and not a second page — the canonical
 * stays `/lab` and the graph below models the benches as `hasPart` of one
 * document — but it is still the URL people actually paste, and what sits on the
 * other end of it is one instrument rather than the whole rack. So a link that
 * names a bench gets a preview and a tab title describing that bench, while the
 * crawlable address keeps `LAB_DESCRIPTION`.
 *
 * ── Why `blurb` and not `summary` ──────────────────────────────────────
 * `summary` is written for a machine reading it with no page around it, and runs
 * to several sentences — the scheduler's is over five hundred characters, which a
 * search result truncates to about a third of a thought and a share card cuts
 * mid-clause. `blurb` is already the one-sentence version.
 *
 * So this frames rather than rewrites: the bench's own sentence says what it
 * does, and the clause after it supplies the two things nobody can infer from a
 * lone sentence arriving out of context — whose lab this is, and which course the
 * bench is the working for. Both come from data that is already load-bearing
 * elsewhere, so neither can drift into being a separate claim.
 */
export function labBenchDescription(bench: BenchEntry): string {
  return `${bench.blurb} An interactive bench in ${profile.name}’s lab, showing the working for ${bench.course}.`;
}

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

/**
 * The share card, described as an image rather than pointed at as a URL.
 *
 * `Person.image` and `primaryImageOfPage` were both bare strings before. That is
 * legal, but it makes a crawler fetch the PNG to learn its dimensions — and
 * Google's own guidance is explicit that an image intended for a rich result
 * must be reachable *and* large enough, which it cannot confirm from a URL
 * alone. Declaring `width`/`height` up front means the 1200×630 card qualifies
 * without a round trip, and hoisting it to a node with an `@id` means the page
 * and the person reference the same image instead of each carrying a copy.
 *
 * `url` and `contentUrl` are the same value on purpose: for a generated image
 * there is no landing page distinct from the bytes.
 */
const primaryImage = {
  '@type': 'ImageObject',
  '@id': ID.image,
  url: ID.image,
  contentUrl: ID.image,
  width: IMAGE_SIZE.width,
  height: IMAGE_SIZE.height,
  encodingFormat: 'image/png',
  caption: `${profile.name} — ${profile.title}`,
  creator: { '@id': ID.person },
  creditText: profile.name,
};

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
  // Resolved by reference: the ImageObject above carries the dimensions.
  image: { '@id': ID.image },
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
  /*
   * Awards and credentials are split on `kind` (see the comment in
   * data/profile.ts), because schema.org means two different things by them and
   * a crawler weighting the difference should get the true one.
   *
   * `award` is a plain string by specification, not an object, so the issuer has
   * to be folded into the text — and it must be, or the honour reads as
   * self-declared. That is the whole reason the phrasing includes the awarding
   * body rather than just the label shown in the UI.
   */
  award: credentials
    .filter((c) => c.kind === 'award')
    .map((c) => `${c.label} — ${c.issuer}`),
  hasCredential: credentials
    .filter((c) => c.kind !== 'award')
    .map((c) => ({
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
  /* The site is two documents, and saying so here is what lets a crawler that
   * only ever fetched /lab resolve upwards to the identity that owns it. */
  hasPart: [{ '@id': ID.page }, { '@id': ID.labPage }],
  datePublished: SITE_PUBLISHED,
  dateModified: SITE_MODIFIED,
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
  description: profile.summary,
  primaryImageOfPage: { '@id': ID.image },
  image: { '@id': ID.image },
  inLanguage: 'en',
  datePublished: SITE_PUBLISHED,
  dateModified: SITE_MODIFIED,
  /* The one link on the page that leads somewhere else worth indexing. Says
   * "this is navigation to a real second document", not decoration. */
  significantLink: absoluteUrl('/lab'),
};

/**
 * The questions, marked up as questions.
 *
 * Honest about what this is for: FAQ rich results were restricted to
 * authoritative government and health sites in 2023, so this is not chasing
 * snippet stars. It is here because answer engines extract Q&A pairs more
 * reliably than prose, and because the alternative to being quoted from the
 * site's own sentences is being paraphrased from a guess about them.
 *
 * Bound to the page by `isPartOf`, and every answer is the identical string the
 * `<details>` list in the Transmission section renders — same import, no second
 * copy — so the node cannot assert anything a reader cannot also read.
 */
const faqPage = {
  '@type': 'FAQPage',
  '@id': ID.faq,
  isPartOf: { '@id': ID.page },
  about: { '@id': ID.person },
  inLanguage: 'en',
  mainEntity: faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

/**
 * The complete graph, ready to serialise into one ld+json script.
 *
 * Order is for human legibility only — JSON-LD resolves by `@id`, not by
 * position, which is exactly why `primaryImage` can be listed last and still be
 * the image both the page and the person referenced hundreds of lines earlier.
 */
export const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    profilePage,
    website,
    person,
    university,
    club,
    faqPage,
    ...softwareNodes,
    primaryImage,
  ],
};


/** Serialised once at module scope. See `serialise` for the escaping. */
export const structuredDataJson = serialise(structuredData);

/* ════════════════════════════════════════════════════════════════════════
 * THE LAB — /lab
 *
 * A second, smaller graph for the second document.
 *
 * It is separate rather than appended to the one above because a `@graph` is a
 * description of *this page*, and a crawler on /lab should not be handed the
 * FAQ, the project list and the credential set of a page it is not looking at —
 * that is how a crawler ends up unsure which URL the entity data belongs to.
 * What it does get is enough to resolve upwards: the same `Person` `@id`, the
 * same `WebSite` `@id`. Both are absolute and both are defined in full on `/`,
 * so the reference joins the two documents into one entity without restating it.
 * ════════════════════════════════════════════════════════════════════════ */

/** One rung of the trail. No `href` means "this is where you are". */
export interface TrailRung {
  name: string;
  href?: string;
}

/**
 * THE TRAIL, AS DATA — because it is published twice.
 *
 * `labBreadcrumb` below feeds search results: /lab is one level down, and
 * without a `BreadcrumbList` a result for it shows the bare URL path where it
 * could show `bakul.app › The Lab`. `LabMasthead` renders these same rungs as
 * the visible way out of the route.
 *
 * Written once here so the crawler's trail and the visitor's cannot disagree —
 * the same reason the bench catalogue is kept separate from the bench registry.
 *
 * Two rungs, not three: the open bench is deliberately not a rung. It is
 * already named by the rail's selected tab and by the panel heading, and adding
 * it here would mean a visible trail that the JSON-LD does not claim.
 *
 * The last rung carries no `href` — the current page is not a link to somewhere
 * else, in the markup or in the graph.
 */
export const LAB_TRAIL: TrailRung[] = [
  { name: profile.name, href: '/' },
  { name: 'The Lab' },
];

const labBreadcrumb = {
  '@type': 'BreadcrumbList',
  '@id': ID.labTrail,
  /*
   * `position` is 1-based and must be contiguous, so it is derived from the
   * index rather than hand-written — a literal here is a number that can fall
   * out of step with the array it is numbering. `item` is absolute because a
   * crawler has no document to resolve a root-relative path against.
   */
  itemListElement: LAB_TRAIL.map((rung, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: rung.name,
    ...(rung.href
      ? { item: rung.href === '/' ? SITE_URL : `${SITE_URL}${rung.href}` }
      : {}),
  })),
};


const labImage = {
  '@type': 'ImageObject',
  '@id': ID.labImage,
  url: ID.labImage,
  contentUrl: ID.labImage,
  width: IMAGE_SIZE.width,
  height: IMAGE_SIZE.height,
  encodingFormat: 'image/png',
  caption: `The Lab — ${benchList({ lower: true })} benches`,
  creator: { '@id': ID.person },
  creditText: profile.name,
};

/**
 * Every bench, typed as what it is.
 *
 * `SoftwareApplication` rather than `SoftwareSourceCode`: the source is on
 * GitHub, but what this URL serves is a *running* program, and the distinction
 * is the difference between "here is code you could read" and "here is a thing
 * you can operate right now". `WebApplication` is the subtype that says so.
 *
 * `offers` at zero is not padding. Google's SoftwareApplication guidance wants
 * either an `offers` or an `aggregateRating`, and inventing ratings for a page
 * nobody has rated is precisely the kind of claim this file refuses to make. A
 * price of zero is simply true.
 *
 * ── Why this is a map over the catalogue ───────────────────────────────
 * These were two literal nodes, hand-written, with descriptions that
 * paraphrased the same benches the shell described in its own words. Two
 * problems, and the second is the serious one: a bench added to the lab did not
 * appear here, so the page rendered three instruments and told crawlers about
 * two — and nothing failed, which is how it would have stayed. Now the graph
 * cannot disagree with the rack, because it is generated from it.
 *
 * `summary` is reused verbatim rather than rewritten for machines. It was
 * already required to be true when read alone, which is precisely the
 * requirement a `description` has.
 */
const benchNodes = BENCHES.map((bench) => ({
  '@type': ['SoftwareApplication', 'WebApplication'],
  '@id': benchId(bench.id),
  name: `${bench.label} Bench`,
  description: bench.summary,
  featureList: [...bench.features],
  /* The properties the bench checks about its own output, published as claims
   * the page itself makes visible. A crawler reading this and a visitor reading
   * the badge are looking at the same list of strings. */
  ...(bench.verifies.length > 0 ? { keywords: bench.verifies.join(', ') } : {}),
  /* The course each bench is evidence for — the join back to the CV's
   * coursework, which is what makes the lab function as a transcript with its
   * working shown rather than as a set of unrelated toys. */
  about: bench.course,
  url: absoluteUrl('/lab'),
  applicationCategory: 'DeveloperApplication',
  applicationSubCategory: 'Algorithm visualisation',
  // No install, no account, no server round trip — the engines are TypeScript
  // running in the page, which is the whole claim the route makes.
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
  author: { '@id': ID.person },
  creator: { '@id': ID.person },
  inLanguage: 'en',
  isPartOf: { '@id': ID.labPage },
}));

/**
 * `WebPage`, not `ProfilePage`: this document is about a set of programs, not
 * about a person. `about` still points at the person because they are the
 * subject's author, but claiming the page describes them would be false and
 * would compete with `/` for the same entity query.
 */
const labPage = {
  '@type': 'WebPage',
  '@id': ID.labPage,
  url: absoluteUrl('/lab'),
  name: `The Lab — ${profile.name}`,
  description: LAB_DESCRIPTION,
  isPartOf: { '@id': ID.website },
  about: { '@id': ID.person },
  author: { '@id': ID.person },
  creator: { '@id': ID.person },
  primaryImageOfPage: { '@id': ID.labImage },
  breadcrumb: { '@id': ID.labTrail },
  hasPart: BENCHES.map((b) => ({ '@id': benchId(b.id) })),
  inLanguage: 'en',
  datePublished: SITE_PUBLISHED,
  dateModified: SITE_MODIFIED,
};

export const labStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [labPage, labBreadcrumb, labImage, ...benchNodes],
};

export const labStructuredDataJson = serialise(labStructuredData);
