# BAKUL // THE LIVING MACHINE

Personal portfolio for **Bakul Ahmed** — Computer Science Engineer.

A single-page interactive experience: a cybernetic machine that boots, runs, and
transforms as you scroll, with the portfolio content layered on top as real,
semantic HTML.

```
npm install
npm run dev        # http://localhost:3000
npm run build && npm run start
```

---

## The five interactions

Everything else was cut. These are the ones that earn their weight:

1. **Cold boot** — the site starts dark in standby. Power arrives, conduits
   energise, turbines spin up, the rack comes online, and the camera pulls back
   to reveal the machine.
2. **Project rack** — projects are physical modules. Scrolling advances the rack
   and locks the active bay into place beside its case study.
3. **The transformation** — the machine comes apart into particles that
   reassemble into a neural lattice. Mechanical → computational → intelligent.
4. **The Lab** (`/lab`) — real working engines, not recordings (see below).
5. **Kernel panic** — type `sudo override` in the command palette, or just type
   `debug` anywhere on the page.

## Navigation

The 3D never gates the content. A recruiter can reach any section in one action:

- **Scroll** — native, damped with Lenis. No hijacking.
- **⌘K / Ctrl+K** — command palette (sections, the Lab, CV, GitHub, LinkedIn,
  email).
- **Left rail** — always visible on desktop; bottom bar on mobile.
- **Skip link** — first focusable element on the page.
- **`/lab`** — the one route off the homepage. Linked from the end of the
  project rack and from the footer; deliberately *not* in the section rail,
  because that rail is generated from the same registry that drives camera
  choreography and every entry in it needs a settle point on the scroll
  timeline.

---

## Content rules

These are enforced, not aspirational:

- Every fact comes from `src/lib/data/`, sourced from the CV in `public/cv/`.
- **No invented projects, metrics, awards, employers, or results.** The previous
  version of this site listed six fabricated projects with fake repository URLs;
  they are gone.
- Unpopulated project bays render as visibly empty slots rather than filler.
- Figures in the Impact section each display their source in the UI.
- The AI/ML section states a direction, not an achievement, because there is no
  shipped ML work yet.
- The contact form never claims a message was sent when it was not.

To add a project: copy an `empty` slot in `src/lib/data/projects.ts`, set
`status: 'online'`, and fill every field.

---

## The Lab — `/lab`

Benches, running live in the browser. Nothing here is a recording, a video, or
a scripted animation of a result computed elsewhere.

| Bench | What it actually does |
| --- | --- |
| **Sorting** | Five algorithms (`src/lib/lab/sorting.ts`), each emitting a trace of discrete steps. The view is a pure function of `(trace, cursor)`, which is what makes scrubbing, stepping backwards and speed control free rather than three separate features. Comparison and swap counts are the trace's own totals, not estimates. |
| **Pathfinding** | Breadth-first, depth-first, Dijkstra and A\* over one generated grid (`src/lib/lab/graph.ts`). Rough ground costs five to enter, so the four searches genuinely diverge instead of drawing the same line in four colours — and each returned route is checked against an independent Bellman–Ford reference that shares no code with any of them. |
| **Compiler** | A real scanner, recursive-descent parser, three-address lowering pass, and linear-scan register allocator (`src/lib/lab/compiler.ts`). Type any assignment statement; every stage recomputes. Correct operator precedence over `+ - * / %`, unary minus, parentheses, and error positions that point at the offending column. |

Every engine is pure TypeScript with no DOM and no React — which is why the
benches can render them as tables, timelines, grids or anything else, and why
the same trace can be replayed forwards and backwards without re-running the
algorithm.

### One list, six readers

`src/lib/lab/catalogue.ts` is the only place a bench is declared. The rail, the
JSON-LD `SoftwareApplication` nodes, the `/llms.txt` listing, the command
palette, the web manifest shortcut and the page's own opening sentence are all
generated from it.

That is not tidiness for its own sake. Every one of those surfaces used to state
the count by hand, and the day a third bench shipped, five of them were quietly
wrong — the meta description a search result quotes still said "Two engines",
and nothing failed, because a miscount does not throw. Deriving the sentence
means the site cannot advertise less than it contains.

### Advertised but never built

An earlier draft of this file described a "Field" bench of live particle-renderer
parameters. It was never built, and the store slice it would have written into
sat unread until it was removed. The lighting gain it was meant to expose now
lives in the debug console (`debug`), where the rest of the real renderer
controls already are. The note stays here because it is the failure this
repository is most prone to.

### Why a bench and not a demo

These are the parts of the degree usually asserted rather than shown. "Knows
algorithms" and "took a compilers course" are lines on a CV. The difference is
that nothing here draws a result and asks you to trust it: every counter is
tallied by the algorithm as it runs, and every run tests properties of its own
output — that a sort's result is ordered and a permutation of its input, that a
route's cost matches what the search reported and an independent reference
agrees it is optimal, that the compiler's allocated registers evaluate to the
same value as the parse tree. The badge shows whether they held.

---

## Architecture

```
src/
  app/             Routes. `/` is the machine; `/lab` is the benches.
  lib/data/        Content. Single source of truth. Real facts only.
  lib/lab/         Working engines. Pure TypeScript, no DOM, no dependencies.
  lib/lab/core/    Seeded RNG, trace recorder, self-verification. Shared.
  lib/lab/catalogue.ts  The one declaration of what the Lab contains.
  lib/audio/       Procedural Web Audio. No files, zero network bytes.
  lib/haptics.ts   Vibration API taps, gated on a coarse pointer.
  lib/site.ts      Resolves the deployment's own origin. No hard-coded URLs.
  lib/seo.ts       The JSON-LD identity graph.
  lib/og.tsx       The share card, rendered at build time.
  store/machine.ts State machine + per-frame singleton.
  hooks/           Capability detection, adaptive quality, scroll engine.
  components/
    machine/       R3F scene, camera rig, shaders, geometry blueprint.
    dom/           Semantic content layer + navigation + debug console.
      Atmosphere   The CSS-only background room. Shared by both routes.
    lab/           Bench UIs for the engines in `lib/lab/`.
```

Two decisions worth knowing before editing:

**Per-frame values live in a mutable singleton** (`frame` in
`src/store/machine.ts`), not React state. Scroll position, power, and morph
change every frame; routing them through React would re-render the tree 60×/sec.
Zustand handles only discrete, user-meaningful transitions.

**The machine is defined once** in `components/machine/lib/blueprint.ts`. Both
the rendered instanced meshes and the particle sampler read from it, which is
why the dissolution genuinely traces the geometry you were just looking at
instead of approximating it.

**Section timing is computed**, never hand-written. `src/lib/data/sections.ts`
derives each camera settle point from the real section heights, so the markup
and the choreography cannot drift apart.

---

## Performance

- No 3D assets. All geometry is procedural — nothing to download, compress, or
  decode, so Draco/KTX2 are moot.
- Three.js is dynamically imported. Measured first-load JS is **149 kB for `/`**
  and **115 kB for `/lab`**, against a 101 kB shared baseline — so the entire
  home page costs 48 kB of route code and the Lab costs 14 kB. Both are complete
  and readable before any of the 3D arrives.
- **`/lab` ships no Three.js at all.** The benches are pure TypeScript and DOM,
  and the background they sit on is CSS, so the route that exists to prove the
  algorithms run does not pay for a renderer it never mounts.
- The chassis renders in ~5 draw calls via instancing.
- The entire transformation is one draw call: three position buffers blended on
  the GPU by a single uniform.
- Quality auto-detects (high / medium / mobile / low) from GPU, cores, memory,
  and pointer type, and steps down if measured frame rate stays below 32fps for
  3 seconds. `mobile` is not a smaller `medium`: it keeps bloom and spends the
  saving on particle count, because a phone's constraint is fill rate, and on a
  scene made almost entirely of emissive surfaces bloom is the most expensive
  thing to lose visually.
- The background costs no JavaScript on either route — see *The room* below.

## Accessibility

Real site underneath the canvas. Verified by grepping the built HTML, not by
assumption:

- Skip link is the first tab stop on both routes (`#main`, `#lab-main`).
- Exactly one `<main>` and one `<h1>` per document.
- `/` has 6 section `<h2>`s — one per station, matching the six entries in the
  choreography registry exactly. `/lab` has 1, because it is one document with
  the benches inside it rather than one page per bench.
- Every input labelled, every button and link named.
- The canvas wrapper is `aria-hidden` — nothing in it is the only source of
  anything.
- The project rack is a real `listbox` with arrow-key traversal; the Lab's
  bench switcher is a real WAI-ARIA `tablist`.
- `prefers-reduced-motion` powers the machine on instantly with motion
  suppressed, and the sorting bench's autoplay does not start on its own.
- `prefers-reduced-transparency` and `prefers-contrast: more` are both handled
  in `globals.css`, not left to the browser.

## Domain — moving the site

**Nothing in `src/` hard-codes a URL.** The origin is resolved once in
`src/lib/site.ts` and everything that needs an absolute URL is built from it:
the canonical tag, Open Graph, `sitemap.xml`, `robots.txt`, the JSON-LD `@id`s,
and the domain printed on the share card.

Resolution order, first match wins:

1. `NEXT_PUBLIC_SITE_URL` / `SITE_URL` — an explicit value someone set
2. `VERCEL_PROJECT_PRODUCTION_URL` — the host's *stable* production domain
3. `URL` (Netlify) / `CF_PAGES_URL` (Cloudflare Pages)
4. `VERCEL_URL` / `DEPLOY_PRIME_URL` — this specific preview deployment
5. `http://localhost:3000`

Point a new domain at the deployment and it is picked up automatically on the
managed hosts; set `NEXT_PUBLIC_SITE_URL` anywhere else. Either way it is a
config change, never a code change.

Two things worth knowing:

- **It is read at build time.** The homepage is statically prerendered, so the
  URLs are baked in by `next build`. Managed hosts expose their environment to
  the build automatically; a hand-rolled Docker build must pass the value to
  the *build* stage.
- **Preview deployments are excluded from search.** A branch deploy serves
  identical content on a throwaway hostname; indexed, it competes with the real
  domain for Bakul's own name. Non-production builds emit
  `noindex` plus a blanket `Disallow: /`.

## Search & sharing

The one query this site has to win is the owner's name, so the work is aimed at
entity resolution rather than keyword density:

- **One connected JSON-LD `@graph`** (`src/lib/seo.ts`) — a `ProfilePage` whose
  `mainEntity` is a `Person` who `authored` the `SoftwareSourceCode` listed on
  the same page. Nodes reference each other by `@id`, so a crawler resolves one
  identity instead of several fragments. Every claim is CV-backed.
- **`sameAs` + `rel="me"`** to GitHub and LinkedIn, in both directions — the
  strongest available signal that these profiles are the same person.
- **A search-first `<title>`** (`Bakul Ahmed — Computer Science Engineer`). The
  brand line, *The Living Machine*, moves to the Open Graph card, where
  personality helps and keywords don't.
- **`max-image-preview: large`**, without which the generated card is built and
  then shown as a thumbnail.
- **The CV PDF is in the sitemap** — it is a separately indexable document whose
  text corroborates the name, the degree, and the roles.
- **A visible FAQ, and a matching `FAQPage` node.** Not for rich results —
  Google restricted FAQ snippets to government and health sites in 2023 — but
  because those six questions are the ones that actually arrive by email, and a
  Q&A pair is the shape an answer engine extracts most reliably. Every answer
  restates something the page or the CV already proves.
- **`Person.award` and `hasCredential` are separate.** schema.org distinguishes
  an honour conferred *on* someone from a course completed by them; emitting all
  three credentials under one property would either inflate a certificate into
  an award or demote the award into a certificate.

### Machine-readable endpoints

| Path | Why it exists |
| --- | --- |
| `/llms.txt` | The same facts as the page, in the format a language model reads without guessing. Generated from `lib/data/` at build time — never a second hand-maintained copy of the CV — so it cannot disagree with the site. Forward-looking timeline entries are tagged `[planned]` explicitly, because a summariser given "Expected October 2027" and no marker will report a finished degree. |
| `/.well-known/security.txt` | RFC 9116. A route handler rather than a static file, because `Expires` is mandatory and a hand-typed date goes stale silently; it is recomputed on every deploy. Rewritten from `/security.txt`, since an `app/` segment cannot begin with a dot. |

Both are absent from the sitemap on purpose: they are metadata fetched directly
by the agents that want them, not pages a search engine should return as
results.

The share card (`src/lib/og.tsx`) is generated at build time, not per request:
on the edge runtime it was re-rendered on every unfurl *including a live Google
Fonts fetch*, and crawlers time out. One renderer feeds both `opengraph-image`
and Twitter, so the two can never diverge.

## Sound

Muted by default, remembered per visitor, silenced when the tab is hidden.
Every sound is synthesised — zero network bytes.

The engine (`src/lib/audio/engine.ts`) is built as one instrument rather than a
bag of beeps:

- **Everything is in one key.** All pitched voices draw from a single A minor
  pentatonic table, so any two sounds that overlap are consonant. Arbitrary
  frequencies are most of why synthesised interface audio sounds cheap.
- **Everything shares one room.** A convolution reverb built from a procedurally
  generated impulse response — with real early reflections, not just a decaying
  noise tail — glues the voices together.
- **Nothing can clip.** Per-role buses (ambient / interface / event) sum into a
  brick-wall limiter. Measured peak under a deliberate voice pile-up is 0.22 of
  full scale.
- **The bed reports state.** Scroll velocity opens the pad's filter; section
  changes re-voice its fifth, so the score develops across a visit.

`SoundBridge` derives every cue from a *state transition*, not from whichever
component caused it — so powering up by clicking the button and powering up by
scrolling sound the same, and new controls get interface feedback from the
delegated listeners without a single call site. Opt a control out with
`data-sound="off"`.

## The room

Two layers, neither of which costs a byte of JavaScript.

**The substrate** (`components/dom/Backdrop.tsx`) is the perspective grid behind
the content, and it is the same figure the share card is built on — so the
preview in a recruiter's Slack and the page they land on are recognisably the
same object. Two elements: the grid is a repeating gradient painted once, and
the motion is a composited `translate3d` looping by exactly one cell. It sits
*above* the readability scrim — below it, a 0.9-opacity dark wash erases it
entirely.

**The atmosphere** (`components/dom/Atmosphere.tsx`) is what the machine is
standing in: slow masses of aurora light, a fine drift of dust, a pool of glow
at the horizon, and depth fog. Six divs, no state, no effects, no `'use client'`.

It exists because the background used to be exactly two things — a WebGL scene
and a flat grid — with nothing between them, and on a phone that gap *was* the
visual experience: the canvas does not mount until the machine powers on, and
once it does it sits behind a near-opaque readability scrim. The most common
first impression of the site was a grid on a dark rectangle.

It is not a second attempt at the 3D scene, and it is deliberately not a
`<canvas>` — a canvas doing this job would need a rAF loop competing with the
one the real machine already runs. Everything here composites on the GPU from
`transform` and `opacity` only, so it keeps moving while the main thread is
busy parsing Three.js, which is precisely the moment the page most needs to
look alive.

It stays in step with the machine through two CSS custom properties published
elsewhere and merely read here: `--power`, mirrored from `frame.power`, so the
room brightens with the boot ramp rather than on a timer that approximates it;
and `--tone`, the same mechanical-amber → computational-cyan scalar the 3D
light rig reads, so the room's hue tracks where the visitor is in the argument.
Neither is a prop — passing them through React would mean re-rendering the
component to change them, at which point it would stop being free.

`/lab` renders the same layer, which is most of why the two routes read as one
site despite one of them having no 3D in it at all.

## Contact form

Set `RESEND_API_KEY` (see `.env.example`) to enable delivery. Without it the
endpoint returns 503 and points the visitor at the direct email address —
deliberately, rather than silently discarding mail. Includes honeypot, header
sanitisation, HTML escaping, and per-IP rate limiting.

## Stack

Next.js 15 (App Router) · TypeScript · React 19 · Tailwind 4 ·
React Three Fiber · Three.js · Zustand · Lenis · Web Audio API
