import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Circle, CircleAlert, TriangleAlert } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Button, Card, Modal } from '../components/ui.jsx'
import { courses, syllabus, timingTemplates } from '../data/mock.js'
import { useAppState } from '../state/context.js'
import { featurePath } from '../data/features.js'

const course = courses[0]

const examTypes = [
  'Midterm Diagnostic Examination',
  'Final Diagnostic Examination',
  'Prelim Quiz Set',
]
const weightingBases = [
  {
    label: 'Combined (Lecture 60% + Lab 40%)',
    note: 'Standard University split matrix mapping',
  },
  {
    label: 'Pure Lecture Distribution basis',
    note: 'Ignores laboratory syllabus configurations',
  },
]

const durationPresets = [45, 60, 90, 120]
const translations = ['English & Filipino Dual Mode', 'English only', 'Filipino only']

const tiers = [
  { key: 'lower', label: 'Lower-Order (Remember / Understand)', bar: 'bg-brand', text: 'text-brand' },
  { key: 'mid', label: 'Mid-Order (Apply / Analyze)', bar: 'bg-accent', text: 'text-accent-dark' },
  { key: 'higher', label: 'Higher-Order (Evaluate / Create)', bar: 'bg-emerald-600', text: 'text-ok' },
]

// Both the per-item answering time and the per-item review allowance come from the admin timing
// estimator, so the two screens cannot disagree about how long an exam takes.
const mcTemplate = timingTemplates.find((t) => t.type === 'Multiple Choice')
const mcTarget = mcTemplate.minutes
const mcBufferMins = mcTemplate.bufferSecs / 60

const selectClass =
  'w-full appearance-none rounded-md border border-line bg-white p-3 text-[13px] text-ink'
const groupLabel = 'text-[11px] font-bold text-ink-3'

export default function ExamConfig() {
  const navigate = useNavigate()
  const { examConfig, setExamConfig, activeSyllabusId } = useAppState()
  const { examType, weighting, translation, items, duration, mix, chapters } = examConfig
  const [overrideTime, setOverrideTime] = useState(false)

  const update = (patch) => setExamConfig((c) => ({ ...c, ...patch }))

  const mixTotal = mix.lower + mix.mid + mix.higher

  // Duration model: answering time plus review time must fit inside the stated written duration.
  // The overload frame stated the buffer as a flat 10% of duration while the admin estimator states
  // it per item; the per-item figure is the specific one and is what both screens now use.
  const reviewBuffer = items * mcBufferMins
  const computedMinutes = items * mcTarget + reviewBuffer
  const timeOverloaded = computedMinutes > duration
  const fittingItems = Math.max(1, Math.floor(duration / (mcTarget + mcBufferMins)))
  const blocked = mixTotal !== 100 || chapters.length === 0 || (timeOverloaded && !overrideTime)

  const selectedHours = syllabus.chapters
    .filter((c) => chapters.includes(c.n))
    .reduce((sum, c) => sum + c.hours, 0)

  const counts = useMemo(
    () => ({
      lower: Math.round((mix.lower / 100) * items),
      mid: Math.round((mix.mid / 100) * items),
      higher: Math.round((mix.higher / 100) * items),
    }),
    [mix, items],
  )

  function setTier(key, value) {
    update({ mix: { ...mix, [key]: Number(value) } })
  }

  return (
    <AppShell
      title="Diagnostic Exam Configuration"
      subtitle="Define assessment constraints to automatically distribute and map cognitive levels."
    >
      <div className="flex gap-6 max-xl:flex-col">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Card className="flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-bold">{course.code} Midterm Parameters</p>
              <Badge tone="info">ACTIVE DRAFT</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              <div className="flex flex-col gap-1.5">
                <label className={groupLabel} htmlFor="examType">
                  EXAM TYPE
                </label>
                <select
                  id="examType"
                  className={selectClass}
                  value={examType}
                  onChange={(e) => update({ examType: e.target.value })}
                >
                  {examTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={groupLabel} htmlFor="syllabus">
                  COURSE SYLLABUS
                </label>
                <select id="syllabus" className={selectClass} defaultValue={`${course.code} - ${course.title}`}>
                  {courses.map((c) => (
                    <option key={c.code}>{`${c.code} - ${c.title}`}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={groupLabel} htmlFor="items">
                  TOTAL ITEMS / POINTS
                </label>
                <div className="flex items-center gap-2 rounded-md border border-line bg-white p-3">
                  <input
                    id="items"
                    type="number"
                    min="10"
                    max="200"
                    value={items}
                    onChange={(e) => update({ items: Number(e.target.value) })}
                    className="min-w-0 flex-1 text-[13px] outline-none"
                  />
                  <span className="text-[11px] font-semibold text-ink-3">ITEMS</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className={groupLabel}>DURATION PRESET</p>
                <div className="flex gap-2">
                  {durationPresets.map((m) => (
                    <button
                      key={m}
                      onClick={() => update({ duration: m })}
                      aria-pressed={duration === m}
                      className={`flex-1 rounded-md border px-3.5 py-2.5 text-xs font-semibold ${
                        duration === m
                          ? 'border-brand bg-brand text-white'
                          : 'border-line bg-white text-ink-2'
                      }`}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={groupLabel} htmlFor="translation">
                  MULTILINGUAL TRANSLATION
                </label>
                <select
                  id="translation"
                  className={selectClass}
                  value={translation}
                  onChange={(e) => update({ translation: e.target.value })}
                >
                  {translations.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className={groupLabel}>SYLLABUS COVERAGE MULTI-SELECT</p>
              <div className="flex flex-wrap gap-2">
                {syllabus.chapters.map((c) => {
                  const on = chapters.includes(c.n)
                  return (
                    <button
                      key={c.n}
                      onClick={() =>
                        update({
                          chapters: on
                            ? chapters.filter((x) => x !== c.n)
                            : [...chapters, c.n].sort((a, b) => a - b),
                        })
                      }
                      aria-pressed={on}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${
                        on ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-white text-ink-2'
                      }`}
                    >
                      {on ? <Check size={12} /> : <Circle size={12} />}
                      Ch {c.n}. {c.title} ({c.hours}h)
                    </button>
                  )
                })}
              </div>
              {chapters.length === 0 && (
                <p className="text-xs font-medium text-bad">
                  Select at least one chapter to allocate items across.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <p className={groupLabel}>COGNITIVE WEIGHTING SYSTEM BASIS</p>
              <div className="flex gap-3 max-md:flex-col">
                {weightingBases.map((w) => (
                  <button
                    key={w.label}
                    onClick={() => update({ weighting: w.label })}
                    aria-pressed={weighting === w.label}
                    className={`flex flex-1 flex-col gap-1 rounded-lg border bg-white p-4 text-left ${
                      weighting === w.label ? 'border-2 border-brand' : 'border-line'
                    }`}
                  >
                    <span
                      className={`text-sm font-bold ${
                        weighting === w.label ? 'text-brand' : 'text-ink'
                      }`}
                    >
                      {w.label}
                    </span>
                    <span className="text-xs text-ink-2">{w.note}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <p className="text-base font-bold">Cognitive Target Mix (Bloom&apos;s Revised)</p>
              <p className={`text-xs font-bold ${mixTotal === 100 ? 'text-ok' : 'text-bad'}`}>
                {mixTotal}% allocated
              </p>
            </div>
            <div className="flex flex-col gap-3.5">
              {tiers.map((t) => (
                <div key={t.key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor={t.key} className="font-semibold text-ink-2">
                      {t.label}
                    </label>
                    <p className={`font-bold ${t.text}`}>
                      {mix[t.key]}% ({counts[t.key]} Items)
                    </p>
                  </div>
                  <input
                    id={t.key}
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={mix[t.key]}
                    onChange={(e) => setTier(t.key, e.target.value)}
                    className="accent-brand"
                  />
                  <div className="h-2 w-full overflow-hidden rounded bg-slate-100">
                    <div className={`h-full ${t.bar}`} style={{ width: `${mix[t.key]}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {mixTotal !== 100 && (
              <p className="text-xs font-medium text-bad">
                The three tiers must total 100% before the allocation matrix can be generated.
              </p>
            )}
          </Card>
        </div>

        <div className="w-[380px] shrink-0 max-xl:w-full">
          <Card className="sticky top-8 flex flex-col gap-5 p-6">
            <p className="text-base font-bold">Configuration Audit</p>
            <div className="flex flex-col gap-3 text-[13px]">
              <div className="flex justify-between">
                <p className="text-ink-2">Stated Syllabus Hours</p>
                <p className="font-bold">{syllabus.statedHours} Hours</p>
              </div>
              <div className="flex justify-between">
                <p className="text-ink-2">Selected Chapter Hours</p>
                <p className="font-bold">{selectedHours} Hours</p>
              </div>
              <div className="flex justify-between gap-4">
                <p className="text-ink-2">Weight Distribution Ratio</p>
                <p className={`text-right font-bold ${mixTotal === 100 ? 'text-ok' : 'text-bad'}`}>
                  {mixTotal === 100 ? 'Balanced (100% compliant)' : `Off by ${100 - mixTotal}%`}
                </p>
              </div>
            </div>
            <hr className="border-line" />

            <p className="text-base font-bold">Review Duration Metrics</p>
            <div className="flex flex-col gap-4 text-[13px]">
              <div className="flex justify-between gap-4">
                <p className="text-ink-2">10% Standard Review Buffer</p>
                <p className="font-bold text-accent-dark">
                  {reviewBuffer.toFixed(1)} Mins Included
                </p>
              </div>
              <div className="flex justify-between gap-4">
                <p className="text-ink-2">Required Exam Target</p>
                <p className="font-bold">{duration.toFixed(1)} Mins Max</p>
              </div>
              <div className="flex justify-between gap-4">
                <p className="text-ink-2">Total Computed Time</p>
                <p className={`font-bold ${timeOverloaded ? 'text-bad' : 'text-ok'}`}>
                  {computedMinutes.toFixed(1)} Mins
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                timeOverloaded ? 'border-bad bg-bad-bg' : 'border-accent bg-warn-bg'
              }`}
            >
              {timeOverloaded ? (
                <TriangleAlert size={18} className="shrink-0 text-bad" />
              ) : (
                <CircleAlert size={18} className="shrink-0 text-accent-dark" />
              )}
              <p className="min-w-0 flex-1 text-xs leading-[1.4]">
                {timeOverloaded
                  ? 'Review buffer has been consumed. High failure risk estimated for lab students if not optimized.'
                  : `Within target: ${items} items at ${mcTarget} min each plus buffer fits the ${duration}-minute window.`}
              </p>
            </div>

            {timeOverloaded ? (
              <Button
                variant="danger"
                className="w-full"
                onClick={() => update({ items: fittingItems })}
              >
                Auto-Optimize Question Count
              </Button>
            ) : (
              <Button className="w-full" disabled={blocked} onClick={() => navigate(featurePath('tos', activeSyllabusId))}>
                Generate TOS Allocation Matrix
              </Button>
            )}
          </Card>
        </div>
      </div>

      {timeOverloaded && !overrideTime && (
        <Modal
          title="Time allocation overload"
          onClose={() => setOverrideTime(true)}
          width={500}
          footer={
            <>
              <Button variant="ghost" onClick={() => setOverrideTime(true)}>
                Proceed anyway
              </Button>
              <Button
                onClick={() => {
                  update({ items: fittingItems })
                  setOverrideTime(false)
                }}
              >
                Reduce to {fittingItems} items
              </Button>
            </>
          }
        >
          <p>
            {items} items at {mcTarget} minutes each plus a {reviewBuffer.toFixed(1)}-minute review
            buffer needs {computedMinutes.toFixed(1)} minutes, which exceeds the{' '}
            {duration}-minute written duration. {fittingItems} items fit the window.
          </p>
        </Modal>
      )}
    </AppShell>
  )
}
