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
4. **Experiment Lab** — real working demos, not recordings (see below).
5. **Kernel panic** — type `sudo override` in the command palette, or just type
   `debug` anywhere on the page.

## Navigation

The 3D never gates the content. A recruiter can reach any section in one action:

- **Scroll** — native, damped with Lenis. No hijacking.
- **⌘K / Ctrl+K** — command palette (sections, CV, GitHub, LinkedIn, email).
- **Left rail** — always visible on desktop; bottom bar on mobile.
- **Skip link** — first focusable element on the page.

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

## Experiment Lab

All three run live in the browser:

| Bench | What it actually does |
| --- | --- |
| **Sorting** | Five algorithms (`src/lib/lab/sorting.ts`), each emitting a trace of discrete steps. The view is a pure function of `(trace, cursor)`, which is what makes scrubbing and speed control free. Same architecture as the Algorithms Visualizer project. |
| **Compiler** | A real scanner, recursive-descent parser, three-address lowering pass, and register allocator (`src/lib/lab/compiler.ts`). Type any assignment statement; every stage recomputes. Correct operator precedence, unary minus, parentheses, and error positions. |
| **Field** | Live parameters for the particle renderer. Writes into the same store the render loop reads each frame. |

---

## Architecture

```
src/
  lib/data/        Content. Single source of truth. Real facts only.
  lib/lab/         Working algorithm + compiler implementations.
  lib/audio/       Procedural Web Audio. No files, zero network bytes.
  lib/site.ts      Resolves the deployment's own origin. No hard-coded URLs.
  lib/seo.ts       The JSON-LD identity graph.
  lib/og.tsx       The share card, rendered at build time.
  store/machine.ts State machine + per-frame singleton.
  hooks/           Capability detection, adaptive quality, scroll engine.
  components/
    machine/       R3F scene, camera rig, shaders, geometry blueprint.
    dom/           Semantic content layer + navigation + debug console.
    lab/           Interactive demo UIs.
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
- Three.js is dynamically imported. First load is ~137 kB; the page is complete
  and readable before any of it arrives.
- The chassis renders in ~5 draw calls via instancing.
- The entire transformation is one draw call: three position buffers blended on
  the GPU by a single uniform.
- Quality auto-detects (high / medium / low) from GPU, cores, memory, and pointer
  type, and steps down if measured frame rate stays below 32fps for 3 seconds.

## Accessibility

Real site underneath the canvas. Verified: skip link is the first tab stop, one
`<main>`, one `<h1>`, nine section `<h2>`s, every input labelled, every button
and link named, the canvas wrapper is `aria-hidden`, and `prefers-reduced-motion`
powers the machine on instantly with motion suppressed.

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

## The substrate

The perspective grid behind the content (`components/dom/Backdrop.tsx`) is the
same figure the share card is built on, so the preview in a recruiter's Slack
and the page they land on are recognisably the same object. Two elements, no
JavaScript: the grid is a repeating gradient painted once, and the motion is a
composited `translate3d` looping by exactly one cell. It sits *above* the
readability scrim — below it, a 0.9-opacity dark wash erases it entirely.

## Contact form

Set `RESEND_API_KEY` (see `.env.example`) to enable delivery. Without it the
endpoint returns 503 and points the visitor at the direct email address —
deliberately, rather than silently discarding mail. Includes honeypot, header
sanitisation, HTML escaping, and per-IP rate limiting.

## Stack

Next.js 15 (App Router) · TypeScript · React 19 · Tailwind 4 ·
React Three Fiber · Three.js · Zustand · Lenis · Web Audio API
