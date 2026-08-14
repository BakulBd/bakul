'use client';

import { useMachine } from '@/store/machine';
import { audio } from '@/lib/audio/engine';
import { profile, subsystems, credentials } from '@/lib/data/profile';
import { Heading, Lead, Reveal, Section, Readout, Panel } from './Primitives';

/**
 * CORE (§6) — the processor as engineering identity.
 *
 * Subsystems are selectable, and selecting one opens a readable HTML panel.
 * The important text lives in the DOM, never inside the 3D scene.
 */
export function SectionCore() {
  const activeSubsystem = useMachine((s) => s.activeSubsystem);
  const setActiveSubsystem = useMachine((s) => s.setActiveSubsystem);
  const audioEnabled = useMachine((s) => s.audioEnabled);

  const active = subsystems.find((s) => s.id === activeSubsystem) ?? null;

  const select = (id: string) => {
    const next = activeSubsystem === id ? null : id;
    setActiveSubsystem(next);
    if (next && audioEnabled) audio.play('relay');
  };

  return (
    <Section id="core" label="Core" index="01">
      <Reveal>
        <Heading id="core">The Core</Heading>
        <Lead>{profile.summary}</Lead>
      </Reveal>

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ---------- Subsystem selector ---------- */}
        <Reveal delay={80}>
          <h3 className="t-label mb-4">Subsystems — select to inspect</h3>
          <ul className="m-0 list-none space-y-2 p-0">
            {subsystems.map((sub) => {
              const isActive = activeSubsystem === sub.id;
              return (
                <li key={sub.id}>
                  <button
                    type="button"
                    onClick={() => select(sub.id)}
                    aria-expanded={isActive}
                    aria-controls="subsystem-detail"
                    className="panel panel-interactive group flex w-full items-center gap-4 px-5 py-4 text-left"
                    style={{
                      borderColor: isActive ? 'var(--color-cyan)' : undefined,
                      boxShadow: isActive ? '0 0 30px -14px var(--color-cyan)' : undefined,
                    }}
                  >
                    <span className={`led ${isActive ? 'led-on' : 'led-idle'}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span
                        className="t-mono block text-xs"
                        style={{ color: isActive ? 'var(--color-cyan)' : 'var(--color-ceramic)' }}
                      >
                        {sub.label}
                      </span>
                      {/*
                        Chips, not a separator-joined run-on.
                        Five technologies joined with dots rendered as five
                        lines of spaced uppercase monospace on a phone — a
                        wall of text that buried the subsystem name above it.
                        Chips give each item its own edge, wrap cleanly, and
                        stay readable at the label's small size.
                      */}
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {sub.items.map((item) => (
                          <span
                            key={item}
                            className="rounded border border-[#2b2f38] bg-[rgba(20,23,30,0.7)] px-1.5 py-0.5 font-[family-name:var(--font-fira)] text-[0.62rem] leading-none normal-case tracking-normal text-[color:var(--color-ash)]"
                          >
                            {item}
                          </span>
                        ))}
                      </span>
                    </span>
                    <span
                      className="t-mono text-xs text-[color:var(--color-ash-dim)] transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      {isActive ? '—' : '+'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Reveal>

        {/* ---------- Detail readout ---------- */}
        <Reveal delay={160}>
          <div id="subsystem-detail" aria-live="polite">
            <Panel className="p-6">
              {active ? (
                <>
                  <p className="t-label emissive-cyan m-0">{active.category}</p>
                  <h3 className="t-mono mt-2 text-lg">{active.label}</h3>
                  <p className="t-body mt-3 text-sm">{active.description}</p>
                  <ul className="mt-5 flex list-none flex-wrap gap-2 p-0">
                    {active.items.map((item) => (
                      <li
                        key={item}
                        className="panel-flat px-3 py-1.5 font-[family-name:var(--font-fira)] text-xs text-[color:var(--color-ceramic)]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <p className="t-label m-0">Idle</p>
                  {/* Short by design: this panel is a full screen of height on
                      a phone, and it previously spent all of it explaining
                      that nothing was hidden — which the chips above already
                      demonstrate by simply showing everything. */}
                  <p className="t-body mt-3 text-sm">
                    Select a subsystem to read what it covers.
                  </p>
                </>
              )}
            </Panel>

            {/* ---------- Education ---------- */}
            <Panel className="mt-4 p-6">
              <p className="t-label emissive-amber m-0">Education</p>
              <h3 className="t-mono mt-2 text-base">{profile.education.institution}</h3>
              <dl className="mt-4 m-0">
                <Readout k="Degree" v={profile.education.degree} />
                <Readout
                  k="Period"
                  v={`${profile.education.start} — ${profile.education.end}`}
                />
                <Readout k="CGPA" v={profile.education.cgpa} />
                <Readout k="Coursework" v={profile.education.coursework.join(', ')} />
                <Readout k="Location" v={profile.education.location} />
              </dl>
            </Panel>

            {/* ---------- Credentials ---------- */}
            <Panel className="mt-4 p-6">
              <p className="t-label emissive-amber m-0">Certifications &amp; Awards</p>
              <ul className="mt-4 m-0 list-none space-y-3 p-0">
                {credentials.map((c) => (
                  <li key={c.label} className="border-t border-[#24272f] pt-3">
                    <p className="t-mono m-0 text-sm">{c.label}</p>
                    <p className="t-body m-0 mt-1 text-xs">
                      {c.issuer}
                      {c.detail ? ` — ${c.detail}` : ''}
                      {c.year ? ` (${c.year})` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
