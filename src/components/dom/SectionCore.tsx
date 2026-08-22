'use client';

import { frame, useMachine } from '@/store/machine';
import { useIsCompact } from '@/hooks/useViewport';
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
  const compact = useIsCompact();

  const active = subsystems.find((s) => s.id === activeSubsystem) ?? null;

  /* No audio call here: SoundBridge plays the engage cue off the
     `activeSubsystem` transition, so it sounds identical however the
     subsystem was selected. */
  const select = (id: string) => {
    setActiveSubsystem(activeSubsystem === id ? null : id);
    /*
     * Send the same activation wave the particle shader already understands,
     * so the machine answers a subsystem being inspected.
     *
     * The assembly line already did this on every milestone selection and the
     * contact form does it on submit; the core did not, which made this the
     * one control surface on the site where clicking something produced a
     * change in the DOM and no reaction at all behind it. One value, read by
     * the shader on its next frame, so the ripple and the click are
     * simultaneous rather than merely close.
     */
    frame.pulse = 1;
  };

  return (
    <Section id="core" label="Core">
      <Reveal>
        <Heading id="core" plain="Skills, tools and education">
          The Core
        </Heading>
        {/*
          A lead written for this section, not `profile.summary`.

          `profile.summary` is the CV's own paragraph and it belongs in the
          reveal, where it is the first thing anyone reads — and it is also the
          site's meta description, its JSON-LD description and its manifest
          description, so it has to stay general. Printing it again here meant
          the same 300 characters appeared twice in the visible page about one
          screen apart, which is the single largest piece of repetition the page
          had left.

          Every other section's lead says what that section is and what to do in
          it (see Projects, Experience, Contact). This one now does the same, so
          the reader arrives already knowing the panel below is interactive.
        */}
        <Lead>
          The stack I build with, grouped as subsystems — select one to inspect what it holds.
          Beneath it, the formal record: degree, coursework, and credentials.
        </Lead>
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
                    /* `items-start`, not `items-center`: once the chips wrap
                       to two or three rows the row gets tall, and centring
                       floated the LED and the +/− marker into the middle of
                       an otherwise empty column, disconnected from the label
                       they belong to. They anchor to the label's line instead. */
                    className="panel panel-interactive group flex w-full items-start gap-4 px-5 py-4 text-left"
                    style={{
                      borderColor: isActive ? 'var(--color-cyan)' : undefined,
                      boxShadow: isActive ? '0 0 30px -14px var(--color-cyan)' : undefined,
                    }}
                  >
                    <span
                      className={`led mt-1.5 ${isActive ? 'led-on' : 'led-idle'}`}
                      aria-hidden="true"
                    />
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
                            className="rounded border border-[#2b2f38] bg-[rgba(20,23,30,0.7)] px-1.5 py-0.5 font-[family-name:var(--font-code)] text-[0.62rem] leading-none normal-case tracking-normal text-[color:var(--color-ash)]"
                          >
                            {item}
                          </span>
                        ))}
                      </span>
                    </span>
                    <span
                      className="t-mono mt-0.5 text-xs text-[color:var(--color-ash-dim)] transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      {isActive ? '—' : '+'}
                    </span>
                  </button>

                  {/*
                    COMPACT: the description opens under the control that
                    asked for it.

                    In two columns, the detail panel sits beside the list and
                    the connection is obvious. In one column that panel lands
                    below all four subsystems — so on a phone, tapping a
                    subsystem appeared to do nothing at all: the text it
                    revealed was a full screen further down, out of sight,
                    with an "Idle — select a subsystem" placeholder occupying
                    the space in between. A disclosure keeps the answer
                    attached to the question.
                  */}
                  {compact && isActive && (
                    <div
                      id="subsystem-detail"
                      className="panel-flat mt-1.5 border-l-2 border-l-[color:var(--color-cyan)] p-5"
                    >
                      <p className="t-label emissive-cyan m-0">{sub.category}</p>
                      <p className="t-body mt-2.5 text-sm">{sub.description}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Reveal>

        {/* ---------- Detail readout ---------- */}
        <Reveal delay={160}>
          {/*
            The live region moved *inward*, onto the readout itself.

            It used to sit on this wrapper, which also contains the education
            block below — so a region announcing "the subsystem you just
            selected" was scoped to include a static block that has nothing to
            do with the selection.

            It is kept rather than removed, unlike the equivalent wrappers in
            Projects and Experience, and the difference is what drives the
            change: `activeSubsystem` moves only when someone presses one of the
            buttons above. That is a user-initiated change to a region on the
            other side of a two-column layout, which is the one case a polite
            live region is actually for. Nothing here is advanced by scrolling.
          */}
          <div>
            {/* Only in two columns. In one, this is the disclosure rendered
                inline under the selected subsystem above. */}
            {!compact && (
              <Panel className="p-6">
                <div id="subsystem-detail" aria-live="polite">
                  {active ? (
                    <>
                      <p className="t-label emissive-cyan m-0">{active.category}</p>
                      <h3 className="t-mono mt-2 text-lg">{active.label}</h3>
                      <p className="t-body mt-3 text-sm">{active.description}</p>
                      <ul className="mt-5 flex list-none flex-wrap gap-2 p-0">
                        {active.items.map((item) => (
                          <li
                            key={item}
                            className="panel-flat px-3 py-1.5 font-[family-name:var(--font-code)] text-xs text-[color:var(--color-ceramic)]"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <>
                      <p className="t-label m-0">Idle</p>
                      <p className="t-body mt-3 text-sm">
                        Select a subsystem to read what it covers.
                      </p>
                    </>
                  )}
                </div>
              </Panel>
            )}

            {/*
              ---------- Education ----------

              No CGPA row. The figure is the hero's lead statistic and an
              animated counter in Impact; a third, quieter printing here added
              nothing except the impression of a longer page.
            */}
            <Panel className={`p-6 ${compact ? '' : 'mt-4'}`}>
              <p className="t-label emissive-amber m-0">Education</p>
              <h3 className="t-mono mt-2 text-base">{profile.education.institution}</h3>
              <dl className="mt-4 m-0">
                <Readout k="Degree" v={profile.education.degree} />
                <Readout
                  k="Period"
                  v={`${profile.education.start} — ${profile.education.end}`}
                />
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
