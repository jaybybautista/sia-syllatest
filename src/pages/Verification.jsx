import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleAlert, Settings2, TriangleAlert, ZoomIn, ZoomOut } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Button, Card, Modal } from '../components/ui.jsx'
import { bloomToneFor } from '../data/bloom.js'
import { featurePath } from '../data/features.js'
import { auditSyllabus } from '../lib/syllabusParser.js'
import { useAppState, useSyllabus } from '../state/context.js'

export default function Verification() {
  const navigate = useNavigate()
  const { syllabus } = useSyllabus()
  const { bloomLevels, updateSyllabus, logActivity } = useAppState()
  const course = syllabus
  const [zoom, setZoom] = useState(1)
  const [outcomes, setOutcomes] = useState(syllabus.outcomes)
  const [chapters, setChapters] = useState(syllabus.chapters)
  const [statedHours, setStatedHours] = useState(syllabus.statedHours)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  // Orientation and examination hours count toward the stated total but are not chapters.
  const otherHours = syllabus.otherHours ?? 0
  const total = chapters.reduce((sum, c) => sum + Number(c.hours || 0), 0) + otherHours
  const mismatch = total !== statedHours
  const dirty =
    outcomes !== syllabus.outcomes || chapters !== syllabus.chapters || statedHours !== syllabus.statedHours

  function setChapter(n, patch) {
    setChapters((cs) => cs.map((c) => (c.n === n ? { ...c, ...patch } : c)))
  }

  /** Writes the corrections to the syllabus. A parsed upload's findings are re-checked against them. */
  function save() {
    if (!dirty) return
    const patch = { outcomes, chapters, statedHours, otherHours }
    if (syllabus.source) Object.assign(patch, auditSyllabus(patch))
    updateSyllabus(syllabus.id, patch)
    logActivity({ syllabusId: syllabus.id, code: syllabus.code, text: `verified the extracted fields of ${syllabus.code}` })
  }

  function reset() {
    setOutcomes(syllabus.outcomes)
    setChapters(syllabus.chapters)
    setStatedHours(syllabus.statedHours)
  }

  return (
    <AppShell
      title="Syllabus Extraction Verification"
      subtitle="Verify and edit the AI extracted outcome nodes before compiling the Table of Specifications."
    >
      <div className="flex min-h-0 flex-1 gap-5 max-xl:flex-col">
        <Card className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/40 bg-white/60 p-3">
            <p className="text-xs font-bold">
              {syllabus.file}
              {syllabus.pages ? ` (${syllabus.pages} Page${syllabus.pages === 1 ? '' : 's'})` : ''}
              {syllabus.source && <span className="font-medium text-ink-3"> · read with {syllabus.source.method}</span>}
            </p>
            <div className="flex gap-2">
              <button
                aria-label="Zoom in"
                onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
                className="flex size-7 items-center justify-center rounded border border-white/40 bg-white/70"
              >
                <ZoomIn size={14} className="text-ink-2" />
              </button>
              <button
                aria-label="Zoom out"
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
                className="flex size-7 items-center justify-center rounded border border-white/40 bg-white/70"
              >
                <ZoomOut size={14} className="text-ink-2" />
              </button>
            </div>
          </div>
          {syllabus.source ? (
            <div className="flex flex-1 justify-center overflow-auto bg-slate-50 p-6">
              <pre
                className="h-fit w-full max-w-[640px] origin-top whitespace-pre-wrap rounded-xl bg-white p-8 font-sans text-[11px] leading-[1.6] text-ink-2 shadow-[0_8px_24px_rgba(30,58,138,0.12)]"
                style={{ transform: `scale(${zoom})`, tabSize: 4 }}
              >
                {syllabus.source.text}
              </pre>
            </div>
          ) : (
          <div className="flex flex-1 justify-center overflow-auto bg-slate-50 p-10">
            <article
              className="h-fit w-[450px] shrink-0 origin-top rounded-xl bg-white p-12 shadow-[0_8px_24px_rgba(30,58,138,0.12),0_18px_40px_rgba(15,23,42,0.15)]"
              style={{ transform: `scale(${zoom})` }}
            >
              <header className="flex flex-col items-center gap-2 text-center">
                <p className="text-[11px] font-bold text-ink-3">PANGASINAN STATE UNIVERSITY</p>
                <p className="text-xs font-extrabold text-brand">COLLEGE OF COMPUTING SCIENCES</p>
                <p className="text-[10px] text-ink-3">Lingayen, Pangasinan</p>
              </header>
              <hr className="my-6 border-line" />
              <p className="text-xs font-extrabold">COURSE SYLLABUS IN {course.code}</p>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-2">
                Course Code: {course.code} · Course Title: {course.title} · Course Credits: 3 Units (
                {syllabus.creditSplit}) · Stated Contact Hours: {syllabus.statedHours} Hours
                (Lecture: {syllabus.lectureHours}, Laboratory: {syllabus.labHours})
              </p>
              <p className="mt-6 text-[11px] font-extrabold">COURSE OUTCOMES (CO) &amp; MAPPING</p>
              <ul className="mt-3 flex flex-col gap-2 text-[10px] leading-[1.5] text-ink-2">
                {syllabus.outcomes.map((o) => (
                  <li key={o.id}>
                    <span className="font-semibold">{o.id}:</span> {o.text} (Tag: {o.bloom})
                  </li>
                ))}
              </ul>
            </article>
          </div>
          )}
        </Card>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <Card className="flex items-center justify-between gap-4 rounded-xl p-4">
            <h2 className="text-lg font-bold">Extracted Node Editor</h2>
            <div className="flex gap-2">
              <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setConfirmDiscard(true)}>
                Discard Draft
              </Button>
              <Button className="px-3 py-1.5 text-xs" disabled={!dirty} onClick={save}>
                {dirty ? 'Save Changes' : 'Saved'}
              </Button>
              <Button
                variant="accent"
                className="px-3 py-1.5 text-xs"
                onClick={() => {
                  save()
                  navigate(featurePath('consistency', syllabus.id))
                }}
              >
                Validate Consistency
              </Button>
            </div>
          </Card>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
            <Card className="flex flex-col gap-3 rounded-xl p-4">
              <p className="text-sm font-bold uppercase">Basic Course Parameters</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-[11px] text-ink-3">STATED CO-HOURS</p>
                  <div className="mt-1 flex items-center gap-2 rounded-md bg-slate-100 p-1.5">
                    <input
                      type="number"
                      min="0"
                      aria-label="Stated contact hours"
                      value={statedHours ?? ''}
                      placeholder="Not found"
                      onChange={(e) => setStatedHours(e.target.value === '' ? null : Number(e.target.value))}
                      className="w-20 rounded border border-line bg-white px-2 py-1 text-[13px]"
                    />
                    <span className="text-[13px]">Hours</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-ink-3">CREDIT SPLIT</p>
                  <p className="mt-1 rounded-md bg-slate-100 p-2.5 text-[13px]">
                    {syllabus.creditSplit}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col gap-3 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold uppercase">Course Outcomes &amp; Cognitive Levels</p>
                <Link
                  to="/bloom"
                  className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                >
                  <Settings2 size={12} />
                  Manage my levels
                </Link>
              </div>
              <div className="flex flex-col gap-2.5">
                {outcomes.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 rounded-md bg-slate-100 p-3">
                    <p className="shrink-0 text-xs font-bold text-brand">{o.id}</p>
                    <p className="min-w-0 flex-1 text-[13px]">{o.text}</p>
                    <select
                      aria-label={`Bloom level for ${o.id}`}
                      value={o.bloom}
                      onChange={(e) =>
                        setOutcomes((os) =>
                          os.map((x) => (x.id === o.id ? { ...x, bloom: e.target.value } : x)),
                        )
                      }
                      className={`shrink-0 rounded px-2 py-1 text-[11px] font-bold ${bloomToneFor(o.bloom)}`}
                    >
                      {bloomLevels.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                      {/* A tag whose level was since deleted stays visible until it is changed. */}
                      {!bloomLevels.some((b) => b.name === o.bloom) && (
                        <option value={o.bloom}>{o.bloom} (removed)</option>
                      )}
                    </select>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="flex flex-col gap-3 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold uppercase">Stated Topic Distributions</p>
                <p className={`text-xs font-semibold ${mismatch ? 'text-bad' : 'text-ok'}`}>
                  {total} / {statedHours ?? '?'} hours
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {chapters.map((c) => (
                  <div key={c.n} className="flex items-center gap-3 rounded-md bg-slate-100 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-ink-3">Chapter {c.n}</p>
                      <p className="truncate text-[13px] font-semibold" title={c.title}>
                        {c.title}
                      </p>
                      {(c.lec != null && c.lec + c.lab === c.hours) || c.cos?.length > 1 ? (
                        <p className="text-[10px] text-ink-3">
                          {c.lec != null && c.lec + c.lab === c.hours && `Lec ${c.lec} + Lab ${c.lab} hrs`}
                          {c.lec != null && c.lec + c.lab === c.hours && c.cos?.length > 1 && ' · '}
                          {c.cos?.length > 1 && `also serves ${c.cos.filter((x) => x !== c.co).join(', ')}`}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <input
                        type="number"
                        aria-label={`Hours for chapter ${c.n}`}
                        value={c.hours}
                        onChange={(e) => setChapter(c.n, { hours: Number(e.target.value) })}
                        className="w-16 rounded border border-line bg-white px-2 py-1 text-right text-xs font-bold text-brand"
                      />
                      <span className="text-[11px] text-ink-3">hrs</span>
                      <select
                        aria-label={`Course outcome for chapter ${c.n}`}
                        value={c.co ?? ''}
                        title={c.coInferred ? 'Inferred from the wording; confirm it' : undefined}
                        onChange={(e) =>
                          setChapter(c.n, {
                            co: e.target.value,
                            cos: [e.target.value, ...(c.cos ?? []).filter((x) => x !== e.target.value)],
                            coInferred: false,
                          })
                        }
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          c.coInferred ? 'bg-warn-bg text-warn' : 'bg-brand-soft text-brand'
                        }`}
                      >
                        {outcomes.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.id}
                            {c.coInferred && o.id === c.co ? ' (inferred)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {otherHours > 0 && (
                  <div className="flex items-center gap-3 rounded-md border border-dashed border-line p-3">
                    <p className="min-w-0 flex-1 text-[12px] text-ink-2">
                      Orientation and examinations (not TOS topics)
                    </p>
                    <p className="shrink-0 text-xs font-bold text-ink-2">{otherHours} hrs</p>
                  </div>
                )}
              </div>
            </Card>

            {mismatch && (
              <Card className="flex items-center gap-3 rounded-xl border-brand/40 p-4 shadow-[0_8px_20px_rgba(30,58,138,0.15)]">
                <CircleAlert size={18} className="shrink-0 text-brand" />
                <p className="min-w-0 flex-1 text-[13px] font-semibold text-brand">
                  Curriculum discrepancy check required: the scheduled hours sum to {total}, but the
                  syllabus states {statedHours ?? 'no'} contact hours.
                </p>
                <Button
                  className="shrink-0 px-4 py-2 text-[13px]"
                  onClick={() => navigate(featurePath('consistency', syllabus.id))}
                >
                  Trigger Audit Check
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>

      {confirmDiscard && (
        <Modal
          title="Discard Unsaved Changes?"
          subtitle={`${course.code} Syllabus Extraction Draft`}
          icon={TriangleAlert}
          tone="bad"
          onClose={() => setConfirmDiscard(false)}
          width={520}
          footer={
            <div className="flex w-full gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmDiscard(false)}>
                Cancel
              </Button>
              <Button
                variant="ghost"
                className="flex-1 border-transparent bg-brand/10 text-brand"
                onClick={() => {
                  save()
                  setConfirmDiscard(false)
                  navigate('/dashboard')
                }}
              >
                Save Draft
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  reset()
                  setConfirmDiscard(false)
                }}
              >
                Discard Changes
              </Button>
            </div>
          }
        >
          <p className="leading-[22px]">
            {dirty
              ? 'Your corrections to the extracted outcomes, chapter hours and outcome mapping have not been saved. Discarding puts back the values last saved.'
              : 'There are no unsaved corrections. The values shown are the ones saved for this syllabus.'}
          </p>
        </Modal>
      )}
    </AppShell>
  )
}
