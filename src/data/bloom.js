import { bloomTone } from './mock.js'

// Bloom's Revised Taxonomy as the system ships it. Every account sees these six levels; levels a
// user adds sit beside them and are private to that account (see AppState).
export const bloomTiers = [
  { id: 'lower', label: 'Lower-order (LOP)', short: 'LOP' },
  { id: 'mid', label: 'Middle-order (MOP)', short: 'MOP' },
  { id: 'higher', label: 'Higher-order (HOP)', short: 'HOP' },
]

export const standardBloom = [
  { id: 'remember', name: 'Remember', tier: 'lower', verbs: 'define, list, recall, identify', standard: true },
  { id: 'understand', name: 'Understand', tier: 'lower', verbs: 'explain, summarize, classify, describe', standard: true },
  { id: 'apply', name: 'Apply', tier: 'mid', verbs: 'use, implement, execute, solve', standard: true },
  { id: 'analyze', name: 'Analyze', tier: 'mid', verbs: 'compare, differentiate, organize, deconstruct', standard: true },
  { id: 'evaluate', name: 'Evaluate', tier: 'higher', verbs: 'judge, critique, justify, verify', standard: true },
  { id: 'create', name: 'Create', tier: 'higher', verbs: 'design, construct, produce, formulate', standard: true },
]

const customTone = 'bg-violet-50 text-violet-700'

/** Badge colours for a level name; levels a user added share one colour so they read as custom. */
export function bloomToneFor(name) {
  return bloomTone[name] ?? customTone
}

/** Orders levels tier by tier (lower → mid → higher), standard levels first within a tier. */
export function orderLevels(levels) {
  return bloomTiers.flatMap((t) => levels.filter((l) => l.tier === t.id))
}

/** Three-letter column heading for the TOS grid. */
export function levelAbbrev(name) {
  return name.slice(0, 3).toUpperCase()
}
