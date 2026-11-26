// Reads a course syllabus into the fields the app works with: course code and title, credit units,
// stated contact hours, course outcomes (with Bloom's levels), and the course outline grouped into
// chapters with hours and the outcome each serves. It expects the text from extractText(), where
// table rows are tab-separated, and handles the common layouts: "Label: value" lines or label/value
// table cells, numbered or bulleted outcome lists, and outline tables with week / topic / hours / CO
// columns, grouped by "Unit 1", "Chapter 2", "Module 3" rows when present.
import { detectBloom, terms } from './classifyQuestions.js'

const sectionPrefix = String.raw`^(?:[IVX]+\.|\d+\.|[A-H]\.)?\s*`
const outcomesHeading = new RegExp(
  `${sectionPrefix}(?:course\\s+(?:intended\\s+)?(?:learning\\s+)?outcomes?|intended\\s+learning\\s+outcomes|learning\\s+outcomes|course\\s+objectives|CILOs?|CLOs?)\\b`,
  'i',
)
const outlineHeading = new RegExp(
  `${sectionPrefix}(?:course\\s+outline|course\\s+contents?|learning\\s+plan|topical\\s+outline|outline\\s+of\\s+topics|course\\s+calendar|weekly\\s+(?:schedule|plan|outline)|course\\s+schedule|topics?\\s+and\\s+schedule)\\b`,
  'i',
)
const otherHeading = new RegExp(
  `${sectionPrefix}(?:course\\s+description|program\\s+(?:educational\\s+)?(?:outcomes|objectives)|course\\s+requirements?|grading(?:\\s+system)?|assessments?(?:\\s+(?:tasks|plan))?|evaluation|references?|bibliography|suggested\\s+readings|learning\\s+resources|course\\s+polic(?:y|ies)|classroom\\s+polic(?:y|ies)|prepared\\s+by|reviewed\\s+by|approved\\s+by|course\\s+information|vision|mission|institutional\\s+outcomes)\\b`,
  'i',
)
const unitRow = /^(chapter|unit|module|part|lesson)\s*([0-9]+|[ivx]+)\b\s*[:.\-–]?\s*(.*)$/i
const examRow = /\b(?:prelim(?:inary)?|mid-?term|semi-?final|final)s?\s+(?:exam|examination|test)s?\b|\bexamination\s+week\b/i
const coRef = /\b(?:CO|CLO|CILO|LO)\s*-?\s*(\d{1,2})\b/gi
const wordCount = (s) => s.split(/\s+/).filter(Boolean).length

const labelPatterns = {
  code: /^(?:course\s*(?:code|no\.?|number)|subject\s*code)$/i,
  title: /^(?:course\s*title|descriptive\s*title|course\s*name|subject\s*title)$/i,
  units: /^(?:credit\s*units?|units|credits?|course\s*credits?|no\.?\s*of\s*units)$/i,
  hours: /^(?:total\s*)?(?:contact\s*hours|no\.?\s*of\s*hours|number\s*of\s*hours|total\s*hours|hours\s*per\s*(?:term|semester))$/i,
  lecHours: /^lec(?:ture)?\s*hours?$/i,
  labHours: /^lab(?:oratory)?\s*hours?$/i,
}

const romanValue = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 }
const firstNumber = (s) => {
  const m = String(s ?? '').match(/\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : null
}

function toLines(text) {
  return text
    .split(/\r?\n/)
    .map((raw) => {
      const cells = raw.split('\t').map((c) => c.replace(/\s+/g, ' ').trim())
      while (cells.length > 1 && cells.at(-1) === '') cells.pop()
      const filled = cells.filter(Boolean)
      return { cells, filled, text: filled.join(' ') }
    })
    .filter((l) => l.text)
}

const isHeading = (line, re) => line.filled.length === 1 && wordCount(line.text) <= 9 && re.test(line.text)
const anyHeading = (line) =>
  isHeading(line, outcomesHeading) || isHeading(line, outlineHeading) || isHeading(line, otherHeading)

/** "Label: value" lines and label/value table cells, keyed by which known label they match. */
function readFields(lines) {
  const found = {}
  const take = (label, value) => {
    const name = label.replace(/[:：]\s*$/, '').trim()
    for (const [key, re] of Object.entries(labelPatterns)) {
      if (!found[key] && re.test(name) && value) found[key] = value.trim()
    }
  }
  for (const line of lines) {
    if (line.filled.length === 1) {
      const m = line.text.match(/^([A-Za-z][A-Za-z ./()-]{2,40}?)\s*[:：]\s*(.+)$/)
      if (m) take(m[1], m[2])
    } else {
      for (let i = 0; i + 1 < line.filled.length; i++) {
        // A cell may also hold "Label: value" on its own.
        const own = line.filled[i].match(/^([A-Za-z][A-Za-z ./()-]{2,40}?)\s*[:：]\s*(.+)$/)
        if (own) take(own[1], own[2])
        else take(line.filled[i], line.filled[i + 1])
      }
      const last = line.filled.at(-1).match(/^([A-Za-z][A-Za-z ./()-]{2,40}?)\s*[:：]\s*(.+)$/)
      if (last) take(last[1], last[2])
    }
  }
  return found
}

function readCourseLine(lines) {
  // "IT 221 – Information Management" near the top, when there is no labelled code.
  for (const line of lines.slice(0, 30)) {
    const m = line.text.match(/^(?:course\s+syllabus\s+(?:in|for)\s+)?([A-Z]{2,6})\s?-?\s?(\d{1,3}[A-Z]?)\b\s*[–—:-]?\s*(.*)$/)
    if (m) return { code: `${m[1]} ${m[2]}`, title: m[3]?.trim() || null }
  }
  return {}
}

function readUnits(value) {
  if (!value) return {}
  const lec = value.match(/(\d+(?:\.\d+)?)\s*(?:units?\s*)?(?:of\s+)?lec(?:ture)?/i)
  const lab = value.match(/(\d+(?:\.\d+)?)\s*(?:units?\s*)?(?:of\s+)?lab(?:oratory)?/i)
  return {
    total: firstNumber(value),
    lec: lec ? Number(lec[1]) : null,
    lab: lab ? Number(lab[1]) : null,
  }
}

function readHourSplit(value) {
  if (!value) return {}
  const lec = value.match(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours)?\s*(?:of\s+)?lec(?:ture)?/i)
  const lab = value.match(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours)?\s*(?:of\s+)?lab(?:oratory)?/i)
  return { lec: lec ? Number(lec[1]) : null, lab: lab ? Number(lab[1]) : null }
}

/** The lines between a heading and the next section heading. */
function section(lines, headingRe) {
  const start = lines.findIndex((l) => isHeading(l, headingRe) || (l.filled.length > 1 && headingRe.test(l.filled[0]) && wordCount(l.filled[0]) <= 6 && l.filled.length <= 2 && !/\d/.test(l.filled[1] ?? '')))
  if (start < 0) return null
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((l) => anyHeading(l))
  return end < 0 ? rest : rest.slice(0, end)
}

function readOutcomes(lines, levels) {
  const body = section(lines, outcomesHeading)
  if (!body) return []
  const items = []
  const numbered = /^(?:(?:CO|CLO|CILO|LO)\s*-?\s*(\d{1,2})|(\d{1,2})|([a-h]))\s*[.:)\-–]?\s+(.{8,})$/i
  const intro = (t) => /able\s+to\b|^upon\s+completion|^at\s+the\s+end\s+of/i.test(t) || /:$/.test(t)
  const headerRow = (l) => l.filled.every((c) => /^(?:course\s+outcomes?|code|description|COs?|program\s+outcomes?|POs?|outcomes?)$/i.test(c))

  for (const line of body) {
    if (headerRow(line) || intro(line.text)) continue
    if (line.filled.length > 1) {
      // Table: "CO1 | Outcome text | (program outcome codes)".
      const idCell = line.filled.find((c) => /^(?:CO|CLO|CILO|LO)\s*-?\s*\d{1,2}$/i.test(c))
      const textCell = [...line.filled].filter((c) => c !== idCell).sort((a, b) => b.length - a.length)[0]
      if (textCell && textCell.length >= 15) {
        items.push({ num: idCell ? Number(idCell.match(/\d+/)[0]) : null, text: textCell })
      }
      continue
    }
    const m = line.text.match(numbered)
    if (m) {
      items.push({ num: m[1] ? Number(m[1]) : m[2] ? Number(m[2]) : null, text: m[4] })
    } else if (items.length && /^[a-z(]/.test(line.text)) {
      items.at(-1).text += ` ${line.text}` // wrapped line
    } else if (wordCount(line.text) >= 4) {
      items.push({ num: null, text: line.text }) // an unnumbered bullet
    }
  }

  return items.map((item, i) => {
    const text = item.text.replace(/\s+/g, ' ').replace(/\s*[;,.]?\s*(and)?$/i, '').trim()
    const id = `CO ${item.num ?? i + 1}`
    return { id, text: /[.!?]$/.test(text) ? text : `${text}.`, bloom: detectBloom(text, levels) }
  })
}

function readOutline(lines) {
  let body = section(lines, outlineHeading)
  // Without an outline heading, fall back to any table rows that carry hours.
  if (!body) body = lines.filter((l) => l.filled.length > 1)
  const warnings = []
  let cols = {}
  const rows = []
  let examHours = 0

  for (const line of body) {
    const lower = line.cells.map((c) => c.toLowerCase())
    const headerHits = lower.filter((c) => /week|topic|content|lesson|hours|hrs|time|outcome|^cos?$|cilo/.test(c)).length
    if (headerHits >= 2 && !line.cells.some((c) => /^\d+(\.\d+)?$/.test(c))) {
      const find = (re) => {
        const i = lower.findIndex((c) => re.test(c))
        return i < 0 ? null : i
      }
      cols = {
        week: find(/week|date|session/),
        topic: find(/topic|content|subject\s*matter|lesson|module/),
        hours: find(/hours|hrs|time\s*allot|no\.?\s*of\s*h|duration/),
        co: find(/^(?:cos?|cilos?|clos?|co\s*mapp|outcomes?\s*addressed)$/) ?? find(/\bcos?\b|cilo|clo/),
      }
      continue
    }

    const cell = (i) => (i == null ? '' : (line.cells[i] ?? ''))
    const cos = [...new Set([...(cols.co != null ? cell(cols.co) : line.text).matchAll(coRef)].map((m) => `CO ${Number(m[1])}`))]
    // Hours only come from a cell that is just a number ("6", "6 hrs"), never from a CO label.
    const hoursCell = /^\d+(\.\d+)?\s*(?:hrs?|hours)?$/i
    let hours = cols.hours != null && hoursCell.test(cell(cols.hours)) ? firstNumber(cell(cols.hours)) : null
    if (hours == null) {
      const bare = line.cells.find((c, i) => i !== cols.week && hoursCell.test(c))
      hours = bare ? firstNumber(bare) : firstNumber(line.text.match(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours)\b/i)?.[0])
    }
    const textCells = line.filled.filter(
      (c) =>
        line.cells.indexOf(c) !== cols.week &&
        !/^\d+(\.\d+)?\s*(?:hrs?|hours)?$/i.test(c) &&
        !/^(?:week\s*)?\d+(?:\s*[-–]\s*\d+)?$/i.test(c) &&
        !/^(?:(?:CO|CLO|CILO|LO)\s*-?\s*\d{1,2}[,;\s]*)+$/i.test(c),
    )
    // A one-cell line (a wrapped cell, or a unit heading spanning the row) is text wherever it sits.
    const single = line.filled.length === 1 && !/^\d+(\.\d+)?$/.test(line.filled[0]) ? line.filled[0] : ''
    let topic =
      single || (cols.topic != null && cell(cols.topic)) || textCells.sort((a, b) => b.length - a.length)[0] || ''
    // A PDF cell boundary too close to the text can glue the hours onto the topic ("… and 6").
    if (hours == null && cols.hours != null && cos.length) {
      const glued = topic.match(/^(.*\S)\s+(\d{1,2}(?:\.\d+)?)$/)
      if (glued) {
        topic = glued[1]
        hours = Number(glued[2])
      }
    }
    if (!topic && hours == null) continue
    if (examRow.test(topic)) {
      examHours += hours ?? 0
      continue
    }
    const unit = topic.match(unitRow)
    if (unit) {
      rows.push({ unit: true, num: /^\d+$/.test(unit[2]) ? Number(unit[2]) : romanValue[unit[2].toLowerCase()], title: unit[3].trim(), hours, cos })
    } else if (hours == null && cos.length === 0 && line.filled.length === 1 && rows.length) {
      // A cell that wrapped onto the next line: it continues the row above.
      const last = rows.at(-1)
      if (last.unit) last.title = `${last.title} ${topic}`.trim()
      else last.topic += ` ${topic}`
    } else if (topic) {
      rows.push({ topic, hours, cos })
    }
  }

  // Group rows under their unit / chapter headings, or treat each row as a chapter.
  const grouped = []
  const hasUnits = rows.some((r) => r.unit)
  for (const r of rows) {
    if (r.unit) {
      grouped.push({ title: r.title, hours: r.hours ?? 0, cos: [...r.cos], topics: [], num: r.num })
    } else if (hasUnits && grouped.length) {
      const g = grouped.at(-1)
      g.hours += r.hours ?? 0
      g.cos.push(...r.cos)
      g.topics.push(r.topic)
      if (!g.title) g.title = r.topic
    } else if (!hasUnits) {
      grouped.push({ title: r.topic, hours: r.hours ?? 0, cos: [...r.cos], topics: [r.topic] })
    }
  }
  if (examHours) warnings.push(`Examination weeks (${examHours} hrs) are not counted as topic hours.`)
  return { chapters: grouped.filter((g) => /[a-z].*[a-z].*[a-z]/i.test(g.title)), warnings }
}

/** The outcome a chapter serves: the one its rows cite most, else the closest in wording. */
function chapterOutcome(chapter, outcomes) {
  if (chapter.cos.length) {
    const counts = new Map()
    chapter.cos.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1))
    const known = [...counts.entries()].filter(([c]) => outcomes.some((o) => o.id === c))
    if (known.length) return { co: known.sort((a, b) => b[1] - a[1])[0][0], inferred: false }
  }
  if (!outcomes.length) return { co: null, inferred: true }
  const words = new Set(terms(`${chapter.title} ${chapter.topics.join(' ')}`))
  const scored = outcomes.map((o) => ({ id: o.id, score: terms(o.text).filter((t) => words.has(t)).length }))
  const best = scored.sort((a, b) => b.score - a.score)[0]
  return { co: best.id, inferred: true }
}

/**
 * @param {string} text output of extractText()
 * @param {Array} levels the user's Bloom's levels
 */
export function parseSyllabus(text, levels) {
  const lines = toLines(text)
  const fields = readFields(lines)
  const fallback = readCourseLine(lines)
  const units = readUnits(fields.units)
  const split = readHourSplit(fields.hours)
  const warnings = []

  let lectureHours = firstNumber(fields.lecHours) ?? split.lec
  let labHours = firstNumber(fields.labHours) ?? split.lab
  if (lectureHours == null && units.lec != null) lectureHours = units.lec * 18
  if (labHours == null && units.lab != null) labHours = units.lab * 54
  let statedHours = firstNumber(fields.hours)
  if (statedHours == null && (lectureHours != null || labHours != null)) {
    statedHours = (lectureHours ?? 0) + (labHours ?? 0)
    warnings.push(
      fields.lecHours || fields.labHours
        ? 'Total contact hours were not stated; using lecture + laboratory hours.'
        : 'Contact hours were not stated; computed from credit units (18 hrs per lecture unit, 54 per laboratory unit).',
    )
  }

  const creditSplit =
    units.lec != null || units.lab != null
      ? [units.lec ? `${units.lec} Lec` : null, units.lab ? `${units.lab} Lab` : null].filter(Boolean).join(' + ')
      : units.total
        ? `${units.total} Units`
        : '—'

  const outcomes = readOutcomes(lines, levels)
  const outline = readOutline(lines)
  warnings.push(...outline.warnings)

  const chapters = outline.chapters.map((c, i) => {
    const { co, inferred } = chapterOutcome(c, outcomes)
    return {
      n: i + 1,
      title: c.title.replace(/\s*[:.\-–]\s*$/, ''),
      hours: c.hours,
      co,
      coInferred: inferred,
      topics: c.topics.join('; '),
    }
  })

  return {
    code: fields.code?.replace(/\s+/g, ' ') ?? fallback.code ?? null,
    title: fields.title ?? fallback.title ?? null,
    statedHours,
    lectureHours,
    labHours,
    creditSplit,
    outcomes,
    chapters,
    warnings,
  }
}

const weight = { CRITICAL: 14, MEDIUM: 6, LOW: 2 }

/** Consistency findings for a parsed syllabus, and the compliance score they leave. */
export function auditSyllabus({ statedHours, outcomes, chapters }) {
  const findings = []
  const total = chapters.reduce((sum, c) => sum + c.hours, 0)

  if (statedHours == null) {
    findings.push({
      id: 'HRS-001',
      severity: 'MEDIUM',
      title: 'Stated Contact Hours Not Found',
      detail: 'The syllabus does not state its total contact hours, so the topic hours cannot be reconciled.',
      fix: 'Enter the stated contact hours on the verification screen',
      fixNote: 'Taken from the course information on the cover page.',
      tag: 'MISSING FIELD',
      confidence: 'Review Needed',
      before: { headline: 'No stated contact hours', detail: `Topics allot ${total} hours in total.` },
      after: { headline: 'Stated hours recorded', detail: 'Topic hours can then be reconciled.' },
    })
  } else if (total !== statedHours) {
    const diff = total - statedHours
    const largest = [...chapters].sort((a, b) => b.hours - a.hours)[0]
    findings.push({
      id: 'MATH-001',
      severity: 'CRITICAL',
      title: diff > 0 ? 'Topic Hours Exceed Stated Contact Hours' : 'Topic Hours Short of Stated Contact Hours',
      detail: `The course outline allots ${total} hours, but the syllabus states ${statedHours} contact hours.`,
      stated: `${statedHours} Hours`,
      computed: `${total} Hours`,
      fix: largest
        ? `Adjust Chapter ${largest.n} (${largest.title}) ${diff > 0 ? 'down' : 'up'} by ${Math.abs(diff)} hour${Math.abs(diff) === 1 ? '' : 's'}`
        : 'Add the course outline topics and their hours',
      fixNote: largest ? `Re-allocate ${largest.hours} contact hours to ${largest.hours - diff}.` : '',
      tag: 'MATH ERROR',
      confidence: 'High Confidence AI Fix',
      before: { headline: `${total} Hours Aggregated`, detail: `Off from the stated total by ${Math.abs(diff)} hr.` },
      after: { headline: `${statedHours} Hours Total Stated`, detail: largest ? `Chapter ${largest.n} set to ${largest.hours - diff} hours.` : '' },
    })
  }

  const mapped = new Set(chapters.map((c) => c.co))
  outcomes
    .filter((o) => !mapped.has(o.id))
    .forEach((o, i) => {
      findings.push({
        id: `MAP-${String(i + 1).padStart(3, '0')}`,
        severity: 'MEDIUM',
        title: `Unassessed Course Outcome (${o.id})`,
        detail: `${o.id} (${o.text.replace(/\.$/, '')}) is not addressed by any topic in the course outline.`,
        targetCo: o.id,
        fix: `Map a course outline topic to ${o.id}`,
        fixNote: 'Or add bank items that assess it.',
        tag: 'COVERAGE GAP',
        confidence: 'Review Needed',
        before: { headline: `0 topics mapped to ${o.id}`, detail: 'No outline topic serves this outcome.' },
        after: { headline: `${o.id} mapped`, detail: 'At least one topic assesses this outcome.' },
      })
    })

  chapters
    .filter((c) => c.hours === 0)
    .forEach((c) => {
      findings.push({
        id: `HRS-1${String(c.n).padStart(2, '0')}`,
        severity: 'MEDIUM',
        title: `No Hours Allotted to Chapter ${c.n}`,
        detail: `“${c.title}” appears in the outline without any contact hours.`,
        fix: `Allot hours to Chapter ${c.n}`,
        fixNote: 'Edit the hours on the verification screen.',
        tag: 'MISSING HOURS',
        confidence: 'Review Needed',
        before: { headline: '0 hours', detail: c.title },
        after: { headline: 'Hours allotted', detail: 'The TOS can then weight this chapter.' },
      })
    })

  chapters
    .filter((c) => c.coInferred && c.co)
    .forEach((c) => {
      findings.push({
        id: `MAP-1${String(c.n).padStart(2, '0')}`,
        severity: 'LOW',
        title: `Outcome Mapping Inferred for Chapter ${c.n}`,
        detail: `The outline does not name an outcome for “${c.title}”; ${c.co} was chosen as the closest match.`,
        fix: `Confirm ${c.co} for Chapter ${c.n}`,
        fixNote: 'Change it on the verification screen if it is wrong.',
        tag: 'INFERRED MAPPING',
        confidence: 'Review Needed',
        before: { headline: `${c.co} (inferred)`, detail: c.title },
        after: { headline: `${c.co} confirmed`, detail: 'Mapping recorded by faculty.' },
      })
    })

  const score = Math.max(0, 100 - findings.reduce((sum, f) => sum + weight[f.severity], 0))
  return { findings, complianceScore: score }
}
