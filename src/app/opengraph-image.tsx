import { ImageResponse } from 'next/og';
import { profile } from '@/lib/data/profile';
import { projects } from '@/lib/data/projects';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'edge';

/** Fetches a Google Font's raw file bytes — the documented way to get real
 * type into an `ImageResponse`, which renders through Satori (no CSS `@font-face`,
 * no `next/font`). Falls back to the system-default face if the fetch fails,
 * so a network hiccup degrades the card instead of breaking image generation. */
/**
 * Every glyph the card can render, so the subsetted font request covers all
 * of them. A missing character here renders as a blank box in the shared
 * preview — the one place nobody would ever see it before it went out.
 */
const GLYPHS =
  profile.name +
  profile.title +
  profile.disciplines.join('') +
  projects.map((p) => p.title + p.kind).join('') +
  profile.education.cgpa +
  'CGPA · Featured work +0123456789/•—';

async function loadInter(weight: 400 | 800) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(
      GLYPHS,
    )}`,
  ).then((r) => r.text());
  const match = css.match(/src: url\(([^)]+)\)/);
  if (!match) return null;
  return fetch(match[1]).then((r) => r.arrayBuffer());
}

export default async function OpengraphImage() {
  const [regular, bold] = await Promise.all([loadInter(400), loadInter(800)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#090a0f',
          backgroundImage:
            'radial-gradient(circle at 82% 18%, rgba(255,140,0,0.16) 0%, rgba(255,140,0,0) 60%), radial-gradient(circle at 15% 85%, rgba(0,229,255,0.13) 0%, rgba(0,229,255,0) 60%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: '#ff8c00' }} />
          <div style={{ fontSize: 22, letterSpacing: 6, color: '#8b909c', fontFamily: 'Inter' }}>
            BAKUL // THE LIVING MACHINE
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 108,
            fontWeight: 800,
            fontFamily: 'Inter',
            color: '#f0f2f5',
            marginTop: 28,
            letterSpacing: -3,
          }}
        >
          {profile.name}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 34,
            fontFamily: 'Inter',
            color: '#00e5ff',
            marginTop: 14,
          }}
        >
          {profile.title}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 24,
            letterSpacing: 4,
            fontFamily: 'Inter',
            color: '#8b909c',
            marginTop: 18,
          }}
        >
          {profile.disciplines.join('   •   ').toUpperCase()}
        </div>

        {/*
          The card used to stop at the job title, which told a recruiter
          scrolling a feed nothing they could not have guessed from the name.
          Naming the actual shipped work and the CGPA is the difference
          between a business card and a reason to click — and both are read
          from the same data the page renders, so a share preview can never
          drift out of step with the site.
        */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginTop: 40,
            paddingTop: 28,
            borderTop: '1px solid #24272f',
          }}
        >
          <div style={{ display: 'flex', fontSize: 21, fontFamily: 'Inter', color: '#ff8c00' }}>
            CGPA {profile.education.cgpa}
          </div>
          <div style={{ display: 'flex', fontSize: 21, color: '#3a3f4a' }}>—</div>
          <div style={{ display: 'flex', fontSize: 21, fontFamily: 'Inter', color: '#8b909c' }}>
            {projects.map((p) => p.title).join('   •   ')}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        ...(regular ? [{ name: 'Inter', data: regular, weight: 400 as const }] : []),
        ...(bold ? [{ name: 'Inter', data: bold, weight: 800 as const }] : []),
      ],
    },
  );
}
