// ─────────────────────────────────────────────────────────────
// Course database · compiled from SoC Course Schedule AY2025/26
// (used as proxy for AY2026/27 — verify on NUSMods before each
// CourseReg round; timings are editable in-app).
// ─────────────────────────────────────────────────────────────

export const SUB_AREAS = {
  1: { name: 'Perception', color: 'var(--sa1)' },
  2: { name: 'Reasoning & Planning', color: 'var(--sa2)' },
  3: { name: 'Learning & Optimization', color: 'var(--sa3)' },
  4: { name: 'AI Governance', color: 'var(--sa4)' },
}

export const LOADS = {
  light: { label: 'Light', rank: 1 },
  'light-moderate': { label: 'Light–moderate', rank: 2 },
  moderate: { label: 'Moderate', rank: 3 },
  'moderate-heavy': { label: 'Moderate–heavy', rank: 4 },
  heavy: { label: 'Heavy', rank: 5 },
}

// Your five semesters (part-time, normal candidature 2.5 y)
export const SEMESTERS = [
  { id: 'S1', label: 'Sem 1', term: 'Aug–Dec 2026', type: 1 },
  { id: 'S2', label: 'Sem 2', term: 'Jan–May 2027', type: 2 },
  { id: 'S3', label: 'Sem 3', term: 'Aug–Dec 2027', type: 1 },
  { id: 'S4', label: 'Sem 4', term: 'Jan–May 2028', type: 2 },
  { id: 'S5', label: 'Sem 5', term: 'Aug–Dec 2028', type: 1 },
]

export const RULES = {
  totalUnits: 40,
  minUnitsPerSem: 4, // part-time minimum
  maxUnitsPerSem: 12, // part-time maximum
  maxLevel4000: 2,
  coursework: { essentials: 5, electives: 5, subAreas: 3 },
  dissertation: { essentials: 3, electives: 3, subAreas: 3 },
  dissertationEarliestStart: 2, // part-time: from 2nd semester
  dissertationLatestStart: 3, // register by Week 1 of 3rd semester
}

// offerings: sem 1 = Aug semester, sem 2 = Jan semester
// evening = has a slot starting 18:00 or later
export const COURSES = [
  // ── Essentials · Sub-Area 1 · Perception ──
  { code: 'CS5246', name: 'Text Mining', units: 4, level: 5000, essential: 1, load: 'moderate',
    loadNote: 'NLP pipeline assignments + project.',
    offerings: [{ sem: 2, day: 'Wed', start: '18:30', end: '20:30' }],
    precludes: ['CS4248'], evening: true },
  { code: 'CS5477', name: '3D Computer Vision', units: 4, level: 5000, essential: 1, load: 'heavy',
    loadNote: 'Geometry-heavy; demanding coding assignments.',
    offerings: [{ sem: 2, day: 'Wed', start: '18:30', end: '21:30' }],
    precludes: ['CS4277'], evening: true },
  { code: 'CS4243', name: 'Computer Vision & Pattern Recognition', units: 4, level: 4000, essential: 1, load: 'moderate-heavy',
    loadNote: 'Daytime only in AY25/26 — not viable after 6pm.',
    offerings: [{ sem: 1, day: 'Thu', start: '16:00', end: '18:00' }, { sem: 2, day: 'Tue', start: '14:00', end: '16:00' }],
    precludes: [], evening: false },
  { code: 'CS6207', name: 'Advanced Natural Language Processing', units: 4, level: 6000, essential: 1, load: 'heavy',
    loadNote: 'PhD-level seminar; daytime only in AY25/26.',
    offerings: [{ sem: 2, day: 'Mon', start: '10:00', end: '12:00' }],
    precludes: [], evening: false },

  // ── Essentials · Sub-Area 2 · Reasoning & Planning ──
  { code: 'CS5446', name: 'AI Planning & Decision Making', units: 4, level: 5000, essential: 2, load: 'moderate',
    loadNote: 'MDPs/RL assignments + project; steady pace.',
    offerings: [{ sem: 1, day: 'Wed', start: '18:30', end: '20:30' }, { sem: 2, day: 'Wed', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5478', name: 'Intelligent Robots: Algorithms & Systems', units: 4, level: 5000, essential: 2, load: 'heavy',
    loadNote: 'Large robotics projects; math + systems.',
    offerings: [{ sem: 1, day: 'Tue', start: '18:30', end: '20:30' }],
    precludes: ['CS4278'], evening: true },
  { code: 'CS4244', name: 'Knowledge Representation & Reasoning', units: 4, level: 4000, essential: 2, load: 'moderate',
    loadNote: 'Not offered in AY25/26 schedule.',
    offerings: [], precludes: [], evening: false },
  { code: 'CS6244', name: 'Advanced Topics in Robotics', units: 4, level: 6000, essential: 2, load: 'heavy',
    loadNote: 'PhD-level; daytime only in AY25/26.',
    offerings: [{ sem: 2, day: 'Fri', start: '10:00', end: '12:00' }],
    precludes: [], evening: false },

  // ── Essentials · Sub-Area 3 · Learning & Optimization ──
  { code: 'CS5242', name: 'Neural Networks & Deep Learning', units: 4, level: 5000, essential: 3, load: 'moderate-heavy',
    loadNote: 'Coding-intensive assignments + project; foundation for CS5260.',
    offerings: [{ sem: 1, day: 'Tue', start: '18:30', end: '20:30' }, { sem: 2, day: 'Mon', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5228', name: 'Knowledge Discovery & Data Mining', units: 4, level: 5000, essential: 3, load: 'moderate',
    loadNote: 'Kaggle-style competition project + assignments.',
    offerings: [{ sem: 1, day: 'Fri', start: '18:30', end: '20:30' }, { sem: 2, day: 'Tue', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5260', name: 'Neural Networks & Deep Learning II', units: 4, level: 5000, essential: 3, load: 'moderate-heavy',
    loadNote: 'Builds directly on CS5242 — take CS5242 first.',
    offerings: [{ sem: 2, day: 'Fri', start: '18:30', end: '20:30' }],
    precludes: [], prereq: ['CS5242'], evening: true },
  { code: 'CS5339', name: 'Theory & Algorithms for Machine Learning', units: 4, level: 5000, essential: 3, load: 'heavy',
    loadNote: 'Proofs and derivations throughout — the most mathematical option.',
    offerings: [{ sem: 2, day: 'Fri', start: '18:30', end: '21:30' }],
    precludes: [], evening: true },
  { code: 'CS5340', name: 'Uncertainty Modelling in AI', units: 4, level: 5000, essential: 3, load: 'heavy',
    loadNote: 'Probabilistic graphical models; math-dense assignments.',
    offerings: [{ sem: 1, day: 'Mon', start: '18:30', end: '20:30' }, { sem: 2, day: 'Tue', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'IS5152', name: 'Data-Driven Decision Making', units: 4, level: 5000, essential: 3, load: 'light-moderate',
    loadNote: 'Applied analytics; gentler entry to Sub-Area 3.',
    offerings: [{ sem: 2, day: 'Wed', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },

  // ── Essentials · Sub-Area 4 · AI Governance ──
  { code: 'IS5010', name: 'AI Ethics and Governance', units: 4, level: 5000, essential: 4, load: 'light',
    loadNote: 'Discussion/essay-based. Only Sub-Area 4 evening option; Sem 1 only.',
    offerings: [{ sem: 1, day: 'Mon', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5562', name: 'Trustworthy Machine Learning', units: 4, level: 5000, essential: 4, load: 'moderate-heavy',
    loadNote: '4pm start in AY25/26 — not viable after 6pm.',
    offerings: [{ sem: 1, day: 'Fri', start: '16:00', end: '18:00' }],
    precludes: [], evening: false },

  // ── Evening electives (CS/IS 4000–6000) ──
  { code: 'CS5224', name: 'Cloud Computing', units: 4, level: 5000, essential: null, load: 'light',
    loadNote: 'Concept-driven, group project, little math.',
    offerings: [{ sem: 1, day: 'Tue', start: '18:30', end: '20:30' }, { sem: 2, day: 'Tue', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5344', name: 'Big-Data Analytics Technology', units: 4, level: 5000, essential: null, load: 'light-moderate',
    loadNote: 'Spark assignments + group project.',
    offerings: [{ sem: 1, day: 'Mon', start: '18:30', end: '20:30' }, { sem: 2, day: 'Mon', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5425', name: 'Big Data Systems for Data Science', units: 4, level: 5000, essential: null, load: 'moderate',
    loadNote: 'Hadoop/Spark assignments + final exam; very applied.',
    offerings: [{ sem: 1, day: 'Fri', start: '18:30', end: '20:30' }, { sem: 2, day: 'Thu', start: '18:30', end: '20:30' }],
    precludes: ['CS4225'], evening: true },
  { code: 'CS5223', name: 'Distributed Systems', units: 4, level: 5000, essential: null, load: 'moderate',
    loadNote: 'Sizeable programming project (Raft-style labs).',
    offerings: [{ sem: 1, day: 'Thu', start: '18:30', end: '20:30' }, { sem: 2, day: 'Thu', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5284', name: 'Graph Machine Learning', units: 4, level: 5000, essential: null, load: 'moderate-heavy',
    loadNote: 'Graph neural nets; coding + math, very AI-relevant.',
    offerings: [{ sem: 1, day: 'Wed', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5346', name: 'Information Visualisation', units: 4, level: 5000, essential: null, load: 'light',
    loadNote: 'Project/portfolio-based; no heavy math.',
    offerings: [{ sem: 2, day: 'Thu', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5462', name: 'Machine Learning Systems', units: 4, level: 5000, essential: null, load: 'moderate-heavy',
    loadNote: 'Systems + ML projects; great for MLOps.',
    offerings: [{ sem: 2, day: 'Thu', start: '18:30', end: '20:30' }],
    precludes: ['CS4262'], evening: true },
  { code: 'CS5239', name: 'Computer Performance Analysis', units: 4, level: 5000, essential: null, load: 'light-moderate',
    loadNote: 'Steady assignments; some queueing theory.',
    offerings: [{ sem: 1, day: 'Tue', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5234', name: 'Algorithms at Scale', units: 4, level: 5000, essential: null, load: 'heavy',
    loadNote: 'Proof-based algorithms and problem sets.',
    offerings: [{ sem: 1, day: 'Thu', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5240', name: 'Theoretical Foundation of Multimedia', units: 4, level: 5000, essential: null, load: 'moderate-heavy',
    loadNote: 'Linear-algebra heavy.',
    offerings: [{ sem: 1, day: 'Thu', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5461', name: 'Algorithmic Mechanism Design', units: 4, level: 5000, essential: null, load: 'heavy',
    loadNote: 'Game theory + proofs.',
    offerings: [{ sem: 1, day: 'Thu', start: '18:30', end: '20:30' }],
    precludes: ['CS4261'], evening: true },
  { code: 'CS5231', name: 'Systems Security', units: 4, level: 5000, essential: null, load: 'moderate',
    loadNote: 'Hands-on labs; needs OS/C comfort.',
    offerings: [{ sem: 1, day: 'Fri', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5322', name: 'Database Security', units: 4, level: 5000, essential: null, load: 'moderate',
    loadNote: 'Regular labs and assignments.',
    offerings: [{ sem: 1, day: 'Wed', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5439', name: 'Software Security', units: 4, level: 5000, essential: null, load: 'moderate',
    loadNote: 'Hands-on vulnerability labs.',
    offerings: [{ sem: 1, day: 'Mon', start: '18:30', end: '20:30' }],
    precludes: ['CS4239'], evening: true },
  { code: 'CS5229', name: 'Advanced Computer Networks', units: 4, level: 5000, essential: null, load: 'moderate',
    loadNote: 'Networking depth; assignments + exam.',
    offerings: [{ sem: 1, day: 'Mon', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5250', name: 'Advanced Operating Systems', units: 4, level: 5000, essential: null, load: 'moderate',
    loadNote: 'Paper reading + kernel-level work.',
    offerings: [{ sem: 2, day: 'Mon', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5321', name: 'Network Security', units: 4, level: 5000, essential: null, load: 'moderate',
    loadNote: 'Labs + exam.',
    offerings: [{ sem: 2, day: 'Mon', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5422', name: 'Wireless Networking', units: 4, level: 5000, essential: null, load: 'moderate',
    loadNote: 'Assignments + exam.',
    offerings: [{ sem: 2, day: 'Tue', start: '18:30', end: '20:30' }],
    precludes: ['CS4222'], evening: true },
  { code: 'CS5218', name: 'Principles of Program Analysis', units: 4, level: 5000, essential: null, load: 'moderate-heavy',
    loadNote: 'Theory-leaning; static analysis.',
    offerings: [{ sem: 2, day: 'Tue', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5421', name: 'Database Applications Design & Tuning', units: 4, level: 5000, essential: null, load: 'moderate',
    loadNote: 'SQL/normalization assignments.',
    offerings: [{ sem: 2, day: 'Fri', start: '18:30', end: '20:30' }],
    precludes: ['CS4221'], evening: true },
  { code: 'CS5233', name: 'Simulation & Modeling Techniques', units: 4, level: 5000, essential: null, load: 'moderate',
    loadNote: 'Simulation projects.',
    offerings: [{ sem: 2, day: 'Wed', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS5332', name: 'Biometric Authentication', units: 4, level: 5000, essential: null, load: 'moderate',
    loadNote: 'Applied security + pattern recognition.',
    offerings: [{ sem: 2, day: 'Wed', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS4248', name: 'Natural Language Processing', units: 4, level: 4000, essential: null, load: 'moderate-heavy',
    loadNote: 'Evening group in Sem 2. Precluded with CS5246 — do not take both.',
    offerings: [{ sem: 2, day: 'Mon', start: '18:30', end: '21:30' }],
    precludes: ['CS5246'], evening: true },
  { code: 'CS4238', name: 'Computer Security Practice', units: 4, level: 4000, essential: null, load: 'moderate-heavy',
    loadNote: 'Intensive hands-on hacking labs.',
    offerings: [{ sem: 1, day: 'Tue', start: '18:30', end: '20:30' }, { sem: 2, day: 'Mon', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'CS4240', name: 'Interaction Design for Virtual Reality', units: 4, level: 4000, essential: null, load: 'moderate',
    loadNote: 'Project-heavy; Unity work.',
    offerings: [{ sem: 2, day: 'Mon', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },
  { code: 'IS4228', name: 'Information Technology in Financial Services', units: 4, level: 4000, essential: null, load: 'light',
    loadNote: 'Reading/discussion-based.',
    offerings: [{ sem: 1, day: 'Tue', start: '18:30', end: '20:30' }],
    precludes: [], evening: true },

  // ── Dissertation ──
  { code: 'CP5101', name: 'Dissertation (MComp in AI)', units: 16, level: 5000, essential: null, load: 'heavy',
    loadNote: 'Research dissertation. 16 units counted as 8 units per semester over two consecutive semesters. Part-time: start from Sem 2 onwards; register by Week 1 of Sem 3.',
    offerings: [], precludes: [], evening: true, dissertation: true },
]

// ─────────────────────────────────────────────────────────────
// Seed plans (from our planning conversation)
// dissertation: { start: 'S3' } means CP5101 occupies S3 + S4
// ─────────────────────────────────────────────────────────────
export const SEED_PLANS = [
  {
    id: 'plan-diss-ramp',
    name: 'Dissertation · easy ramp',
    mode: 'dissertation',
    dissertationStart: 'S3',
    semesters: {
      S1: ['IS5010', 'CS5224'],
      S2: ['CS5246', 'CS5228'],
      S3: ['CS5446'],
      S4: [],
      S5: ['CS5242'],
    },
  },
  {
    id: 'plan-cw-ramp',
    name: 'Coursework · easy ramp',
    mode: 'coursework',
    dissertationStart: null,
    semesters: {
      S1: ['IS5010', 'CS5224'],
      S2: ['CS5242', 'CS5346'],
      S3: ['CS5446', 'CS5344'],
      S4: ['CS5246', 'CS5260'],
      S5: ['CS5228', 'CS5223'],
    },
  },
  {
    id: 'plan-cw-balanced',
    name: 'Coursework · balanced',
    mode: 'coursework',
    dissertationStart: null,
    semesters: {
      S1: ['CS5242', 'IS5010'],
      S2: ['CS5246', 'CS5346'],
      S3: ['CS5446', 'CS5344'],
      S4: ['CS5260', 'CS5425'],
      S5: ['CS5228', 'CS5224'],
    },
  },
]

export const KEY_DATES = [
  { date: '2026-07-20', label: 'CourseReg Round 1 opens (09:00)' },
  { date: '2026-08-03', label: 'Orientation week (Sem 1 AY26/27)' },
  { date: '2026-08-10', label: 'Week 1 · classes begin' },
]

export const nusmodsUrl = (code) => `https://nusmods.com/courses/${code}`
export const nusmodsApiUrl = (code, acadYear) =>
  `https://api.nusmods.com/v2/${acadYear}/modules/${code}.json`
