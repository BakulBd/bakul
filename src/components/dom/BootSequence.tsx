'use client';

import { useEffect, useState } from 'react';
import { Power, ArrowRight, Download, Github } from 'lucide-react';
import { frame, useMachine } from '@/store/machine';
import { profile, AWARD_SEMESTERS } from '@/lib/data/profile';
import { projects } from '@/lib/data/projects';
import {
  BOOT_STAGES,
  BUS_TRACES,
  MEMORY_SLOTS,
  RACK_MODULE_COUNT,
  TURBINE_BLADES,
  TURBINE_PIVOTS,
  type Group,
} from '@/components/machine/lib/blueprint';

/**
 * FIRST 10 SECONDS (§3) — power-on self test.
 *
 * Presented as a machine's POST screen: each subsystem is probed in turn and
 * reports back, the way a computer enumerates its hardware before handing
 * over to the OS. That framing is doing real work rather than being a
 * costume — the visitor learns what the machine is made of while they wait
 * for it, instead of watching a decorative progress bar.
 *
 * Critically: this never traps the visitor. The skip link, the quick-nav rail,
 * and the command palette are all live during standby, and scrolling powers the
 * system automatically — so a recruiter is never held at a gate.
 *
 * ── ONE SCREEN IN THREE STATES, NOT THREE SCREENS ───────────────────────
 * This used to be two overlapping compositions — a "standby" block and a
 * "reveal" block — that cross-faded into one another, each carrying its own
 * copy of the name, the title and the disciplines. Four things followed from
 * that, and every one of them was on screen:
 *
 *   1. The name left the screen entirely for the second half of the boot. The
 *      standby block faded on `1 - power * 1.8`, which reaches zero at power
 *      0.556, and the reveal only became visible at power 1. For the 44% of the
 *      ramp in between, the most important word on the site was nowhere — on
 *      the one screen written so that the name leads from the first frame.
 *   2. The faded block kept its box. `opacity: 0` is not `display: none`, so
 *      roughly 400px of invisible standby markup went on being centred by this
 *      flex column while the POST panel — by then the only thing visible — was
 *      pushed down and off-centre by half a screen. That is the same defect
 *      once fixed for the reveal block, still live for the POST phase.
 *   3. The rating plate's energised state was never seen at rest. `is-live`
 *      turns the figures amber, and the plate was destroyed the moment the
 *      machine reached ONLINE — so amber existed only mid-ramp, for about a
 *      second, while the plate's own note in globals.css describes it as "the
 *      same three figures energised once the system is online".
 *   4. The reveal's entrance could not run. It transitioned `opacity` and
 *      `transform` while simultaneously switching `position` from absolute to
 *      relative and dropping an `sr-only` clip — neither of which animates — so
 *      the declared fade was in practice a pop.
 *
 * The composition is now singular and continuous. The identity, the plate and
 * the status line are mounted once and never re-created; only the block beneath
 * them changes — power button, then POST readout, then the summary and the
 * calls to action. Nothing cross-fades to nothing, nothing invisible holds a
 * box, and the plate energising *is* the transition rather than a detail thrown
 * away at the end of one.
 *
 * It also retires the duplicate heading. There used to be a visual name marked
 * `aria-hidden` and a real `<h1>` held in `sr-only` until the boot finished;
 * there is now one heading, visible from the first frame and in the accessible
 * tree throughout.
 */

/**
 * THE RATING PLATE — the three figures the first screen has to carry.
 *
 * Derived, never retyped. `education.cgpa` is the CV's own string, the award
 * count is the same constant that writes the credential's own sentence, and the
 * shipped figure is the length of the project list — so the plate cannot drift
 * from the sections it summarises, and adding a fourth project updates the hero
 * for free.
 *
 * Three is the limit on purpose. A fourth figure would push the strip to two
 * rows on a laptop and turn a glance into a read, and the whole argument for
 * putting proof this early is that it costs the visitor nothing.
 */
const cgpa = profile.education.cgpa.split(' / ');

const PLATE: { fig: string; unit?: string; key: string }[] = [
  { fig: cgpa[0], unit: `/ ${cgpa[1]}`, key: 'CGPA' },
  {
    // "six academic semesters" is prose in the credential; the plate needs the
    // numeral, so the count comes from the same sentence via its own constant
    // rather than being asserted twice.
    fig: String(AWARD_SEMESTERS),
    unit: '×',
    key: "Vice-Chancellor's Award",
  },
  { fig: String(projects.length), key: 'Projects shipped' },
];

/**
 * What each subsystem reports. Keyed by the same `Group` the 3D scene lights,
 * and the counts are read from the blueprint's own constants rather than
 * retyped — a POST screen that claims four rails while the machine renders
 * six is worse than no POST screen at all.
 */
const STAGE_REPORT: Record<Group, { device: string; detail: string }> = {
  board: { device: 'BOARD', detail: 'mainboard + power rails' },
  core: { device: 'CPU', detail: 'processor die + heatsink' },
  memory: { device: 'MEM', detail: `${MEMORY_SLOTS} DIMM slots populated` },
  bus: { device: 'BUS', detail: `${BUS_TRACES.length} data lanes routed` },
  gpu: { device: 'GPU', detail: 'graphics card in slot' },
  cooling: { device: 'FAN', detail: `${TURBINE_PIVOTS.length} fans × ${TURBINE_BLADES} blades` },
  storage: { device: 'DISK', detail: `${RACK_MODULE_COUNT} project bays mounted` },
  monitor: { device: 'VIDEO', detail: 'BAKUL OS — display online' },
};

export function BootSequence() {
  const powerState = useMachine((s) => s.powerState);
  const beginActivation = useMachine((s) => s.beginActivation);

  const [power, setPower] = useState(0);

  // Mirror the frame-loop power value into React at a low rate. Reading it
  // every frame in state would defeat the point of the frame singleton, so we
  // sample on an interval instead — the DOM only needs coarse resolution here.
  useEffect(() => {
    if (powerState === 'STANDBY') return;

    /*
     * ONLINE means the ramp has finished, so pin the value and arm nothing.
     *
     * This effect's only dependency is `powerState`, which meant *reaching*
     * ONLINE re-ran it and started a fresh interval — one that nothing ever
     * cleared, because the state it depends on never changes again. A 90ms
     * sample loop and the React state update behind it therefore ran for the
     * whole visit, eleven times a second, to keep re-reporting a number that
     * had stopped moving seconds earlier.
     *
     * Pinning to 1 also fixes the no-WebGL path. There, `Experience` completes
     * the activation immediately because there is no render loop to advance
     * the ramp — so `frame.power` stays at 0 forever, and the plate below would
     * sit etched under an interface that has already handed over. ONLINE is the
     * machine's own statement that power is up; taking it at its word is more
     * reliable than sampling a loop that may not be running.
     */
    if (powerState === 'ONLINE') {
      setPower(1);
      return;
    }

    const id = window.setInterval(() => setPower(frame.power), 90);
    return () => window.clearInterval(id);
  }, [powerState]);

  /* SoundBridge plays the power-up off the state transition, so clicking this
     button and simply scrolling to activate now sound the same — they are the
     same event as far as a visitor is concerned. */
  const handlePower = () => {
    beginActivation();
  };

  const standby = powerState === 'STANDBY';
  const online = powerState === 'ONLINE';
  /* The ramp is running. Named rather than re-derived at each use, because
     `!standby && !online` reads as a gap between two states instead of as the
     phase it actually is. */
  const booting = !standby && !online;
  const pct = Math.round(power * 100);

  /*
   * The furthest stage the ramp has crossed — the subsystem being brought up
   * right now. `BOOT_STAGES` is sorted and its first threshold is 0, so this is
   * index 0 from the first frame of the ramp and never falls back.
   *
   * Used only by the screen-reader narration below. The visual readout does not
   * need it: each row decides for itself whether it has been crossed.
   */
  const liveIndex = BOOT_STAGES.reduce((acc, s, i) => (power >= s.at ? i : acc), 0);
  const live = STAGE_REPORT[BOOT_STAGES[liveIndex].group];

  /*
   * The status line, in all three states.
   *
   * One element reporting the machine's actual condition, rather than a
   * standby-only label that disappeared along with the block holding it. The
   * LED walks unlit → amber → cyan, which is the page's whole narrative —
   * mechanical at the start, computational at the end — compressed into one dot.
   *
   * Modifier classes rather than inline colours, because `.led` already declares
   * a `--dur-3` transition on exactly the two properties that change, so the
   * walk animates itself and the three states stay named in one place.
   */
  const status = standby
    ? { led: 'led-idle', label: 'System Standby' }
    : booting
      ? { led: 'led-amber', label: 'Power-On Self Test' }
      : { led: 'led-on', label: 'BAKUL OS — Online' };

  /*
   * The second status line. Scene-setting while the machine is dark, and the
   * location once it is up — a recruiter scanning the first screen wants "where
   * is this person" answered before they scroll, and at ONLINE the machine's
   * condition is already stated by the LED and label directly above, so
   * repeating it here would spend a line on nothing.
   */
  const note = standby
    ? `${profile.location} · Computing engine offline`
    : booting
      ? 'Bringing subsystems online…'
      : profile.location;

  return (
    /*
     * `dvh`, matching the section around it.
     *
     * `min-h-screen` is `100vh`, which on mobile Safari and Chrome means the
     * viewport with the URL bar hidden — taller than what is actually on
     * screen at load. Nested inside a section already capped at `100dvh`,
     * that pushed the bottom of this block (the Power System button, the
     * whole reason the first screen exists) below the fold on exactly the
     * devices where the first screen matters most.
     *
     * `min-h` rather than `h` is also what makes the online composition safe on
     * a short phone: the box grows to fit its content instead of centring an
     * overflowing column, so nothing is ever clipped above the section's top
     * edge where it could not be scrolled back to.
     *
     * The bottom padding is clearance for the mobile nav: this block is
     * vertically centred, and without it the centring is computed against a
     * box whose last 56px are covered by the bar.
     */
    <div className="relative flex min-h-[100dvh] flex-col justify-center pb-[calc(var(--nav-h)+1rem)] lg:pb-0">
      {/* ---------- IDENTITY — mounted once, in every state ---------- */}
      <div className="flex items-center gap-3">
        <span className={`led ${status.led}`} aria-hidden="true" />
        <p className="t-label m-0">{status.label}</p>
      </div>

      {/*
        The name leads from the very first frame, and keeps leading.

        This is the document's only <h1>. It used to be duplicated — a visual
        copy marked `aria-hidden` for standby and a real heading kept in
        `sr-only` until the boot finished — which meant the heading a crawler
        and a screen reader were given was, for several seconds, not the text a
        sighted visitor was looking at. One element serves both now.
      */}
      <h1 className="t-display mt-5 text-[clamp(3rem,13vw,8.5rem)] leading-[0.92]">
        {profile.name.split(' ')[0]}
        <span className="text-[color:var(--color-ash)]"> {profile.name.split(' ')[1]}</span>
      </h1>

      <p className="t-mono mt-4 text-[clamp(0.85rem,2.2vw,1.15rem)] emissive-cyan">
        {profile.title}
      </p>

      {/*
        The disciplines belong on the first screen in every state.

        A phone's standby screen was the name, the job title, a status line
        and a button — four short lines centred in an 844px viewport, with
        roughly 460px of empty space above them and 500px below. Nothing was
        wrong with any single element; there was simply not enough on screen
        to compose. These four words are already written, already true, and
        are exactly what a visitor wants next after the title.
      */}
      <p className="t-label mt-4">{profile.disciplines.join(' • ')}</p>

      {/*
        Proof, before the first scroll — and still there after it.

        See the `.plate` block in globals.css for why this is a stamped rating
        plate rather than three cards. Its one behaviour is that the figures are
        etched while the machine is dark and energise with it, and `is-live` is
        driven from the same power state every other emissive surface on this
        screen reads — so the plate comes up *with* the machine instead of
        announcing itself separately.

        It stays mounted through ONLINE. Previously it was destroyed at exactly
        the moment it finished energising, which threw away both the payoff of
        that transition and the strongest three facts on the page at the moment
        the visitor first has calls to action to act on.

        `aria-hidden` because this is a visual summary of facts the document
        already states — the CGPA in the summary paragraph below, the award in
        the credentials list, the project count in the projects section — and a
        screen reader handed "3.96 / 4.00 CGPA, 6 ×, 3" out of context is given
        a riddle rather than a résumé.
      */}
      <div aria-hidden="true" className={`plate mt-7 max-w-[34rem]${standby ? '' : ' is-live'}`}>
        {PLATE.map((p) => (
          <div key={p.key} className="plate__cell">
            <p className="plate__fig m-0">
              {p.fig}
              {p.unit && <span className="plate__unit">{p.unit}</span>}
            </p>
            <p className="plate__key m-0">{p.key}</p>
          </div>
        ))}
      </div>

      <p className="t-label mt-6 text-[color:var(--color-ash-dim)]">{note}</p>

      {/* ---------- STANDBY — the invitation ---------- */}
      {standby && (
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <button type="button" onClick={handlePower} className="btn btn-primary">
            <Power aria-hidden="true" />
            Power System
          </button>
          <p className="t-label m-0">or scroll to activate</p>
        </div>
      )}

      {/* ---------- BOOTING — the readout ---------- */}
      {booting && (
        <>
          {/*
            The narration, and the only live region on this screen.

            The panel below used to be `role="status" aria-live="polite"` in its
            entirety, while its contents — a percentage and eight rows — were
            re-rendered eleven times a second off the sampling interval. A
            polite region that mutates at that rate is not an announcement, it
            is a queue that never drains, and it was the only thing a screen
            reader had to listen to during the boot.

            This says the same thing at the rate it actually changes: eight
            times, once per subsystem.
          */}
          <p className="sr-only" role="status" aria-live="polite">
            {live.device} online — {live.detail}
          </p>

          <div
            /* `bracketed` draws registration marks at the four corners — the
               convention for a measured readout on a technical drawing, and the
               detail that makes this read as an instrument rather than a card. */
            className="panel-flat bracketed mt-8 w-full max-w-[34rem] p-5 sm:p-6"
          >
            <div className="flex items-baseline justify-between gap-4 border-b border-[#24272f] pb-3">
              <span className="t-label emissive-amber">BAKUL BIOS — POST</span>
              <span className="font-[family-name:var(--font-code)] text-xs tabular-nums text-[color:var(--color-ash)]">
                {pct}%
              </span>
            </div>

            {/* Redundant to assistive tech: the percentage beside it is the
                same value as text, so the bar is the sighted rendering of a
                fact already stated rather than a second source of it. */}
            <div className="mt-3 h-[3px] w-full bg-[#1a1c23]" aria-hidden="true">
              <div
                className="h-full bg-[color:var(--color-amber)]"
                style={{
                  width: `${pct}%`,
                  boxShadow: '0 0 12px #ff8c00',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>

            {/* Device table. Each row resolves the moment the 3D subsystem it
                names starts drawing power — same constant, same frame. See
                `.post-log` in globals.css for why the row is a class rather
                than a grid of inline styles. */}
            <ul className="post-log">
              {BOOT_STAGES.map((stage, i) => {
                const report = STAGE_REPORT[stage.group];
                const done = power >= stage.at;
                const isLatest =
                  done && (i === BOOT_STAGES.length - 1 || power < BOOT_STAGES[i + 1].at);
                return (
                  <li
                    key={stage.group}
                    className={`post-log__row${done ? ' is-done' : ''}`}
                  >
                    <span className="post-log__device">{report.device}</span>
                    <span className="post-log__state">
                      {done ? 'OK' : '····'}
                      {isLatest && (
                        <span className="caret ml-1" aria-hidden="true">
                          ▌
                        </span>
                      )}
                    </span>
                    <span className="post-log__detail">{report.detail}</span>
                  </li>
                );
              })}
            </ul>

            <p className="t-label mt-4 border-t border-[#24272f] pt-3 normal-case tracking-normal">
              {pct >= 99 ? 'Handing off to BAKUL OS…' : 'Enumerating subsystems…'}
            </p>
          </div>
        </>
      )}

      {/* ---------- ONLINE — the handover ---------- */}
      {online && (
        <div className="boot-handoff">
          <p className="t-body mt-7 max-w-[54ch]">{profile.summary}</p>

          {/*
            Three actions, three tiers — see `.btn-quiet` in globals.css.

            The ask is the work, so View Projects is filled. Download CV is the
            recruiter's second move and stays outlined. GitHub is for the visitor
            who has already decided to dig, and does not need to compete for the
            attention of the two who haven't: it keeps the same height and
            baseline as its neighbours and gives up everything else.

            `items-center` rather than the default stretch, because the quiet
            button has no box to stretch — left alone it grew to the tallest
            sibling and hung its underline well below the others' bottom edge.
          */}
          <div className="mt-9 flex flex-wrap items-center gap-x-3 gap-y-2">
            <a href="#section-projects" className="btn btn-primary">
              View Projects
              <ArrowRight aria-hidden="true" />
            </a>
            <a href={profile.contact.cv} className="btn" download>
              <Download aria-hidden="true" />
              Download CV
            </a>
            <a
              href={profile.contact.github}
              className="btn btn-quiet"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github aria-hidden="true" />
              GitHub
            </a>
          </div>
        </div>
      )}

      {/*
        Scroll affordance, standby only.

        "or scroll to activate" is already written next to the button, but on
        a touch screen the instruction and the gesture are in different
        places — the words are mid-screen and the gesture happens anywhere.
        A moving mark at the foot of the first screen is the conventional
        signal that there is more below, and it doubles as the answer to
        "what does scrolling do here". It disappears the moment the machine
        starts powering on, because by then it has been answered.
      */}
      {standby && (
        <div
          aria-hidden="true"
          /* Clear of the bottom bar. The container's own bottom edge is the
             full 100dvh, whose last stretch the fixed nav sits on top of —
             anchoring to bottom-0 would put the cue underneath it. */
          className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--nav-h)+0.5rem)] flex flex-col items-center gap-2 lg:hidden"
        >
          {/* No size override: `.t-label` is 0.6875rem (11px), which is the
              floor this design holds to. The previous `text-[0.55rem]` set this
              at about 8.8px — small enough that the word it renders stopped
              being readable at arm's length, on the one screen where a visitor
              most needs to be told what to do next. */}
          <span className="t-label text-[color:var(--color-ash-dim)]">Scroll</span>
          <span className="scroll-cue" />
        </div>
      )}
    </div>
  );
}
