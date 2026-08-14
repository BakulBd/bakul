/**
 * SINGLE SOURCE OF TRUTH — IDENTITY
 *
 * Every fact here is sourced from Bakul Ahmed's CV. Nothing in this file is
 * invented. If a value is unknown it is either omitted or explicitly marked
 * as a visible `[PLACEHOLDER]` slot (see the empty project bay in
 * SectionProjects for the pattern).
 *
 * Do not add metrics, awards, employers, or results that are not verifiable.
 */

/** The one production domain, referenced everywhere metadata needs a URL —
 * layout, sitemap, robots, the generated OG image — so it only ever needs
 * updating in one place. */
export const SITE_URL = 'https://bakul.app';

export const profile = {
  name: 'Bakul Ahmed',
  /** Display title used in the reveal. */
  title: 'Computer Science Engineer',
  /** Precise factual status, used wherever accuracy matters more than brevity. */
  status: 'B.Sc. in CSE (in progress) — Green University of Bangladesh',
  disciplines: ['AI', 'Software', 'Systems', 'Experiments'],
  location: 'Dhaka, Bangladesh',

  summary:
    'Computer Science undergraduate (CGPA 3.96/4.00) with a foundation in data structures, algorithms, and full-stack development — Python, C/C++, Java, React, Next.js, Node.js. I build real, independently-shipped projects, and I lead technical events as General Secretary of the Green University Computer Club.',

  /** Verbatim intent from CV — an ambition, not an achievement. */
  ambition:
    'Aspiring AI/ML researcher — coursework and project experience spanning Artificial Intelligence, Machine Learning, Natural Language Processing, and Data Mining, working toward graduate research in the field.',

  contact: {
    email: 'that.bakul@gmail.com',
    phone: '+8801786-685665',
    github: 'https://github.com/BakulBd',
    githubHandle: 'BakulBd',
    linkedin: 'https://www.linkedin.com/in/bakulahmed/',
    linkedinHandle: 'bakulahmed',
    cv: '/cv/Bakul_Ahmed_CV.pdf',
  },

  education: {
    institution: 'Green University of Bangladesh',
    degree: 'B.Sc. in Computer Science and Engineering',
    start: 'September 2023',
    end: 'Expected October 2027',
    location: 'Dhaka, Bangladesh',
    cgpa: '3.96 / 4.00',
    coursework: [
      'Data Structures and Algorithms',
      'Object-Oriented Programming',
      'Database Management Systems',
      'Computer Architecture',
      'Digital Logic Design',
      'Operating Systems',
      'Computer Networks',
      'Software Engineering',
      'Artificial Intelligence',
      'Machine Learning',
      'Data Mining',
      'Natural Language Processing',
      'Compiler Design',
    ],
  },
} as const;

/**
 * Skills grouped as machine subsystems. `id` keys the 3D core geometry, so
 * these must stay stable — the Core component maps subsystems to physical
 * positions by id.
 */
export const subsystems = [
  {
    id: 'languages',
    label: 'LANGUAGE UNIT',
    category: 'Languages',
    description:
      'The instruction set I think in. Python for reasoning and data work, Java and C/C++ for structured and low-level systems, TypeScript for everything that ships.',
    items: ['Python', 'Java', 'C / C++', 'JavaScript', 'TypeScript', 'SQL'],
  },
  {
    id: 'frameworks',
    label: 'BUILD BUS',
    category: 'Frameworks & Tools',
    description:
      'What I actually ship with. Interfaces in React and Next.js, real-time services in Node, 3D in Three.js, all version-controlled and containerised.',
    items: ['React', 'Next.js', 'Node.js', 'Three.js', 'Docker', 'Git', 'Linux'],
  },
  {
    id: 'concepts',
    label: 'LOGIC CORE',
    category: 'Concepts',
    description:
      'The fundamentals underneath the frameworks — structures and algorithms decide whether a program scales; operating systems and networks decide whether it survives contact with a real machine.',
    items: [
      'Data Structures & Algorithms',
      'Object-Oriented Programming',
      'Database Management Systems',
      'Operating Systems',
      'Computer Networks',
    ],
  },
  {
    id: 'direction',
    label: 'RESEARCH INTAKE',
    category: 'Direction',
    description:
      'Where I am pointing next. Artificial intelligence, machine learning, and natural language processing, approached through coursework and real projects rather than framework APIs alone.',
    items: ['Artificial Intelligence', 'Machine Learning', 'Natural Language Processing', 'Data Mining', 'LLM Integration'],
  },
] as const;


/** Certifications & awards — CV verbatim, no embellishment. */
export const credentials = [
  {
    label: "Vice-Chancellor's Award",
    issuer: 'Green University of Bangladesh',
    detail: 'Recipient across six academic semesters for outstanding academic performance',
    year: null,
  },
  {
    label: 'Code in Place',
    issuer: 'Stanford University',
    detail: 'Python programming course',
    year: '2023',
  },
  {
    label: 'Competitive Programming',
    issuer: 'Codeforces',
    detail: '100+ problems solved · rating 800+',
    year: null,
  },
] as const;
