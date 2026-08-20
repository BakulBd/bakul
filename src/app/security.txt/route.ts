import { profile } from '@/lib/data/profile';
import { absoluteUrl } from '@/lib/site';

/**
 * security.txt — RFC 9116.
 *
 * A machine-readable answer to "who do I tell?". This is a static portfolio
 * with one POST endpoint, so the realistic finding is a misconfigured header or
 * a leaked key in a public repo rather than a remote exploit — but the cost of
 * publishing a contact address is one route, and the cost of *not* publishing
 * one is that a researcher who finds something either gives up or posts it
 * publicly. Scanners also check for this file when scoring a domain's hygiene.
 *
 * Why a route handler and not `public/.well-known/security.txt`:
 *
 * `Expires` is the only mandatory field in the spec, and a hand-typed date is a
 * date that goes stale silently — the file keeps serving, keeps looking
 * official, and quietly tells every reader that it is no longer maintained. A
 * literal in a static file is guaranteed to be wrong eventually; a value
 * computed at build time is correct every time the site is deployed. That is
 * the entire reason this is code.
 *
 * Everything else is derived from `lib/data` and `lib/site` for the same reason
 * the rest of the site is: the email address and the origin exist in exactly
 * one place each.
 *
 * Fields deliberately omitted: `Encryption` (no published PGP key — pointing at
 * a key that does not exist is worse than no key), `Policy` (there is no
 * disclosure-policy page, and linking a 404 from a security file is exactly the
 * kind of broken promise this file is meant to avoid), and `Hiring` (cute, but
 * it is not a security field and clutters a document that gets parsed).
 */

/**
 * Build-time evaluation. `Date.now()` here runs once, when the route is
 * prerendered, so the emitted expiry is anchored to the deploy that produced it
 * rather than drifting forward on every request — which would make the field
 * meaningless as a maintenance signal.
 */
export const dynamic = 'force-static';

/**
 * RFC 9116 §2.5.5 caps this at one year, and recommends being conservative.
 * 365 days is the ceiling rather than a guess: the value is recomputed on every
 * deploy, so the only way it ever expires is a full year with no deploy at all
 * — at which point "this file is unmaintained" is precisely the correct thing
 * for it to be saying.
 */
const EXPIRY_DAYS = 365;

const MS_PER_DAY = 86_400_000;

/**
 * ISO 8601 with a `Z` offset, which is what the spec's grammar wants.
 * `toISOString()` already emits exactly that; the milliseconds are trimmed
 * because sub-second precision on a one-year deadline is noise.
 */
function expiryStamp(): string {
  const at = new Date(Date.now() + EXPIRY_DAYS * MS_PER_DAY);
  return at.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

const document = [
  '# Security contact for this site.',
  '# Format: RFC 9116 — https://www.rfc-editor.org/rfc/rfc9116',
  '#',
  '# Scope: this domain and its subdomains, plus the repositories linked from',
  `# ${profile.contact.github}. Please report privately first — I will confirm`,
  '# receipt, and I have no objection to public disclosure once a fix is out.',
  '',
  `Contact: mailto:${profile.contact.email}`,
  `Expires: ${expiryStamp()}`,
  'Preferred-Languages: en, bn',
  // The spec requires this to be the URI the file is *served* from, which is
  // the well-known path — not the `/security.txt` route backing it. The rewrite
  // in next.config.ts is what makes both true at once.
  `Canonical: ${absoluteUrl('/.well-known/security.txt')}`,
  '',
].join('\n');

export function GET(): Response {
  return new Response(document, {
    headers: {
      // RFC 9116 §3 — `text/plain` with a UTF-8 charset, stated, not guessed.
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
