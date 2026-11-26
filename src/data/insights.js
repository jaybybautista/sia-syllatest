// Facts the dashboards report about syllabi, all computed from the records themselves so every
// number and status follows what users have actually done.
import { formatDate } from './syllabi.js'
import { computeGaps } from '../lib/tosGaps.js'

export const computedHours = (s) => s.chapters.reduce((sum, c) => sum + c.hours, 0)

/** The syllabi a faculty member is responsible for: ones they teach or uploaded. */
export function isOwnedBy(syllabus, account) {
  return syllabus.instructor === account.name || syllabus.uploadedBy === account.name
}

/**
 * Keeps only the newest upload of each course per instructor, so a re-upload replaces the older one
 * while two instructors teaching the same course each keep their own syllabus.
 */
export function latestPerCourse(list) {
  const newest = new Map()
  for (const s of list) {
    const key = `${s.code}|${s.instructor}`
    const held = newest.get(key)
    if (!held || s.uploadedOn > held.uploadedOn) newest.set(key, s)
  }
  return [...newest.values()]
}

/** The most pressing problem on a syllabus, or null when it has none. */
export function syllabusIssue(s) {
  const hours = computedHours(s)
  if (hours !== s.statedHours) {
    return { kind: 'hours', text: `${hours} computed vs ${s.statedHours} stated hours` }
  }
  if (s.findings.length) {
    const more = s.findings.length - 1
    return { kind: 'findings', text: `${s.findings[0].title}${more ? ` (+${more} more)` : ''}` }
  }
  return null
}

/** Where the syllabus is in its review: the chair's decision, or whether it is ready to submit. */
export function syllabusStatus(s) {
  switch (s.review.state) {
    case 'Approved':
      return { label: 'Approved', tone: 'ok' }
    case 'Revisions':
      return { label: 'Revisions Requested', tone: 'bad' }
    case 'For Review':
      return { label: 'Awaiting Review', tone: 'info' }
    default:
      return syllabusIssue(s) ? { label: 'Needs Fixes', tone: 'warn' } : { label: 'Draft', tone: 'muted' }
  }
}

/** How far the syllabus has got: parsed, TOS locked, items banked, results analysed. */
export function syllabusStage(s) {
  if (s.analysis) return { label: 'Results Analysed', feature: 'analysis' }
  if (s.tosLocked && s.bankItems.length) return { label: 'Exam Bank', feature: 'bank' }
  if (s.tosLocked) return { label: 'TOS Locked', feature: 'bank' }
  return { label: 'Syllabus', feature: 'tos' }
}

/** The faculty screen a dashboard row should open: the fix for its issue, otherwise the next step. */
export function nextFeatureFor(s) {
  const issue = syllabusIssue(s)
  if (issue) return issue.kind === 'hours' ? 'verification' : 'consistency'
  const stage = syllabusStage(s).feature
  return stage === 'analysis' ? 'bank' : stage
}

/** When anything last changed on the syllabus. */
export function lastChangedOn(s) {
  const dates = [
    s.uploadedOn,
    s.updatedOn,
    s.analysis?.uploadedOn,
    ...s.bankItems.map((q) => q.imported?.on),
  ].filter(Boolean)
  return dates.sort().at(-1)
}

/** Share of the syllabus's course outcomes with at least one bank item mapped to them. */
export function outcomeCoverage(s) {
  if (!s.outcomes.length) return 0
  const mapped = new Set(s.bankItems.map((q) => q.co))
  return Math.round((s.outcomes.filter((o) => mapped.has(o.id)).length / s.outcomes.length) * 100)
}

export function timeAgo(iso, now = Date.now()) {
  if (!iso) return '—'
  const mins = Math.round((now - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return formatDate(iso)
}

export function shortDate(isoDay) {
  return new Date(`${isoDay}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Whether a term deadline is met by the given syllabi: `tos` needs every TOS locked, `bank` needs
 * the question bank to fill every slot of the exam's TOS.
 */
export function deadlineState(deadline, list, examConfig, levels) {
  if (list.length === 0) return { note: 'No syllabi this term', tone: 'text-ink-3' }
  const pending =
    deadline.check === 'tos'
      ? list.filter((s) => !s.tosLocked)
      : list.filter((s) => computeGaps({ syllabus: s, examConfig, levels }).gap > 0)
  if (pending.length === 0) return { note: 'Done', tone: 'text-ok' }
  return {
    note: `${pending.length} of ${list.length} pending: ${pending.map((s) => s.code).join(', ')}`,
    tone: 'text-bad',
  }
}

/** "37 KB" for small files, "3.8 MB" otherwise. Sizes are stored in MB. */
export function fileSizeLabel(mb) {
  if (mb == null) return ''
  return mb < 1 ? `${Math.max(1, Math.round(mb * 1024))} KB` : `${mb.toFixed(1)} MB`
}
