import { NextResponse } from 'next/server';
import { profile } from '@/lib/data/profile';

/**
 * Contact transmission endpoint.
 *
 * Delivery uses Resend when RESEND_API_KEY is configured. When it is not, the
 * endpoint reports that honestly instead of pretending the message was sent —
 * a contact form that silently discards mail is worse than no form at all.
 */

export const runtime = 'nodejs';

interface Payload {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  /** Honeypot — real users never fill this; bots usually do. */
  company?: unknown;
}

const MAX = { name: 120, email: 200, message: 4000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Simple per-address rate limit. Resets with the process; enough to blunt abuse.
 *
 * ── What it is not ─────────────────────────────────────────────────────
 * It is a speed bump, and the two reasons are worth stating so nobody mistakes
 * it for a control:
 *
 *   · The key is a client-supplied string. `x-forwarded-for` is a request
 *     header, and its leftmost element is whatever the *client* wrote — an edge
 *     proxy appends to it. `clientIp` below prefers the headers a platform
 *     writes itself for exactly this reason, but on a host that sets none of
 *     them the identifier is forgeable and rotating it defeats the limit.
 *   · The state is per-process. Serverless runs many, and each keeps its own
 *     map, so the real allowance is LIMIT × however many instances are warm.
 *
 * A limiter that actually holds needs shared state (Upstash, Vercel KV, or the
 * platform's own WAF). What this must do until then is be *bounded*, which it
 * was not: an entry was created per distinct address and only ever replaced
 * when that same address came back after its window had expired. An address
 * that arrived once and never returned kept its entry for the life of the
 * process. Combined with a forgeable key, that is unbounded memory growth
 * driven by attacker-controlled input — the leak was the more serious half of
 * the bug, because a limiter that can be evaded merely fails to help, while one
 * that grows without limit takes the process down with it.
 *
 * Two bounds, because they cover different failures:
 *
 *   the sweep   removes windows that have already expired. Throttled to once a
 *               minute so the O(n) pass cannot be triggered per request, which
 *               keeps steady-state memory proportional to *live* windows rather
 *               than to every address ever seen.
 *   the cap     a flood of forged addresses produces thousands of entries that
 *               are all still live, so the sweep would delete none of them. The
 *               cap is what holds there. Map iterates in insertion order, so
 *               evicting from the front drops the entries nearest to expiring.
 *
 * The cap is itself evadable — flooding forged addresses can evict a real
 * attacker's entry — which is the same sentence as the first paragraph: shared
 * state is the fix, and this is the bound until there is some.
 */
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
/** Hard ceiling on tracked addresses. */
const MAX_TRACKED = 5_000;
/** Minimum gap between full sweeps of the map. */
const SWEEP_MS = 60 * 1000;
let lastSweep = 0;

function rateLimited(ip: string): boolean {
  const now = Date.now();

  if (now - lastSweep > SWEEP_MS) {
    lastSweep = now;
    for (const [key, entry] of hits) {
      if (now > entry.resetAt) hits.delete(key);
    }
  }

  // Still at the ceiling after sweeping: every window tracked is live, so make
  // room from the front rather than letting the map grow past the cap.
  if (hits.size >= MAX_TRACKED && !hits.has(ip)) {
    let toDrop = hits.size - MAX_TRACKED + 1;
    for (const key of hits.keys()) {
      if (toDrop-- <= 0) break;
      hits.delete(key);
    }
  }

  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > LIMIT;
}

/**
 * The best available identifier for the caller.
 *
 * Ordered by how much the value can be trusted, not by how common it is. The
 * first three are written by the edge itself and overwrite anything a client
 * sent, so they cannot be forged through it. `x-forwarded-for` is last and is
 * the one that used to be first: it is a list a client can seed, and taking its
 * leftmost element — which is the correct way to read the *original* client
 * address behind a well-behaved proxy — is also exactly the element a client
 * controls when there isn't one.
 */
function clientIp(request: Request): string {
  const h = request.headers;
  const candidate =
    h.get('cf-connecting-ip') ??
    h.get('x-vercel-forwarded-for') ??
    h.get('x-real-ip') ??
    h.get('x-forwarded-for')?.split(',')[0];
  return candidate?.trim() || 'unknown';
}

const asString = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Strips characters that could inject extra SMTP headers. */
const sanitizeHeader = (v: string) => v.replace(/[\r\n]+/g, ' ').slice(0, MAX.name);

const escapeHtml = (v: string) =>
  v.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );

export async function POST(request: Request) {
  const ip = clientIp(request);

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Too many messages from this address. Try again later.' },
      { status: 429 },
    );
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: 'Malformed request.' }, { status: 400 });
  }

  // Honeypot: accept and discard so the bot sees success and moves on.
  if (asString(body.company)) {
    return NextResponse.json({ ok: true, delivered: false });
  }

  const name = asString(body.name);
  const email = asString(body.email);
  const message = asString(body.message);

  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Name is required.';
  else if (name.length > MAX.name) errors.name = 'Name is too long.';

  if (!email) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email) || email.length > MAX.email)
    errors.email = 'Enter a valid email address.';

  if (!message) errors.message = 'Message is required.';
  else if (message.length < 10) errors.message = 'Message is too short.';
  else if (message.length > MAX.message) errors.message = 'Message is too long.';

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // No mail transport configured. Say so rather than faking delivery.
    console.warn('[contact] RESEND_API_KEY is not set — message was not delivered.');
    return NextResponse.json(
      {
        ok: false,
        error: `Mail delivery is not configured on this deployment. Please email ${profile.contact.email} directly.`,
        fallbackEmail: profile.contact.email,
      },
      { status: 503 },
    );
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    const from = process.env.CONTACT_FROM ?? 'Portfolio <onboarding@resend.dev>';
    // Where the message actually lands. Deliberately separate from the
    // *displayed* contact email (profile.contact.email): Resend's sandbox
    // mode (the shared onboarding@resend.dev sender, no verified domain)
    // will only deliver to the address that owns the API key, which is not
    // always the same inbox the site tells visitors to write to. Once a
    // domain is verified in Resend, set CONTACT_TO to the real address and
    // this starts delivering there — no code change needed.
    const to = process.env.CONTACT_TO ?? profile.contact.email;

    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `Portfolio message from ${sanitizeHeader(name)}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre>`,
    });

    if (error) {
      console.error('[contact] delivery failed:', error);
      return NextResponse.json(
        {
          ok: false,
          error: `Delivery failed. Please email ${profile.contact.email} directly.`,
          fallbackEmail: profile.contact.email,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, delivered: true });
  } catch (e) {
    console.error('[contact] unexpected error:', e);
    return NextResponse.json(
      {
        ok: false,
        error: `Something went wrong. Please email ${profile.contact.email} directly.`,
        fallbackEmail: profile.contact.email,
      },
      { status: 500 },
    );
  }
}
