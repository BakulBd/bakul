'use client';

/*
 * `impactGroups` is deliberately NOT imported.
 *
 * Its three groups restated facts this page already carries: CGPA and the
 * Vice-Chancellor's Award appear in the hero plate and in the counters below,
 * Code in Place and the Codeforces count appear in Core's credentials, and
 * "three independently built projects" restated the entire Projects section.
 * Repetition is what made this page feel long — not the amount it has to say.
 *
 * The export stays in the data module because `llms.txt` consumes it, so the
 * machine-readable surface keeps full fidelity while the human-facing page
 * states each fact once.
 */
import { metrics } from '@/lib/data/impact';

import { Heading, Lead, Reveal, Section, Panel, Counter } from './Primitives';

/**
 * IMPACT (§12) — control centre.
 *
 * Every figure carries its source in the markup. There are no user counts, no
 * request volumes, no uptime percentages, and no performance deltas, because
 * none of those exist for this work. A number without a source does not ship.
 */
export function SectionImpact() {
  return (
    <Section id="impact" label="Impact">
      <Reveal>
        <Heading id="impact">Impact</Heading>
        <Lead>
          Verified figures only. Each number below is traceable to the source named beneath it —
          coursework, community roles, or a public profile.
        </Lead>
      </Reveal>

      {/* ---------- Counters ---------- */}
      {/*
        Five metrics in one row — but only where a row of five has the width to
        be one. `grid-cols-5` was set at `lg`, and at 1024px that divides an
        892px content column into 165.6px cells, or a 117.6px content box once
        the panel's own padding is taken out. Five headline figures, five
        labels, five two-line descriptions and five source lines were being
        asked to live in a column narrower than the text inside it: the CGPA
        wrapped outright, and `6 sem` cleared its cell by about 8px, which is
        not clearance so much as coincidence.

        The container caps at 1240px, so cells stop widening there — 208.8px,
        a 160.8px content box — and that is the width the five-up row was
        actually designed against. `xl` is where the layout first has it. From
        1024 to 1279 the two-column tablet layout carries on instead, which is
        the same arrangement already shipping from 768px up rather than a third
        one invented for a 256px band.

        The first metric leads. Five identical cards in a row state that every
        figure here carries equal weight, and they do not: the CGPA is the one
        number a recruiter is scanning this section for, and it was rendered at
        exactly the same size as the count of problems solved on Codeforces.
        Below the five-up breakpoint it takes the full row and a larger
        setting; at five-up the row's own geometry does the ordering and it
        returns to a single cell.
      */}
      <div className="mt-11 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        {metrics.map((m, i) => {
          const lead = i === 0;
          return (
            <Reveal
              key={m.id}
              delay={i * 70}
              className={lead ? 'col-span-2 xl:col-span-1' : ''}
            >
              <Panel className="h-full p-5 sm:p-6">
                {/* Five columns means less width per card than the old four-up
                    grid budgeted for — a long suffix like " semesters"
                    genuinely doesn't fit the old 2.9rem cap and was being
                    silently clipped by the panel's own overflow:hidden.
                    break-words is a safety net for any future suffix length;
                    the smaller cap and `Counter`'s subordinate suffix are the
                    real fixes.

                    The lead's size was written `clamp(2.6rem, 11vw, 2.6rem)`,
                    where the floor and the ceiling are the same number — so the
                    preferred value could never be chosen and the whole
                    expression was a fixed 2.6rem wearing the syntax of a fluid
                    one. That mattered, because this card is the only one that
                    spans the full row below the five-up breakpoint: its box
                    grows from ~240px of content at 320px to ~900px at 1279px
                    while its figure stayed the same height, so by tablet width
                    the "lead" was a small number in a large panel. Now it
                    actually tracks the width it is given, and `xl:` pins it
                    back to 2.6rem at five-up where, as above, the row's
                    geometry does the ordering and every card is the same size
                    on purpose. */}
                <p
                  className={`t-display break-words emissive-amber ${
                    lead
                      ? 'text-[clamp(2.6rem,7vw,3.6rem)] xl:text-[2.6rem]'
                      : 'text-[clamp(1.65rem,4vw,2.6rem)]'
                  }`}
                >
                  <Counter value={m.value} precision={m.precision} suffix={m.suffix} />
                </p>
                <h3 className="t-mono mt-3 text-xs">{m.label}</h3>
                <p className="t-body mt-2 text-xs">{m.detail}</p>
                <p className="t-label mt-4 border-t border-[#24272f] pt-3">Source — {m.source}</p>
              </Panel>
            </Reveal>
          );
        })}
      </div>

      {/* Follows the last counter (delay 280) rather than the removed groups. */}
      <Reveal delay={340}>
        {/* Capped, like every other paragraph on the page.

            This one had no `max-width` and sat under a full-width counter grid,
            so it measured 1108px — around 137 characters a line, comfortably
            the longest measure on the site and roughly twice what is
            comfortable to read. It is also the most important sentence in the
            section: the one that says which numbers are deliberately absent,
            which is the claim the whole section's credibility rests on. */}
        <p className="t-label mt-7 max-w-[var(--measure)] normal-case tracking-normal text-[color:var(--color-ash-dim)]">
          Not shown, because they do not exist yet: production user counts, API traffic, uptime
          figures, published research, or industry awards.
        </p>
      </Reveal>
    </Section>
  );
}
