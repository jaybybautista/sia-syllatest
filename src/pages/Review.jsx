import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, CircleX, GripVertical, RotateCcw, TriangleAlert } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Button, Card, Modal } from '../components/ui.jsx'
import { bloomTone, chair, courses, deadlines, questions as seedQuestions } from '../data/mock.js'
import { useAppState } from '../state/context.js'

const course = courses[0]

const regenerateModes = [
  ['Same parameters', 'Redraft the item against the identical TOS cell and Bloom level.'],
  ['Rework distractors', 'Keep the stem and correct answer; redraft the incorrect options only.'],
  ['Lower cognitive level', 'Target one Bloom level below the current classification.'],
]

const fieldBox = 'w-full rounded-md border border-white/40 bg-white/70 p-3 text-[13px] text-ink'
const fieldLabel = 'text-[11px] font-bold text-ink-3'

export default function Review() {
  const navigate = useNavigate()
  const { examConfig } = useAppState()
  const [items, setItems] = useState(seedQuestions)
  const [activeId, setActiveId] = useState(seedQuestions[0].id)
  const [regenerating, setRegenerating] = useState(false)
  const [mode, setMode] = useState(regenerateModes[0][0])
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [submitNote, setSubmitNote] = useState('')

  const active = items.find((q) => q.id === activeId)
  const flagged = items.filter((q) => q.status === 'warn').length
  const commentedItem = items.find((q) => q.comments.length > 0 && q.status === 'warn')
  const openComments = commentedItem ? commentedItem.comments.length : 0

  function updateActive(patch) {
    setItems((qs) => qs.map((q) => (q.id === activeId ? { ...q, ...patch } : q)))
  }

  function setCorrect(key) {
    updateActive({
      options: active.options.map((o) => ({ ...o, correct: o.key === key })),
    })
  }

  return (
    <AppShell
      title="Interactive Item Verification Workspace"
      subtitle="Validate, edit, and reorganize generated items. Real-time compliance auditing guarantees alignment."
    >
      <div className="flex min-h-0 flex-1 gap-5 max-xl:flex-col">
        <Card className="flex w-[280px] shrink-0 flex-col gap-3 p-4 max-xl:w-full">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-bold">Items Navigator ({examConfig.items})</p>
            {flagged > 0 && (
              <span className="text-[11px] font-semibold text-warn">{flagged} flagged</span>
            )}
          </div>
          <p className="text-[11px] text-ink-3">
            Showing {items.length} drafted items of {examConfig.items} in this set.
          </p>
          <ul className="flex flex-col gap-1.5">
            {items.map((q) => (
              <li key={q.id}>
                <button
                  onClick={() => setActiveId(q.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-md p-2.5 text-left ${
                    q.id === activeId ? 'bg-brand-soft' : 'hover:bg-white/70'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <GripVertical size={12} className="shrink-0 text-ink-3" />
                    <span
                      className={`truncate text-[13px] ${
                        q.id === activeId ? 'font-semibold text-brand' : 'text-ink-2'
                      }`}
                    >
                      {q.id}. {q.short}
                    </span>
                  </span>
                  {q.status === 'warn' ? (
                    <TriangleAlert size={14} className="shrink-0 text-warn" />
                  ) : (
                    <CheckCircle2 size={14} className="shrink-0 text-ok" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex min-w-0 flex-1 flex-col gap-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-bold">Edit Item: {active.id}</p>
            <Badge tone="info">VERSION {active.version} DRAFT</Badge>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel} htmlFor="qtext">
              QUESTION TEXT
            </label>
            <textarea
              id="qtext"
              rows={3}
              className={`${fieldBox} leading-[1.5]`}
              value={active.text}
              onChange={(e) => updateActive({ text: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <p className={fieldLabel}>MULTIPLE CHOICE OPTIONS</p>
            {active.options.map((o) => (
              <label
                key={o.key}
                className={`flex cursor-pointer items-center gap-2.5 rounded-md border p-2.5 ${
                  o.correct ? 'border-emerald-600 bg-ok-bg' : 'border-white/40 bg-white/70'
                }`}
              >
                <input
                  type="radio"
                  name="correct"
                  className="sr-only"
                  checked={o.correct}
                  onChange={() => setCorrect(o.key)}
                />
                {o.correct ? (
                  <CheckCircle2 size={16} className="shrink-0 text-ok" />
                ) : (
                  <CircleX size={16} className="shrink-0 text-ink-3" />
                )}
                <span
                  className={`min-w-0 flex-1 text-[13px] ${
                    o.correct ? 'font-semibold text-ink' : 'text-ink-2'
                  }`}
                >
                  {o.key}. {o.text}
                  {o.correct && ' (Correct)'}
                </span>
              </label>
            ))}
            <p className="text-[11px] text-ink-3">Select an option to mark it as the answer key.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel} htmlFor="rationale">
              PEDAGOGICAL RATIONALE
            </label>
            <textarea
              id="rationale"
              rows={3}
              className={`${fieldBox} leading-[1.4] text-ink-2`}
              value={active.rationale}
              onChange={(e) => updateActive({ rationale: e.target.value })}
            />
          </div>

          {active.previous && (
            <div className="flex flex-col gap-2 rounded-lg border border-line bg-slate-50 p-3">
              <p className={fieldLabel}>VERSION COMPARISON HISTORY</p>
              <div className="flex gap-3 text-xs">
                <div className="flex-1">
                  <p className="font-semibold text-ink-2">v{active.previous.version} (Original)</p>
                  <p className="text-ink-3">{active.previous.text}</p>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-brand">v{active.version} (Revised)</p>
                  <p className="text-ink-2">{active.text}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="flex w-[340px] shrink-0 flex-col gap-5 p-4 max-xl:w-full">
          <p className="text-sm font-bold">Metadata &amp; Verification Gaps</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <p className={fieldLabel}>BLOOM CLASSIFICATION</p>
              <Badge tone="info" className={bloomTone[active.bloom]}>
                {active.bloom}
              </Badge>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className={fieldLabel}>TOS CELL</p>
              <p className="text-[13px] font-semibold">
                Chapter {active.chapter} · {active.co}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className={fieldLabel}>METRICS COMPLIANCE</p>
              <p
                className={`text-[13px] font-semibold ${
                  active.alignment >= 90 ? 'text-ok' : 'text-warn'
                }`}
              >
                {active.alignment >= 90 ? 'High' : 'Needs review'} Alignment ({active.alignment}%)
              </p>
            </div>
          </div>

          {active.flag && (
            <div className="flex items-start gap-2 rounded-lg bg-warn-bg p-3">
              <TriangleAlert size={14} className="mt-0.5 shrink-0 text-warn" />
              <p className="text-[11px] leading-[1.4] text-ink-2">{active.flag}</p>
            </div>
          )}

          <hr className="border-line" />

          <div className="flex flex-col gap-2.5">
            <p className={fieldLabel}>CHAIR REVIEWER COMMENTS</p>
            {active.comments.length === 0 ? (
              <p className="text-[11px] text-ink-3">No chair comments on this item yet.</p>
            ) : (
              active.comments.map((c) => (
                <div key={c.text} className="rounded-lg bg-warn-bg p-3">
                  <p className="text-xs font-semibold">{c.author}</p>
                  <p className="text-[10px] uppercase tracking-wide text-ink-3">{c.role}</p>
                  <p className="mt-1 text-[11px] leading-[1.4] text-ink-2">{c.text}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto flex flex-col gap-2.5">
            <Button variant="ghost" icon={RotateCcw} onClick={() => setRegenerating(true)}>
              Regenerate Item
            </Button>
            <Button onClick={() => setConfirmSubmit(true)}>Submit for Approval</Button>
          </div>
        </Card>
      </div>

      {regenerating && (
        <Modal
          title={`Regenerate ${active.id}`}
          onClose={() => setRegenerating(false)}
          width={520}
          footer={
            <>
              <Button variant="ghost" onClick={() => setRegenerating(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  updateActive({
                    previous: { version: active.version, text: active.text },
                    version: (Number(active.version) + 0.1).toFixed(1),
                    status: 'ok',
                    alignment: Math.min(99, active.alignment + 12),
                    flag: undefined,
                  })
                  setRegenerating(false)
                }}
              >
                Regenerate
              </Button>
            </>
          }
        >
          <p className="mb-4">
            The item stays in the same TOS cell (Chapter {active.chapter}, {active.co}) so the
            allocation grid is unaffected.
          </p>
          <div className="flex flex-col gap-2">
            {regenerateModes.map(([label, note]) => (
              <label
                key={label}
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${
                  mode === label ? 'border-brand bg-brand-soft' : 'border-line'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  checked={mode === label}
                  onChange={() => setMode(label)}
                  className="mt-0.5 accent-[#1e3a8a]"
                />
                <span>
                  <span className="block text-[13px] font-semibold text-ink">{label}</span>
                  <span className="block text-xs text-ink-3">{note}</span>
                </span>
              </label>
            ))}
          </div>
        </Modal>
      )}

      {confirmSubmit && (
        <Modal
          title={`Submit ${course.code} Items for Review`}
          onClose={() => setConfirmSubmit(false)}
          width={540}
          footer={
            <div className="flex w-full gap-3">
              <Button
                variant="ghost"
                className="flex-1 border-transparent bg-slate-100"
                onClick={() => setConfirmSubmit(false)}
              >
                Return to Editor
              </Button>
              <Button className="flex-1" onClick={() => navigate('/export')}>
                Confirm &amp; Route Set
              </Button>
            </div>
          }
        >
          <p className="-mt-2 text-[13px] text-ink-3">
            Please confirm the readiness of all {examConfig.items} generated diagnostic items prior
            to routing to the department chair.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <p className="text-[11px] font-bold uppercase text-ink-3">Readiness Checklist</p>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 text-ok" />
              <p className="text-[13px] font-medium text-ink-2">
                TOS Aligned (100% Bloom&apos;s Match)
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 text-ok" />
              <p className="text-[13px] font-medium text-ink-2">
                Equivalence &amp; Item Shuffling Matrix configured
              </p>
            </div>
            {openComments > 0 ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-accent bg-warn-bg p-2.5">
                <TriangleAlert size={16} className="shrink-0 text-accent-dark" />
                <p className="min-w-0 flex-1 text-xs font-semibold">
                  {openComments} unresolved feedback comment{openComments > 1 ? 's' : ''} remain on
                  Item {commentedItem.id}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="shrink-0 text-ok" />
                <p className="text-[13px] font-medium text-ink-2">No unresolved chair comments</p>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase text-ink-3" htmlFor="reviewer">
              Target Reviewer
            </label>
            <select
              id="reviewer"
              className="w-full rounded-lg border border-line bg-white p-3 text-[13px] font-semibold text-ink"
              defaultValue={`${chair.name} (${chair.role})`}
            >
              <option>{`${chair.name} (${chair.role})`}</option>
              <option>College Assessment Committee</option>
            </select>
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase text-ink-3" htmlFor="submitNote">
              Submission Note
            </label>
            <textarea
              id="submitNote"
              rows={3}
              className="w-full rounded-lg border border-line bg-white p-3 text-[13px]"
              placeholder="Summarise what changed since the last submission."
              value={submitNote}
              onChange={(e) => setSubmitNote(e.target.value)}
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-[13px]">
            <p className="text-ink-2">Target Compliance Deadline</p>
            <p className="font-bold text-bad">{deadlines[1].date}, 2024</p>
          </div>
        </Modal>
      )}
    </AppShell>
  )
}
