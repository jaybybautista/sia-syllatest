import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Plus, SlidersHorizontal, TriangleAlert, X } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Button, Card, Modal } from '../components/ui.jsx'
import { difficultyLevels, discriminationLabel, user } from '../data/mock.js'
import { bloomToneFor } from '../data/bloom.js'
import { featurePath } from '../data/features.js'
import { useAppState, useSyllabus } from '../state/context.js'

const types = ['Multiple Choice', 'Short Answer', 'Code Writing']

const fieldClass =
  'w-full rounded-lg border border-white/40 bg-white/70 p-2.5 text-[13px] text-ink backdrop-blur-[6px]'
const fieldLabel = 'text-[11px] font-bold text-ink-2'

// The course is fixed by the syllabus the bank was opened for, so it is not a filter here.
const emptyFilters = {
  keyword: '',
  chapters: [],
  cos: [],
  blooms: [],
  difficulties: [],
  types: [],
}

export default function Bank() {
  const navigate = useNavigate()
  const { syllabus } = useSyllabus()
  const { bloomLevels } = useAppState()
  const { bankItems, bankTotal } = syllabus
  const bloomNames = bloomLevels.map((l) => l.name)
  // Figma's wizard listed Q-312 as "Analyze" and Q-313 as "Create", the reverse of the bank list on
  // the same data. The bank record is treated as the source of truth and the wizard reads from it.
  const matrixCells = syllabus.outcomes.flatMap((o) =>
    bloomNames.map((b) => `Cognitive Processing Level > ${b} (${o.id.replace(' ', '')})`),
  )
  const [filters, setFilters] = useState(emptyFilters)
  const [draft, setDraft] = useState(emptyFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selected, setSelected] = useState([])
  const [previewId, setPreviewId] = useState(bankItems[0].id)
  const [wizard, setWizard] = useState(null)
  const [tab, setTab] = useState('bulk')
  const [cell, setCell] = useState(matrixCells[3] ?? matrixCells[0])
  const [weight, setWeight] = useState('10')
  const [points, setPoints] = useState('5')

  function matches(q, f) {
    if (f.keyword && !q.text.toLowerCase().includes(f.keyword.toLowerCase())) return false
    if (f.chapters.length && !f.chapters.includes(`Chapter ${q.chapter}`)) return false
    if (f.cos.length && !f.cos.includes(q.co)) return false
    if (f.blooms.length && !f.blooms.includes(q.bloom)) return false
    if (f.difficulties.length && !f.difficulties.includes(q.difficulty)) return false
    return true
  }

  const results = useMemo(() => bankItems.filter((q) => matches(q, filters)), [bankItems, filters])
  const draftCount = useMemo(
    () => bankItems.filter((q) => matches(q, draft)).length,
    [bankItems, draft],
  )

  const preview = bankItems.find((q) => q.id === previewId)
  const flagged = results.find((q) => q.similarity)
  const allShownSelected = results.length > 0 && results.every((q) => selected.includes(q.id))
  const selectedItems = bankItems.filter((q) => selected.includes(q.id))

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  function toggleDraft(key, value) {
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((x) => x !== value) : [...d[key], value],
    }))
  }

  const chips = [
    { key: 'course', label: `Course: ${syllabus.code}`, tone: 'info' },
    ...filters.chapters.map((c) => ({ key: 'chapters', value: c, label: c, tone: 'muted' })),
    ...filters.cos.map((c) => ({ key: 'cos', value: c, label: c, tone: 'info' })),
    ...filters.blooms.map((b) => ({ key: 'blooms', value: b, label: `Bloom: ${b}`, bloom: b })),
    ...filters.difficulties.map((d) => ({
      key: 'difficulties',
      value: d,
      label: `Difficulty: ${d}`,
      tone: d === 'Advanced' || d === 'Hard' ? 'bad' : 'muted',
    })),
    ...filters.types.map((t) => ({ key: 'types', value: t, label: `Type: ${t}`, tone: 'muted' })),
  ]

  function removeChip(chip) {
    if (!chip.value) return
    setFilters((f) => ({ ...f, [chip.key]: f[chip.key].filter((x) => x !== chip.value) }))
    setDraft((f) => ({ ...f, [chip.key]: f[chip.key].filter((x) => x !== chip.value) }))
  }

  return (
    <AppShell
      title="AI-Aligned Question Bank"
      subtitle="Search, audit, and assemble formal test items mapped directly to approved course outcomes (COs)."
    >
      <div className="flex min-h-0 flex-1 gap-5 max-xl:flex-col">
        <Card className="flex w-[280px] shrink-0 flex-col gap-5 p-5 max-xl:w-full">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">FILTERS</p>
            <button
              onClick={() => {
                setDraft(filters)
                setFiltersOpen(true)
              }}
              className="flex items-center gap-1 text-[11px] font-semibold text-brand"
            >
              <SlidersHorizontal size={12} />
              Multi-select
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel} htmlFor="keyword">
              SEARCH KEYWORD
            </label>
            <input
              id="keyword"
              className={fieldClass}
              placeholder="asynchronous mobile"
              value={filters.keyword}
              onChange={(e) => {
                setFilters((f) => ({ ...f, keyword: e.target.value }))
                setDraft((f) => ({ ...f, keyword: e.target.value }))
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className={fieldLabel}>COURSE</p>
            <p className={`${fieldClass} font-semibold`}>
              {syllabus.code} · {syllabus.title}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className={fieldLabel}>ACTIVE FILTER CHIPS</p>
            {chips.length === 0 ? (
              <p className="text-[11px] text-ink-3">No filters applied.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <span
                    key={chip.label}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${
                      chip.bloom
                        ? `${bloomToneFor(chip.bloom)} border-transparent`
                        : chip.tone === 'info'
                          ? 'border-brand/20 bg-brand-soft text-brand'
                          : chip.tone === 'bad'
                            ? 'border-red-200 bg-bad-bg text-bad'
                            : 'border-line bg-slate-100 text-ink-2'
                    }`}
                  >
                    {chip.label}
                    {chip.value && (
                      <button aria-label={`Remove ${chip.label}`} onClick={() => removeChip(chip)}>
                        <X size={11} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setFilters(emptyFilters)
              setDraft(emptyFilters)
            }}
          >
            Reset Active Filters
          </Button>
        </Card>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSelected(allShownSelected ? [] : results.map((q) => q.id))}
                aria-label="Select all shown items"
                className={`flex size-4 items-center justify-center rounded border-2 ${
                  allShownSelected ? 'border-brand bg-brand' : 'border-line bg-white'
                }`}
              >
                {allShownSelected && <Check size={10} className="text-white" />}
              </button>
              <p className="text-[13px] font-semibold">
                Selected {selected.length} of {bankTotal} items
              </p>
              <Button
                variant="ghost"
                disabled={selected.length === 0}
                className="border-brand/20 bg-brand-soft px-3 py-1.5 text-xs text-brand"
                onClick={() => {
                  setTab('bulk')
                  setWizard(true)
                }}
              >
                Bulk Add to Midterm TOS
              </Button>
            </div>
            <Button
              variant="accent"
              icon={Plus}
              onClick={() => {
                setTab('new')
                setWizard(true)
              }}
            >
              Create New Exam Set
            </Button>
          </div>

          {flagged && (
            <div className="flex items-center gap-3 rounded-lg border border-accent bg-warn-bg p-4">
              <TriangleAlert size={16} className="shrink-0 text-accent-dark" />
              <p className="text-[13px]">
                <span className="font-bold text-accent-dark">Similarity Warning:</span> Item{' '}
                {flagged.id} shares a {flagged.similarity.pct}% lexical likeness with the{' '}
                {flagged.similarity.source}. Automated rotation recommended.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {results.length === 0 && (
              <Card className="p-6 text-[13px] text-ink-3">
                No items match these filters. Reset the filters or widen the Bloom level.
              </Card>
            )}
            {results.map((q) => {
              const d = discriminationLabel(q.discrimination)
              return (
                <Card key={q.id} className="flex flex-col gap-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggle(q.id)}
                        aria-label={`Select ${q.id}`}
                        className={`flex size-4 items-center justify-center rounded border-2 ${
                          selected.includes(q.id) ? 'border-brand bg-brand' : 'border-line bg-white'
                        }`}
                      >
                        {selected.includes(q.id) && <Check size={10} className="text-white" />}
                      </button>
                      <button onClick={() => setPreviewId(q.id)} className="text-xs font-bold text-brand">
                        {q.id}
                      </button>
                      <span className="text-xs text-ink-3">•</span>
                      <span className="text-xs text-ink-3">
                        {syllabus.code} - Chapter {q.chapter}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge tone="info">{q.co}</Badge>
                      <Badge className={bloomToneFor(q.bloom)}>{q.bloom}</Badge>
                      <Badge tone="muted">{q.difficulty}</Badge>
                    </div>
                  </div>
                  <p className="text-sm font-medium leading-[1.5]">{q.text}</p>
                  <div className="flex items-center justify-between text-xs text-ink-3">
                    <p>
                      discrimination score:{' '}
                      <span className={`font-bold ${d.tone}`}>
                        {q.discrimination.toFixed(2)} ({d.label})
                      </span>
                    </p>
                    <p>
                      Historical Use: {q.uses} {q.uses === 1 ? 'time' : 'times'}
                      {q.uses === 0 && ' (New)'}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        <Card className="flex w-[340px] shrink-0 flex-col gap-5 p-5 max-xl:w-full">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">ITEM PREVIEW</p>
            <p className="text-xs font-semibold text-ink-3">{preview.id}</p>
          </div>
          <hr className="border-line" />
          <div>
            <p className="text-[11px] text-ink-3">PROMPT TARGET</p>
            <p className="text-[13px] font-medium">{preview.target}</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-ink-3">CHOICES &amp; KEY MAPPING</p>
            {preview.choices.map((c) => (
              <div
                key={c.key}
                className={`flex gap-2.5 rounded-lg border p-2.5 text-xs ${
                  c.correct ? 'border-emerald-600 bg-ok-bg text-ok' : 'border-white/40 bg-white/70'
                }`}
              >
                <p className="font-bold">{c.key}</p>
                <p className={`min-w-0 flex-1 ${c.correct ? '' : 'text-ink-2'}`}>{c.text}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[11px] text-ink-3">SHARING SCOPE</p>
            <p className="mt-1.5 rounded-lg border border-white/40 bg-white/70 p-2.5 text-xs font-semibold">
              {user.college} (CCS)
            </p>
          </div>
        </Card>
      </div>

      {filtersOpen && (
        <Modal
          title="Multi-Select Question Bank Filters"
          onClose={() => setFiltersOpen(false)}
          width={480}
          footer={
            <div className="flex w-full items-center justify-between gap-4">
              <p className="text-[13px] text-ink-2">
                Found <span className="font-bold">{draftCount} matching items</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="border-transparent bg-slate-100"
                  onClick={() => setFiltersOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setFilters(draft)
                    setFiltersOpen(false)
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          }
        >
          <button
            onClick={() => setDraft({ ...emptyFilters, keyword: draft.keyword })}
            className="-mt-2 mb-4 block text-[13px] font-semibold text-brand"
          >
            Clear All
          </button>

          <ChipGroup
            label="Topic / Unit"
            options={syllabus.chapters.map((c) => `Chapter ${c.n}`)}
            selected={draft.chapters}
            onToggle={(v) => toggleDraft('chapters', v)}
          />
          <ChipGroup
            label="Course Outcome"
            options={syllabus.outcomes.map((o) => o.id)}
            selected={draft.cos}
            onToggle={(v) => toggleDraft('cos', v)}
          />
          <ChipGroup
            label="Bloom's Cognitive Levels"
            options={bloomNames}
            selected={draft.blooms}
            onToggle={(v) => toggleDraft('blooms', v)}
          />
          <ChipGroup
            label="Difficulty Range"
            options={difficultyLevels}
            selected={draft.difficulties}
            onToggle={(v) => toggleDraft('difficulties', v)}
          />
          <ChipGroup
            label="Question Type"
            options={types}
            selected={draft.types}
            onToggle={(v) => toggleDraft('types', v)}
          />
        </Modal>
      )}

      {wizard && (
        <Modal
          title="Assemble Selected Question Bank Items"
          onClose={() => setWizard(null)}
          width={600}
          footer={
            <div className="flex w-full gap-3">
              <Button
                variant="ghost"
                className="flex-1 border-transparent bg-slate-100"
                onClick={() => setWizard(null)}
              >
                Return to Bank
              </Button>
              <Button
                className="flex-1"
                disabled={tab === 'bulk' && selectedItems.length === 0}
                onClick={() => {
                  setWizard(null)
                  setSelected([])
                  navigate(tab === 'bulk' ? featurePath('tos', syllabus.id) : '/exam-config')
                }}
              >
                {tab === 'bulk' ? 'Confirm & Map to TOS' : 'Continue to Exam Setup'}
              </Button>
            </div>
          }
        >
          <div className="-mt-2 flex gap-1 rounded-[10px] border border-line bg-slate-50 p-1">
            {[
              ['bulk', 'Bulk Add to Midterm TOS'],
              ['new', 'Create New Exam Set Setup'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-[13px] ${
                  tab === key
                    ? 'bg-white font-semibold text-brand shadow-[0_2px_2px_rgba(15,23,42,0.05)]'
                    : 'font-medium text-ink-3'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'bulk' ? (
            <>
              <div className="mt-5 flex flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
                <p className="text-[13px] font-bold text-brand">
                  Bulk Action Selection ({selectedItems.length} Item
                  {selectedItems.length === 1 ? '' : 's'} Selected)
                </p>
                <div className="flex flex-col gap-2">
                  {selectedItems.map((q) => (
                    <div key={q.id} className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-xs font-semibold">
                        • {q.id}: {q.target.replace(/\.$/, '')}
                      </p>
                      <p className="shrink-0 text-[11px] text-ink-3">
                        {q.co} • {q.bloom} • {q.difficulty}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-accent bg-warn-bg p-3">
                <TriangleAlert size={16} className="shrink-0 text-accent-dark" />
                <p className="min-w-0 flex-1 text-xs">
                  <span className="font-bold text-accent-dark">Alignment check:</span> Shifting these{' '}
                  {selectedItems.length} items will cover{' '}
                  {[...new Set(selectedItems.map((q) => q.co))].join(', ')} at the{' '}
                  {[...new Set(selectedItems.map((q) => q.bloom))].join(' / ')} level
                  {selectedItems.length > 1 ? 's' : ''}.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase text-ink-3" htmlFor="cell">
                  Target Midterm TOS Matrix Cell
                </label>
                <select
                  id="cell"
                  className="w-full rounded-lg border border-line bg-white p-3 text-[13px]"
                  value={cell}
                  onChange={(e) => setCell(e.target.value)}
                >
                  {matrixCells.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex gap-4">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase text-ink-3" htmlFor="weight">
                    Target Weight
                  </label>
                  <div className="flex items-center gap-2 rounded-md border border-line p-2.5">
                    <input
                      id="weight"
                      className="min-w-0 flex-1 text-[13px] outline-none"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                    <span className="text-[11px] text-ink-3">% of total score</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase text-ink-3" htmlFor="points">
                    Test Points
                  </label>
                  <div className="flex items-center gap-2 rounded-md border border-line p-2.5">
                    <input
                      id="points"
                      className="min-w-0 flex-1 text-[13px] outline-none"
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                    />
                    <span className="text-[11px] text-ink-3">per item</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-5">
              Start a new exam set from the configuration screen. Any items selected here stay
              selected and can be mapped into the new allocation once its TOS is generated.
            </p>
          )}
        </Modal>
      )}
    </AppShell>
  )
}

function ChipGroup({ label, options, selected, onToggle }) {
  return (
    <div className="mb-5 flex flex-col gap-2.5">
      <p className="text-[11px] font-bold uppercase text-ink-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onToggle(o)}
            aria-pressed={selected.includes(o)}
            className={`rounded-lg border px-3 py-1.5 text-xs ${
              selected.includes(o)
                ? 'border-brand bg-brand-soft font-semibold text-brand'
                : 'border-line bg-white font-medium text-ink-2'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
