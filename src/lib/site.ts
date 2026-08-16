/**
 * SITE ORIGIN — resolved, never hard-coded.
 *
 * Every absolute URL the site emits (canonical, Open Graph, sitemap, robots,
 * JSON-LD `@id`s) is built from `SITE_URL`. Moving the site to a new domain
 * must not require a code change, so the origin is discovered from the
 * environment in a fixed order of precedence and only falls back to a literal
 * as the last resort.
 *
 * Order matters: an explicit variable set by a human always beats anything the
 * host guessed, and a host's *stable production* domain always beats the
 * per-deployment URL — otherwise every preview build would publish canonicals
 * pointing at itself and compete with production in the index.
 */

/** Strips a trailing slash and adds a scheme if the host gave a bare domain. */
function normalise(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  // Vercel/Cloudflare hand back `my-site.vercel.app` with no scheme; Netlify
  // includes one. Accept both rather than caring which host we're on.
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** First non-empty candidate wins. */
function firstOf(...candidates: (string | undefined)[]): string | undefined {
  for (const c of candidates) {
    const n = c ? normalise(c) : '';
    if (n) return n;
  }
  return undefined;
}

const env = process.env;

/**
 * The origin this deployment should call itself.
 *
 * `NEXT_PUBLIC_SITE_URL` is the one to set when pointing a new domain at the
 * site — it is read identically on the server and in the browser bundle, so a
 * single value covers every consumer.
 */
export const SITE_URL: string =
  firstOf(
    // 1. Deliberate override — a human typed this.
    env.NEXT_PUBLIC_SITE_URL,
    env.SITE_URL,
    // 2. The host's stable production domain (custom domain once one is
    //    attached). Correct even when the current build is a preview.
    env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL,
    // 3. Netlify / Cloudflare Pages equivalents.
    env.URL,
    env.CF_PAGES_URL,
    // 4. This specific deployment (preview builds, branch deploys).
    env.NEXT_PUBLIC_VERCEL_URL,
    env.VERCEL_URL,
    env.DEPLOY_PRIME_URL,
  ) ?? 'http://localhost:3000';

/** Parsed once — `metadataBase` and the JSON-LD builders both need the object. */
export const SITE_ORIGIN = new URL(SITE_URL);

/** Bare host, for display ("bakul.app") and for the JSON-LD site name. */
export const SITE_DOMAIN = SITE_ORIGIN.host.replace(/^www\./, '');

/**
 * Absolute URL for a site-relative path. Used anywhere a spec requires a full
 * URL (Open Graph, JSON-LD, sitemap) rather than Next's automatic
 * `metadataBase` resolution.
 */
export const absoluteUrl = (path = '/'): string =>
  new URL(path, SITE_ORIGIN).toString();

/**
 * Whether this build is the real, public site.
 *
 * Preview and branch deployments serve identical content on a different
 * hostname. Left indexable they become duplicate-content competitors against
 * the canonical domain for the owner's own name — the exact query this site
 * most needs to win. They are excluded from search instead.
 */
export const IS_PRODUCTION_DEPLOY: boolean = (() => {
  // Explicit host signals first.
  if (env.VERCEL_ENV) return env.VERCEL_ENV === 'production';
  // Netlify: 'production' | 'deploy-preview' | 'branch-deploy'.
  if (env.CONTEXT) return env.CONTEXT === 'production';
  // Self-hosted: an explicitly configured origin plus a production build is
  // as good a signal as exists.
  if (env.NEXT_PUBLIC_SITE_URL || env.SITE_URL) return env.NODE_ENV === 'production';
  // Unknown host and no configured domain — assume it is not the public site.
  return false;
})();

/**
 * Search Console verification token, supplied by environment so the site can
 * be re-verified on a new domain without touching source.
 */
export const GOOGLE_SITE_VERIFICATION = env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined;
