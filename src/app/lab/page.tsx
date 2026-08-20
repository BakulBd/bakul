import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { LabShell } from '@/components/lab/LabShell';
import { LabMasthead } from '@/components/lab/LabMasthead';

import { Atmosphere } from '@/components/dom/Atmosphere';
import { Backdrop } from '@/components/dom/Backdrop';
import { FilmGrain } from '@/components/dom/FilmGrain';
import { absoluteUrl } from '@/lib/site';
import { profile } from '@/lib/data/profile';
import {
  BENCHES,
  DEFAULT_BENCH,
  type BenchEntry,
  benchCountPhrase,
  findBench,
} from '@/lib/lab/catalogue';
import { LAB_DESCRIPTION, labBenchDescription, labStructuredDataJson } from '@/lib/seo';

/**
 * THE LAB — /lab
 *
 * The one route on the site that is not the machine. Everything else lives at
 * `/` as a single scrolling document; this is separate because it is a
 * different *kind* of thing: the main page is an argument you read, and the lab
 * is a set of instruments you operate.
 *
 * ── Why this is not a section on the main page ───────────────────────────
 * The main page's choreography is derived from measured scroll geometry:
 * `lib/data/sections.ts` measures each section's real height and computes the
 * camera's settle points from it. A bench does not have a settle point — it has
 * no natural length at all, because its height depends on which algorithm is
 * loaded and how many instructions an expression lowered to. Dropping something
 * of unbounded height into that registry would either need a fake fixed height
 * or would shift every camera cue after it on every state change.
 *
 * Being a route also means the 3D layer is simply absent here rather than
 * suppressed, which is the honest way to make a page about instruments: no
 * WebGL context, no render loop, no postprocessing pipeline competing with a
 * playhead that has to hit its step rate.
 *
 * ── Why it is a server component with no 'use client' ───────────────────
 * The heading, the framing copy and the closing note below are all in the
 * initial document — a crawler and a reader with JavaScript disabled both get
 * the point of the page without executing anything. `LabShell` is the client
 * boundary, and since the route resolves `?bench=` before rendering it (see the
 * note further down), that initial document now describes the bench actually
 * being asked for rather than the first one in the catalogue.
 *
 * Server-rendered per request rather than at build time — that is the price of
 * reading the query, and the whole cost of it is one render of markup that
 * depends on no data. Nothing here is fetched, cached, or revalidated.
 *
 * ── Why the background layers are repeated here ─────────────────────────
 * `Atmosphere`, `Backdrop` and `FilmGrain` are mounted by `Experience` on the
 * main page, which this route does not use. They are pure CSS with no state and
 * no per-frame JavaScript, so mounting them costs a handful of divs and keeps
 * the lab inside the same room as the rest of the site instead of on a flat
 * rectangle. `--power` is never set on this route, so the CSS default of 0
 * would hide them — which is why the wrapper pins it on: there is no boot
 * sequence here to ramp it.
 *
 * All three, not two. The lab previously mounted the air and the grain but not
 * the floor, so it was the one route standing in the same room with nothing
 * under it — and the substrate is the site's signature figure, the one the
 * share card is drawn from. `--flow` and `--scroll` stay at their defaults
 * here because there is no scroll engine on this route: the floor holds its
 * idle crawl, which is exactly right for a bench that is stood at rather than
 * travelled through.
 */

const TITLE = 'The Lab';

/*
 * Imported, not restated.
 *
 * This exact sentence is the `<meta name="description">`, the Open Graph and
 * Twitter description, and the `description` of the `WebPage` node in the lab's
 * JSON-LD. It used to be a literal here and the structured data used to
 * paraphrase it; two copies of a sentence in two files is a guarantee that one
 * of them is eventually edited alone. It lives in `@/lib/seo` because that is
 * the module the graph is built in.
 */
const DESCRIPTION = LAB_DESCRIPTION;

/* ── WHY THIS ROUTE READS THE QUERY ON THE SERVER ──────────────────────────
 *
 * `?bench=scheduler` used to be applied entirely after hydration, and the bill
 * for that came due on the URLs this page hands out most.
 *
 * `LabShell` is a client component rendered by this server page, so the server
 * ran it with the catalogue's default bench selected. `ssr: false` on the lazy
 * bench views suppresses the bench *body* and nothing else — the panel header
 * (the course line, the blurb, the engine's source path) and the rail's
 * `aria-selected` are all rendered from `current`, on the server, before any
 * query parameter had been read. Three things followed:
 *
 *   1. Someone opening a shared `/lab?bench=scheduler` read one bench's framing
 *      and then watched it turn into another's.
 *   2. `#bench-scheduler` resolved to nothing at the moment the browser looked
 *      for it, because the element in the document was `#bench-sorting`. The
 *      fragment half of every link the shell writes was inert.
 *   3. Anything that does not execute JavaScript — a crawler, a link unfurler —
 *      saw the default bench at all six addresses.
 *
 * Both producers of those URLs are on the primary flow: the command palette has
 * one entry per bench, and every bench has its own "Copy link" button.
 *
 * ── What it costs ──────────────────────────────────────────────────────
 * Awaiting `searchParams` opts this route out of static generation. That is a
 * real trade and this is the cheap side of it: nothing on this page is fetched,
 * so a request renders exactly the markup a build would have produced. The
 * alternative — `useSearchParams` behind a `<Suspense>` boundary — buys the
 * static shell back by replacing the whole rack with a fallback on first paint,
 * which is the same defect wearing a spinner.
 *
 * ── Why not `/lab/[bench]` ─────────────────────────────────────────────
 * Six prerendered routes are the textbook answer and would earn per-bench
 * canonicals. But the benches are parts of one document here, not six pages:
 * the JSON-LD publishes them as `hasPart` with fragment `@id`s, and the shell
 * switches them with `replaceState` specifically so Back still means "leave the
 * lab" rather than "undo five tab clicks". `replaceState` against a real route
 * desynchronises the router's own history state, so that shape would force a
 * server navigation on what is a purely client-side toggle.
 */
type LabPageProps = {
  /** A `Promise` since Next 15. Awaiting it is what makes this route dynamic. */
  searchParams: Promise<{ bench?: string | string[] }>;
};

/**
 * Which bench this request is for.
 *
 * `findBench` returns null for anything unrecognised, so a stale or hand-edited
 * `?bench=` lands on the default rather than an empty rack — the same rule the
 * shell already applied on the client, now applied one step earlier.
 *
 * The array case is `?bench=a&bench=b`: nothing here generates it and a crawler
 * can still construct it. First wins, because a URL carrying two answers has to
 * resolve to one bench and the alternative is honouring neither.
 *
 * Called twice per request, by `generateMetadata` and by the page. Next dedupes
 * the `searchParams` promise across both, and this function is a lookup in a
 * six-element array, so the second call is free.
 */
async function openBench({ searchParams }: LabPageProps): Promise<BenchEntry> {
  const { bench } = await searchParams;
  return findBench(Array.isArray(bench) ? bench[0] : bench) ?? DEFAULT_BENCH;
}

export async function generateMetadata(props: LabPageProps): Promise<Metadata> {
  const bench = await openBench(props);

  /*
   * The default bench *is* `/lab` — `benchPath` deliberately gives it a bare
   * path — so at that address every string below is byte-identical to the static
   * metadata this replaced. Only a URL that names a bench gets bench-specific
   * copy, which keeps the canonical, crawled address describing the rack instead
   * of whichever instrument happens to be first in the array.
   */
  const named = bench.id !== DEFAULT_BENCH.id;
  const title = named ? `${bench.label} — ${TITLE}` : TITLE;
  const description = named ? labBenchDescription(bench) : DESCRIPTION;

  return {
    // Rendered through the root layout's `%s | Bakul Ahmed` template: the
    // longest of the six comes to 52 characters, inside what a result shows.
    title,
    description,
    /*
     * Still `/lab`, for every variant.
     *
     * The title and description above describe the open bench; the canonical
     * says which document that bench is part of, and there is only one. This is
     * the same claim the graph makes — `hasPart` with `#bench-…` `@id`s — so a
     * crawler consolidating six query variants into one page is agreeing with
     * the structured data rather than working around it.
     */
    alternates: { canonical: '/lab' },
    /*
     * Keywords are close to worthless as a ranking signal and are kept for one
     * narrow reason: they are the only place the page names the courses the
     * benches are evidence for, which is the join a subject-specific search
     * actually matches on.
     *
     * The bench-derived half comes first so the list can never omit an instrument
     * the page is serving. It was a hand-written array naming sorting and the
     * compiler, and it silently stopped mentioning a whole bench. `Set` dedupes
     * because two benches can cite the same course.
     */
    keywords: [
      ...new Set([
        ...BENCHES.map((b) => `${b.label.toLowerCase()} visualiser`),
        ...BENCHES.map((b) => b.course),
        'algorithm visualisation',
        'interactive computer science',
        profile.name,
      ]),
    ],
    openGraph: {
      type: 'article',
      // The shared address, not the requesting one. A card that unfurls to a
      // different URL than the one pasted is a card nobody trusts twice.
      url: absoluteUrl('/lab'),
      title: `${title} — ${profile.name}`,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — ${profile.name}`,
      description,
    },
    /*
     * `max-image-preview: large` is the property that decides whether the 1200×630
     * card is shown at full width in a result or shrunk to a thumbnail. The site
     * default in `robots.ts` covers `/`; declaring it here means this route keeps
     * it regardless of what a future default becomes.
     *
     * `max-snippet: -1` because the framing copy below is written to be quoted —
     * capping it would only mean being quoted from the middle of a sentence.
     */
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}

export default async function LabPage(props: LabPageProps) {
  const bench = await openBench(props);

  return (
    /*
     * `--power: 1` pins the atmosphere on.
     *
     * Every background layer fades with `--power`, which the machine's boot ramp
     * publishes on the main page. There is no boot here, so without this the
     * layers would render at opacity 0 — present in the DOM and invisible.
     *
     * `--tone: 1` pins the room to the cool end of the narrative. On the main
     * page tone is a function of scroll position, amber (mechanical) through
     * cyan (computational); the lab is nothing but the computational end, so
     * the floor, the air and the horizon are all mixed there rather than
     * sitting at the amber default a route with no scroll engine would inherit.
     */
    <div className="lab-route" style={{ '--power': 1, '--tone': 1 } as CSSProperties}>
      <a href="#lab-main" className="skip-link">
        Skip to the benches
      </a>

      {/*
        * The lab's own `@graph`, not the home page's.
        *
        * The root layout emits the profile graph on every route, which is right
        * for `/` and wrong here: this document is about the programs. This node
        * set describes them as `SoftwareApplication`s, carries a
        * `BreadcrumbList` so a result for /lab can render `bakul.app › The Lab`
        * instead of a raw path, and references the same `Person` `@id` the home
        * graph defines in full — so the two documents resolve to one entity
        * without either restating the other.
        *
        * Pre-serialised and `<`-escaped in @/lib/seo.
        */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: labStructuredDataJson }}
      />

      <Atmosphere />
      <Backdrop />
      <FilmGrain />

      {/*
        The way out, and it is deliberately outside `<main>`: the trail is
        site-level navigation rather than part of this document's content, and a
        screen-reader user skipping to the main landmark should land on the
        benches, not have to walk back past the chrome to reach them.
      */}
      <LabMasthead />

      <main id="lab-main" className="lab-route__main">
        <header className="lab-route__head">
          <p className="t-label emissive-cyan">Diagnostics / Bench</p>
          {/* The page's only h1 — the main page's h1 is the name, and two
              documents each having exactly one is what keeps the outline
              correct on both. */}
          <h1 className="t-display lab-route__title">The Lab</h1>
          {/* The count is interpolated rather than typed. This sentence is the
              first thing anyone reads on the page, and it said "Two engines" for
              a while after the third one shipped — a page miscounting itself in
              its own opening line. */}
          <p className="t-body lab-route__lead">
            {benchCountPhrase()}, running here, in this tab. Not a recording of a sort and
            not a picture of a compiler — every trace, grid and instruction listing below
            was produced by code on this page, from whatever you gave it.
          </p>
        </header>

        <LabShell initialBench={bench.id} />

        {/*
          * The footer states the rule the rack is built on rather than counting
          * its contents. It was headed "Why these two", which stopped being true
          * on the day a bench was added and would stop being true again — a
          * heading that has to be edited every time the thing it describes grows
          * is a heading that will eventually be wrong.
          */}
        <footer className="lab-route__foot">
          <h2 className="lab-route__foot-title">Why a bench and not a demo</h2>
          <p className="t-body">
            These are the parts of a computer science degree usually taught as things to
            memorise, and they are far more interesting as things to operate. A complexity
            class is an abstraction over a count you can just make the machine report; a
            shortest path is a claim you can check against a second algorithm that shares no
            code with the first; a compiler is four passes you can watch feed each other. So
            nothing here draws a result and asks you to trust it — every counter is tallied
            during the run, and every run tests properties of its own output and shows you
            whether they held.
          </p>
          <p className="t-body">
            The engines live in <code>src/lib/lab/</code> and are plain TypeScript with no
            dependencies and no reference to the DOM. The view is a separate concern that
            reads their output, which is what makes scrubbing a sort backwards, replaying a
            search over the same map and re-allocating registers at a different budget
            possible without any engine knowing a UI exists.
          </p>
        </footer>
      </main>
    </div>
  );
}
