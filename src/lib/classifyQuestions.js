// Tags each extracted question with the bank's fields: chapter (and through it the CO), Bloom
// level, difficulty and duplicates. It runs in the browser with no model download or API key:
//  - Chapter: weighted keyword overlap between the question and each chapter's description — its
//    title, listed topics, the outcome it serves, and the wording of bank items already in it.
//  - Bloom level: the action verbs and question patterns of each level in the user's own taxonomy,
//    including the verbs they gave levels they added.
// Every suggestion carries the evidence it was based on and a confidence, so a faculty member can
// see why a field was filled and correct it.
import { bloomTiers } from '../data/bloom.js'

const stopwords = new Set(
  `a an the of to in on for and or is are was were be been being it its this that these those with as at by from
  which what who whom whose when where why how following not no yes all any each both can could should would will
  shall may might must do does did done has have had using use used than then there their they them you your we
  our us i me my he she his her into about over under between more most less least very also such only one two
  three four five six seven eight nine ten statement statements true false answer correct best given below above
  example question item choose select write explain describe first last based value whether given use using
  analyze analyse evaluate implement design apply create compare identify define justify determine perform`.split(/\s+/),
)

function stem(word) {
  if (word.length <= 3) return word
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`
  if (word.endsWith('sses')) return word.slice(0, -2)
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3)
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us') && !word.endsWith('is')) return word.slice(0, -1)
  return word
}

/**
 * Unigrams plus adjacent bigrams ("linked list", "binary search"), stop words removed and words
 * stemmed. Pass `sources` to record the original wording of each term, for showing as evidence.
 */
export function terms(text, sources) {
  const raw = text
    .toLowerCase()
    .replace(/big[\s-]?o\b/g, 'bigo')
    .split(/[^a-z0-9+#]+/)
    .filter((w) => w.length >= 2 && !stopwords.has(w) && !/^\d+$/.test(w))
  const words = raw.map(stem)
  const grams = [...words]
  for (let i = 0; i + 1 < words.length; i++) grams.push(`${words[i]} ${words[i + 1]}`)
  if (sources) {
    const shown = (w) => (w === 'bigo' ? 'Big-O' : w)
    words.forEach((w, i) => sources.has(w) || sources.set(w, shown(raw[i])))
    for (let i = 0; i + 1 < words.length; i++) {
      const g = `${words[i]} ${words[i + 1]}`
      if (!sources.has(g)) sources.set(g, `${shown(raw[i])} ${shown(raw[i + 1])}`)
    }
  }
  return grams
}

// Built-in cues for the six standard levels, on top of the verbs stored on each level.
const standardCues = {
  remember: {
    verbs: 'define, list, recall, identify, name, state, label, recognize, enumerate, match, cite, locate, memorize, repeat, know',
    patterns: [/^(what|who|when|where) (is|are|was|were|does)\b/i, /\bwhich of the following (is|are)\b/i, /\bstands? for\b/i, /\bis (called|known as|termed)\b/i, /\bwhat do you call\b/i, /\bthe term\b/i],
  },
  understand: {
    verbs: 'explain, summarize, classify, describe, discuss, interpret, paraphrase, illustrate, infer, outline, give an example, restate, translate, express',
    patterns: [/^why\b/i, /\bwhat (happens|is the purpose|is the role|is the main idea)\b/i, /\bin your own words\b/i, /\bbest describes?\b/i, /\bmeans? that\b/i],
  },
  apply: {
    verbs: 'use, implement, execute, solve, compute, calculate, apply, demonstrate, trace, convert, perform, show, determine, simulate, insert, delete',
    patterns: [/\bwhat (is|will be) (the )?(output|result|value|final)\b/i, /\bafter (the following|executing|running|inserting|deleting)\b/i, /\bhow many\b/i, /\bgiven (the|an?) (array|list|tree|bst|graph|queue|stack|heap|input|code|values?|sequence)\b/i],
  },
  analyze: {
    verbs: 'compare, differentiate, organize, deconstruct, analyze, analyse, contrast, examine, distinguish, categorize, debug, break down, inspect, relate, attribute, diagnose',
    patterns: [/\b(time|space) complexity\b/i, /\brunning time\b/i, /\bbig-?o\b/i, /\bdifference between\b/i, /\b(find|identify|locate) the (error|bug|flaw)\b/i, /\bwhy does\b/i, /\bwhat causes\b/i],
  },
  evaluate: {
    verbs: 'judge, critique, justify, verify, evaluate, assess, defend, recommend, argue, appraise, validate, prioritize, decide, rate, support',
    patterns: [/\b(most|least) (appropriate|suitable|efficient|effective|secure)\b/i, /\bwhich is (better|best|more suitable|preferable)\b/i, /\bbest (approach|choice|option|strategy|solution)\b/i, /\bshould (you|the team|we)\b/i, /\bwhether\b/i],
  },
  create: {
    verbs: 'design, construct, produce, formulate, create, develop, compose, plan, propose, build, devise, generate, invent, author, write a program, write a function',
    patterns: [/\bwrite (a|an) (program|function|method|class|algorithm|query|script)\b/i, /\bdesign (a|an)\b/i, /\bpropose (a|an)\b/i, /\bcome up with\b/i],
  },
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Words that are also everyday nouns ("linked list", "uses a queue", "state of the stack") only
// count as a Bloom verb when they open the question as an instruction.
const leadOnlyVerbs = new Set([
  'list', 'name', 'state', 'use', 'show', 'match', 'plan', 'rate', 'support', 'label', 'trace',
  'insert', 'delete', 'relate', 'repeat', 'know', 'express', 'outline', 'translate', 'author',
])

function cuesFor(level) {
  const builtIn = standardCues[level.id]
  const verbs = [level.verbs ?? '', builtIn?.verbs ?? '']
    .join(',')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
  return {
    verbs: [...new Set(verbs)].map((v) => {
      const word = `${escapeRe(v)}(s|es|d|ed|ing)?\\b`
      return {
        word: v,
        leadOnly: leadOnlyVerbs.has(v),
        first: new RegExp(`^\\W*${word}`, 'i'),
        early: new RegExp(`^(?:\\W*\\w+\\W+){1,2}?${word}`, 'i'),
        any: new RegExp(`\\b${word}`, 'i'),
      }
    }),
    patterns: builtIn?.patterns ?? [],
  }
}

function toProbabilities(scores, floor) {
  const shifted = scores.map((s) => s + floor)
  const sum = shifted.reduce((a, b) => a + b, 0)
  return shifted.map((s) => s / sum)
}

/**
 * Builds a classifier for one syllabus and one user's Bloom levels.
 * @returns {(q: {text: string, choices: Array, type: string}) => object}
 */
export function createClassifier({ syllabus, levels, chapters = syllabus.chapters }) {
  // Chapter "documents": what the syllabus says the chapter is about.
  const coText = Object.fromEntries(syllabus.outcomes.map((o) => [o.id, o.text]))
  const docs = chapters.map((c) => {
    const bank = syllabus.bankItems.filter((q) => q.chapter === c.n).map((q) => `${q.text} ${q.target ?? ''}`)
    const weighted = [
      ...terms(c.title).flatMap((t) => [t, t, t]),
      ...terms(c.topics ?? '').flatMap((t) => [t, t]),
      ...terms(coText[c.co] ?? ''),
      ...terms(bank.join(' ')),
    ]
    const tf = new Map()
    weighted.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1))
    return tf
  })
  const df = new Map()
  docs.forEach((tf) => [...tf.keys()].forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)))
  // A term found in every chapter says nothing about which chapter a question belongs to.
  const idf = (t) => Math.log((chapters.length + 1) / (df.get(t) ?? chapters.length + 1))

  const levelCues = levels.map(cuesFor)
  const tierOf = Object.fromEntries(levels.map((l) => [l.name, l.tier]))

  return function classify(q) {
    const body = `${q.text} ${q.choices.map((c) => c.text).join(' ')}`
    const sources = new Map()
    const stemTerms = new Set(terms(q.text, sources))
    const qTerms = [...new Set(terms(body, sources))]

    // Chapter
    const chapterScores = docs.map((tf) =>
      qTerms.reduce((sum, t) => {
        const n = tf.get(t)
        if (!n) return sum
        const inStem = stemTerms.has(t) ? 1.5 : 1
        const bigram = t.includes(' ') ? 1.6 : 1
        return sum + idf(t) * (1 + Math.log(n)) * inStem * bigram
      }, 0),
    )
    const chapterProb = toProbabilities(chapterScores, 0.35)
    const chapterBest = chapterProb.indexOf(Math.max(...chapterProb))
    // The strongest matching terms, without repeating a word already shown inside a phrase.
    const evidenceTerms = []
    qTerms
      .filter((t) => docs[chapterBest].has(t) && idf(t) > 0.2)
      .sort((a, b) => idf(b) * (b.includes(' ') ? 2 : 1) - idf(a) * (a.includes(' ') ? 2 : 1))
      .forEach((t) => {
        const words = t.split(' ')
        const overlaps = evidenceTerms.some((e) => words.some((w) => e.split(' ').includes(w)))
        if (!overlaps && evidenceTerms.length < 3) evidenceTerms.push(t)
      })

    // Bloom level
    const evidenceByLevel = levels.map(() => [])
    // True or false and identification items are statements, not instructions: "Mobile-first
    // design starts with…" does not ask the student to design, so only an opening verb counts.
    const statement = q.type === 'True or False' || q.type === 'Short Answer'
    const bloomScores = levelCues.map((cues, i) => {
      let score = 0
      for (const v of cues.verbs) {
        // An instruction verb that opens the question ("Justify why…") outweighs one further in.
        const weight = v.first.test(q.text)
          ? 4
          : v.leadOnly || statement
            ? 0
            : v.early.test(q.text)
              ? 2.5
              : v.any.test(q.text)
                ? 1.25
                : 0
        if (weight) {
          score += weight
          evidenceByLevel[i].push(`“${v.word}”`)
        }
      }
      for (const p of cues.patterns) {
        if (p.test(q.text)) {
          score += 2
          evidenceByLevel[i].push('question pattern')
        }
      }
      return score
    })
    // Question format nudges when the wording gives little away.
    const nudge = (name, by) => {
      const i = levels.findIndex((l) => l.name === name)
      if (i >= 0) bloomScores[i] += by
    }
    if (q.type === 'Code Writing') nudge('Create', 1.5)
    if (q.type === 'Essay') nudge('Understand', 0.6)
    if (q.type === 'True or False' || q.type === 'Short Answer') nudge('Remember', 0.6)
    if (q.type === 'Multiple Choice') nudge('Remember', 0.3)

    const bloomProb = toProbabilities(bloomScores, 0.25)
    const bloomBest = bloomProb.indexOf(Math.max(...bloomProb))
    const level = levels[bloomBest]

    return {
      // Keyed by chapter number and level name so a subset of chapters can be looked up directly.
      chapterProb: Object.fromEntries(chapters.map((c, i) => [c.n, chapterProb[i]])),
      bloomProb: Object.fromEntries(levels.map((l, i) => [l.name, bloomProb[i]])),
      chapter: chapters[chapterBest].n,
      bloom: level.name,
      difficulty: difficultyFor(level.name, tierOf[level.name]),
      chapterConfidence: chapterProb[chapterBest],
      bloomConfidence: bloomProb[bloomBest],
      evidence: {
        chapter: chapterScores[chapterBest] > 0 ? evidenceTerms.map((t) => sources.get(t) ?? t) : [],
        bloom: [...new Set(evidenceByLevel[bloomBest])].slice(0, 3),
      },
    }
  }
}

export function difficultyFor(bloomName, tier) {
  if (bloomName === 'Create') return 'Advanced'
  return { lower: 'Easy', mid: 'Medium', higher: 'Hard' }[tier] ?? 'Medium'
}

/** Share of words two questions have in common (Jaccard over unigrams). */
export function similarity(a, b) {
  const sa = new Set(terms(a).filter((t) => !t.includes(' ')))
  const sb = new Set(terms(b).filter((t) => !t.includes(' ')))
  if (!sa.size || !sb.size) return 0
  let shared = 0
  sa.forEach((t) => sb.has(t) && shared++)
  return shared / (sa.size + sb.size - shared)
}

export const tierLabel = (tierId) => bloomTiers.find((t) => t.id === tierId)?.short ?? tierId

/**
 * The Bloom's level of a course outcome, from its action verb: outcomes open with the verb
 * ("Design and prototype…", "Analyze the time complexity…"), so the earliest verb found wins.
 * Falls back to Understand when no listed verb appears.
 */
export function detectBloom(text, levels) {
  const body = text.replace(/^(?:students?\s+)?(?:(?:will|should|shall)\s+)?(?:be\s+able\s+to\s+)?/i, '')
  let best = null
  levels.forEach((level) => {
    for (const v of cuesFor(level).verbs) {
      const m = v.any.exec(body)
      if (m && (!best || m.index < best.index)) best = { index: m.index, name: level.name }
    }
  })
  return best && best.index < 60 ? best.name : 'Understand'
}
