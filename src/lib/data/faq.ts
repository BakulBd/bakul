/**
 * FREQUENTLY ASKED — one source for the rendered list and the FAQPage node.
 *
 * WHY THIS FILE EXISTS AT ALL
 *
 * Not for rich results. Google restricted FAQ rich snippets to authoritative
 * government and health sites in 2023, so the stars are not coming and this
 * would be a poor trade if that were the goal. It exists for two other
 * reasons, both real:
 *
 *   1. These are the questions that actually arrive by email. A recruiter or a
 *      prospective supervisor wants to know availability, location, and whether
 *      the work is genuinely solo before they want anything else, and the
 *      answers were previously scattered across five sections or absent.
 *   2. An answer engine quoting this site will quote something. Question-and-
 *      answer pairs, marked up as such, are the format those systems extract
 *      most reliably — so this is the difference between being summarised from
 *      the site's own words and being summarised from an inference about them.
 *
 * THE RULE THIS FILE OBEYS
 *
 * Every answer restates something the page already says or the CV already
 * proves. Nothing here is a new claim, because a `FAQPage` node asserting a
 * fact the document does not show is exactly the kind of structured-data
 * mismatch that earns a manual action — and because the site's whole argument
 * is that its claims are checkable.
 *
 * Answers are plain strings, not JSX, precisely so the visible `<details>` and
 * the JSON-LD `acceptedAnswer.text` cannot drift apart. If one needs markup
 * later, it needs a second field, not a fork.
 */

import { profile } from './profile';
import { projects } from './projects';
import { benchCountPhrase, benchList } from '../lab/catalogue';

const liveProjects = projects.filter((p) => p.status === 'online');

export interface FaqItem {
  q: string;
  a: string;
}

export const faq: readonly FaqItem[] = [
  {
    q: 'Are you available for graduate research positions?',
    a: `Yes. I am ${profile.status.replace(' — ', ', ')}, graduating ${profile.education.end.replace('Expected ', '')}, and I am specifically looking for graduate research in artificial intelligence, machine learning, and natural language processing. My CV is on this page as a PDF, and the fastest route to me is ${profile.contact.email}.`,
  },
  {
    q: 'Where are you based, and do you work remotely?',
    a: `${profile.location}. I have worked remotely throughout — every project listed here was built and deployed remotely, and the university roles run alongside them — so distributed teams and remote supervision are the normal case rather than an accommodation.`,
  },
  {
    q: 'Did you build these projects yourself?',
    a: `Yes — the ${liveProjects.length} projects on this page are independently built, which is also how the CV describes them. Each one links to its own public repository on github.com/${profile.contact.githubHandle}, so the commit history is the evidence. Where a project has no deployed demo, this site says so instead of linking somewhere that is not one.`,
  },
  {
    q: 'How can I verify what is claimed on this site?',
    a: 'Every fact here comes from the CV, which you can download from this page, or from a public repository you can open and read. Figures in the Impact section each display their own source in the interface. Nothing states a metric or an outcome that is not traceable to one of those two places — no user counts, no performance numbers that were not measured.',
  },
  {
    q: 'What is the Lab?',
    /*
     * Composed from the bench catalogue rather than written out, because this
     * answer is republished verbatim in the `FAQPage` structured data and in
     * /llms.txt. A hand-written count here would be a wrong number in three
     * places at once, and the first version of this sentence was exactly that:
     * it said "two engines" for as long as it took to add a third.
     *
     * `benchCountPhrase` and `benchList` are the only interpolations. The rest is
     * the part that does not change as the rack grows — that these run, that they
     * are instrumented, and that nothing on screen was pre-recorded.
     */
    a: `A second page at /lab with ${benchCountPhrase({ lower: true })} running live in your browser — ${benchList({ lower: true })} — each one instrumented so the counters beside it are measurements taken while it ran, not figures written into the page. They are working implementations in TypeScript, and every run also checks properties of its own output and shows you whether they held. Nothing there is a video or an animation of a result computed somewhere else.`,
  },
  {
    q: 'Why does the site look like a machine?',
    a: 'Because the alternative was a template. The 3D layer boots, runs and transforms as you scroll, but it never gates the content: every section is real semantic HTML underneath, reachable by scroll, by the command palette, or by keyboard alone, and the whole site still works with WebGL unavailable or motion turned off.',
  },
] as const;
