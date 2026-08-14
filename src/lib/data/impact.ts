/**
 * IMPACT — control centre readouts.
 *
 * HARD RULE: every figure here is verifiable — from the CV, or directly from
 * github.com/BakulBd (repository metadata, README content). There are no user
 * counts, no API request volumes, no uptime figures, no performance deltas,
 * no publications, and no companies — because none exist yet.
 *
 * `source` is rendered in the UI so each number can be traced to its origin.
 * If you cannot name the source, the number does not belong on this page.
 */

export interface Metric {
  id: string;
  value: number;
  /** Rendered after the animated value, e.g. '+' or '/4.00'. */
  suffix: string;
  label: string;
  detail: string;
  source: string;
  /** Counters animate integers; precision > 0 renders a decimal (e.g. CGPA). */
  precision: number;
}

export const metrics: Metric[] = [
  {
    id: 'cgpa',
    value: 3.96,
    suffix: ' / 4.00',
    label: 'CGPA',
    detail: 'Cumulative grade point average across the CSE programme to date.',
    source: 'Green University of Bangladesh',
    precision: 2,
  },
  {
    id: 'vc-award',
    value: 6,
    // Short by design, like every sibling suffix ('+', '/4.00') — the full
    // word already appears in the label and detail text right below. At full
    // width in a five-up grid, "semesters" as a headline-sized suffix simply
    // doesn't fit any card in the row without shrinking every number on the
    // page to accommodate the one longest word.
    suffix: ' sem',
    label: "Vice-Chancellor's Award",
    detail: 'Recipient across six academic semesters for outstanding academic performance.',
    source: 'Green University of Bangladesh',
    precision: 0,
  },
  {
    id: 'datacamp-scholarship',
    value: 300,
    suffix: '+',
    label: 'DataCamp Scholarships',
    detail: 'Students given free DataCamp learning access through a scholarship I arranged personally.',
    source: 'DataCamp · GUCC',
    precision: 0,
  },
  {
    id: 'participants',
    value: 200,
    suffix: '+',
    label: 'Event Participants',
    detail: 'Reached through university-wide technology events organised and led at GUCC.',
    source: 'GUCC',
    precision: 0,
  },
  {
    id: 'codeforces',
    value: 100,
    suffix: '+',
    label: 'Problems Solved',
    detail: 'Competitive programming problems solved across online judges. Codeforces rating 800+.',
    source: 'Codeforces',
    precision: 0,
  },
];

export interface ImpactGroup {
  id: string;
  label: string;
  entries: { label: string; detail: string }[];
}

export const impactGroups: ImpactGroup[] = [
  {
    id: 'academic',
    label: 'ACADEMIC',
    entries: [
      {
        label: 'B.Sc. CSE — in progress',
        detail: 'Green University of Bangladesh, September 2023 – expected October 2027.',
      },
      {
        label: 'CGPA 3.96 / 4.00',
        detail:
          'Coursework spanning data structures, algorithms, computer architecture, operating systems, AI, ML, data mining, NLP, and compiler design.',
      },
      {
        label: "Vice-Chancellor's Award",
        detail: 'Awarded across six academic semesters for outstanding academic performance.',
      },
    ],
  },
  {
    id: 'community',
    label: 'COMMUNITY',
    entries: [
      {
        label: 'General Secretary',
        detail: 'Green University Computer Club (GUCC) — leading club operations since March 2026.',
      },
      {
        label: 'Student Mentor',
        detail:
          'Dept. of Artificial Intelligence and Data Science, Green University — mentoring undergraduates since October 2025.',
      },
      {
        label: 'Open access initiatives',
        detail: 'DataCamp learning scholarships arranged personally for 300+ students.',
      },
    ],
  },
  {
    id: 'technical',
    label: 'TECHNICAL',
    entries: [
      {
        label: 'Stanford Code in Place',
        detail: 'Completed in Python, 2023.',
      },
      {
        label: 'Codeforces — 100+ problems',
        detail: 'Rating 800+.',
      },
      {
        label: 'Three independently built projects',
        detail:
          'An AI exam-proctoring platform, a real-time multiplayer game server, and AI-scaffolded learning research — full details in the Project Bay.',
      },
    ],
  },
];
