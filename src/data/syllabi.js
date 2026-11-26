// Upload history. Every syllabus a faculty member uploads becomes one record here, and each
// feature screen (verification, consistency, TOS, bank, reviewer approval, item analysis) opens
// from a list of these records and shows only the data that belongs to the tapped syllabus.
import {
  analysedItems,
  analysisStats,
  attainment,
  bankItems,
  cohortSize,
  complianceScore,
  findings,
  instructors,
  syllabus,
  term,
  user,
} from './mock.js'

const withCo = (chapters, items) => {
  const coForChapter = Object.fromEntries(chapters.map((c) => [c.n, c.co]))
  return items.map((item) => ({ ...item, co: coForChapter[item.chapter] }))
}

// ELEC 4 is the syllabus every other screen in the prototype was designed around.
const elec4 = {
  id: 'elec4-2324-2',
  code: 'ELEC 4',
  title: 'Special Topics on Web and Mobile 2',
  term: term.label,
  file: syllabus.file,
  fileSize: 3.8,
  pages: syllabus.pages,
  uploadedOn: '2024-03-04T09:12:00',
  uploadedBy: user.name,
  instructor: instructors['ELEC 4'],
  statedHours: syllabus.statedHours,
  creditSplit: syllabus.creditSplit,
  lectureHours: 36,
  labHours: 54,
  outcomes: syllabus.outcomes,
  chapters: syllabus.chapters,
  complianceScore,
  findings: findings.map((f) => (f.id === 'MAP-012' ? { ...f, targetCo: 'CO 3' } : f)),
  bankItems,
  tosLocked: false,
  review: {
    state: 'For Review',
    thread: {
      item: `Item 3 (${bankItems[0].id})`,
      issue:
        'Question maps to “Asynchronous backend API integration” but targets “Simple local storage arrays”.',
      reply: `Understood. We will adjust the item target to utilize asynchronous Axios configurations to match ${bankItems[0].co}.`,
      when: '12 mins ago',
    },
  },
  analysis: {
    file: 'ELEC4_Midterm_Results_3A.csv',
    uploadedOn: '2024-03-21T15:40:00',
    exam: 'Midterm',
    section: 'Section 3A',
    cohortSize,
    stats: analysisStats,
    items: analysedItems,
    attainment,
  },
}

const it312Chapters = [
  { n: 1, title: 'Foundations of Human-Computer Interaction', hours: 12, co: 'CO 1',
    topics: 'usability, user experience, affordances, feedback, mental models, Norman design principles, perception, memory, attention, Fitts law, interaction styles' },
  { n: 2, title: 'User Research & Task Analysis', hours: 14, co: 'CO 1',
    topics: 'user research, interviews, surveys, personas, scenarios, task analysis, observation, contextual inquiry, requirements gathering, stakeholders, journey maps' },
  { n: 3, title: 'Prototyping & Usability Evaluation', hours: 16, co: 'CO 2',
    topics: 'prototypes, wireframes, mockups, low-fidelity and high-fidelity prototyping, heuristic evaluation, Nielsen heuristics, usability testing, think-aloud protocol, cognitive walkthrough, SUS, A/B testing' },
  { n: 4, title: 'Accessible & Inclusive Design', hours: 12, co: 'CO 3',
    topics: 'accessibility, WCAG, color contrast, screen readers, alt text, keyboard navigation, ARIA, disabilities, inclusive design, color blindness, captions, assistive technology' },
]

const it312 = {
  id: 'it312-2324-2',
  code: 'IT 312',
  title: 'Human Computer Interaction',
  term: term.label,
  file: 'IT_312_HCI_Syllabus.docx',
  fileSize: 1.2,
  pages: 5,
  uploadedOn: '2024-03-03T14:05:00',
  uploadedBy: instructors['IT 312'],
  instructor: instructors['IT 312'],
  statedHours: 54,
  creditSplit: '2 Lec + 1 Lab',
  lectureHours: 36,
  labHours: 18,
  outcomes: [
    { id: 'CO 1', text: 'Apply user-centred design principles to analyse interaction problems.', bloom: 'Apply' },
    { id: 'CO 2', text: 'Evaluate interface prototypes using heuristic and usability testing methods.', bloom: 'Evaluate' },
    { id: 'CO 3', text: 'Design accessible interfaces that meet WCAG 2.1 AA guidelines.', bloom: 'Create' },
  ],
  chapters: it312Chapters,
  complianceScore: 100,
  findings: [],
  bankItems: withCo(it312Chapters, [
    {
      id: 'Q-401',
      chapter: 3,
      bloom: 'Evaluate',
      difficulty: 'Medium',
      text: 'Evaluate which usability metric best evidences that a redesigned checkout flow reduced user error.',
      discrimination: 0.44,
      uses: 2,
      target: 'Choosing an outcome metric for a usability study.',
      choices: [
        { key: 'A', text: 'Error rate per completed task.', correct: true },
        { key: 'B', text: 'Average session length.', correct: false },
        { key: 'C', text: 'Number of page views per visit.', correct: false },
      ],
    },
    {
      id: 'Q-402',
      chapter: 4,
      bloom: 'Create',
      difficulty: 'Hard',
      text: 'Design the keyboard focus behaviour for a modal dialog so that it satisfies WCAG 2.1 AA.',
      discrimination: 0.38,
      uses: 1,
      target: 'Keyboard-accessible focus order for a modal dialog.',
      choices: [
        { key: 'A', text: 'Trap focus inside the dialog and return it to the trigger on close.', correct: true },
        { key: 'B', text: 'Move focus to the page footer when the dialog opens.', correct: false },
        { key: 'C', text: 'Disable keyboard focus while the dialog is open.', correct: false },
      ],
    },
    {
      id: 'Q-403',
      chapter: 1,
      bloom: 'Apply',
      difficulty: 'Easy',
      text: "Apply Fitts law: which change most reduces the time needed to hit a primary action on a touch screen?",
      discrimination: 0.52,
      uses: 4,
      target: "Fitts law applied to touch targets.",
      choices: [
        { key: 'A', text: 'Make the target larger and place it within the thumb zone.', correct: true },
        { key: 'B', text: 'Add a hover tooltip to the button.', correct: false },
        { key: 'C', text: 'Use a lighter font weight for the label.', correct: false },
      ],
    },
  ]),
  tosLocked: true,
  review: { state: 'Approved', thread: null },
  analysis: {
    file: 'IT312_Midterm_Results_2B.csv',
    uploadedOn: '2024-03-19T10:22:00',
    exam: 'Midterm',
    section: 'Section 2B',
    cohortSize: 42,
    stats: [
      { label: 'KR-20 Reliability', value: '0.81', note: 'Highly Reliable (>0.80)' },
      { label: 'Avg. Discrimination', value: '0.39', note: 'Good Item Quality' },
      { label: 'Distractor Efficiency', value: '91%', note: '4 active distractors adjusted' },
    ],
    items: [
      { id: 'Item 1', difficulty: 0.81, discrimination: 0.41, co: 'CO 1', distribution: [{ key: 'A', pct: 81 }, { key: 'B', pct: 9 }, { key: 'C', pct: 6 }, { key: 'D', pct: 4 }] },
      { id: 'Item 2', difficulty: 0.62, discrimination: 0.36, co: 'CO 2', distribution: [{ key: 'A', pct: 62 }, { key: 'B', pct: 21 }, { key: 'C', pct: 12 }, { key: 'D', pct: 5 }] },
      {
        id: 'Item 3',
        difficulty: 0.48,
        discrimination: 0.18,
        co: 'CO 3',
        distribution: [{ key: 'A', pct: 48 }, { key: 'B', pct: 30 }, { key: 'C', pct: 14 }, { key: 'D', pct: 8 }],
        flag: 'answered correctly, while upper and lower groups split almost evenly. The stem leans on WCAG clause numbers rather than design reasoning.',
        revisionNote: 'Rewrite the stem around a concrete interface so it tests the accessible design decision, not the clause number.',
      },
    ],
    attainment: [
      { co: 'CO 1', pct: 88 },
      { co: 'CO 2', pct: 79 },
      { co: 'CO 3', pct: 73 },
    ],
  },
}

const it213Chapters = [
  { n: 1, title: 'Arrays, Lists & Linked Structures', hours: 16, co: 'CO 1',
    topics: 'arrays, linked lists, nodes, pointers, head and tail, doubly linked lists, stacks, queues, push, pop, enqueue, dequeue, insertion, deletion, traversal, LIFO, FIFO' },
  { n: 2, title: 'Algorithm Analysis & Big-O', hours: 18, co: 'CO 2',
    topics: 'algorithm analysis, Big-O notation, time complexity, space complexity, asymptotic growth, constant, logarithmic, linear, quadratic and exponential time, worst case, best case, average case, nested loops, recursion' },
  { n: 3, title: 'Trees & Graphs', hours: 20, co: 'CO 3',
    topics: 'trees, binary trees, binary search trees, BST, root, leaf, height, inorder, preorder and postorder traversal, heaps, graphs, vertices, edges, adjacency matrix, adjacency list, breadth-first search (BFS), depth-first search (DFS), shortest path, Dijkstra, spanning trees' },
  { n: 4, title: 'Sorting & Searching', hours: 18, co: 'CO 4',
    topics: 'sorting algorithms, bubble sort, selection sort, insertion sort, merge sort, quicksort, pivot, partitioning, stable sorting, binary search, linear search, hashing, hash tables, hash functions, collisions, separate chaining, open addressing, linear probing, comparisons, swaps' },
]

const it213 = {
  id: 'it213-2324-2',
  code: 'IT 213',
  title: 'Data Structures & Algorithms',
  term: term.label,
  file: 'IT_213_Syllabus.docx',
  fileSize: 2.1,
  pages: 7,
  uploadedOn: '2024-03-02T08:47:00',
  uploadedBy: instructors['IT 213'],
  instructor: instructors['IT 213'],
  statedHours: 72,
  creditSplit: '2 Lec + 1 Lab',
  lectureHours: 36,
  labHours: 36,
  outcomes: [
    { id: 'CO 1', text: 'Implement linear data structures using arrays and linked nodes.', bloom: 'Apply' },
    { id: 'CO 2', text: 'Analyze the time and space complexity of algorithms using asymptotic notation.', bloom: 'Analyze' },
    { id: 'CO 3', text: 'Evaluate the suitability of tree and graph structures for a given problem.', bloom: 'Evaluate' },
    { id: 'CO 4', text: 'Design efficient sorting and searching solutions for large datasets.', bloom: 'Create' },
  ],
  chapters: it213Chapters,
  complianceScore: 90,
  findings: [
    {
      id: 'MAP-027',
      severity: 'MEDIUM',
      title: 'Unassessed Course Outcome (CO 3)',
      detail: 'Course Outcome 3 (Trees & Graphs) has no questions mapped in the generated diagnostics bank.',
      targetCo: 'CO 3',
      fix: 'Map pre-validated Chapter 3 items to CO 3 at the Evaluate level',
      fixNote: 'Draws from existing bank items; no new drafting required.',
      tag: 'COVERAGE GAP',
      confidence: 'Review Needed',
      before: { headline: '0 items mapped to CO 3', detail: 'No diagnostic item assesses tree and graph selection.' },
      after: { headline: '1 item mapped to CO 3', detail: 'Q-215 mapped at the Evaluate level.' },
    },
    {
      id: 'MAP-028',
      severity: 'MEDIUM',
      title: 'Unassessed Course Outcome (CO 4)',
      detail: 'Course Outcome 4 (Sorting & Searching) has no questions mapped in the generated diagnostics bank.',
      targetCo: 'CO 4',
      fix: 'Map pre-validated Chapter 4 items to CO 4 at the Create level',
      fixNote: 'Draws from existing bank items; no new drafting required.',
      tag: 'COVERAGE GAP',
      confidence: 'Review Needed',
      before: { headline: '0 items mapped to CO 4', detail: 'No diagnostic item assesses sorting and searching design.' },
      after: { headline: '1 item mapped to CO 4', detail: 'Q-216 mapped at the Create level.' },
    },
  ],
  bankItems: withCo(it213Chapters, [
    {
      id: 'Q-212',
      chapter: 1,
      bloom: 'Apply',
      difficulty: 'Easy',
      text: 'Implement the insertion of a node at the head of a singly linked list. Which pointer must be updated first?',
      discrimination: 0.46,
      uses: 3,
      target: 'Pointer ordering during linked-list insertion.',
      choices: [
        { key: 'A', text: "Set the new node's next to the current head.", correct: true },
        { key: 'B', text: 'Set the head to the new node.', correct: false },
        { key: 'C', text: "Set the tail's next to the new node.", correct: false },
      ],
    },
    {
      id: 'Q-213',
      chapter: 2,
      bloom: 'Analyze',
      difficulty: 'Medium',
      text: 'Analyze the running time of a loop that halves its input on every iteration.',
      discrimination: 0.4,
      uses: 2,
      target: 'Recognising logarithmic growth.',
      choices: [
        { key: 'A', text: 'O(log n)', correct: true },
        { key: 'B', text: 'O(n)', correct: false },
        { key: 'C', text: 'O(n log n)', correct: false },
      ],
    },
    {
      id: 'Q-215',
      chapter: 3,
      bloom: 'Evaluate',
      difficulty: 'Hard',
      text: 'Evaluate whether an adjacency matrix or an adjacency list better suits a sparse road network of 50,000 intersections.',
      discrimination: 0.35,
      uses: 0,
      target: 'Choosing a graph representation for sparse data.',
      choices: [
        { key: 'A', text: 'Adjacency list, because memory grows with edges rather than vertices squared.', correct: true },
        { key: 'B', text: 'Adjacency matrix, because lookups are always faster.', correct: false },
        { key: 'C', text: 'Either, because both use the same memory.', correct: false },
      ],
    },
    {
      id: 'Q-216',
      chapter: 4,
      bloom: 'Create',
      difficulty: 'Advanced',
      text: 'Design a search strategy for a sorted file of 10 million records that must answer each lookup in under 30 comparisons.',
      discrimination: 0.31,
      uses: 0,
      target: 'Designing a bounded-comparison search.',
      choices: [
        { key: 'A', text: 'Binary search over the sorted records.', correct: true },
        { key: 'B', text: 'Linear scan from the first record.', correct: false },
        { key: 'C', text: 'Hash the file on every lookup.', correct: false },
      ],
    },
  ]),
  tosLocked: false,
  review: { state: 'For Review', thread: null },
  analysis: null,
}

const elec3Chapters = [
  { n: 1, title: 'Responsive Web Foundations', hours: 20, co: 'CO 1',
    topics: 'semantic HTML, CSS, box model, flexbox, CSS grid, media queries, responsive design, viewport, breakpoints, mobile-first layouts, typography' },
  { n: 2, title: 'Client-side Scripting & the DOM', hours: 25, co: 'CO 2',
    topics: 'JavaScript, the DOM, events and event listeners, querySelector, elements, variables, functions, arrays, objects, form validation, DOM manipulation' },
  { n: 3, title: 'Mobile UI Frameworks', hours: 25, co: 'CO 2',
    topics: 'UI frameworks, Bootstrap, Tailwind, components, React, Vue, Ionic, mobile navigation, themes, touch gestures' },
  { n: 4, title: 'Testing & Publishing Web Apps', hours: 20, co: 'CO 3',
    topics: 'testing, unit tests, automated tests, Jest, Lighthouse audits, performance, debugging, publishing, deployment, hosting, domains, minification, Git version control' },
]

const elec3 = {
  id: 'elec3-2324-1',
  code: 'ELEC 3',
  title: 'Special Topics on Web and Mobile 1',
  term: '1st Sem, A.Y. 2023-2024',
  file: 'ELEC3_Syllabus_2023.pdf',
  fileSize: 3.1,
  pages: 6,
  uploadedOn: '2023-08-14T11:30:00',
  uploadedBy: user.name,
  instructor: instructors['ELEC 4'],
  statedHours: 90,
  creditSplit: '2 Lec + 1 Lab',
  lectureHours: 36,
  labHours: 54,
  outcomes: [
    { id: 'CO 1', text: 'Build responsive page layouts with semantic HTML and modern CSS.', bloom: 'Apply' },
    { id: 'CO 2', text: 'Develop interactive client-side features for web and mobile browsers.', bloom: 'Create' },
    { id: 'CO 3', text: 'Verify web application quality through automated testing before release.', bloom: 'Evaluate' },
  ],
  chapters: elec3Chapters,
  complianceScore: 96,
  findings: [],
  bankItems: withCo(elec3Chapters, [
    {
      id: 'Q-118',
      chapter: 1,
      bloom: 'Apply',
      difficulty: 'Easy',
      text: 'Apply a CSS media query so a two-column layout stacks into one column below 640px.',
      discrimination: 0.43,
      uses: 5,
      target: 'Writing a width-based media query.',
      choices: [
        { key: 'A', text: '@media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }', correct: true },
        { key: 'B', text: '@media print { .grid { display: none; } }', correct: false },
        { key: 'C', text: '.grid { width: 640px; }', correct: false },
      ],
    },
    {
      id: 'Q-121',
      chapter: 4,
      bloom: 'Evaluate',
      difficulty: 'Medium',
      text: 'Evaluate which test type best protects a checkout form against regressions across browser releases.',
      discrimination: 0.37,
      uses: 2,
      target: 'Choosing an end-to-end test for a critical flow.',
      choices: [
        { key: 'A', text: 'An automated end-to-end test run across target browsers.', correct: true },
        { key: 'B', text: 'A unit test of the submit handler alone.', correct: false },
        { key: 'C', text: 'A manual check before each semester.', correct: false },
      ],
    },
  ]),
  tosLocked: true,
  review: { state: 'Approved', thread: null },
  analysis: {
    file: 'ELEC3_Final_Results_3A.xlsx',
    uploadedOn: '2023-12-15T16:10:00',
    exam: 'Final',
    section: 'Section 3A',
    cohortSize: 48,
    stats: [
      { label: 'KR-20 Reliability', value: '0.86', note: 'Highly Reliable (>0.80)' },
      { label: 'Avg. Discrimination', value: '0.44', note: 'Very Good Item Quality' },
      { label: 'Distractor Efficiency', value: '93%', note: '3 active distractors adjusted' },
    ],
    items: [
      { id: 'Item 1', difficulty: 0.76, discrimination: 0.47, co: 'CO 1', distribution: [{ key: 'A', pct: 76 }, { key: 'B', pct: 12 }, { key: 'C', pct: 8 }, { key: 'D', pct: 4 }] },
      { id: 'Item 2', difficulty: 0.58, discrimination: 0.42, co: 'CO 2', distribution: [{ key: 'A', pct: 58 }, { key: 'B', pct: 22 }, { key: 'C', pct: 13 }, { key: 'D', pct: 7 }] },
      { id: 'Item 3', difficulty: 0.66, discrimination: 0.39, co: 'CO 3', distribution: [{ key: 'A', pct: 66 }, { key: 'B', pct: 18 }, { key: 'C', pct: 10 }, { key: 'D', pct: 6 }] },
    ],
    attainment: [
      { co: 'CO 1', pct: 86 },
      { co: 'CO 2', pct: 78 },
      { co: 'CO 3', pct: 81 },
    ],
  },
}

export const seedSyllabi = [elec4, it312, it213, elec3]

/** The most recent upload for a course code, used by screens that only know the code. */
export function latestForCode(list, code) {
  return [...list]
    .filter((s) => s.code === code)
    .sort((a, b) => b.uploadedOn.localeCompare(a.uploadedOn))[0]
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Builds the record for a freshly uploaded file. The prototype has no parser, so the extracted
 * content is taken from the latest upload of the same course (or ELEC 4 for a new course); the
 * file, course and term are the ones the user entered.
 */
export function createSyllabusRecord(list, { code, title, term: termLabel, file, fileSize, uploader }) {
  const base = latestForCode(list, code) ?? elec4
  const stamp = Date.now().toString(36)
  return {
    ...base,
    id: `${code.toLowerCase().replace(/\s+/g, '')}-${stamp}`,
    code,
    title,
    term: termLabel,
    file,
    fileSize,
    uploadedOn: new Date().toISOString(),
    // The faculty member who uploads a syllabus is the one who teaches it.
    uploadedBy: uploader.name,
    instructor: uploader.name,
    tosLocked: false,
    review: { state: 'Draft', thread: null },
    analysis: null,
  }
}

/**
 * Statistics for a results file uploaded against a syllabus that had none. Item outcomes follow the
 * syllabus outcomes so every row names a CO that exists.
 */
export function sampleAnalysis(record, fileName) {
  const shapes = [
    { difficulty: 0.74, discrimination: 0.44 },
    { difficulty: 0.57, discrimination: 0.36 },
    { difficulty: 0.42, discrimination: 0.22 },
    { difficulty: 0.63, discrimination: 0.4 },
  ]
  const items = record.outcomes.map((o, i) => {
    const s = shapes[i % shapes.length]
    const key = Math.round(s.difficulty * 100)
    const rest = 100 - key
    const b = Math.round(rest * 0.5)
    const c = Math.round(rest * 0.3)
    return {
      id: `Item ${i + 1}`,
      ...s,
      co: o.id,
      distribution: [
        { key: 'A', pct: key },
        { key: 'B', pct: b },
        { key: 'C', pct: c },
        { key: 'D', pct: rest - b - c },
      ],
      ...(s.discrimination < 0.3
        ? {
            revisionNote: `Tighten the stem so it requires ${o.id} reasoning rather than recall.`,
          }
        : {}),
    }
  })
  return {
    file: fileName,
    uploadedOn: new Date().toISOString(),
    exam: 'Midterm',
    section: 'Section 1A',
    cohortSize: 40,
    stats: [
      { label: 'KR-20 Reliability', value: '0.79', note: 'Acceptable (0.70-0.80)' },
      { label: 'Avg. Discrimination', value: '0.36', note: 'Good Item Quality' },
      { label: 'Distractor Efficiency', value: '85%', note: '5 active distractors adjusted' },
    ],
    items,
    attainment: record.outcomes.map((o, i) => ({ co: o.id, pct: [82, 74, 66, 71][i % 4] })),
  }
}
