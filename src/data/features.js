// Feature screens that open from the syllabus history list. `path` is the list; the screen for one
// syllabus lives at `${path}/:syllabusId`.
export const features = {
  verification: {
    path: '/verification',
    title: 'Syllabus Extraction Verification',
    listSubtitle: 'Choose an uploaded syllabus to review its extracted course outcomes and topic hours.',
  },
  consistency: {
    path: '/consistency',
    title: 'Syllabus Integrity & Consistency Audit',
    listSubtitle: 'Choose an uploaded syllabus to audit its stated-versus-computed figures.',
  },
  tos: {
    path: '/tos',
    title: 'Table of Specifications (TOS) Builder',
    listSubtitle: 'Choose an uploaded syllabus to compute its item distribution grid.',
  },
  bank: {
    path: '/bank',
    title: 'AI-Aligned Question Bank',
    listSubtitle: 'Choose an uploaded syllabus to browse the bank items mapped to its course outcomes.',
  },
  approval: {
    path: '/approval',
    title: 'Reviewer & Peer Verification',
    listSubtitle: 'Choose a submitted syllabus to compare its TOS blueprint against the drafted items.',
  },
  analysis: {
    path: '/analysis',
    title: 'Item Analysis & CO Attainment',
    listSubtitle: 'Choose an uploaded results file to review item statistics and outcome attainment.',
    results: true,
  },
}

/** Where a feature screen for one syllabus lives. */
export function featurePath(key, syllabusId) {
  return syllabusId ? `${features[key].path}/${syllabusId}` : features[key].path
}
