import { ImageResponse } from 'next/og';
import { profile } from '@/lib/data/profile';
import { projects } from '@/lib/data/projects';
import { SITE_DOMAIN } from '@/lib/site';

/**
 * THE SHARE CARD.
 *
 * One renderer, used by both `opengraph-image` and `twitter-image`, so the two
 * can never diverge. Rendered through Satori, which supports a deliberate
 * subset of CSS: flexbox only (every element with children declares
 * `display: flex`), no CSS grid, and no external stylesheets. Anything the
 * layout engine can't express is drawn as inline SVG instead — which is also
 * why the backdrop below is generated rather than written as CSS patterns.
 *
 * The card is the single most-seen artefact of the whole site: it is what a
 * recruiter sees in Slack, LinkedIn or WhatsApp *before* deciding whether to
 * open the page at all. It has to carry the name, the role, the proof, and the
 * domain without being opened.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png';

/* ------------------------------------------------------------------ *
 * CONTENT
 *
 * The card is a fixed composition with swappable copy, not a template each
 * route re-invents. Every route that can be shared declares its text here and
 * the layout below renders it, which is what keeps a second card from slowly
 * becoming a second design — and, just as importantly, means the glyph subset
 * is derived from the same object rather than maintained alongside it.
 *
 * The shape is deliberately fixed at six slots. Anything a route wants to say
 * has to fit the composition; the composition does not bend per route.
 * ------------------------------------------------------------------ */

type CardContent = {
  /** Small tracked rail, top-left, beside the status light. */
  readonly kicker: string;
  /** The display line, set in the site's headline face. */
  readonly heading: string;
  /** The cyan line beneath it — what the heading actually is. */
  readonly subheading: string;
  /** Chips: three or four words, upper-cased at render. */
  readonly chips: readonly string[];
  /** The single number worth leading with, in amber. */
  readonly stat: string;
  /** What the number refers to. */
  readonly note: string;
  /** The proof row: the concrete things behind the claim. */
  readonly proof: readonly string[];
  /** `og:image:alt` — the card's content for anyone who cannot see it,
   *  including link previews that are rendered as text. */
  readonly alt: string;
};

export const SHARE_CARDS = {
  /*
   * Home. Everything is read from the same data the page renders, so the
   * preview can never drift out of step with the site it is advertising.
   */
  home: {
    kicker: 'THE LIVING MACHINE',
    heading: profile.name,
    subheading: profile.title,
    chips: profile.disciplines,
    stat: `CGPA ${profile.education.cgpa}`,
    note: profile.education.institution,
    proof: projects.map((p) => p.title),
    alt: `${profile.name} — ${profile.title}. ${profile.education.degree} at ${profile.education.institution}, CGPA ${profile.education.cgpa}.`,
  },

  /*
   * The lab. It gets its own card because it is the one page on this site that
   * is worth sharing on its own terms — an interactive artefact rather than a
   * section of a profile — and inheriting the home card meant a link to the
   * benches previewed as a CV. The name still leads the rail: whatever the
   * page, the card's job is attribution first.
   */
  lab: {
    kicker: `${profile.name.toUpperCase()} / DIAGNOSTICS`,
    heading: 'The Lab',
    subheading: 'Algorithms you can step through, one operation at a time',
    chips: ['Sorting', 'Compilers', 'Interactive'],
    stat: '2 benches',
    note: 'Running in the browser, no server',
    proof: ['Five instrumented sorts', 'Scanner, parser, IR, registers'],
    alt: 'The Lab — two interactive engines: five instrumented comparison sorts with a scrubbable trace, and a complete compiler front end from scanner to register allocation.',
  },
} as const satisfies Record<string, CardContent>;

export type ShareCardKey = keyof typeof SHARE_CARDS;

const COLOR = {
  carbon: '#090a0f',
  amber: '#ff8c00',
  cyan: '#00e5ff',
  ceramic: '#f0f2f5',
  ash: '#8b909c',
  ashDim: '#5b6070',
  rule: '#24272f',
} as const;

/* ------------------------------------------------------------------ *
 * BACKDROP
 *
 * A perspective floor receding to a vanishing point on the horizon: the same
 * spatial idea the site itself opens with, so the card reads as a frame from
 * the experience rather than a separate banner. Drawn as one inline SVG
 * because Satori has no repeating-gradient or 3D-transform support — and
 * because generating the geometry means the convergence is actually correct
 * rather than faked with skewed rectangles.
 * ------------------------------------------------------------------ */

const HORIZON = 402;
const VANISH_X = OG_SIZE.width * 0.62;

function backdropSvg(): string {
  const lines: string[] = [];

  /* Depth lines. Spacing follows a power curve so they bunch towards the
     horizon the way real perspective does — evenly spaced lines read as a
     ladder lying on the floor, not as distance. */
  const DEPTH_STEPS = 13;
  for (let i = 1; i <= DEPTH_STEPS; i++) {
    const y = HORIZON + (OG_SIZE.height - HORIZON) * Math.pow(i / DEPTH_STEPS, 2.35);
    // Nearer lines are brighter: an atmospheric-depth cue, one attribute wide.
    const o = (0.05 + (i / DEPTH_STEPS) * 0.16).toFixed(3);
    lines.push(
      `<line x1="0" y1="${y.toFixed(1)}" x2="${OG_SIZE.width}" y2="${y.toFixed(1)}" stroke="#5b6070" stroke-opacity="${o}" stroke-width="1"/>`,
    );
  }

  /* Rails converging on the vanishing point. */
  for (let j = -14; j <= 14; j++) {
    if (j === 0) continue;
    const xBottom = VANISH_X + j * 118;
    const o = (0.14 - Math.min(0.1, Math.abs(j) * 0.008)).toFixed(3);
    lines.push(
      `<line x1="${VANISH_X}" y1="${HORIZON}" x2="${xBottom.toFixed(1)}" y2="${OG_SIZE.height}" stroke="#5b6070" stroke-opacity="${o}" stroke-width="1"/>`,
    );
  }

  /* Horizon glow — where the floor meets the light. */
  const horizonBand = `
    <defs>
      <linearGradient id="hz" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#00e5ff" stop-opacity="0"/>
        <stop offset="42%" stop-color="#00e5ff" stop-opacity="0.5"/>
        <stop offset="70%" stop-color="#ff8c00" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="#ff8c00" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#090a0f" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#090a0f" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="0" y="${HORIZON - 1}" width="${OG_SIZE.width}" height="2" fill="url(#hz)"/>
    <rect x="0" y="${HORIZON}" width="${OG_SIZE.width}" height="120" fill="url(#fade)"/>`;

  /* A row of connector pins along the top edge — the machine's edge connector,
     and a piece of texture that reads as engineering rather than ornament. */
  const pins: string[] = [];
  for (let i = 0; i < 46; i++) {
    const x = 72 + i * 23;
    if (x > OG_SIZE.width - 72) break;
    const tall = i % 4 === 0;
    pins.push(
      `<rect x="${x}" y="0" width="3" height="${tall ? 16 : 8}" fill="#ff8c00" fill-opacity="${tall ? 0.3 : 0.14}"/>`,
    );
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_SIZE.width}" height="${OG_SIZE.height}" viewBox="0 0 ${OG_SIZE.width} ${OG_SIZE.height}">${horizonBand}${lines.join('')}${pins.join('')}</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/* ------------------------------------------------------------------ *
 * TYPE
 * ------------------------------------------------------------------ */

/**
 * Every glyph the card can render, so the subsetted font request covers all of
 * them. A missing character here renders as a blank box in the shared preview —
 * the one place nobody would ever see it before it went out.
 */
const GLYPHS = [
  // Derived from the cards themselves rather than listed again, so adding a
  // route's copy above cannot leave its glyphs behind. Every string in every
  // card, including the alt text — which costs nothing, since the subset is
  // deduplicated by the font service and these are all Latin.
  Object.values(SHARE_CARDS)
    .flatMap((c) => [c.kicker, c.heading, c.subheading, c.stat, c.note, c.alt, ...c.chips, ...c.proof])
    .join(''),
  SITE_DOMAIN,
  '0123456789/·—•.:,',
  // Both cases of the full alphabet: the chips and the rail are upper-cased at
  // render time, and uppercasing happens after subsetting.
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
].join('');

/**
 * Fetches a Google Font's raw bytes — the documented way to get real type into
 * an `ImageResponse`, which renders through Satori and so has no `@font-face`
 * and no `next/font`. This runs at build time, not per request, because the
 * routes using it are statically generated; a network failure degrades the
 * card to the system face rather than failing the build.
 */
async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(GLYPHS)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    ).then((r) => r.text());
    const match = css.match(/src: url\(([^)]+)\)/);
    if (!match) return null;
    return await fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * CARD
 * ------------------------------------------------------------------ */

export async function renderShareCard(key: ShareCardKey = 'home'): Promise<ImageResponse> {
  const card = SHARE_CARDS[key];

  /*
   * The card's name is set in the site's display face, not its body face.
   *
   * This is the one place the brand has to survive being taken out of its own
   * context — the card is what appears in a Slack unfurl, a LinkedIn post, an
   * iMessage preview, and it is very often seen *before* the site itself. With
   * the name in Inter here and Space Grotesk on the page, the preview and the
   * landing were showing the same word in two different voices, which is the
   * one inconsistency a share card cannot afford: recognition is its entire
   * job. The perspective grid was already drawn to match the site's substrate
   * for exactly this reason; the type had simply been left behind.
   *
   * Loaded in parallel and each independently optional — `loadGoogleFont`
   * returns null on any network failure, and Satori falls back to the system
   * face for whichever weight is missing rather than failing the build.
   */
  const [regular, semibold, bold, display] = await Promise.all([
    loadGoogleFont('Inter', 400),
    loadGoogleFont('Inter', 600),
    loadGoogleFont('Inter', 800),
    loadGoogleFont('Space Grotesk', 700),
  ]);

  const fonts = [
    ...(regular ? [{ name: 'Inter', data: regular, weight: 400 as const, style: 'normal' as const }] : []),
    ...(semibold ? [{ name: 'Inter', data: semibold, weight: 600 as const, style: 'normal' as const }] : []),
    ...(bold ? [{ name: 'Inter', data: bold, weight: 800 as const, style: 'normal' as const }] : []),
    ...(display
      ? [{ name: 'Space Grotesk', data: display, weight: 700 as const, style: 'normal' as const }]
      : []),
  ];

  /* Only claim the display face if its bytes actually arrived. */
  const displayFamily = display ? 'Space Grotesk' : 'Inter';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          background: COLOR.carbon,
          fontFamily: 'Inter',
          // Two off-canvas light sources, matching the site's own amber
          // (mechanical) / cyan (computational) split.
          backgroundImage:
            'radial-gradient(circle at 84% 12%, rgba(255,140,0,0.20) 0%, rgba(255,140,0,0) 55%), radial-gradient(circle at 8% 88%, rgba(0,229,255,0.16) 0%, rgba(0,229,255,0) 55%)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={backdropSvg()}
          alt=""
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />

        {/* Content plate */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: '64px 72px 60px 72px',
            position: 'relative',
          }}
        >
          {/* ---------- Header rail ---------- */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: COLOR.amber,
                  boxShadow: `0 0 16px ${COLOR.amber}`,
                }}
              />
              <div style={{ display: 'flex', fontSize: 19, letterSpacing: 5, color: COLOR.ash }}>
                {card.kicker}
              </div>
            </div>

            {/*
              The live domain, read from the resolved origin. If the site moves,
              the card follows — nothing here is a typed-in hostname.
            */}
            <div style={{ display: 'flex', fontSize: 19, letterSpacing: 3, color: COLOR.ashDim }}>
              {SITE_DOMAIN.toUpperCase()}
            </div>
          </div>

          {/* ---------- Identity ---------- */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28 }}>
            {/* Editorial accent rule — gives the name a left edge to sit against. */}
            <div
              style={{
                display: 'flex',
                width: 4,
                alignSelf: 'stretch',
                background: `linear-gradient(180deg, ${COLOR.amber} 0%, rgba(255,140,0,0) 100%)`,
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  fontSize: 104,
                  // 700 is Space Grotesk's heaviest cut, matching `.t-display`.
                  fontFamily: displayFamily,
                  fontWeight: 700,
                  color: COLOR.ceramic,
                  // -2.3px at 104px ≈ the -0.022em the site sets. The old
                  // -3.5 was tuned for Inter, which is drawn narrower and can
                  // take more negative tracking before glyphs collide.
                  letterSpacing: -2.3,
                  lineHeight: 1.02,
                }}
              >
                {card.heading}
              </div>

              <div
                style={{
                  display: 'flex',
                  fontSize: 33,
                  fontWeight: 600,
                  color: COLOR.cyan,
                  marginTop: 16,
                  letterSpacing: -0.4,
                }}
              >
                {card.subheading}
              </div>

              {/* Disciplines as physical chips rather than a bullet list — the
                  same vocabulary the site's panels use. */}
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                {card.chips.map((d) => (
                  <div
                    key={d}
                    style={{
                      display: 'flex',
                      fontSize: 17,
                      letterSpacing: 2.6,
                      color: COLOR.ash,
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: `1px solid ${COLOR.rule}`,
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    {d.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ---------- Proof ---------- */}
          {/*
            A card that stops at the heading tells someone scrolling a feed
            nothing they could not have guessed from the title. The number, what
            it refers to, and the concrete work behind it are the reason to
            click — and on the home card all three are read from the same data
            the page renders, so the preview cannot drift out of step with it.
          */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              paddingTop: 26,
              borderTop: `1px solid ${COLOR.rule}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', fontSize: 20, fontWeight: 600, color: COLOR.amber }}>
                {card.stat}
              </div>
              <div style={{ display: 'flex', width: 4, height: 4, borderRadius: 999, background: COLOR.ashDim }} />
              <div style={{ display: 'flex', fontSize: 20, color: COLOR.ash }}>{card.note}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {card.proof.map((item, i) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {i > 0 && (
                    <div
                      style={{ display: 'flex', width: 4, height: 4, borderRadius: 999, background: COLOR.rule }}
                    />
                  )}
                  <div style={{ display: 'flex', fontSize: 20, color: COLOR.ash }}>{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
