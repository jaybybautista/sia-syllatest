// The activity log behind the dashboards' "AI jobs" and "faculty activity" panels. It starts with
// what the seed records already show happened (uploads, parses, results analyses) and grows as
// users act: every upload, TOS lock, review decision, question import and analysis adds an entry.

const minutesAfter = (iso, mins) => new Date(new Date(iso).getTime() + mins * 60000).toISOString()

export function seedActivity(syllabi) {
  const entries = syllabi.flatMap((s) => {
    const list = [
      {
        at: s.uploadedOn,
        actor: s.uploadedBy,
        syllabusId: s.id,
        code: s.code,
        text: `uploaded ${s.file} for ${s.code}`,
      },
      {
        at: minutesAfter(s.uploadedOn, 1),
        actor: 'SyllaTest AI',
        ai: true,
        syllabusId: s.id,
        code: s.code,
        text: `Parsed ${s.file}: ${s.outcomes.length} course outcomes, ${s.chapters.length} chapters`,
      },
    ]
    if (s.analysis) {
      list.push({
        at: s.analysis.uploadedOn,
        actor: 'SyllaTest AI',
        ai: true,
        syllabusId: s.id,
        code: s.code,
        text: `Analysed ${s.analysis.file} (${s.analysis.cohortSize} students)`,
      })
    }
    return list
  })
  return entries
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((e, i) => ({ ...e, id: `seed-${i}` }))
}

/** "Dr. Evelyn Ramos uploaded …", or the AI's own message for AI jobs. */
export function describe(entry) {
  return entry.ai ? entry.text : `${entry.actor} ${entry.text}`
}
