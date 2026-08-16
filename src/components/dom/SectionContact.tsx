'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Mail, Github, Linkedin, Phone, MapPin, Download } from 'lucide-react';
import { frame, useMachine } from '@/store/machine';
import { audio } from '@/lib/audio/engine';
import { profile } from '@/lib/data/profile';
import { Heading, Lead, Reveal, Section, Panel } from './Primitives';

const CHANNEL_ICON = { Email: Mail, GitHub: Github, LinkedIn: Linkedin, Phone: Phone } as const;

type Phase = 'idle' | 'sending' | 'sent' | 'error';

/**
 * CONTACT (§15) — transmission terminal.
 *
 * A real, semantic, validated HTML form. The packet animation runs alongside
 * submission; it never gates it, and it never fakes a result. Failures are
 * reported plainly with a direct email fallback.
 */
export function SectionContact() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const audioEnabled = useMachine((s) => s.audioEnabled);
  const formRef = useRef<HTMLFormElement>(null);

  /*
   * The outcome gets its own cue, not just the send.
   *
   * A form that plays a confident sound the moment you press the button and
   * then says nothing when the request fails has told you the opposite of what
   * happened. `transmit` fires on despatch; this resolves it — arrival or
   * failure — so the audio and the notice agree.
   */
  useEffect(() => {
    if (!audioEnabled) return;
    if (phase === 'sent') audio.play('activate');
    else if (phase === 'error') audio.play('error');
  }, [phase, audioEnabled]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (phase === 'sending') return;

    const data = new FormData(e.currentTarget);
    const payload = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      message: String(data.get('message') ?? ''),
      company: String(data.get('company') ?? ''),
    };

    setPhase('sending');
    setErrors({});
    setNotice('');

    // The packet travelling down the optical channel is the send itself.
    frame.pulse = 1;
    if (audioEnabled) audio.play('transmit');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok && json.ok) {
        setPhase('sent');
        setNotice('Message received. I will reply to the address you provided.');
        formRef.current?.reset();
        return;
      }

      if (json.errors) {
        setErrors(json.errors);
        setPhase('error');
        setNotice('Check the highlighted fields.');
        return;
      }

      setPhase('error');
      setNotice(json.error ?? 'Transmission failed.');
    } catch {
      setPhase('error');
      setNotice(
        `Could not reach the server. Please email ${profile.contact.email} directly.`,
      );
    }
  }

  const sending = phase === 'sending';

  return (
    <Section id="contact" label="Transmission" index="08">
      <Reveal>
        <Heading id="contact">Transmission</Heading>
        <Lead>
          Open to graduate research opportunities, collaboration, and interesting problems. The form
          sends a real message; every direct channel is listed beside it.
        </Lead>
      </Reveal>

      <div className="mt-11 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        {/* ---------- Form ---------- */}
        <Reveal delay={80}>
          <Panel className="p-6 md:p-8">
            <form ref={formRef} onSubmit={onSubmit} noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="t-label">
                    Name *
                  </label>
                  <input
                    id="c-name"
                    name="name"
                    required
                    maxLength={120}
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'c-name-err' : undefined}
                    className="field mt-2"
                  />
                  {errors.name && (
                    <p id="c-name-err" className="t-label mt-1.5" style={{ color: 'var(--color-alert)' }}>
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="c-email" className="t-label">
                    Email *
                  </label>
                  <input
                    id="c-email"
                    name="email"
                    type="email"
                    required
                    maxLength={200}
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'c-email-err' : undefined}
                    className="field mt-2"
                  />
                  {errors.email && (
                    <p id="c-email-err" className="t-label mt-1.5" style={{ color: 'var(--color-alert)' }}>
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="c-message" className="t-label">
                  Message *
                </label>
                <textarea
                  id="c-message"
                  name="message"
                  required
                  rows={6}
                  minLength={10}
                  maxLength={4000}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'c-message-err' : undefined}
                  className="field mt-2 resize-y"
                />
                {errors.message && (
                  <p id="c-message-err" className="t-label mt-1.5" style={{ color: 'var(--color-alert)' }}>
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Honeypot — visually and semantically hidden from real users. */}
              <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0">
                <label htmlFor="c-company">Company (leave blank)</label>
                <input id="c-company" name="company" tabIndex={-1} autoComplete="off" />
              </div>

              {/* ---------- Optical channel ---------- */}
              <div className="mt-7">
                <div className="relative h-[3px] w-full overflow-hidden bg-[#1a1c23]">
                  <div
                    className="absolute inset-y-0 w-[26%]"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, var(--color-cyan), transparent)',
                      boxShadow: '0 0 14px var(--color-cyan)',
                      // The packet only moves while a real request is in flight.
                      animation: sending ? 'packet 0.9s linear infinite' : 'none',
                      opacity: sending ? 1 : 0,
                      transition: 'opacity 0.3s',
                    }}
                  />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <button type="submit" className="btn btn-primary" disabled={sending}>
                    <Send aria-hidden="true" className={sending ? 'animate-pulse' : ''} />
                    {sending ? 'Transmitting…' : 'Transmit Message'}
                  </button>

                  <p
                    role="status"
                    aria-live="polite"
                    className="t-label m-0 normal-case tracking-normal"
                    style={{
                      color:
                        phase === 'sent'
                          ? 'var(--color-cyan)'
                          : phase === 'error'
                            ? 'var(--color-alert)'
                            : 'var(--color-ash)',
                    }}
                  >
                    {notice}
                  </p>
                </div>
              </div>
            </form>
          </Panel>
        </Reveal>

        {/* ---------- Direct channels ---------- */}
        <Reveal delay={140}>
          <Panel className="p-6 md:p-8">
            <p className="t-label emissive-cyan m-0">Direct channels</p>
            <ul className="mt-5 list-none space-y-4 p-0">
              {[
                { label: 'Email', value: profile.contact.email, href: `mailto:${profile.contact.email}` },
                { label: 'GitHub', value: profile.contact.githubHandle, href: profile.contact.github },
                { label: 'LinkedIn', value: profile.contact.linkedinHandle, href: profile.contact.linkedin },
                { label: 'Phone', value: profile.contact.phone, href: `tel:${profile.contact.phone}` },
              ].map((c) => {
                const Icon = CHANNEL_ICON[c.label as keyof typeof CHANNEL_ICON];
                return (
                  <li key={c.label} className="flex items-start gap-3 border-t border-[#24272f] pt-4">
                    <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-ash-dim)]" />
                    <div>
                      <p className="t-label m-0">{c.label}</p>
                      <a
                        href={c.href}
                        target={c.href.startsWith('http') ? '_blank' : undefined}
                        rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="font-[family-name:var(--font-fira)] text-sm text-[color:var(--color-ceramic)] underline decoration-[#33373f] underline-offset-4 transition-colors hover:text-[color:var(--color-cyan)] hover:decoration-[color:var(--color-cyan)]"
                      >
                        {c.value}
                      </a>
                    </div>
                  </li>
                );
              })}
              <li className="flex items-start gap-3 border-t border-[#24272f] pt-4">
                <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-ash-dim)]" />
                <div>
                  <p className="t-label m-0">Location</p>
                  <p className="t-body m-0 mt-1 text-sm">{profile.location}</p>
                </div>
              </li>
            </ul>

            <a href={profile.contact.cv} download className="btn mt-7 w-full justify-center">
              <Download aria-hidden="true" />
              Download CV (PDF)
            </a>
          </Panel>
        </Reveal>
      </div>

      {/* ---------- Footer ---------- */}
      <Reveal delay={220}>
        <footer className="mt-14 border-t border-[#1a1c23] pt-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="t-label m-0">
              {profile.name} — {profile.status}
            </p>
            <p className="t-label m-0">
              Built with Next.js, React Three Fiber, and WebGL
            </p>
          </div>
        </footer>
      </Reveal>

    </Section>
  );
}
