import { ImageResponse } from 'next/og';
import { profile } from '@/lib/data/profile';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'edge';

/** Fetches a Google Font's raw file bytes — the documented way to get real
 * type into an `ImageResponse`, which renders through Satori (no CSS `@font-face`,
 * no `next/font`). Falls back to the system-default face if the fetch fails,
 * so a network hiccup degrades the card instead of breaking image generation. */
async function loadInter(weight: 400 | 800) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(
      profile.name + profile.title + profile.disciplines.join(''),
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
            marginTop: 20,
          }}
        >
          {profile.disciplines.join('   •   ').toUpperCase()}
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
