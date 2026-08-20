import type { NextConfig } from 'next';

/**
 * CONTENT SECURITY POLICY — the directives that provably hold here, enforced.
 *
 * ── Why there wasn't one ───────────────────────────────────────────────
 * This file used to explain the absence of a CSP by saying the page "compiles
 * WebGL shaders at runtime, loads Google Fonts, and runs Web Audio". All three
 * are true of the page and none of them is a CSP concern:
 *
 *   · GLSL is not script. `script-src` governs JavaScript; a shader handed to
 *     `gl.shaderSource` is a string passed to a graphics driver and no CSP
 *     directive has any opinion about it.
 *   · The page does not load Google Fonts. `next/font/google` downloads all
 *     four faces at build time and serves them from this origin — which
 *     `app/layout.tsx` already documents at length, in the note explaining why
 *     the `preconnect` to fonts.gstatic.com was removed. `font-src 'self'`
 *     would be satisfied.
 *   · Web Audio here is synthesised, not fetched. No `media-src` request is
 *     ever made.
 *
 * So the reasoning was wrong, and a wrong reason is worse than no reason: it
 * closed the question. The real obstacle is narrower and lives elsewhere —
 * `script-src` and `style-src`, below.
 *
 * ── What is enforced ───────────────────────────────────────────────────
 * Every directive here is one whose correctness can be read off the source
 * rather than guessed at, and none of them can fail the way a mis-set
 * `style-src` does — silently, and only in the layer that makes the page look
 * finished.
 *
 *   base-uri 'self'        There is no <base> element anywhere in the app, so
 *                          the only thing this can block is an injected one
 *                          rewriting every relative URL on the page.
 *   object-src 'none'      No <object>, <embed> or <applet>. Pure denial.
 *   frame-ancestors 'none' The modern form of the X-Frame-Options below, which
 *                          is kept alongside it for browsers that only read
 *                          the old header. The two agree.
 *   form-action 'self'     The contact form posts to a same-origin route
 *                          handler; nothing on the site submits anywhere else.
 *
 * `upgrade-insecure-requests` is deliberately absent rather than forgotten:
 * every asset reference in this codebase is origin-relative and the host serves
 * only HTTPS, so it would upgrade nothing — while adding a directive whose
 * behaviour against a plain-HTTP `localhost` dev server is the one part of this
 * policy that could not be verified by reading.
 *
 * ── What is not enforced, and what it would take ───────────────────────
 * `default-src`, `script-src` and `style-src` are missing because both of the
 * things this page is built on need `'unsafe-inline'` as things stand:
 *
 *   · The App Router streams its payload as inline <script> tags in the HTML.
 *     (The JSON-LD block is not one of these — `application/ld+json` is a data
 *     block, never executed, and CSP does not check it.)
 *   · This interface drives most of its state through inline `style`
 *     attributes, by design: a per-frame React re-render is exactly the cost
 *     the frame singleton exists to avoid, so values are written straight to
 *     the element. That is governed by `style-src-attr`, and there is no
 *     nonce mechanism for attributes at all.
 *
 * `script-src 'self' 'unsafe-inline'` is not worth writing down — it is a
 * policy that permits precisely the injection a CSP is for. The real upgrade is
 * a nonce-based `script-src` with `'strict-dynamic'`, which requires generating
 * a per-request nonce in middleware, which requires rendering this page
 * dynamically. That trades away the static optimisation the whole performance
 * budget rests on, so it is a decision to take deliberately and measure — not
 * to slip in under a security header. Left as a documented Phase-2 item rather
 * than a silent omission.
 */
const contentSecurityPolicy = [
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // This page uses none of these — explicitly say so rather than leaving
  // the default (permissive) policy in place.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  /*
   * HSTS, production only.
   *
   * Browsers ignore this header on a plain-HTTP response, so sending it in
   * development would be inert rather than harmful — but a two-year directive
   * is the most persistent thing in this file, and pinning it to the one
   * environment that is actually served over TLS keeps it from ever being
   * cached against a hostname that isn't.
   *
   * Neither `includeSubDomains` nor `preload` is set, and that is a decision,
   * not an oversight: both are effectively irreversible from the visitor's side
   * (the browser honours the directive it already cached), and both make a
   * claim about hosts this repository cannot see. Add `includeSubDomains` once
   * every subdomain of the production domain is known to be HTTPS-only, and
   * `preload` only after that has been true for a while.
   */
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000' }]
    : []),
];

/**
 * CACHING — only for the assets Next does not already fingerprint.
 *
 * Everything under `/_next/static` carries a content hash in its filename and
 * is served immutable by the framework; adding rules for it here can only make
 * that worse. What is left is the handful of files living at stable paths, where
 * the URL stays the same while the bytes may change — so each one needs a window
 * chosen from how often it actually changes and how bad a stale copy is.
 *
 * `must-revalidate` on the CV is the point of that entry: a recruiter who opens
 * the PDF, then opens it again after an update, must not be handed the old one
 * from cache after the hour is up. For icons, a stale copy for a day is
 * invisible, so they get the longer window and revalidate in the background.
 */
const cacheRules = [
  {
    // The CV is the one file where a stale copy is a factual error: it is the
    // document being cited as the source for every claim on the page. An hour
    // of caching, then a real revalidation — never a silent stale serve.
    source: '/cv/:file*',
    value: 'public, max-age=3600, must-revalidate',
  },
  {
    // Favicons and PWA icons change roughly never, and are requested on every
    // cold navigation. A day fresh, a week stale-while-revalidate.
    source: '/:file(favicon.ico|favicon.svg|favicon-16x16.png|favicon-32x32.png|apple-touch-icon.png|android-chrome-192x192.png|android-chrome-512x512.png)',
    value: 'public, max-age=86400, stale-while-revalidate=604800',
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,

  // Tree-shakes named imports from these packages down to what's actually
  // used, instead of pulling each package's full module graph into the trace.
  experimental: {
    optimizePackageImports: ['lucide-react', 'three', '@react-three/fiber'],
  },

  /**
   * RFC 9116 requires security.txt at `/.well-known/security.txt`. The file is
   * generated by a route handler (see `app/security.txt/route.ts` — the expiry
   * has to be computed at build time, not typed by hand), and a directory named
   * `.well-known` inside `app/` would be a route segment starting with a dot,
   * which Next treats as private and refuses to route.
   *
   * A rewrite rather than a redirect: scanners follow the spec path and should
   * get the document itself with a 200, not a hop to somewhere else. Both paths
   * serve identical bytes, and the file's own `Canonical` field names the
   * well-known one as the real address.
   */
  async rewrites() {
    return [{ source: '/.well-known/security.txt', destination: '/security.txt' }];
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      ...cacheRules.map(({ source, value }) => ({
        source,
        headers: [{ key: 'Cache-Control', value }],
      })),
    ];
  },
};

export default nextConfig;

