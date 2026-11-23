import { useMemo, useRef, useState } from 'react'
import { CircleCheck, FileText, Info, LoaderCircle, ScanText, TriangleAlert, UploadCloud } from 'lucide-react'
import { Badge, Button, Modal, ProgressBar } from './ui.jsx'
import { bloomToneFor, levelAbbrev } from '../data/bloom.js'
import { difficultyLevels } from '../data/mock.js'
import { acceptedTypes, extractText } from '../lib/extractText.js'
import { parseQuestions, questionTypes } from '../lib/questionParser.js'
import { createClassifier, difficultyFor, similarity } from '../lib/classifyQuestions.js'
import { allocateToGaps, computeGaps } from '../lib/tosGaps.js'
import { useAppState } from '../state/context.js'

const field = 'w-full rounded-lg border border-line bg-white px-2.5 py-2 text-[13px] text-ink'
const fieldLabel = 'text-[10px] font-bold uppercase tracking-wide text-ink-3'
const pct = (x) => `${Math.round(x * 100)}%`
const duplicateThreshold = 0.7
const lowChapterConfidence = 0.45
const lowBloomConfidence = 0.4

/**
 * Upload an exam (PDF, Word, or a scan), pull the questions out of it, tag each one with the
 * bank's fields, and file the best-fitting ones into the gaps of the exam's TOS.
 */
export default function QuestionImport({ syllabus, onClose, onImport }) {
  const { examConfig, bloomLevels } = useAppState()
  const [step, setStep] = useState('pick') // pick | reading | review
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState({ stage: '', progress: 0 })
  const [error, setError] = useState(null)
  const [meta, setMeta] = useState(null)
  const [items, setItems] = useState([])
  const [view, setView] = useState('all')
  const [dragging, setDragging] = useState(false)
  const run = useRef(0)
  const inputRef = useRef(null)

  const gaps = useMemo(
    () => computeGaps({ syllabus, examConfig, levels: bloomLevels }),
    [syllabus, examConfig, bloomLevels],
  )
  const chapterByN = useMemo(() => Object.fromEntries(syllabus.chapters.map((c) => [c.n, c])), [syllabus.chapters])
  const tierOf = useMemo(() => Object.fromEntries(bloomLevels.map((l) => [l.name, l.tier])), [bloomLevels])

  const { placements } = useMemo(() => allocateToGaps(items, gaps, bloomLevels), [items, gaps, bloomLevels])

  // The values each question would be saved with: a gap placement may move it to its runner-up cell.
  const resolved = useMemo(
    () =>
      items.map((q) => {
        const place = placements.get(q.id)
        const chapter = place.status === 'fills' ? place.chapter : q.chapter
        const bloom = place.status === 'fills' ? place.bloom : q.bloom
        const lowConfidence =
          (!q.pinned.chapter && q.cls.chapterConfidence < lowChapterConfidence) ||
          (!q.pinned.bloom && q.cls.bloomConfidence < lowBloomConfidence)
        const missingKey = !(q.choices.some((c) => c.correct) || q.answer?.trim()) && !['Essay', 'Code Writing'].includes(q.type)
        return {
          ...q,
          place,
          chapter,
          bloom,
          co: q.co ?? chapterByN[chapter]?.co,
          difficulty: q.difficulty ?? difficultyFor(bloom, tierOf[bloom]),
          lowConfidence,
          missingKey,
          needsReview: q.include && (lowConfidence || missingKey),
        }
      }),
    [items, placements, chapterByN, tierOf],
  )

  const counts = {
    all: resolved.length,
    fills: resolved.filter((q) => q.place.status === 'fills').length,
    reserve: resolved.filter((q) => q.place.status === 'reserve').length,
    review: resolved.filter((q) => q.needsReview).length,
    skipped: resolved.filter((q) => q.place.status === 'skipped').length,
  }
  const included = resolved.filter((q) => q.include)
  const addedByCell = new Map()
  resolved.forEach((q) => {
    if (q.place.status === 'fills') {
      const k = `${q.chapter}|${q.bloom}`
      addedByCell.set(k, (addedByCell.get(k) ?? 0) + 1)
    }
  })
  const gapAfter = gaps.gap - counts.fills

  async function readFile(picked) {
    if (!picked) return
    const token = ++run.current
    setFile(picked)
    setError(null)
    setStep('reading')
    setProgress({ stage: 'Starting', progress: 0 })
    try {
      const extracted = await extractText(picked, (p) => run.current === token && setProgress(p))
      if (run.current !== token) return
      setProgress({ stage: 'Finding questions', progress: 1 })
      const { questions, warnings } = parseQuestions(extracted.text)
      const classify = createClassifier({ syllabus, levels: bloomLevels })
      const drafts = []
      questions.forEach((q, i) => {
        const cls = classify(q)
        const bankMatch = syllabus.bankItems
          .map((b) => ({ id: b.id, score: similarity(q.text, b.text) }))
          .sort((a, b) => b.score - a.score)[0]
        const fileMatch = drafts
          .map((d) => ({ id: `Item ${d.number}`, score: similarity(q.text, d.text) }))
          .sort((a, b) => b.score - a.score)[0]
        const dup = [bankMatch, fileMatch].find((m) => m && m.score >= duplicateThreshold)
        drafts.push({
          ...q,
          id: `import-${token}-${i}`,
          cls,
          chapterProb: cls.chapterProb,
          bloomProb: cls.bloomProb,
          chapter: cls.chapter,
          bloom: cls.bloom,
          co: null, // follows the chapter unless the user picks one
          difficulty: null, // follows the Bloom level unless the user picks one
          pinned: { chapter: false, bloom: false },
          duplicateOf: dup ? { id: dup.id, score: dup.score } : null,
          include: !dup,
        })
      })
      setMeta({ ...extracted, warnings })
      setItems(drafts)
      setView('all')
      setStep('review')
    } catch (e) {
      if (run.current !== token) return
      console.error(e)
      setError(e?.message || 'The file could not be read.')
      setStep('pick')
    }
  }

  function update(id, patch) {
    setItems((list) => list.map((q) => (q.id === id ? { ...q, ...(typeof patch === 'function' ? patch(q) : patch) } : q)))
  }

  function addToBank() {
    const n = Math.max(0, ...syllabus.bankItems.map((q) => Number(q.id.match(/\d+/)?.[0] ?? 0)))
    const now = new Date().toISOString()
    const newItems = included.map((q, i) => ({
      id: `Q-${n + i + 1}`,
      chapter: q.chapter,
      co: q.co,
      bloom: q.bloom,
      difficulty: q.difficulty,
      type: q.type,
      text: q.text.trim(),
      choices: q.choices.map((c) => ({ ...c, text: c.text.trim() })),
      answer: q.answer?.trim() || null,
      points: q.points,
      discrimination: null,
      uses: 0,
      target: `Imported from ${file.name}, item ${q.number}.`,
      imported: { file: file.name, on: now, fillsGap: q.place.status === 'fills' },
    }))
    onImport({ items: newItems, file: file.name, fills: counts.fills, gapAfter })
  }

  const visible = resolved.filter((q) =>
    view === 'all'
      ? true
      : view === 'review'
        ? q.needsReview
        : q.place.status === view,
  )

  return (
    <Modal
      title="Import Questions from an Exam File"
      subtitle={`${syllabus.code} · ${syllabus.title}`}
      icon={ScanText}
      onClose={() => {
        run.current++
        onClose()
      }}
      width={step === 'review' ? 1120 : 760}
      footer={
        step === 'review' ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-ink-2">
              <span className="font-bold text-ink">{included.length}</span> of {resolved.length} selected ·{' '}
              <span className="font-semibold text-ok">{counts.fills} fill TOS gaps</span> ·{' '}
              {gapAfter > 0 ? (
                <span className="font-semibold text-bad">{gapAfter} items still short after import</span>
              ) : (
                <span className="font-semibold text-ok">every gap is covered</span>
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep('pick')}>
                Choose Another File
              </Button>
              <Button disabled={included.length === 0} onClick={addToBank}>
                Add {included.length} to Question Bank
              </Button>
            </div>
          </div>
        ) : null
      }
    >
      {step === 'pick' && (
        <div className="flex flex-col gap-5">
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              readFile(e.dataTransfer.files?.[0])
            }}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragging ? 'border-brand bg-brand-soft' : 'border-line bg-slate-50 hover:bg-white'
            }`}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft">
              <UploadCloud size={22} className="text-brand" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">Drop an exam file here or click to browse</p>
              <p className="mt-1 text-xs text-ink-3">
                PDF, Word (.docx, .doc), or a photo/scan (.png, .jpg). Scanned pages are read with OCR.
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              aria-label="Exam file"
              accept={acceptedTypes}
              className="sr-only"
              onChange={(e) => {
                readFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-bad-bg p-3 text-[13px] text-bad">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              <p>
                <span className="font-bold">{file?.name} could not be read.</span> {error}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[13px] font-bold text-ink">Current TOS gaps · {examConfig.examType}</p>
              <p className="text-xs text-ink-3">
                {examConfig.items} items · Ch {gaps.chapters.map((c) => c.n).join(', ')} · {examConfig.mix.lower}/
                {examConfig.mix.mid}/{examConfig.mix.higher} LOP/MOP/HOP
              </p>
            </div>
            <p className="text-xs text-ink-2">
              The bank covers <span className="font-bold">{gaps.covered}</span> of {gaps.need} TOS slots.{' '}
              {gaps.gap > 0 ? (
                <>
                  <span className="font-bold text-bad">{gaps.gap} slots are empty</span>; imported questions
                  are filed into them first.
                </>
              ) : (
                'Every slot is covered; imported questions are kept as reserve items.'
              )}
            </p>
            <GapGrid gaps={gaps} levels={bloomLevels} added={new Map()} />
          </div>

          <div className="flex items-start gap-2.5 text-xs text-ink-3">
            <Info size={14} className="mt-0.5 shrink-0" />
            <p>
              Each question is tagged by matching its wording against this syllabus — chapter titles and
              topics, course outcomes, and existing bank items — and against the action verbs of your
              Bloom&apos;s levels, including levels you added. You review every tag before anything is saved.
              OCR downloads its English language data the first time it runs, so scans need an internet
              connection.
            </p>
          </div>
        </div>
      )}

      {step === 'reading' && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <LoaderCircle size={28} className="animate-spin text-brand" />
          <div>
            <p className="text-sm font-bold text-ink">{file?.name}</p>
            <p className="mt-1 text-xs text-ink-3">{progress.stage}…</p>
          </div>
          <ProgressBar value={Math.round(progress.progress * 100)} className="max-w-sm" />
          <Button
            variant="ghost"
            onClick={() => {
              run.current++
              setStep('pick')
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {step === 'review' && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-slate-50 px-4 py-3 text-xs text-ink-2">
            <span className="flex items-center gap-1.5 font-semibold text-ink">
              <FileText size={14} className="text-brand" />
              {file?.name}
            </span>
            <span>Read with {meta.method}</span>
            {meta.ocrPages > 0 && <span>{meta.ocrPages} page{meta.ocrPages === 1 ? '' : 's'} OCR&apos;d</span>}
            <span>{resolved.length} questions found</span>
            <details className="ml-auto">
              <summary className="cursor-pointer font-semibold text-brand">Show extracted text</summary>
              <pre className="mt-2 max-h-60 max-w-[640px] overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-white p-3 text-[11px] text-ink-2">
                {meta.text}
              </pre>
            </details>
          </div>

          {meta.warnings.map((w) => (
            <div key={w} className="flex items-center gap-2.5 rounded-lg border border-accent bg-warn-bg p-3 text-[13px]">
              <TriangleAlert size={16} className="shrink-0 text-accent-dark" />
              {w}
            </div>
          ))}

          {resolved.length === 0 ? (
            <div className="rounded-xl border border-line bg-white p-6 text-[13px]">
              <p className="font-bold text-ink">No numbered questions were found in this file.</p>
              <p className="mt-1 text-ink-3">
                Questions need to start with a number (“1.”, “1)”, or “Q1:”), with choices lettered A–E. Open
                “Show extracted text” above to see what was read. A blurry scan reads better at a higher
                resolution.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[13px] font-bold text-ink">TOS gap allocation</p>
                  <p className="text-xs text-ink-3">
                    {gaps.gap} slots were empty · {counts.fills} filled by this file ·{' '}
                    {Math.max(0, gapAfter)} still empty
                  </p>
                </div>
                <GapGrid gaps={gaps} levels={bloomLevels} added={addedByCell} />
              </div>

              <div className="flex flex-wrap gap-1 rounded-[10px] border border-line bg-slate-50 p-1">
                {[
                  ['all', 'All'],
                  ['fills', 'Fills a gap'],
                  ['reserve', 'Reserve'],
                  ['review', 'Needs review'],
                  ['skipped', 'Not importing'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setView(key)}
                    className={`rounded-lg px-3 py-2 text-xs ${
                      view === key
                        ? 'bg-white font-semibold text-brand shadow-[0_2px_2px_rgba(15,23,42,0.05)]'
                        : 'font-medium text-ink-3'
                    }`}
                  >
                    {label} ({counts[key]})
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {visible.length === 0 && <p className="text-[13px] text-ink-3">Nothing in this view.</p>}
                {visible.map((q) => (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    syllabus={syllabus}
                    levels={bloomLevels}
                    examChapters={gaps.chapters}
                    onChange={(patch) => update(q.id, patch)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}

function GapGrid({ gaps, levels, added }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-1 text-center text-[11px]">
        <thead>
          <tr className="text-ink-3">
            <th className="text-left font-bold">CHAPTER</th>
            {levels.map((l) => (
              <th key={l.id} className="font-bold" title={l.name}>
                {levelAbbrev(l.name)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gaps.chapters.map((c) => (
            <tr key={c.n}>
              <td className="max-w-[180px] truncate pr-2 text-left font-semibold text-ink-2" title={c.title}>
                Ch {c.n} · {c.title}
              </td>
              {levels.map((l) => {
                const cell = gaps.byKey.get(`${c.n}|${l.name}`)
                const plus = added.get(cell.key) ?? 0
                const short = cell.gap - plus
                const tone =
                  cell.need === 0
                    ? 'bg-slate-50 text-ink-3'
                    : cell.gap === 0
                      ? 'bg-ok-bg text-ok'
                      : short <= 0
                        ? 'bg-brand-soft text-brand'
                        : 'bg-bad-bg text-bad'
                return (
                  <td
                    key={l.id}
                    className={`rounded-md px-1.5 py-1.5 font-semibold ${tone}`}
                    title={`${l.name}: TOS needs ${cell.need}, bank has ${cell.have}${plus ? `, import adds ${plus}` : ''}`}
                  >
                    {cell.need === 0 ? '—' : `${Math.min(cell.have, cell.need) + plus}/${cell.need}`}
                    {plus > 0 && <span className="ml-1 font-bold">+{plus}</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-3">
        <Legend className="bg-ok-bg" label="Already covered by the bank" />
        <Legend className="bg-brand-soft" label="Filled by this import" />
        <Legend className="bg-bad-bg" label="Still short" />
        <span>Cells read “items in bank / items the TOS needs”.</span>
      </div>
    </div>
  )
}

function Legend({ className, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2.5 rounded-sm ${className}`} />
      {label}
    </span>
  )
}

function QuestionCard({ q, syllabus, levels, examChapters, onChange }) {
  const { place } = q
  const chapter = syllabus.chapters.find((c) => c.n === q.chapter)
  const onExam = examChapters.some((c) => c.n === q.chapter)
  const hasChoices = q.choices.length > 0

  const status =
    place.status === 'skipped'
      ? q.duplicateOf
        ? { tone: 'warn', label: `Possible duplicate of ${q.duplicateOf.id}` }
        : { tone: 'muted', label: 'Not importing' }
      : place.status === 'fills'
        ? { tone: 'ok', label: `Fills gap · Ch ${q.chapter} · ${q.bloom}` }
        : {
            tone: 'info',
            label: onExam ? 'Reserve · that TOS cell is full' : `Reserve · Ch ${q.chapter} is not on this exam`,
          }

  const original = q.cls
  const moved = place.status === 'fills' && place.alternate

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-4 ${
        q.include ? 'border-line bg-white' : 'border-dashed border-line bg-slate-50 opacity-80'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs font-bold text-ink">
          <input
            type="checkbox"
            className="size-4 accent-[var(--color-brand)]"
            checked={q.include}
            onChange={(e) => onChange({ include: e.target.checked })}
          />
          Item {q.number}
          {q.points != null && <span className="font-medium text-ink-3">· {q.points} pts</span>}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {q.include && q.missingKey && <Badge tone="bad">No answer key</Badge>}
          {q.include && q.lowConfidence && <Badge tone="warn">Low confidence</Badge>}
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
      </div>

      <textarea
        aria-label={`Item ${q.number} question text`}
        className={`${field} min-h-[44px] resize-y font-medium leading-[1.5]`}
        rows={Math.min(5, Math.max(2, Math.ceil(q.text.length / 110)))}
        value={q.text}
        onChange={(e) => onChange({ text: e.target.value })}
      />

      {hasChoices ? (
        <div className="grid grid-cols-2 gap-2 max-lg:grid-cols-1">
          {q.choices.map((c, i) => (
            <div
              key={c.key}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                c.correct ? 'border-emerald-600 bg-ok-bg' : 'border-line bg-white'
              }`}
            >
              <input
                type="radio"
                name={`key-${q.id}`}
                aria-label={`Mark ${c.key} as the correct answer for item ${q.number}`}
                checked={c.correct}
                onChange={() =>
                  onChange((d) => ({ choices: d.choices.map((x, j) => ({ ...x, correct: j === i })) }))
                }
                className="accent-emerald-600"
              />
              <span className={`text-xs font-bold ${c.correct ? 'text-ok' : 'text-ink-2'}`}>{c.key}</span>
              <input
                aria-label={`Item ${q.number} choice ${c.key}`}
                className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none"
                value={c.text}
                onChange={(e) =>
                  onChange((d) => ({ choices: d.choices.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) }))
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className={fieldLabel}>Answer</span>
          <input
            aria-label={`Item ${q.number} answer`}
            className={`${field} py-1.5`}
            placeholder={q.type === 'Essay' || q.type === 'Code Writing' ? 'Rubric or model answer (optional)' : 'Expected answer'}
            value={q.answer ?? ''}
            onChange={(e) => onChange({ answer: e.target.value })}
          />
        </div>
      )}

      <div className="grid grid-cols-5 gap-2 max-lg:grid-cols-2">
        <Select
          label="Chapter"
          value={q.chapter}
          pinned={q.pinned.chapter}
          onChange={(v) =>
            onChange((d) => ({ chapter: Number(v), co: null, pinned: { ...d.pinned, chapter: true } }))
          }
          options={syllabus.chapters.map((c) => [c.n, `Ch ${c.n} · ${c.title}`])}
        />
        <Select
          label="Course outcome"
          value={q.co}
          onChange={(v) => onChange({ co: v })}
          options={syllabus.outcomes.map((o) => [o.id, o.id])}
          title={syllabus.outcomes.find((o) => o.id === q.co)?.text}
        />
        <Select
          label="Bloom's level"
          value={q.bloom}
          pinned={q.pinned.bloom}
          onChange={(v) => onChange((d) => ({ bloom: v, difficulty: null, pinned: { ...d.pinned, bloom: true } }))}
          options={levels.map((l) => [l.name, l.name])}
          badge={bloomToneFor(q.bloom)}
        />
        <Select
          label="Difficulty"
          value={q.difficulty}
          onChange={(v) => onChange({ difficulty: v })}
          options={difficultyLevels.map((d) => [d, d])}
        />
        <Select
          label="Type"
          value={q.type}
          onChange={(v) =>
            onChange((d) => ({
              type: v,
              choices:
                v === 'True or False' && d.choices.length === 0
                  ? [
                      { key: 'A', text: 'True', correct: false },
                      { key: 'B', text: 'False', correct: false },
                    ]
                  : d.choices,
            }))
          }
          options={questionTypes.map((t) => [t, t])}
        />
      </div>

      <p className="flex items-start gap-1.5 text-[11px] leading-[1.5] text-ink-3">
        <CircleCheck size={12} className="mt-0.5 shrink-0 text-brand" />
        <span>
          {q.pinned.chapter ? (
            <>Chapter set by you. </>
          ) : (
            <>
              Ch {original.chapter} ({pct(original.chapterConfidence)})
              {original.evidence.chapter.length > 0
                ? ` from ${original.evidence.chapter.map((t) => `“${t}”`).join(', ')}`
                : ' — no topic words matched; please check'}
              .{' '}
            </>
          )}
          {q.pinned.bloom ? (
            <>Bloom&apos;s level set by you.</>
          ) : (
            <>
              {original.bloom} ({pct(original.bloomConfidence)})
              {original.evidence.bloom.length > 0
                ? ` from ${original.evidence.bloom.join(', ')}`
                : ' by question format; no action verb found'}
              .
            </>
          )}
          {moved && (
            <span className="font-semibold text-brand">
              {' '}
              Filed under Ch {q.chapter} · {q.bloom}, its next-closest fit, because Ch {original.chapter} ·{' '}
              {original.bloom} has no open slot.
            </span>
          )}
          {q.duplicateOf && (
            <span className="font-semibold text-warn">
              {' '}
              {pct(q.duplicateOf.score)} word overlap with {q.duplicateOf.id}.
            </span>
          )}
          {chapter && !onExam && <span> Ch {chapter.n} is not part of the current exam setup.</span>}
        </span>
      </p>
    </div>
  )
}

function Select({ label, value, options, onChange, pinned, badge, title }) {
  return (
    <label className="flex min-w-0 flex-col gap-1" title={title}>
      <span className={fieldLabel}>
        {label}
        {pinned && <span className="ml-1 normal-case text-brand">· set by you</span>}
      </span>
      <select
        className={`${field} truncate py-1.5 font-semibold ${badge ?? ''}`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </label>
  )
}

