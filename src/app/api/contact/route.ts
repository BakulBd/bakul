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

/** Simple per-IP rate limit. Resets with the process; enough to blunt abuse. */
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > LIMIT;
}

const asString = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Strips characters that could inject extra SMTP headers. */
const sanitizeHeader = (v: string) => v.replace(/[\r\n]+/g, ' ').slice(0, MAX.name);

const escapeHtml = (v: string) =>
  v.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

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
