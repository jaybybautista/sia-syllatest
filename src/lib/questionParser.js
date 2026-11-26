// Splits the raw text of an exam into questions. It understands the layouts teachers usually
// use: numbered items ("1.", "1)", "Q1:"), lettered choices on their own lines or inline
// ("A. … B. …"), a correct choice marked with * or "(correct)", "Answer: B" lines, test-part
// headings ("Test II. True or False") and an answer key at the end ("1. B  2. C" or "1-B").

export const questionTypes = ['Multiple Choice', 'True or False', 'Short Answer', 'Code Writing', 'Essay']

const questionStart = /^\s*(?:(?:q(?:uestion)?|item|no\.?)\s*)?(\d{1,3})\s*[.):]\s*(\S.*)$/i
// OCR often drops the space after the letter ("A.1  B.2"), so a capital letter may run straight on.
const choiceLine = /^\s*[([]?([A-Ea-e])[)\].:](\s*)(\S.*)$/
const inlineChoiceMarker = /(?:^|\s)[([]?([A-E])[)\].](?:\s+|(?=[^\s.]))/g
const answerLine = /^\s*(?:correct\s+)?(?:answer|ans|key)\s*[:=-]\s*(.+)$/i
const answerKeyHeading = /^\s*(?:answer\s*key|answers|key\s+to\s+correction|answer\s+sheet)\b[\s:.-]*$/i
const partHeading = /^\s*(?:part|test|section)\s+(?:[ivx]+|\d+|[a-e])\b/i
const romanHeading = /^\s*[ivx]+\s*[.):-]\s*\S/i
const wordCount = (s) => s.split(/\s+/).filter(Boolean).length

/** "Test II. True or False", "Part 3: Essay", "IV. IDENTIFICATION", or a short line naming a test type. */
function isHeading(line, q) {
  if (q) {
    // "2. TRUE OR FALSE" on its own is a heading; "2. True or false: a stack is LIFO." is an item.
    return wordCount(q[2]) <= 4 && sectionType(q[2]) !== null
  }
  if (partHeading.test(line)) return true
  if (romanHeading.test(line) && sectionType(line)) return true
  return wordCount(line) <= 6 && sectionType(line) !== null && !/[?]/.test(line)
}
const pointsTag = /\s*[([]\s*(\d+(?:\.\d+)?)\s*(?:pts?|points?|marks?)\s*[)\]]\s*/i
const correctMarker = /^\s*\*\s*|\s*(?:\*|\(correct\)|✓|✔)\s*$/i

const sectionType = (line) => {
  const l = line.toLowerCase()
  if (/true\s+or\s+false|\bt\s*\/\s*f\b/.test(l)) return 'True or False'
  if (/multiple\s+choice/.test(l)) return 'Multiple Choice'
  if (/identification|fill\s+in/.test(l)) return 'Short Answer'
  if (/essay/.test(l)) return 'Essay'
  if (/programming|problem\s+solving|coding/.test(l)) return 'Code Writing'
  return null
}

function splitInlineChoices(text, from = 0) {
  const markers = [...text.matchAll(inlineChoiceMarker)]
  // Only treat as inline choices when the letters run in order (from A, or from the next letter due).
  const run = []
  for (const m of markers) {
    if (m[1].charCodeAt(0) - 65 === from + run.length) run.push(m)
  }
  if (run.length < 2) return { stem: text, choices: [] }
  const stem = text.slice(0, run[0].index).trim()
  const choices = run.map((m, i) => {
    const start = m.index + m[0].length
    const end = i + 1 < run.length ? run[i + 1].index : text.length
    return { key: m[1], text: text.slice(start, end).trim() }
  })
  return { stem, choices }
}

function cleanChoice(key, raw) {
  const correct = correctMarker.test(raw)
  return { key: key.toUpperCase(), text: raw.replace(correctMarker, '').trim(), correct }
}

/**
 * Parses "1. B  2. C", "1-B, 2-C", "1) True" and "1. Stack" style key entries. OCR sometimes
 * merges a separator into a dot ("7.B.8.C"), so entries may also be split by dots.
 */
function parseKeyLine(line, keys) {
  const pairs = [...line.matchAll(/(\d{1,3})\s*[.):-]?\s*([A-E]\b|true\b|false\b|[A-Za-z][\w\s()./+#-]*?)(?=[\s.,;]+\d{1,3}\s*[.):-]|\s*[,;]|[\s.]*$)/gi)]
  pairs.forEach(([, n, value]) => keys.set(Number(n), value.trim()))
}

/**
 * @param {string} raw
 * @returns {{questions: Array, warnings: string[]}}
 */
export function parseQuestions(raw) {
  const lines = raw
    .replace(/\u00A0/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())

  const questions = []
  const keys = new Map()
  let current = null
  let section = null
  let inKey = false

  const finish = () => {
    if (!current) return
    if (current.choices.length === 0) {
      const { stem, choices } = splitInlineChoices(current.text)
      if (choices.length) {
        current.text = stem
        current.choices = choices.map((c) => cleanChoice(c.key, c.text))
      }
    }
    questions.push(current)
    current = null
  }

  for (const line of lines) {
    // Blank lines and answer lines ("________") carry no question text.
    if (!line || /^[_\-.\s]+$/.test(line)) continue

    if (answerKeyHeading.test(line)) {
      finish()
      inKey = true
      continue
    }
    if (inKey) {
      if (!partHeading.test(line) && !romanHeading.test(line)) parseKeyLine(line, keys)
      continue
    }

    const answer = line.match(answerLine)
    if (answer && current) {
      current.answer = answer[1].trim()
      continue
    }

    const q = line.match(questionStart)
    if (isHeading(line, q)) {
      finish()
      section = sectionType(line) ?? section
      continue
    }

    if (q) {
      finish()
      let text = q[2]
      let points = null
      const pts = text.match(pointsTag)
      if (pts) {
        points = Number(pts[1])
        text = text.replace(pointsTag, ' ').trim()
      }
      current = { number: Number(q[1]), text, choices: [], answer: null, points, section }
      continue
    }

    const c = line.match(choiceLine)
    const lowerWithoutSpace = c && c[1] === c[1].toLowerCase() && !c[2]
    if (c && !lowerWithoutSpace && current && c[1].toUpperCase().charCodeAt(0) - 65 === current.choices.length) {
      // A row of choices ("A. Quicksort  B. Merge sort  C. …") adds them all.
      const row = splitInlineChoices(line, current.choices.length).choices
      if (row.length >= 2) row.forEach((r) => current.choices.push(cleanChoice(r.key, r.text)))
      else current.choices.push(cleanChoice(c[1], c[3]))
      continue
    }

    if (current) {
      // Wrapped text: continue the last choice, or the question stem.
      const last = current.choices.at(-1)
      if (last) last.text = `${last.text} ${line}`.trim()
      else current.text = `${current.text} ${line}`.trim()
    }
  }
  finish()

  const warnings = []
  const result = questions
    .filter((q) => q.text.length >= 6)
    .map((q) => {
      const keyed = keys.get(q.number) ?? q.answer
      const choices = q.choices.map((c) => ({ ...c }))
      let type = inferType(q, choices)
      let answer = null

      if (type === 'True or False' && choices.length === 0) {
        choices.push({ key: 'A', text: 'True', correct: false }, { key: 'B', text: 'False', correct: false })
      }

      if (keyed) {
        const letter = keyed.match(/^\(?([A-E])\)?\.?$/i)?.[1]?.toUpperCase()
        const tf = /^(t|true)$/i.test(keyed) ? 'True' : /^(f|false)$/i.test(keyed) ? 'False' : null
        if (letter && choices.length) choices.forEach((c) => (c.correct = c.key === letter))
        else if (tf && choices.length) choices.forEach((c) => (c.correct = c.text.toLowerCase() === tf.toLowerCase()))
        else answer = keyed
      }

      if (choices.length >= 2 && choices.filter((c) => c.correct).length > 1) {
        // More than one choice marked correct: keep the first and leave the rest for review.
        let seen = false
        choices.forEach((c) => {
          if (c.correct && seen) c.correct = false
          if (c.correct) seen = true
        })
      }

      return {
        number: q.number,
        text: q.text,
        choices,
        answer,
        points: q.points,
        type,
        hasKey: choices.some((c) => c.correct) || Boolean(answer),
      }
    })

  if (result.length && result.every((q) => !q.hasKey)) {
    warnings.push('No answer key was found. Mark the correct choice on each item before adding it.')
  }
  return { questions: result, warnings }
}

function inferType(q, choices) {
  const tfChoices =
    choices.length === 2 && choices.every((c) => /^(true|false)$/i.test(c.text.replace(/\.$/, '')))
  if (tfChoices || (q.section === 'True or False' && choices.length === 0)) return 'True or False'
  if (choices.length >= 2) return 'Multiple Choice'
  if (/\b(write|code|implement)\b.*\b(program|function|method|class|code|query|script|pseudocode|algorithm)\b/i.test(q.text))
    return 'Code Writing'
  if (q.section === 'Code Writing' || q.section === 'Essay') return q.section
  if (/^(discuss|explain|describe|justify|compare)\b/i.test(q.text) && q.text.length > 80) return 'Essay'
  return 'Short Answer'
}
