// Deterministic TOS allocation. The Figma grid hard-coded item counts that did not follow
// the stated formula (Ch 1 showed 4 items for 11.11% of 50, Ch 4 showed 19 for 23.33%), and its
// Bloom totals did not match the configured 30/50/20 mix. Both are computed here instead.

/** Largest-remainder apportionment: distributes `total` across `weights`, summing exactly. */
export function largestRemainder(weights, total) {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum === 0) return weights.map(() => 0)

  const exact = weights.map((w) => (w / sum) * total)
  const base = exact.map(Math.floor)
  let remaining = total - base.reduce((a, b) => a + b, 0)

  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac)

  for (let i = 0; remaining > 0; i = (i + 1) % order.length, remaining--) {
    base[order[i].index] += 1
  }
  return base
}

export const bloomColumns = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']

/** Splits a tier percentage mix into per-Bloom-level item counts. */
export function bloomSplit(items, mix) {
  const [lower, mid, higher] = largestRemainder([mix.lower, mix.mid, mix.higher], items)
  const [remember, understand] = largestRemainder([1, 1], lower)
  const [apply, analyze] = largestRemainder([1, 1], mid)
  const [evaluate, create] = largestRemainder([1, 1], higher)
  return [remember, understand, apply, analyze, evaluate, create]
}

/**
 * Builds the distribution grid. Chapter item counts come from chapter hours; each chapter's
 * Bloom row is then apportioned from the same cognitive mix, so rows and columns both reconcile.
 */
export function buildMatrix(chapters, totalItems, mix) {
  const perChapter = largestRemainder(
    chapters.map((c) => c.hours),
    totalItems,
  )
  const totalHours = chapters.reduce((sum, c) => sum + c.hours, 0)

  const rows = chapters.map((c, i) => ({
    ...c,
    items: perChapter[i],
    weight: totalHours ? (c.hours / totalHours) * 100 : 0,
    bloom: bloomSplit(perChapter[i], mix),
  }))

  const totals = {
    hours: totalHours,
    weight: rows.reduce((sum, r) => sum + r.weight, 0),
    items: rows.reduce((sum, r) => sum + r.items, 0),
    bloom: bloomColumns.map((_, i) => rows.reduce((sum, r) => sum + r.bloom[i], 0)),
  }

  return { rows, totals }
}
