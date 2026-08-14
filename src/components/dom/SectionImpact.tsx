'use client';

import { metrics, impactGroups } from '@/lib/data/impact';
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
    <Section id="impact" label="Impact" index="05">
      <Reveal>
        <Heading id="impact">Impact</Heading>
        <Lead>
          Verified figures only. Each number below is traceable to the source named beneath it —
          coursework, community roles, or a public profile.
        </Lead>
      </Reveal>

      {/* ---------- Counters ---------- */}
      {/* Five metrics — grid-cols-5 at the widest breakpoint keeps them in one
          clean row instead of leaving a lone orphan card on a 4-up grid. */}
      <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((m, i) => (
          <Reveal key={m.id} delay={i * 70}>
            <Panel className="h-full p-6">
              {/* Five columns at the widest breakpoint means less width per
                  card than the old four-up grid budgeted for — a long suffix
                  like " semesters" genuinely doesn't fit the old 2.9rem cap
                  and was being silently clipped by the panel's own
                  overflow:hidden. break-words is a safety net for any future
                  suffix length; the smaller cap is the real fix. */}
              <p className="t-display break-words text-[clamp(1.9rem,4vw,2.6rem)] emissive-amber">
                <Counter value={m.value} precision={m.precision} suffix={m.suffix} />
              </p>
              <h3 className="t-mono mt-3 text-xs">{m.label}</h3>
              <p className="t-body mt-2 text-xs">{m.detail}</p>
              <p className="t-label mt-4 border-t border-[#24272f] pt-3">Source — {m.source}</p>
            </Panel>
          </Reveal>
        ))}
      </div>

      {/* ---------- Grouped detail ---------- */}
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {impactGroups.map((group, gi) => (
          <Reveal key={group.id} delay={120 + gi * 70}>
            <Panel className="h-full p-6">
              <h3 className="t-label emissive-cyan m-0">{group.label}</h3>
              <ul className="mt-5 list-none space-y-4 p-0">
                {group.entries.map((entry) => (
                  <li key={entry.label} className="border-t border-[#24272f] pt-4">
                    <p className="t-mono m-0 text-xs">{entry.label}</p>
                    <p className="t-body m-0 mt-1.5 text-xs">{entry.detail}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          </Reveal>
        ))}
      </div>

      <Reveal delay={300}>
        <p className="t-label mt-7 normal-case tracking-normal text-[color:var(--color-ash-dim)]">
          Not shown, because they do not exist yet: production user counts, API traffic, uptime
          figures, published research, or industry awards.
        </p>
      </Reveal>
    </Section>
  );
}
