/**
 * ASSEMBLY LINE — chronological milestones.
 *
 * `stage` maps to the progression Student → Programmer → Developer → Engineer
 * → Builder → Future. Every entry is drawn from the CV. Ongoing roles carry
 * `ongoing: true`; nothing is described as finished that is still running —
 * and a role that has genuinely ended (superseded by a later one) is marked
 * `ongoing: false` rather than left stale.
 */

export type Stage =
  | 'STUDENT'
  | 'PROGRAMMER'
  | 'DEVELOPER'
  | 'ENGINEER'
  | 'BUILDER'
  | 'FUTURE';

export interface Milestone {
  id: string;
  stage: Stage;
  period: string;
  title: string;
  org: string | null;
  ongoing: boolean;
  /** Forward-looking entries are intentions, never accomplishments. */
  projected: boolean;
  points: string[];
}

export const milestones: Milestone[] = [
  {
    id: 'code-in-place',
    stage: 'STUDENT',
    period: '2023',
    title: 'Code in Place',
    org: 'Stanford University',
    ongoing: false,
    projected: false,
    points: [
      'Completed Stanford’s Code in Place programme in Python.',
      'First structured exposure to programming as a discipline rather than a tool.',
    ],
  },
  {
    id: 'gub-start',
    stage: 'STUDENT',
    period: 'September 2023',
    title: 'B.Sc. in Computer Science and Engineering',
    org: 'Green University of Bangladesh',
    ongoing: true,
    projected: false,
    points: [
      'Began the CSE programme in Dhaka, Bangladesh.',
      'Coursework spans data structures and algorithms, computer architecture, operating systems, computer networks, software engineering, AI, ML, data mining, NLP, and compiler design.',
      'Maintaining a CGPA of 3.96 / 4.00.',
    ],
  },
  {
    id: 'library-system',
    stage: 'PROGRAMMER',
    period: 'Feb 2024 – Apr 2024',
    title: 'Library Management System',
    org: 'Course Project — OOP',
    ongoing: false,
    projected: false,
    points: [
      'Engineered a Java desktop application centralising books, members, and loans.',
      'Designed a normalised MySQL schema with integrity enforced through JDBC access.',
      'First project where database design mattered more than application code.',
    ],
  },
  {
    id: 'algorithms-visualizer',
    stage: 'DEVELOPER',
    period: 'Sep 2024 – Dec 2024',
    title: 'Algorithms Visualizer',
    org: 'Course Project — Algorithms',
    ongoing: false,
    projected: false,
    points: [
      'Built a React and D3.js tool animating sorting and tree algorithms step by step.',
      'Implemented playback controls — play, pause, and speed — over a replayable step trace.',
      'Separated algorithm execution from rendering so new algorithms need no new animation code.',
    ],
  },
  {
    id: 'gucc-joint-secretary',
    stage: 'ENGINEER',
    period: 'Mar 2025 – Feb 2026',
    title: 'Joint Information Secretary & Web Developer',
    org: 'Green University Computer Club (GUCC)',
    ongoing: false,
    projected: false,
    points: [
      'Managed club communications and helped plan and run technical and academic events, including HackTheAI and GitAICampusVerse.',
      'Developed and maintained the club website, improving online engagement and event outreach.',
      'Role concluded on stepping up to General Secretary.',
    ],
  },
  {
    id: 'ai-mentor',
    stage: 'BUILDER',
    period: 'Oct 2025 – Present',
    title: 'Student Mentor',
    org: 'Dept. of Artificial Intelligence and Data Science, Green University',
    ongoing: true,
    projected: false,
    points: [
      'Mentoring undergraduate students, providing academic guidance and peer support with coursework and university activities.',
      'Running peer-learning sessions focused on communication, collaboration, and problem-solving.',
    ],
  },
  {
    id: 'gucc-general-secretary',
    stage: 'BUILDER',
    period: 'Mar 2026 – Present',
    title: 'General Secretary',
    org: 'Green University Computer Club (GUCC)',
    ongoing: true,
    projected: false,
    points: [
      'Lead club operations and coordinate executive activities across academic, technical, and student-focused initiatives.',
      'Coordinate with faculty, students, and external organisations to run major events and technology programmes.',
    ],
  },
  {
    id: 'community',
    stage: 'BUILDER',
    period: 'Ongoing',
    title: 'Events & Open Access',
    org: 'GUCC',
    ongoing: true,
    projected: false,
    points: [
      'Organised and led tech events reaching 200+ participants.',
      'Arranged DataCamp learning scholarships personally for 300+ students.',
    ],
  },
  {
    id: 'graduation',
    stage: 'FUTURE',
    period: 'Expected October 2027',
    title: 'B.Sc. CSE — Completion',
    org: 'Green University of Bangladesh',
    ongoing: false,
    projected: true,
    points: [
      'Expected completion of the undergraduate programme.',
      'Projected milestone — not yet achieved.',
    ],
  },
  {
    id: 'graduate-research',
    stage: 'FUTURE',
    period: 'Next',
    title: 'Graduate Research in AI / ML',
    org: null,
    ongoing: false,
    projected: true,
    points: [
      'Aspiring toward graduate research in artificial intelligence and machine learning.',
      'Stated intention — not a current position.',
    ],
  },
];

export const stageOrder: Stage[] = [
  'STUDENT',
  'PROGRAMMER',
  'DEVELOPER',
  'ENGINEER',
  'BUILDER',
  'FUTURE',
];
