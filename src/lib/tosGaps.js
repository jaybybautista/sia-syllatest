// Finds where the question bank falls short of the exam's Table of Specifications and decides
// which imported questions fill those shortfalls.
import { buildMatrix } from '../data/tos.js'

const cellKey = (chapter, bloom) => `${chapter}|${bloom}`

/**
 * One cell per (chapter, Bloom level) of the TOS for the current exam setup: how many items the
 * TOS asks for, how many the bank already holds, and the gap between the two.
 */
export function computeGaps({ syllabus, examConfig, levels }) {
  const chapters = syllabus.chapters.filter((c) => examConfig.chapters.includes(c.n))
  const { rows } = buildMatrix(chapters, examConfig.items, examConfig.mix, levels)
  const have = new Map()
  syllabus.bankItems.forEach((q) => {
    const k = cellKey(q.chapter, q.bloom)
    have.set(k, (have.get(k) ?? 0) + 1)
  })

  const cells = rows.flatMap((row) =>
    levels.map((level, i) => {
      const need = row.bloom[i]
      const held = have.get(cellKey(row.n, level.name)) ?? 0
      return { key: cellKey(row.n, level.name), chapter: row.n, bloom: level.name, need, have: held, gap: Math.max(0, need - held) }
    }),
  )
  return {
    chapters,
    cells,
    byKey: new Map(cells.map((c) => [c.key, c])),
    need: cells.reduce((s, c) => s + c.need, 0),
    covered: cells.reduce((s, c) => s + Math.min(c.need, c.have), 0),
    gap: cells.reduce((s, c) => s + c.gap, 0),
  }
}

// A question may be placed in a cell other than its top match only when that cell fits nearly as
// well; below these shares of its best match the placement would misrepresent the item. A
// chapter is the topic the item tests, so it only moves when the classifier was nearly undecided;
// neighbouring Bloom levels are often a judgement call, so they get more room.
const suitableChapterShare = 0.85
const suitableBloomShare = 0.6

/**
 * Greedy best-fit allocation. Every (question, cell) pair is scored by how well the question fits
 * the cell (chapter probability × Bloom probability). Pairs are taken best first; a question goes
 * to a cell while that cell still has a gap, so the strongest candidates fill each gap.
 * Questions the user has pinned to a chapter or level are only placed in matching cells.
 *
 * @param {Array} questions classified questions: {id, include, chapterProb (by chapter n), bloomProb (by level name), chapter, bloom, pinned}
 * @returns {Map<string, {status: 'fills'|'reserve'|'skipped', chapter: number, bloom: string, alternate: boolean}>}
 */
export function allocateToGaps(questions, gaps, levels) {
  const remaining = new Map(gaps.cells.map((c) => [c.key, c.gap]))
  const chapterNs = gaps.chapters.map((c) => c.n)
  const result = new Map()
  const pairs = []

  for (const q of questions) {
    if (!q.include) {
      result.set(q.id, { status: 'skipped', chapter: q.chapter, bloom: q.bloom, alternate: false })
      continue
    }
    // Measured against the question's best match over every chapter, not just the ones on this exam.
    const maxOf = (probs) => Math.max(0, ...Object.values(probs))
    const bestChapter = maxOf(q.chapterProb)
    const bestBloom = maxOf(q.bloomProb)
    chapterNs.forEach((n) => {
      if (q.pinned.chapter ? n !== q.chapter : (q.chapterProb[n] ?? 0) < bestChapter * suitableChapterShare) return
      levels.forEach((l) => {
        if (q.pinned.bloom ? l.name !== q.bloom : (q.bloomProb[l.name] ?? 0) < bestBloom * suitableBloomShare) return
        const pc = q.pinned.chapter ? 1 : q.chapterProb[n]
        const pb = q.pinned.bloom ? 1 : q.bloomProb[l.name]
        pairs.push({ q, chapter: n, bloom: l.name, fit: pc * pb })
      })
    })
  }

  pairs.sort((a, b) => b.fit - a.fit)
  for (const p of pairs) {
    if (result.has(p.q.id)) continue
    const k = cellKey(p.chapter, p.bloom)
    if ((remaining.get(k) ?? 0) <= 0) continue
    remaining.set(k, remaining.get(k) - 1)
    result.set(p.q.id, {
      status: 'fills',
      chapter: p.chapter,
      bloom: p.bloom,
      alternate: p.chapter !== p.q.chapter || p.bloom !== p.q.bloom,
    })
  }

  for (const q of questions) {
    if (!result.has(q.id)) result.set(q.id, { status: 'reserve', chapter: q.chapter, bloom: q.bloom, alternate: false })
  }
  return { placements: result, remaining }
}
