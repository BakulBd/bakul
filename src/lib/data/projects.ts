/**
 * PROJECT BAY — rack module definitions.
 *
 * Three flagship projects — the same three the CV itself leads with
 * ("three independently built projects"). Course projects (a library system,
 * an algorithms visualiser) are real but intentionally not featured here;
 * they're coursework, not independent builds, and the CV's own current
 * curation doesn't lead with them either. They still appear on the Assembly
 * Line (Experience section) as real history, and the algorithm step-trace
 * architecture is rebuilt live in the Experiment Lab.
 *
 * Every field here is sourced from the CV and from github.com/BakulBd —
 * repository metadata and each project's own README, read before writing a
 * word of copy. Nothing is invented: no user counts, no performance numbers,
 * no claims the source material doesn't make.
 *
 * `live` is null wherever there is genuinely no deployed demo — the UI shows
 * "No deployed demo" rather than a broken or fabricated link. Every `live`
 * URL below was checked and returned HTTP 200 before being added.
 *
 * To add a project: append an entry, set `live` to null unless you've
 * checked it resolves, and source every field from something you can point
 * to (a README, a CV line, a repo topic) rather than writing what would
 * sound good.
 */

type ProjectStatus = 'online' | 'empty';

/** Drives the machine's reaction when a bay locks in (lighting + conduit tempo). */
type ProjectSignature = 'data' | 'compute' | 'none';

export interface Project {
  slot: string;
  status: ProjectStatus;
  title: string;
  kind: string;
  period: string;
  stack: string[];
  /** Machine response profile. */
  signature: ProjectSignature;
  problem: string;
  solution: string;
  architecture: string;
  challenge: string;
  /** Outcome as delivered. Never a fabricated metric. */
  result: string;
  github: string | null;
  live: string | null;
}

export const projects: Project[] = [
  {
    slot: '01',
    status: 'online',
    title: 'hdgame.me',
    kind: 'Personal Project — Full-Stack Multiplayer Game',
    period: '2026 — Present',
    stack: ['Next.js', 'TypeScript', 'Three.js', 'Node.js', 'Colyseus', 'Docker'],
    signature: 'compute',
    problem:
      'Real-time multiplayer games need the client to feel instant while staying consistent with an authoritative server — any divergence between the two shows up immediately as rubber-banding.',
    solution:
      'A monorepo for a multi-title 3D game platform: one authoritative Node.js game server and one Next.js/Three.js client, both stepping the identical deterministic physics simulation from a package they share, deployed as containers.',
    architecture:
      'A `packages/shared` module holds every constant and the physics simulation step, imported by both the Colyseus game server and the Next.js client — so client-side prediction and server reconciliation run the same physics rather than an approximation of it. Docker containerises both halves for deployment.',
    challenge:
      'Keeping client and server physics identical. The shared-package structure exists specifically because a second copy of any force or constant, drifting even slightly, is what makes a client and server disagree about where something is.',
    result:
      'A live, playable multiplayer platform with client-server synchronisation, physics simulation, and WebSocket networking running end to end.',
    github: 'https://github.com/BakulBd/web-game',
    live: 'https://web-game-frontend-mu.vercel.app',
  },
  {
    slot: '02',
    status: 'online',
    title: 'Epistemic Guard',
    kind: 'AI-Assisted Programming Research',
    period: '2026',
    stack: ['TypeScript', 'VS Code Extension API', 'LLM', 'Node.js'],
    signature: 'compute',
    problem:
      'Unrestricted AI coding assistance lets a learner produce working code they cannot explain or fix themselves — a gap the source paper calls "epistemic debt."',
    solution:
      'A VS Code extension for studying AI-assisted programming through metacognitive explanations and code-repair tasks: AI-generated code is detected as it enters a project, and the learner must explain it well enough — judged by a second LLM against a published rubric — before the change is allowed through.',
    architecture:
      'A rule-enforcement engine and telemetry logger inside the VS Code extension; an LLM-based evaluation service with a strict parser and a deterministic mock for testing; and an automated experimental workflow — participant randomisation, a code-repair task, telemetry capture — kept apart from the apparatus itself.',
    challenge:
      'Verifying the apparatus against itself before trusting it to run a real study on anyone: the suite of roughly 350 tests has to prove the explanation gate and evaluation harness behave correctly with no network calls and no live experimental data.',
    result:
      'The apparatus is complete and self-tested, built for analysing how developers understand AI-generated code. As its own documentation states plainly: no experimental data has been collected with it yet.',
    github: 'https://github.com/BakulBd/epistemic-guard',
    live: null,
  },
  {
    slot: '03',
    status: 'online',
    title: 'Green Guardian',
    kind: 'AI-Powered University Platform',
    period: '2026 — Present',
    stack: ['Next.js', 'TypeScript', 'Firebase', 'TensorFlow.js', 'Gemini API'],
    signature: 'compute',
    problem:
      'Running an online exam with academic integrity intact means proctoring, plagiarism review, and marking at a scale no small teaching staff can do by hand.',
    solution:
      'A full-stack university platform with separate student, teacher, admin, and classroom-management workflows — AI exam proctoring, plagiarism detection, OCR, AI-assisted marking, and academic analytics built in.',
    architecture:
      'Next.js frontend on a serverless Firebase backend (Auth, Firestore). Face and gaze tracking run client-side through TensorFlow.js, so proctoring works without a dedicated monitoring server. Submitted work is OCR’d and scored for similarity and AI-generated content through the Gemini API, feeding the AI-assisted marking and analytics dashboards.',
    challenge:
      'Running real-time face-tracking inference and strict, server-enforced exam timing with no dedicated backend to lean on — the client has to log integrity events reliably enough that a serverless backend can score them after the fact.',
    result:
      'A deployed platform covering the full academic workflow end to end: exam delivery, live monitoring, plagiarism and AI-content scoring, AI-assisted marking, and analytics.',
    github: 'https://github.com/BakulBd/GreenGuardian',
    live: 'https://green.bakul.app',
  },
];
