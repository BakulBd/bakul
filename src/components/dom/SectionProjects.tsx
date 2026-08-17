'use client';

import { useEffect, useRef } from 'react';
import { frame, useMachine } from '@/store/machine';
import { useRafScroll } from '@/hooks/useRafScroll';
import { useIsCompact } from '@/hooks/useViewport';
import { projects, type Project } from '@/lib/data/projects';
import { ProjectVisual } from './ProjectVisual';
import { Heading, Lead, Reveal, Section, Readout, Status } from './Primitives';

/**
 * PROJECT BAY (§7)
 *
 * Projects are rack modules, not cards. Scrolling advances the rack and the
 * active module locks into position; the full case study is a readable HTML
 * panel beside it.
 *
 * Every bay here is real, verified work — sourced from the CV or straight from
 * github.com/BakulBd, never invented to fill a slot. A future bay with no real
 * project behind it yet is still supported (`status: 'empty'` in the data)
 * and renders as a genuinely empty, labelled slot rather than padding.
 */

/*
 * Bounded to the same height as the rack list, so the pair never grows the
 * page taller than one sticky viewport (see the `.panel-scroll` comment in
 * globals.css for why that matters). The header and the Source/Live Demo
 * buttons are fixed — `shrink-0` — so they're always reachable without
 * scrolling; only the case-study text in the middle, whose length genuinely
 * varies project to project, scrolls internally when it has to.
 */
function ModuleDetail({ project, bounded = true }: { project: Project; bounded?: boolean }) {
  /*
   * `bounded` is the pinned-layout constraint, and it only makes sense while
   * the layout is actually pinned.
   *
   * On a phone `calc(100vh - 31rem)` resolves to about 350px, and the case
   * study — five readouts of real prose, the best writing on this site — was
   * being folded into a ~120px masked scroll box below the title and chips.
   * In practice that rendered as a blank gap: the content was technically
   * scrollable and effectively invisible. Unbounded, the panel is simply as
   * tall as its content and the page scrolls, which is what a phone does
   * anyway.
   */
  const cap = bounded ? 'max-h-[calc(100dvh-31rem)]' : '';
  const scroll = bounded ? 'panel-scroll' : '';

  if (project.status === 'empty') {
    return (
      <div className={`panel flex flex-col p-6 sm:p-7 ${cap}`}>
        <Status state="idle">Bay {project.slot} — Empty</Status>
        <h3 className="t-mono mt-4 text-xl text-[color:var(--color-ash-dim)]">SLOT AVAILABLE</h3>
        <p className="t-body mt-4 max-w-[52ch] text-sm">
          This bay is unpopulated. New work is installed here as it ships — the rack is built to
          take it, and it stays empty until there is something real to put in it.
        </p>
        <dl className="mt-6 m-0">
          <Readout k="Title" v={<span className="text-[color:var(--color-ash-dim)]">[PROJECT_TITLE]</span>} />
          <Readout k="Stack" v={<span className="text-[color:var(--color-ash-dim)]">[TECHNOLOGIES]</span>} />
          <Readout k="Repository" v={<span className="text-[color:var(--color-ash-dim)]">[GITHUB_URL]</span>} />
          <Readout k="Demo" v={<span className="text-[color:var(--color-ash-dim)]">[LIVE_DEMO]</span>} />
        </dl>
      </div>
    );
  }

  return (
    <article className={`panel flex flex-col p-6 sm:p-7 ${cap}`}>
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Status state="online">Bay {project.slot} — Online</Status>
        <span className="t-label">{project.period}</span>
      </div>

      <h3 className="shrink-0 t-display mt-4 text-[clamp(1.5rem,3.4vw,2.3rem)]">{project.title}</h3>
      <p className="shrink-0 t-label mt-2 normal-case tracking-normal">{project.kind}</p>

      <ul className="shrink-0 mt-5 flex list-none flex-wrap gap-2 p-0">
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="panel-flat px-3 py-1.5 font-[family-name:var(--font-fira)] text-xs"
          >
            {tech}
          </li>
        ))}
      </ul>

      {/*
        The bay's signature visual.

        Rendered only where the panel is unbounded — which in practice means
        the compact layout, the one that previously had no visual evidence of
        any project at all. In the pinned wide layout the panel is capped at
        one viewport and the case study is already competing for that space;
        adding a diagram there would push the prose further into its scroll
        box rather than adding anything.
      */}
      {!bounded && (
        <div className="shrink-0 mt-6">
          <ProjectVisual slot={project.slot} />
        </div>
      )}

      {/* One word per label — "Technical challenge" was the only two-word
          label here and it wrapped, dragging its own row out of alignment
          with the four above it. */}
      <dl className={`mt-7 min-h-0 flex-1 m-0 ${scroll} ${bounded ? 'pr-2' : ''}`}>
        <Readout k="Problem" v={project.problem} />
        <Readout k="Solution" v={project.solution} />
        <Readout k="Architecture" v={project.architecture} />
        <Readout k="Challenge" v={project.challenge} />
        <Readout k="Result" v={project.result} />
      </dl>

      <div className="shrink-0 mt-7 flex flex-wrap gap-3">

        {project.github && (
          <a href={project.github} className="btn" target="_blank" rel="noopener noreferrer">
            Source ↗
          </a>
        )}
        {project.live ? (
          <a href={project.live} className="btn" target="_blank" rel="noopener noreferrer">
            Live Demo ↗
          </a>
        ) : (
          // Stating the absence is more honest than hiding it or linking nowhere.
          <span className="t-label self-center">No deployed demo</span>
        )}
      </div>
    </article>
  );
}

/**
 * How long a manual bay selection outranks the scroll-position auto-sync
 * below. Exists because a click can itself cause a small residual scroll —
 * bringing an off-screen rack row into view, a rounding nudge from the
 * browser's own scroll-into-view — and without this guard, that incidental
 * scroll immediately re-fires the position-based sync and silently snaps the
 * selection back to whatever bay the raw scroll fraction maps to, undoing
 * the click that caused it. A deliberate scroll from the visitor reliably
 * outlasts this window; an incidental few-pixel settle from a click does not.
 */
const MANUAL_SELECT_PRIORITY_MS = 600;

export function SectionProjects() {
  const activeProject = useMachine((s) => s.activeProject);
  const setActiveProject = useMachine((s) => s.setActiveProject);
  const setProjectEmerged = useMachine((s) => s.setProjectEmerged);
  const projectEmerged = useMachine((s) => s.projectEmerged);
  const webglFailed = useMachine((s) => s.webglFailed);
  const railRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastManualSelectAt = useRef(0);
  const compact = useIsCompact();

  const select = (index: number) => {
    lastManualSelectAt.current = performance.now();
    // The machine answers a bay being opened, as it does a subsystem being
    // inspected and a milestone locking in — same wave, same frame.
    frame.pulse = 1;
    const wasActive = useMachine.getState().activeProject === index;
    const emerged = useMachine.getState().projectEmerged;
    setActiveProject(index);
    // Opening a bay pushes it out through the monitor; clicking the bay that
    // is already projected pulls it back in. Only ever driven from a real
    // click or key press — the scroll-position sync below deliberately does
    // not touch this, or moving through the rack would fire the whole
    // cinematic over and over.
    // No audio call here: SoundBridge plays the bay-lock cue off the
    // `activeProject` transition and the emergence cue off `projectEmerged`,
    // so a click, an arrow key and the command palette all sound the same.
    setProjectEmerged(!(wasActive && emerged));
  };

  /*
   * Keep the active row visible inside the rack's own scroll — never the
   * page's. The list is internally scrollable (see `.panel-scroll` below) on
   * general principle — this rack has held as many as six bays before and
   * will again — so this still matters at the current bay count and isn't
   * something to remove just because three bays currently fit without it.
   * Without this, advancing past the visible rows via scroll-driven
   * auto-select would highlight a bay the visitor cannot currently see
   * without a second, separate scroll of their own.
   *
   * `block: 'nearest'` is what keeps this contained to the rack's own
   * scrollable ancestor instead of touching window scroll — the bug this
   * fixes was `.click()`/`.focus()` falling back to page-level scrolling
   * when a target was outside a non-scrollable container.
   */
  // Skips its own first invocation — see below.
  const isFirstActiveProjectRender = useRef(true);

  useEffect(() => {
    // Effects run once after the initial render regardless of whether the
    // dependency "changed" from a prior value, so without this guard this
    // fires the moment the component mounts — while the visitor may still be
    // at BOOT, nowhere near the Projects section yet. At that moment the
    // rack list usually has no internal overflow to scroll (nothing has been
    // clicked, so the list is short), and when `scrollIntoView` finds no real
    // scroll room in the nearest container, it escalates to the window —
    // yanking a first-time visitor straight past the boot sequence into the
    // middle of the page before they've done anything. Only a genuine,
    // later change to activeProject (a real click or arrow-key press) should
    // ever move any scroll container.
    if (isFirstActiveProjectRender.current) {
      isFirstActiveProjectRender.current = false;
      return;
    }
    const btn =
      railRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')[activeProject];
    btn?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeProject]);

  /* Arrow-key traversal along the rack — the rack is a real listbox. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const dir = e.key === 'ArrowDown' ? 1 : -1;
    const next = (activeProject + dir + projects.length) % projects.length;
    select(next);
    const btn = railRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')[next];
    btn?.focus();
  };

  /*
   * Compact layout: the bay whose card is centred in the viewport is the
   * active one.
   *
   * The rack/detail split does not exist here — every bay is rendered in full
   * (see below) — but the 3D machine still lights one bay at a time, and it
   * should be the one being read. An IntersectionObserver keyed to a band
   * across the middle of the screen answers that directly, and unlike the
   * scroll-fraction maths below it does not care how tall any card turned out
   * to be.
   */
  useEffect(() => {
    if (!compact) return;
    const root = listRef.current;
    if (!root) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-bay]'));
    if (cards.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = Number((entry.target as HTMLElement).dataset.bay);
          if (Number.isInteger(i)) useMachine.getState().setActiveProject(i);
        }
      },
      // A narrow band across the middle: a card is "the one being read" only
      // while it crosses the centre of the screen, so two adjacent cards can
      // never both claim it.
      { rootMargin: '-45% 0px -45% 0px' },
    );

    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [compact]);

  /* Advance the rack as the section scrolls — modules lock into position.
     Coalesced to one read per animation frame; see useRafScroll. */
  useRafScroll(() => {
    // The rack only exists on a wide viewport; on a compact one the observer
    // above owns the selection and this would fight it every frame.
    if (compact) return;

    const el = document.getElementById('section-projects');
    if (!el) return;

    const rect = el.getBoundingClientRect();

    /*
     * Anything pushed out through the monitor is drawn back in once the
     * visitor leaves the rack entirely. Without this, scrolling on with a
     * project still projected would leave the camera part-way into a
     * close-up of a screen that is no longer what the page is about, and the
     * machine held square instead of idling. Checked before the
     * manual-select guard below, because leaving the section should retract
     * it whether or not a click just happened.
     */
    const offScreen = rect.bottom < 0 || rect.top > window.innerHeight;
    if (offScreen && useMachine.getState().projectEmerged) {
      useMachine.getState().setProjectEmerged(false);
    }

    // A recent manual click owns the selection for a short window — see
    // MANUAL_SELECT_PRIORITY_MS above.
    if (performance.now() - lastManualSelectAt.current < MANUAL_SELECT_PRIORITY_MS) return;

    const total = rect.height - window.innerHeight;
    if (total <= 0) return;
    const progress = Math.min(1, Math.max(0, -rect.top / total));
    // Bias the index slightly so a module locks in before the visitor has
    // fully scrolled past it, rather than lagging behind.
    const index = Math.min(projects.length - 1, Math.floor(progress * projects.length * 0.999));
    if (index !== useMachine.getState().activeProject) {
      useMachine.getState().setActiveProject(index);
    }
  }, [compact]);

  const current = projects[activeProject] ?? projects[0];

  return (
    <Section id="projects" label="Project Bay" index="02">
      <Reveal>
        <Heading id="projects">Project Bay</Heading>
        {/* Kept to two lines. The old version spent its last sentence
            explaining that more bays could be added later — filler that cost
            three lines of vertical space on a phone and pushed the rack
            itself, the actual content, below the fold. */}
        <Lead>
          {compact
            ? 'Shipped and in-progress work. Every bay below is open — the problem it solves, how it is built, and what came of it.'
            : 'Shipped and in-progress work, installed as rack modules. Scroll to advance the rack, or select a bay to open it.'}
        </Lead>
      </Reveal>

      {/*
        COMPACT: every bay, open.

        The rack-and-detail pairing is a two-column idea — a list you steer
        with on the left, the case study it controls on the right. Collapsed
        into one column it becomes a list of three titles followed by the
        contents of exactly one of them, where selecting a different bay
        scrolls the thing you were reading off the screen. Rendering all three
        in full removes the indirection entirely: the case studies are the
        content, and on a phone there is no reason to make someone operate a
        control surface to reach them.
      */}
      {compact ? (
        <div ref={listRef} className="mt-9 space-y-5">
          {projects.map((p, i) => (
            <Reveal key={p.slot} delay={Math.min(i, 2) * 70}>
              <div data-bay={i}>
                <ModuleDetail project={p} bounded={false} />
              </div>
            </Reveal>
          ))}
        </div>
      ) : (
      <div className="mt-11 grid gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* ---------- Rack ---------- */}
        <Reveal delay={80}>
          <div
            ref={railRef}
            role="listbox"
            aria-label="Project rack"
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
            className="panel-scroll max-h-[calc(100dvh-31rem)] space-y-2 pr-1"
          >
            {projects.map((p, i) => {
              const isActive = i === activeProject;
              const isEmpty = p.status === 'empty';
              return (
                <button
                  key={p.slot}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => select(i)}
                  className="panel panel-interactive flex w-full items-start gap-3.5 px-5 py-4 text-left"
                  style={{
                    // The active module physically advances toward the viewer.
                    transform: isActive ? 'translateX(10px)' : 'translateX(0)',
                    borderColor: isActive
                      ? isEmpty
                        ? 'var(--color-ash-dim)'
                        : 'var(--color-amber)'
                      : undefined,
                    boxShadow: isActive && !isEmpty ? '0 0 34px -16px var(--color-amber)' : undefined,
                    opacity: isEmpty ? 0.6 : 1,
                    transition: 'transform 0.45s cubic-bezier(0.16,1,0.3,1), border-color 0.3s, box-shadow 0.3s',
                  }}
                >
                  <span className="t-mono mt-0.5 text-[0.68rem] text-[color:var(--color-ash-dim)]">
                    {p.slot}
                  </span>
                  <span
                    className={`led mt-2 shrink-0 ${isEmpty ? 'led-idle' : isActive ? 'led-amber' : 'led-on'}`}
                    aria-hidden="true"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span
                        className="t-mono text-sm leading-snug"
                        style={{ color: isEmpty ? 'var(--color-ash-dim)' : 'var(--color-ceramic)' }}
                      >
                        {p.title}
                      </span>

                      {/* States what the click does to the 3D layer, in the
                          DOM, so the behaviour is discoverable without the
                          canvas rather than left as an unexplained camera
                          move. Hidden when the canvas isn't running. */}
                      {isActive && !isEmpty && !webglFailed && (
                        <span
                          className="t-label shrink-0 normal-case tracking-normal"
                          style={{
                            color: projectEmerged ? 'var(--color-cyan)' : 'var(--color-ash-dim)',
                          }}
                        >
                          {projectEmerged ? 'Projected ↗' : 'Project it'}
                        </span>
                      )}
                    </span>

                    {/*
                      Discrete chips, capped at three.
                      Joining six technologies with separators produced a
                      three-line grey run-on that read as noise and buried the
                      project title above it — the one thing a visitor is
                      actually scanning this list for. Three chips fit one line
                      at every width the rack is used at, and the remainder is
                      counted rather than wrapped. The full stack is listed in
                      the detail panel beside this, so nothing is lost.
                    */}
                    {!isEmpty && (
                      <span className="mt-2 flex flex-wrap items-center gap-1.5">
                        {p.stack.slice(0, 3).map((tech) => (
                          <span
                            key={tech}
                            className="rounded border border-[#2b2f38] bg-[rgba(20,23,30,0.7)] px-1.5 py-0.5 font-[family-name:var(--font-fira)] text-[0.62rem] leading-none text-[color:var(--color-ash)]"
                          >
                            {tech}
                          </span>
                        ))}
                        {p.stack.length > 3 && (
                          <span className="font-[family-name:var(--font-fira)] text-[0.62rem] text-[color:var(--color-ash-dim)]">
                            +{p.stack.length - 3}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="t-label mt-4">↑ ↓ to traverse the rack</p>
        </Reveal>

        {/* ---------- Active module detail ---------- */}
        <Reveal delay={140}>
          <div aria-live="polite">
            <ModuleDetail project={current} />
          </div>
        </Reveal>
      </div>
      )}
    </Section>
  );
}
