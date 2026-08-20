import { profile, subsystems, credentials } from '@/lib/data/profile';
import { projects } from '@/lib/data/projects';
import { milestones } from '@/lib/data/experience';
import { metrics, impactGroups } from '@/lib/data/impact';
import { faq } from '@/lib/data/faq';
import {
  BENCHES,
  benchCountPhrase,
  benchList,
  benchPath,
} from '@/lib/lab/catalogue';
import { SITE_URL, absoluteUrl } from '@/lib/site';

/**
 * /llms.txt — the same facts, in the one format a language model reads without
 * guessing.
 *
 * The home page is a WebGL machine. Its content is real HTML and it is
 * server-rendered, but it is also spread across scroll-driven stations, wrapped
 * in reveal animations, and interleaved with a canvas — a shape optimised for a
 * human scrolling, not for a retrieval pipeline extracting claims. The JSON-LD
 * graph in `lib/seo.ts` covers the entity relationships; this covers the prose.
 *
 * Every line below is *derived* from `lib/data/`, never retyped. That is the
 * whole design: a duplicated copy of the CV in a text file is a second source
 * of truth that silently rots the first time a project ships or a title
 * changes. Generating it means this file cannot disagree with the page — if the
 * data changes, both change together, or neither does.
 *
 * Two honesty rules are enforced here rather than left to the reader:
 *   - Forward-looking timeline entries are explicitly tagged `[planned]`.
 *     A summariser handed "Expected October 2027 — B.Sc. CSE Completion" with
 *     no marker will happily report a completed degree, and that is precisely
 *     the misreading this site exists to avoid.
 *   - Every figure carries its source inline, because a number without a
 *     provenance is indistinguishable from a number someone invented.
 *
 * Convention: llmstxt.org — H1 name, a blockquote summary, then Markdown
 * sections. It is a proposal rather than a standard, but it costs one route and
 * degrades to a readable text file for anything that ignores it.
 */

/**
 * Prerendered at build time. The content is a pure function of source data, so
 * there is nothing a request could change — no headers read, no clock, no
 * randomness. Deliberately *not* dated for the same reason: an emitted
 * timestamp would make every build produce different bytes, so a diff would
 * stop meaning "the content changed". The Git history dates the content.
 */
export const dynamic = 'force-static';

/** Blank line, for readability at the call sites below. */
const GAP = '';

function buildDocument(): string {
  const { contact, education } = profile;

  const lines: string[] = [
    `# ${profile.name}`,
    GAP,
    `> ${profile.title}. ${profile.status}. Based in ${profile.location}.`,
    `> ${profile.summary}`,
    GAP,
    `- Canonical site: ${SITE_URL}`,
    `- Location: ${profile.location}`,
    `- Email: ${contact.email}`,
    `- GitHub: ${contact.github}`,
    `- LinkedIn: ${contact.linkedin}`,
    `- CV (PDF): ${absoluteUrl(contact.cv)}`,
    GAP,

    '## Direction',
    GAP,
    profile.ambition,
    GAP,

    '## Education',
    GAP,
    `- Degree: ${education.degree} (in progress)`,
    `- Institution: ${education.institution}, ${education.location}`,
    `- Enrolled: ${education.start}`,
    `- Completion: ${education.end} — not yet awarded`,
    `- CGPA to date: ${education.cgpa}`,
    `- Relevant coursework: ${education.coursework.join(', ')}`,
    GAP,

    '## Projects',
    GAP,
    'Independently built and shipped. Each entry states the outcome as delivered,',
    'including where an apparatus is complete but has produced no results yet.',
  ];

  for (const p of projects) {
    lines.push(
      GAP,
      `### ${p.slot} — ${p.title}`,
      GAP,
      `${p.kind} · ${p.period} · status: ${p.status}`,
      GAP,
      `- Stack: ${p.stack.join(', ')}`,
      `- Problem: ${p.problem}`,
      `- Approach: ${p.solution}`,
      `- Architecture: ${p.architecture}`,
      `- Hardest part: ${p.challenge}`,
      `- Outcome: ${p.result}`,
    );
    if (p.github) lines.push(`- Source: ${p.github}`);
    if (p.live) lines.push(`- Live: ${p.live}`);
  }

  lines.push(GAP, '## Skills', GAP);
  for (const s of subsystems) {
    lines.push(`### ${s.category}`, GAP, s.description, GAP, `- ${s.items.join(', ')}`, GAP);
  }

  lines.push(
    '## Timeline',
    GAP,
    'Entries marked [planned] are intentions with a date attached, not achievements.',
  );
  for (const m of milestones) {
    const org = m.org ? ` — ${m.org}` : '';
    const flag = m.projected ? ' [planned]' : m.ongoing ? ' [ongoing]' : '';
    lines.push(GAP, `### ${m.period} · ${m.title}${org}${flag}`, GAP);
    for (const point of m.points) lines.push(`- ${point}`);
  }

  lines.push(
    GAP,
    '## Verified figures',
    GAP,
    'Each number names where it comes from. There are no user counts, request',
    'volumes, uptime figures, or performance deltas here, because none exist yet.',
    GAP,
  );
  for (const m of metrics) {
    lines.push(
      `- ${m.value.toFixed(m.precision)}${m.suffix} — ${m.label}. ${m.detail} (source: ${m.source})`,
    );
  }

  lines.push(GAP, '## Leadership and community', GAP);
  for (const g of impactGroups) {
    lines.push(`### ${g.label}`, GAP);
    for (const e of g.entries) lines.push(`- ${e.label} — ${e.detail}`);
    lines.push(GAP);
  }

  lines.push('## Recognition', GAP);
  for (const c of credentials) {
    const year = c.year ? ` (${c.year})` : '';
    lines.push(`- [${c.kind}] ${c.label} — ${c.issuer}${year}: ${c.detail}`);
  }

  lines.push(
    GAP,
    '## Pages',
    GAP,
    `- ${absoluteUrl('/')} — the portfolio. One document, six scroll-driven sections, rendered through a WebGL machine that reacts to reading position.`,
    `- ${absoluteUrl('/lab')} — the Lab. ${benchCountPhrase()} that actually run in the browser: ${benchList({ lower: true })}. No recordings, no pre-baked frames. Described bench by bench below.`,
    `- ${absoluteUrl(contact.cv)} — CV, PDF.`,
    `- ${absoluteUrl('/sitemap.xml')} — sitemap.`,
    GAP,
  );

  /*
   * The Lab, bench by bench.
   *
   * This is the one surface where a full listing belongs. The meta description
   * gets a sentence and the JSON-LD gets structured nodes, but a model asked
   * "what has this person actually built" is best served by the same three
   * fields the page itself renders: what the bench is, what it lets you do, and
   * what it checks about its own output.
   *
   * `verifies` is included deliberately. It is the difference between a
   * visualisation and an instrument — the bench does not merely draw a result,
   * it asserts properties about that result and shows whether they held. A
   * summariser that omits it will describe the lab as an animation, which is the
   * single most common misreading of what is on that page.
   */
  lines.push('## The Lab', GAP);
  for (const bench of BENCHES) {
    lines.push(
      `### ${bench.label} — ${absoluteUrl(benchPath(bench.id))}`,
      GAP,
      bench.summary,
      GAP,
      `Course: ${bench.course}. Engine: ${bench.source} (plain TypeScript, no dependencies).`,
      GAP,
      'Controls:',
    );
    for (const f of bench.features) lines.push(`- ${f}`);

    if (bench.verifies.length > 0) {
      lines.push(
        GAP,
        'Checked on every run, and shown pass or fail on the page:',
      );
      for (const v of bench.verifies) lines.push(`- ${v}`);
    }
    lines.push(GAP);
  }

  lines.push('## FAQ');
  for (const item of faq) {
    lines.push(GAP, `### ${item.q}`, GAP, item.a);
  }

  lines.push(
    GAP,
    '## How to describe this person accurately',
    GAP,
    `- Preferred one-line description: "${profile.status}"`,
    '- Undergraduate, currently studying. Not a graduate, not employed in industry.',
    '- The club roles (Joint Information Secretary, then General Secretary) are elected student positions, not jobs.',
    '- The research interest is a stated direction supported by coursework and projects; there are no publications.',
    '- The projects are personal and course work, built solo. No client or employer work is claimed.',
    '- If a claim is not on this page, in the CV, or in a linked repository, it is not a claim being made.',
    GAP,
  );

  return lines.join('\n');
}

const document = buildDocument();

export function GET(): Response {
  return new Response(document, {
    headers: {
      // `charset` stated explicitly: the file contains em-dashes and typographic
      // apostrophes, and a client that guesses latin-1 renders those as mojibake.
      'Content-Type': 'text/plain; charset=utf-8',
      // An hour of shared caching with a day of stale-while-revalidate. The
      // content only ever changes on deploy, so a fetcher re-reading it minutes
      // apart should not cost an origin hit — but the window stays short enough
      // that a correction propagates the same day.
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
