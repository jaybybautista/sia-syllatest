// Single source of truth for sample data so every screen shows the same facts.
export const user = {
  name: 'Dr. Evelyn Ramos',
  email: 'eramos@psu.edu.ph',
  college: 'College of Computing Sciences',
  // Academic rank, distinct from the system role the app grants.
  rank: 'Associate Professor III',
}

// Figma named the chair three different ways: "Dept. Chair Evelyn" (same person as the faculty
// author), "Evelyn Ramos (Academic Audit)" in the SSO chooser, and "Dr. Michael Torres (Dept.
// Chair / Audit Lead)" in the submit dialog. The last is the only distinct person, so it is used
// everywhere and the author/reviewer stay separate.
export const chair = {
  name: 'Dr. Michael Torres',
  email: 'mtorres@psu.edu.ph',
  role: 'Department Chair / Audit Lead',
}

// Each role signs in as a different person, so the account shown follows the active role.
export const accountByRole = {
  faculty: user,
  chair,
  admin: { name: 'ICT Systems Admin', email: 'ict-admin@psu.edu.ph' },
}

export const term = {
  label: '2nd Sem, A.Y. 2023-2024',
  long: 'Second Semester, Academic Year 2023 - 2024',
}

export const courses = [
  {
    code: 'ELEC 4',
    title: 'Special Topics on Web and Mobile 2',
    type: 'Syllabus',
    status: 'Review Staged',
    tone: 'warn',
    updated: 'Updated 10 mins ago',
    issue: '91 computed vs 90 stated hours detected',
  },
  {
    code: 'IT 312',
    title: 'Human Computer Interaction',
    type: 'TOS Draft',
    status: 'Verified',
    tone: 'ok',
    updated: 'Updated Yesterday',
    issue: null,
  },
  {
    code: 'IT 213',
    title: 'Data Structures & Algorithms',
    type: 'Exam Bank',
    status: 'Under Verification',
    tone: 'warn',
    updated: 'Updated 2 days ago',
    issue: '2 unassessed course outcomes',
  },
]

// Bloom's Revised Taxonomy — one palette used by every screen that tags a level.
export const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']

export const bloomTone = {
  Remember: 'bg-slate-100 text-ink-2',
  Understand: 'bg-sky-50 text-sky-700',
  Apply: 'bg-brand-soft text-brand',
  Analyze: 'bg-indigo-50 text-indigo-700',
  Evaluate: 'bg-warn-bg text-warn',
  Create: 'bg-ok-bg text-ok',
}

export const syllabus = {
  file: 'ELEC4_Syllabus_2023.pdf',
  pages: 6,
  statedHours: 90,
  creditSplit: '2 Lec + 1 Lab',
  outcomes: [
    {
      id: 'CO 1',
      text: 'Design and prototype highly responsive, device-agnostic user interfaces.',
      bloom: 'Analyze',
    },
    {
      id: 'CO 2',
      text: 'Construct full-stack cross-platform mobile systems using asynchronous API handlers.',
      bloom: 'Create',
    },
    {
      id: 'CO 3',
      text: 'Perform end-to-end cloud deployment verifying security and endpoint latency.',
      bloom: 'Evaluate',
    },
  ],
  chapters: [
    { n: 1, title: 'Web and Mobile Tech stacks', hours: 10, co: 'CO 1',
    topics: 'HTML, CSS, responsive layout, viewport meta tag, breakpoints, media queries, mobile-first design, front-end and back-end stacks, choosing a tech stack, native vs hybrid apps, progressive web apps, service workers, browsers and devices' },
    { n: 2, title: 'Asynchronous Javascript & APIs', hours: 25, co: 'CO 2',
    topics: 'asynchronous programming, callbacks, promises, async/await, event loop, microtasks, setTimeout, Promise.all, fetch, Axios, REST APIs, HTTP methods (GET, POST, PATCH, DELETE), HTTP status codes, JSON, request and response handling, error handling, caching API responses, latency' },
    { n: 3, title: 'Cross-platform development structures', hours: 35, co: 'CO 2',
    topics: 'cross-platform frameworks, React Native, Flutter, Expo, JSX components, props and state, hooks (useState, useEffect), re-rendering, widgets, user interface styling, lists (FlatList), navigation (stack and tab navigators), local storage (AsyncStorage), offline support and sync, emulators and simulators, Fast Refresh, platform-specific code (Platform.OS), Android and iOS builds, package.json dependencies' },
    { n: 4, title: 'Cloud Deployment Pipelines', hours: 21, co: 'CO 3',
    topics: 'cloud hosting, deployment pipelines, CI/CD, build and test stages, containers, Docker, environment variables, secrets management, API keys, authentication tokens, secure storage, HTTPS and TLS, security, blue-green and rolling deployments, health checks, rollback, monitoring, server load, scaling, endpoint latency' },
  ],
}

export const computedHours = syllabus.chapters.reduce((sum, c) => sum + c.hours, 0)

export const complianceScore = 74

export const findings = [
  {
    id: 'MATH-041',
    severity: 'CRITICAL',
    title: 'Syllabus Lecture Hour Sum Over-allocation',
    detail:
      'Stated total hours on the cover page do not match the aggregated duration of the chapter schedules.',
    stated: `${syllabus.statedHours} Hours`,
    computed: `${computedHours} Hours`,
    fix: 'Adjust Chapter 4 (Cloud Deployment Pipelines) down by 1 hour',
    fixNote: 'Re-allocate 21 contact hours to 20 contact hours.',
    tag: 'MATH ERROR',
    confidence: 'High Confidence AI Fix',
    before: {
      headline: `${computedHours} Hours Aggregated`,
      detail: `Chapter 4 allocates 21 hours. Total syllabus sum exceeds cover limit by ${computedHours - syllabus.statedHours} hr.`,
    },
    after: {
      headline: `${syllabus.statedHours} Hours Total Stated`,
      detail: 'Adjust Chapter 4 down to 20 hours to fit cover page specifications.',
    },
  },
  {
    id: 'MAP-012',
    severity: 'MEDIUM',
    title: 'Unassessed Course Outcomes',
    detail:
      'Course Outcome 3 (Cloud Deployment Verification) has no questions mapped in the generated diagnostics bank.',
    fix: 'Generate 4 items tagged to CO 3 at the Evaluate level',
    fixNote: 'Draws from Chapter 4 grounding materials.',
    tag: 'COVERAGE GAP',
    confidence: 'Review Needed',
    before: { headline: '0 items mapped to CO 3', detail: 'No diagnostic item assesses cloud deployment verification.' },
    after: { headline: '4 items mapped to CO 3', detail: 'Drafted at the Evaluate level from Chapter 4 materials.' },
  },
  {
    id: 'LEX-233',
    severity: 'MEDIUM',
    title: 'Title-Content Lexical Mismatch',
    detail:
      "Chapter 2 lists 'Asynchronous Javascript & APIs' but laboratory exercises focus exclusively on static iOS UI prototyping, creating a pedagogical disconnect.",
    fix: 'Re-title Chapter 2 laboratory block to match stated topic',
    fixNote: 'No hour re-allocation required.',
    tag: 'LEXICAL DRIFT',
    confidence: 'Review Needed',
    before: { headline: 'Lab exercises cover static iOS UI prototyping', detail: 'Chapter 2 is titled Asynchronous Javascript & APIs.' },
    after: { headline: 'Lab block re-titled to match the stated topic', detail: 'Chapter hours are unchanged.' },
  },
  {
    id: 'DUP-118',
    severity: 'LOW',
    title: 'Repeated Assessment Method Labels',
    detail:
      "The term 'Individual Machine Problem' is applied identically across both Chapter 1 and Chapter 3 without grading rubric variations.",
    fix: 'Append rubric variant labels to each occurrence',
    fixNote: 'Cosmetic; does not affect the compliance index.',
    tag: 'REDUNDANCY',
    confidence: 'Review Needed',
    before: {
      headline: '“Individual Machine Problem” used identically for Chapters 1 & 3.',
      detail: '',
    },
    after: {
      headline: 'Update Chapter 1 to “Introductory Mobile Prototyping Layout Lab”.',
      detail: '',
    },
  },
]

export const severityTone = { CRITICAL: 'bad', MEDIUM: 'warn', LOW: 'muted' }

export const deadlines = [
  { date: 'Mar 15', label: 'Midterm TOS Submission', note: 'Critical', critical: true },
  { date: 'Mar 20', label: 'Midterm Exam Diagnostic Bank', note: 'Upcoming', critical: false },
]

export const questions = [
  {
    id: 'Q1',
    short: 'Tech Stack',
    chapter: 1,
    co: 'CO 1',
    bloom: 'Analyze',
    version: '1.2',
    status: 'ok',
    alignment: 96,
    text: 'Which architecture constraint defines highly device-agnostic layouts over standard server-side rendering setups?',
    options: [
      { key: 'A', text: 'Mobile-First Progressive Enhancement using Responsive Breakpoints', correct: true },
      { key: 'B', text: 'Fixed Static Viewport with Dynamic CSS Grids', correct: false },
      { key: 'C', text: 'Server-rendered templates with fixed pixel widths', correct: false },
      { key: 'D', text: 'Native platform builds compiled per device class', correct: false },
    ],
    rationale:
      "Mobile-First frameworks ensure fluid, robust components without logical display overlaps, testing the student's deconstructive capabilities.",
    previous: {
      version: '1.1',
      text: 'Which architecture is best for mobile layouts setups?',
    },
    comments: [
      {
        author: 'Dr. Michael Torres',
        role: 'Department Chair',
        text: 'Approved item context. Ensure code items are evaluated with precise AST validators.',
      },
    ],
  },
  {
    id: 'Q2',
    short: 'Asynchronous API',
    chapter: 2,
    co: 'CO 2',
    bloom: 'Apply',
    version: '1.0',
    status: 'ok',
    alignment: 92,
    text: 'Given a fetch call that resolves after the component unmounts, which handler prevents a state update on an unmounted component?',
    options: [
      { key: 'A', text: 'An AbortController signal passed to fetch', correct: true },
      { key: 'B', text: 'Wrapping the call in a try/catch block', correct: false },
      { key: 'C', text: 'Increasing the request timeout', correct: false },
      { key: 'D', text: 'Caching the response in localStorage', correct: false },
    ],
    rationale:
      'Aborting the in-flight request on cleanup is the idiomatic guard; try/catch only handles thrown errors, not lifecycle races.',
    comments: [],
  },
  {
    id: 'Q3',
    short: 'CORS Origin Mismatch',
    chapter: 2,
    co: 'CO 2',
    bloom: 'Analyze',
    version: '1.1',
    status: 'warn',
    alignment: 71,
    text: 'A deployed client receives a CORS error against its own API subdomain. Which response header must the server return?',
    options: [
      { key: 'A', text: 'Access-Control-Allow-Origin naming the client origin', correct: true },
      { key: 'B', text: 'Content-Security-Policy with a frame-ancestors directive', correct: false },
      { key: 'C', text: 'X-Frame-Options set to SAMEORIGIN', correct: false },
      { key: 'D', text: 'Strict-Transport-Security with a long max-age', correct: false },
    ],
    rationale:
      'The browser requires the server to echo an allowed origin; the other headers govern framing and transport, not cross-origin reads.',
    flag: 'Distractors B-D share a security-header theme that may cue the answer by elimination.',
    comments: [
      {
        author: 'Dr. Michael Torres',
        role: 'Department Chair',
        text: 'Rework the distractors so they are not all transport-security headers.',
      },
    ],
  },
]

// Bank items. In Figma every card repeated "discrimination score: 0.48 (Good)", and chapter/CO
// tags contradicted the syllabus map (Ch 2 tagged CO 1 / CO 3). Both are corrected here: the CO
// of each item follows the chapter it belongs to.
const coForChapter = Object.fromEntries(syllabus.chapters.map((c) => [c.n, c.co]))

export const bankItems = [
  {
    id: 'Q-312',
    chapter: 2,
    bloom: 'Create',
    difficulty: 'Hard',
    text: 'Write an asynchronous JavaScript handler using fetch() to stream coordinates from a client to a cross-platform mobile backend under 200ms latency limits.',
    discrimination: 0.48,
    uses: 3,
    target: 'Asynchronous client-backend mobile handshake latency.',
    choices: [
      { key: 'A', text: 'Perform persistent polling on main thread.', correct: false },
      {
        key: 'B',
        text: 'Implement asynchronous fetch pipelines with edge latency caching.',
        correct: true,
      },
      { key: 'C', text: 'Synchronize full datasets directly via a blocking gateway.', correct: false },
    ],
    similarity: { pct: 88, source: 'A.Y. 2022 Midterm exam' },
  },
  {
    id: 'Q-313',
    chapter: 1,
    bloom: 'Analyze',
    difficulty: 'Medium',
    text: 'Analyze the state transition behaviors of responsive layouts when transitioning fluid viewports between landscape mobile devices and standard high-DPI desktop viewports.',
    discrimination: 0.36,
    uses: 1,
    target: 'Responsive breakpoint reasoning across viewport classes.',
    choices: [
      { key: 'A', text: 'Breakpoints re-flow the grid at defined widths.', correct: true },
      { key: 'B', text: 'The viewport scales the layout uniformly.', correct: false },
      { key: 'C', text: 'Layout is recomputed per device pixel ratio only.', correct: false },
    ],
  },
  {
    id: 'Q-314',
    chapter: 4,
    bloom: 'Evaluate',
    difficulty: 'Hard',
    text: 'Evaluate the security parameters of token-based authentication schemas during persistent endpoint handshakes over public unencrypted Wi-Fi protocols.',
    discrimination: 0.21,
    uses: 0,
    target: 'Token handling risk on untrusted transport.',
    choices: [
      { key: 'A', text: 'Short-lived tokens over TLS with rotation.', correct: true },
      { key: 'B', text: 'Long-lived bearer tokens cached on device.', correct: false },
      { key: 'C', text: 'Basic auth with a shared department password.', correct: false },
    ],
  },
].map((item) => ({ ...item, co: coForChapter[item.chapter] }))

export const bankTotal = 150

// Authored difficulty uses four levels (the filter popover offers Easy/Medium/Hard/Advanced).
// This is distinct from the computed difficulty *index* on the analysis screen, which is a
// p-value banded as Easy/Moderate/Hard — Figma used overlapping words for the two measures.
export const difficultyLevels = ['Easy', 'Medium', 'Hard', 'Advanced']

export function discriminationLabel(value) {
  if (value >= 0.4) return { label: 'Good', tone: 'text-ok' }
  if (value >= 0.3) return { label: 'Acceptable', tone: 'text-warn' }
  return { label: 'Needs revision', tone: 'text-bad' }
}

// Chair-side data. The Figma chair dashboard listed "CS 211 Data Structures" for the same course
// the faculty dashboard calls "IT 213 Data Structures & Algorithms"; the IT 213 code is used here.
export const instructors = {
  'ELEC 4': 'Dr. Evelyn Ramos',
  'IT 312': 'Prof. Maria Cruz',
  'IT 213': 'Engr. J. Santos',
}

export const chairMetrics = [
  { label: 'Syllabi Submitted', value: '92%', note: '23 of 25 active courses', icon: 'file' },
  { label: 'Syllabus Compliance', value: '88%', note: '4 critical alerts flagged', icon: 'shield' },
  { label: 'AI Usage / Cost', value: '74K / $2.40', note: 'Month-to-date token quota', icon: 'coins' },
  {
    label: 'Accreditation Readiness',
    value: 'A+',
    note: 'CHED Regional Standard 3.1',
    icon: 'award',
  },
]

export const approvalQueue = [
  {
    code: 'ELEC 4',
    title: 'Web & Mobile 2',
    type: 'TOS Draft',
    compliance: 74,
    action: 'Review Blueprint',
  },
  {
    code: 'IT 312',
    title: 'Human Computer Interaction',
    type: 'Midterm Exam',
    compliance: 100,
    action: 'Verify & Lock',
  },
  {
    code: 'IT 213',
    title: 'Data Structures & Algorithms',
    type: 'Syllabus Parse',
    compliance: 90,
    action: 'Review Blueprint',
  },
].map((r) => ({ ...r, instructor: instructors[r.code] }))

export const coCoverage = [
  { code: 'IT 312', label: 'IT 312 (HCI)', pct: 100 },
  { code: 'ELEC 4', label: 'ELEC 4 (Web & Mobile)', pct: 75 },
  { code: 'IT 213', label: 'IT 213 (Data Structures)', pct: 100 },
]

export const facultyActivity = [
  { text: 'Dr. Evelyn Ramos triggered an audit check for ELEC 4', when: '10 mins ago' },
  { text: 'Prof. Maria Cruz locked final TOS for IT 312', when: '2 hours ago' },
  { text: 'System parsed IT_213_Syllabus.docx successfully', when: '1 day ago' },
]

// One threshold for every compliance figure. Figma colored 90% amber ("Good") and 100% green
// with no stated rule; these bands are applied everywhere a percentage is shown.
export function complianceTone(pct) {
  if (pct >= 95) return { tone: 'ok', label: 'Passed', bar: 'bg-emerald-600' }
  if (pct >= 85) return { tone: 'warn', label: 'Good', bar: 'bg-accent' }
  return { tone: 'bad', label: 'Deficit', bar: 'bg-bad' }
}

// Item analysis. Figma showed a "CO 4 - Latency Security" that the syllabus never defines and
// relabelled CO 3; outcomes here come from `syllabus.outcomes`, so CO 3 stays cloud deployment.
export const analysisStats = [
  { label: 'KR-20 Reliability', value: '0.84', note: 'Highly Reliable (>0.80)' },
  { label: 'Avg. Discrimination', value: '0.42', note: 'Very Good Item Quality' },
  { label: 'Distractor Efficiency', value: '88%', note: '9 active distractors adjusted' },
]

// Number of answer sheets in the imported results file. Every count on the analysis screens is
// derived from it so the percentages and the student tallies can never drift apart.
export const cohortSize = 50

// Response distribution per item. The first option is always the key, and its share equals the
// difficulty index by definition, so the two can never contradict each other on screen.
export const analysedItems = [
  {
    id: 'Item 1',
    difficulty: 0.72,
    discrimination: 0.45,
    co: 'CO 1',
    distribution: [
      { key: 'A', pct: 72 },
      { key: 'B', pct: 12 },
      { key: 'C', pct: 10 },
      { key: 'D', pct: 6 },
    ],
  },
  {
    id: 'Item 2',
    difficulty: 0.21,
    discrimination: 0.15,
    co: 'CO 2',
    distribution: [
      { key: 'A', pct: 21 },
      { key: 'B', pct: 64 },
      { key: 'C', pct: 9 },
      { key: 'D', pct: 6 },
    ],
    // Figma attributed the 64% to "high-performing students". 64% is the share of the whole
    // cohort; the upper group is a subset of it, so the claim is restated against the cohort.
    flag: 'took Option B over the key. A distractor outdrawing the key by three to one points to a miskeyed item or an instruction gap, not to item difficulty.',
    revisionNote:
      'Replace Option B with a less plausible distractor and clarify the terminology around asynchronous promise resolution.',
  },
  {
    id: 'Item 3',
    difficulty: 0.55,
    discrimination: 0.08,
    co: 'CO 3',
    distribution: [
      { key: 'A', pct: 55 },
      { key: 'B', pct: 20 },
      { key: 'C', pct: 15 },
      { key: 'D', pct: 10 },
    ],
    flag: 'answered correctly, but upper and lower groups performed alike. The item separates nobody and cannot evidence attainment.',
    revisionNote:
      'Rewrite the stem so it requires the CO 3 deployment reasoning rather than recall of the platform name.',
  },
]

export const attainment = [
  { co: 'CO 1', pct: 84 },
  { co: 'CO 2', pct: 76 },
  { co: 'CO 3', pct: 62 },
]

export const attainmentTarget = 70

export function difficultyLabel(v) {
  if (v >= 0.7) return 'Easy'
  if (v >= 0.4) return 'Moderate'
  return 'Hard'
}

export function itemVerdict(discrimination) {
  if (discrimination >= 0.3) return { label: 'RETAIN', tone: 'ok' }
  if (discrimination >= 0.15) return { label: 'REVISE', tone: 'warn' }
  return { label: 'REJECT', tone: 'bad' }
}

// Admin configuration. Costs are shown in pesos throughout; the Figma chair card quoted "$2.40"
// while the admin card quoted "₱ 0.12", mixing currencies for the same system.
// Figma's provider drawer named the active engine "Vertex Gemini 1.5 Pro" while the admin card
// and the sign-in footer both credit "Contra Core Cognitive LLM". Contra Core is kept as the
// active primary to match the product branding, and Vertex is listed as the alternate it is.
export const aiProviders = [
  {
    id: 'contra-3.5',
    name: 'Contra Core Cognitive LLM (v3.5)',
    note: 'Primary pipeline for syllabus deconstruction and logical mapping.',
    region: 'asia-southeast1 (Singapore)',
    latency: '240 ms average',
    costPer1k: 0.08,
    priority: 'Priority 1 (Primary)',
    uptime: '99.98%',
    zeroTraining: true,
  },
  {
    id: 'vertex-gemini',
    name: 'Vertex Gemini 1.5 Pro',
    note: 'Fallback provider for long-document parsing when Contra Core is saturated.',
    region: 'us-central1 (Iowa)',
    latency: '310 ms average',
    costPer1k: 0.11,
    priority: 'Priority 2 (Fallback)',
    uptime: '99.95%',
    zeroTraining: true,
  },
  {
    id: 'psu-local',
    name: 'PSU On-Premise Parser',
    note: 'Runs inside the university network. Slower, no external data transfer.',
    region: 'Lingayen campus datacentre',
    latency: '1.4 s average',
    costPer1k: 0,
    priority: 'Priority 3 (Manual)',
    uptime: '99.20%',
    zeroTraining: true,
  },
]

// The user drawer models access as independent claims rather than one role. Figma's example
// granted Dr. Evelyn Ramos "System Administrator", contradicting her faculty role on every other
// screen, so claims here follow each account's actual role.
export const authorityClaims = ['System Administrator', 'Department Chair', 'Academic Faculty']

export const claimsByRole = {
  Faculty: ['Academic Faculty'],
  'Department Chair': ['Academic Faculty', 'Department Chair'],
  Administrator: ['System Administrator'],
}

// Question time estimator. The admin editor is the authority for base duration, and the exam
// configuration screen reads the multiple-choice row from here for its duration check.
//
// Two reconciliations:
//   1. Figma's overload panel called 1.2 min/item "optimal" for 50 items in 60 minutes. It is not:
//      50 x 1.2 = 60 min exactly, leaving nothing for review. The editor's own 1.5 min is used, and
//      the exam screen now derives the number of items that actually fit instead of repeating 1.2.
//   2. The editor states a per-type review buffer in seconds while the overload panel stated a flat
//      10% of total duration. The per-type figure is the specific one, so the buffer is computed as
//      items x bufferSecs; for 50 multiple-choice items that is 8.3 min, near the 10% it replaces.
export const timingTemplates = [
  {
    type: 'Multiple Choice',
    label: 'Multiple Choice Recall',
    minutes: 1.5,
    scale: 1.0,
    mapping: 'Remember',
    yearLevel: 'Freshman (1st Yr)',
    bufferSecs: 10,
  },
  {
    type: 'Identification',
    label: 'Identification Task',
    minutes: 2,
    scale: 1.1,
    mapping: 'Understand',
    yearLevel: 'Freshman (1st Yr)',
    bufferSecs: 15,
  },
  {
    type: 'Computational Problem',
    label: 'Computational Problem',
    minutes: 5,
    scale: 1.5,
    mapping: 'Apply/Analyze',
    yearLevel: 'Sophomore (2nd Yr)',
    bufferSecs: 30,
  },
  {
    type: 'Code Tracing',
    label: 'Code Tracing Exercise',
    minutes: 8,
    scale: 1.8,
    mapping: 'Analyze/Evaluate',
    yearLevel: 'Junior (3rd Yr)',
    bufferSecs: 45,
  },
  {
    type: 'Short Essay Prompt',
    label: 'Short Essay Prompt',
    minutes: 10,
    scale: 2.0,
    mapping: 'Evaluate/Create',
    yearLevel: 'Senior (4th Yr)',
    bufferSecs: 60,
  },
  {
    type: 'Lab Practical',
    label: 'Lab Practical Simulation',
    minutes: 15,
    scale: 2.5,
    // Figma's last row read "Create/Synthesis". Synthesis belongs to the 1956 taxonomy and was
    // renamed Create in the revised one this product uses throughout, so the duplicate is dropped.
    mapping: 'Create',
    yearLevel: 'Senior (4th Yr)',
    bufferSecs: 90,
  },
]

export const auditLog = [
  {
    source: 'OAuth Gateway',
    when: '10m ago',
    detail: 'Dr. Evelyn Ramos (PSU-Mail Login)',
    status: 'Success',
  },
  {
    source: 'Cognitive Parser',
    when: '1h ago',
    detail: 'AI Auto-Fixes Applied (ELEC 4)',
    status: 'Auto-Fix Completed',
  },
  {
    source: 'Contra Core',
    when: '3h ago',
    detail: 'System Backup Automated Sync',
    status: 'Success',
  },
]

export const monthlyTokenLimit = 200000

export const systemRoles = [
  { name: 'Dr. Evelyn Ramos', email: 'eramos@psu.edu.ph', role: 'Faculty', college: 'CCS' },
  { name: 'Prof. Maria Cruz', email: 'mcruz@psu.edu.ph', role: 'Faculty', college: 'CCS' },
  { name: 'Dr. Michael Torres', email: 'mtorres@psu.edu.ph', role: 'Department Chair', college: 'CCS' },
  { name: 'ICT Systems Admin', email: 'ict-admin@psu.edu.ph', role: 'Administrator', college: 'All' },
]

// Notifications. Figma had "Dr. Evelyn Ramos flagged hours mismatch" addressed to Evelyn herself,
// cited "12 core outcomes" for a 3-outcome syllabus, referenced an IT 311 course that exists
// nowhere else, and dated the TOS deadline to October (outside this term).
export const notifications = [
  {
    id: 'n1',
    group: 'Today',
    icon: 'file',
    tone: 'info',
    title: 'Syllabus Parsed',
    bold: 'ELEC 4',
    body: ` Web and Mobile syllabus parsed into ${syllabus.outcomes.length} course outcomes and ${syllabus.chapters.length} topic blocks.`,
    when: '10 minutes ago',
    unread: true,
    to: '/verification',
  },
  {
    id: 'n2',
    group: 'Today',
    icon: 'message',
    tone: 'warn',
    title: 'Reviewer Comment',
    bold: chair.name,
    body: ' flagged an hours mismatch on the ELEC 4 midterm mapping.',
    when: '2 hours ago',
    unread: true,
    to: '/consistency',
  },
  {
    id: 'n3',
    group: 'Earlier',
    icon: 'clock',
    tone: 'bad',
    title: 'Midterm TOS Deadline',
    body: `Submission deadline is approaching on ${deadlines[0].date} for all computing sciences courses.`,
    when: 'Yesterday',
    unread: false,
    to: '/tos',
  },
  {
    id: 'n4',
    group: 'Earlier',
    icon: 'x',
    tone: 'bad',
    title: 'OCR Pipeline Failed',
    body: 'IT 213 syllabus scan was low contrast. Please re-upload a clear copy.',
    when: '3 days ago',
    unread: false,
    to: '/upload',
  },
]

export const helpTopics = [
  {
    q: 'How are item counts computed from syllabus hours?',
    a: 'Each chapter receives items in proportion to its contact hours, using the largest-remainder method so the per-chapter counts always sum to the exact exam item target.',
  },
  {
    q: 'Why does the consistency checker flag my hour totals?',
    a: 'The cover page states a total number of contact hours. When the per-chapter schedule sums to a different figure, the audit flags the gap and proposes the smallest correction.',
  },
  {
    q: 'Can I edit AI-drafted items before approval?',
    a: 'Yes. Every drafted item stays editable until the department chair approves and locks the blueprint. Faculty remain accountable for the released exam.',
  },
  {
    q: 'What happens when I lock a TOS?',
    a: 'Locking freezes the allocation grid so generation and export draw from a stable distribution. Changing hours afterwards requires a fresh audit pass.',
  },
  {
    q: 'Who can see items I add to the question bank?',
    a: 'Items are scoped to your college by default. Sharing scope is shown on each item in the bank preview panel.',
  },
]

// Grounding materials. Each file carries the purpose it is used for; Figma's attach button label
// read "Attach Selected Materials ( Files)" with the count missing.
export const groundingLibrary = [
  {
    name: 'ELEC4-Chapter2-AsyncJS-APIs.pptx',
    kind: 'PowerPoint Presentation',
    size: 12.4,
    icon: 'presentation',
    purpose: 'Use for Topic Mapping',
    enabled: true,
  },
  {
    name: 'ELEC4_LabManual_HCI_Prototyping.pdf',
    kind: 'PDF Document',
    size: 4.2,
    icon: 'book',
    purpose: 'Use for Lab Questions',
    enabled: true,
  },
  {
    name: 'CHED_SpecialTopics_Guidelines.pdf',
    kind: 'PDF Document',
    size: 1.8,
    icon: 'file',
    purpose: 'Use for Compliance Reference',
    enabled: false,
  },
]

export const groundingSizeLimitMb = 50

// Export targets. Figma flagged Moodle XML "Recommended" in green while leaving PDF selected by
// default, so the recommendation pointed at a format nobody was choosing. The flag is kept but the
// recommended format is what the screen now opens on, and `ext` drives the produced bundle names
// so the download list always matches the format that was actually picked.
export const exportFormats = [
  {
    name: 'Moodle XML Format',
    ext: 'xml',
    note: 'Native LMS import',
    recommended: true,
    size: '842 KB',
  },
  { name: 'PDF Academic Layout', ext: 'pdf', note: 'Official institutional print copy', size: '4.2 MB' },
  { name: 'DOCX Word Document', ext: 'docx', note: 'Editable / Office standard', size: '1.6 MB' },
  { name: 'XLSX Exam Blueprint Matrix', ext: 'xlsx', note: 'Excellent for audit review', size: '1.1 MB' },
  { name: 'GIFT Import Scheme', ext: 'txt', note: 'Plaintext questions & choices', size: '96 KB' },
  { name: 'QTI Canvas/Blackboard Pack', ext: 'zip', note: 'Standardized learning metadata', size: '2.8 MB' },
  { name: 'Google Forms Template', ext: 'gform', note: 'Direct cloud sync format', size: '— (cloud)' },
  { name: 'JSON Schema', ext: 'json', note: 'Developer AST structures', size: '410 KB' },
]

// Help centre content. Figma's card used a teal accent (#0f766e) that appears on no other screen,
// so the help desk card uses the brand palette here. Its "Core Cognitive LLM latency: 12s average"
// also conflicts with the provider drawer's "240 ms average"; the two measure different things, so
// the status card now labels them separately.
export const helpCategories = [
  {
    icon: 'upload',
    title: 'Syllabus Extraction',
    body: 'Guides on uploading clear PDFs, companion handouts, and handling OCR on scanned documents.',
    to: '/upload',
  },
  {
    icon: 'table',
    title: 'TOS Generation',
    body: "How the AI computes lecture hours vs question tags mathematically using Bloom's cognitive taxonomy.",
    to: '/tos',
  },
  {
    icon: 'fileCheck',
    title: 'Compliance & Export',
    body: 'Exporting aligned question sheets directly to official CHED/PSU physical templates instantly.',
    to: '/export',
  },
  {
    icon: 'alert',
    title: 'System Consistency',
    body: 'Understanding system alerts for unassessed course outcomes and midterm lecture hours balance.',
    to: '/consistency',
  },
]

export const recentArticles = [
  { title: 'How do I align lab hours with lecture requirements?', to: '/verification' },
  {
    title: `Fixing the '${computedHours} computed vs ${syllabus.statedHours} stated hours' warning`,
    to: '/consistency',
  },
  { title: 'Invoking the OCR pipeline on legacy scans', to: '/upload' },
]

// Share of the individual monthly token allowance consumed, shown in the account popover.
export const tokenUsagePct = 62

// Upload pipeline steps. Figma's card reported a "Verified 25.4 MB" file while the dropzone states
// a 25 MB cap; the size shown here comes from the staged file instead of a fixed figure.
export const uploadSteps = [
  { label: 'Syllabus Upload & Integrity Lock (SHA-256 hash verified)', done: 'Completed' },
  { label: 'Malware & Security Quarantine Sandbox Scan', done: 'Passed' },
  {
    label: 'Optical Layout Decipher (OCR triggered: scanned PDF matched to CHED standard format)',
    done: 'Completed',
  },
  {
    label: 'Cognitive Outcome & Course Outcome Mapping (analyzing verb hierarchies)',
    done: 'Completed',
  },
  { label: 'PSU Mathematical & Topic Distribution Schema Compliance Run', done: 'Completed' },
]

export const uploadSizeLimitMb = 25

export const auditChecks = [
  'Hour Reconciliation Audit',
  'Title-to-Content Mismatch Analysis',
  'Duplicate Assessment Scan',
  'Course Outcome (CO) Coverage Check',
]
