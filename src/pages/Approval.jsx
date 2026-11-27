import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Check, CheckCircle2, Lock } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Button, Card, Modal } from '../components/ui.jsx'
import { chair, deadlines } from '../data/mock.js'
import { featurePath } from '../data/features.js'
import { useAppState, useSyllabus } from '../state/context.js'

const states = ['Draft', 'For Review', 'Revisions', 'Approved']

// Required hours per CO come from the stated 90 spread evenly over the chapters each CO owns;
// mapped hours are the chapter figures as extracted. The Figma frame hard-coded the overage onto
// CO 2, which contradicted its own "reduce Chapter 4" recommendation.
function coCoverage(syllabus) {
  const byCo = {}
  for (const ch of syllabus.chapters) {
    byCo[ch.co] = (byCo[ch.co] ?? 0) + ch.hours
  }
  const mappedTotal = Object.values(byCo).reduce((a, b) => a + b, 0)
  const scale = syllabus.statedHours / mappedTotal

  return syllabus.outcomes.map((o) => {
    const mapped = byCo[o.id] ?? 0
    const required = Math.round(mapped * scale)
    return { ...o, mapped, required, delta: mapped - required }
  })
}

// Figma's prefilled text called the 91-vs-90 figure a "1 Hour Deficit" on CO 2 and described 54
// as the lecture constraint, though the cover page lists 54 as laboratory hours and the overage
// sits on Chapter 4 (CO 3). The options are derived from the syllabus so they name the real gap.
function revisionReasonsFor(syllabus, coverage, computedHours) {
  const short = (text) => text.split(' ').slice(0, 5).join(' ').replace(/[.,]$/, '')
  const gaps = coverage
    .filter((c) => c.delta !== 0)
    .map(
      (c) =>
        `${c.id} — ${short(c.text)} (${Math.abs(c.delta)} hour ${c.delta > 0 ? 'over-allocation' : 'shortfall'})`,
    )
  const hours =
    computedHours !== syllabus.statedHours && gaps.length === 0
      ? [`Topic hours — ${computedHours} computed vs ${syllabus.statedHours} stated`]
      : []
  return [
    ...gaps,
    ...hours,
    ...syllabus.outcomes.map((o) => `${o.id} — ${short(o.text)} (outcome mismatch on drafted items)`),
    'Distractor quality below standard',
    'Insufficient coverage of a course outcome',
  ]
}

export default function Approval() {
  const navigate = useNavigate()
  const { syllabus } = useSyllabus()
  const { updateSyllabus, logActivity } = useAppState()
  const course = syllabus
  const author = { name: syllabus.instructor }
  const computedHours = syllabus.chapters.reduce((sum, c) => sum + c.hours, 0) + (syllabus.otherHours ?? 0)
  const coverage = useMemo(() => coCoverage(syllabus), [syllabus])
  const revisionReasons = useMemo(
    () => revisionReasonsFor(syllabus, coverage, computedHours),
    [syllabus, coverage, computedHours],
  )
  const thread = syllabus.review.thread
  // The review state belongs to the syllabus, so the history list shows it after leaving.
  const state = syllabus.review.state
  function setState(next) {
    updateSyllabus(syllabus.id, (s) => ({ review: { ...s.review, state: next } }))
    const verb = {
      Approved: `approved and locked the ${syllabus.code} blueprint`,
      Revisions: `requested revisions on ${syllabus.code}`,
      'For Review': `returned ${syllabus.code} to the review queue`,
      Draft: `moved ${syllabus.code} back to draft`,
    }[next]
    logActivity({ syllabusId: syllabus.id, code: syllabus.code, text: verb })
  }
  const [checks, setChecks] = useState({ hours: true, outcomes: false, duplicates: true, bloom: true })
  const [requesting, setRequesting] = useState(false)
  const [reason, setReason] = useState(revisionReasons[0])
  const [note, setNote] = useState(
    computedHours !== syllabus.statedHours
      ? `Please adjust the chapter hours so the schedule reconciles with the ${syllabus.statedHours}-hour total on the cover page. Detected ${computedHours} computed vs ${syllabus.statedHours} stated hours.`
      : `Please revise the ${syllabus.code} blueprint before it is resubmitted for approval.`,
  )
  const [severity, setSeverity] = useState('Critical Mismatch')
  const [due, setDue] = useState('2024-03-25')
  const [notify, setNotify] = useState(true)

  const allChecked = Object.values(checks).every(Boolean)

  const checklist = [
    ['hours', 'Stated lecture hours match total test items.'],
    ['outcomes', 'All course outcomes (COs) assessed.'],
    ['duplicates', 'No duplicate test questions detected.'],
    ['bloom', 'Cognitive complexity levels validated.'],
  ]

  if (state === 'Approved') {
    return (
      <AppShell
        title="Reviewer & Peer Verification"
        subtitle="Compare TOS blueprints side-by-side with drafted questions and submit official validation compliance logs."
      >
        <Card className="flex flex-col gap-8 rounded-3xl border-line p-10">
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ok-bg">
              <CheckCircle2 size={28} className="text-ok" />
            </span>
            <div>
              <p className="text-xl font-bold">Syllabus Aligned &amp; Locked Successfully</p>
              <p className="text-[13px] text-ok">
                PSU verification certified. Document metadata has been signed and made immutable.
              </p>
            </div>
          </div>

          <div className="flex gap-5 max-lg:flex-col">
            {/* Figma credited "Dr. Evelyn Ramos — Peer Reviewer" here, but she authors the set;
                the certifying identity is the chair who approved it. */}
            <InfoBlock
              label="CERTIFICATION IDENTITY"
              value={chair.name}
              note={`${chair.role} (CCS Dept)`}
            />
            <InfoBlock
              label="IMMUTABLE VERSION"
              value={`${course.code.replace(' ', '-')}-V2.0-LOCKED`}
              note={`Locked: ${deadlines[0].date}, 2024 • 11:34 AM`}
              tone="text-brand"
            />
            <InfoBlock
              label="SECURITY WATERMARK"
              value="SECURE_CERT_PSU_9942"
              note="Audit reference tag active"
              tone="text-accent-dark"
            />
          </div>

          <div className="flex gap-6 max-lg:flex-col">
            <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-6">
              <p className="text-[15px] font-bold text-brand">Generate Examination Blueprints</p>
              <p className="text-[13px] text-ink-2">
                Now that the syllabus hours and outcomes are verified mathematically, you can export
                the CHED compliance table of specifications or configure parallel final test banks.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate(featurePath('tos', syllabus.id))}>
                  Build Table of Specifications (TOS)
                </Button>
                <Button
                  variant="ghost"
                  className="border-brand text-brand"
                  onClick={() => navigate('/generation')}
                >
                  Generate Aligned Questions
                </Button>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-line bg-white p-6">
              <p className="text-[15px] font-bold">System Immutable Lock Policy</p>
              <p className="text-[13px] text-ink-2">
                To prevent syllabus drift, direct editing is now disabled. Revisions require a formal
                unlocking request signed by the Department Chairperson.
              </p>
              <Button
                variant="ghost"
                className="self-start border-transparent bg-slate-100"
                onClick={() => setState('For Review')}
              >
                File Chairperson Unlock Appeal
              </Button>
            </div>
          </div>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Reviewer & Peer Verification"
      subtitle="Compare TOS blueprints side-by-side with drafted questions and submit official validation compliance logs."
    >
      <div className="flex min-h-0 flex-1 gap-5 max-xl:flex-col">
        <Card className="flex min-w-0 flex-1 flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] font-bold">TOS &amp; EXAM SYNC VERIFIER</p>
            <div className="flex gap-2">
              {states.map((s) => (
                <span
                  key={s}
                  className={`rounded px-2.5 py-1 text-[11px] font-bold ${
                    s === state
                      ? 'bg-brand text-white'
                      : 'border border-white/40 bg-white/70 text-ink-3'
                  }`}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <hr className="border-line" />

          <div className="flex flex-col gap-3">
            <p className="text-[13px] font-bold text-ink-2">TOS COVERAGE RATIO AUDIT</p>
            {coverage.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg border border-white/40 bg-white/70 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold">
                    {c.id}: {c.text.split(' ').slice(0, 5).join(' ')}…
                  </p>
                  <p className="text-[11px] text-ink-3">
                    Required: {c.required} Hours | Mapped: {c.mapped} Hours
                  </p>
                </div>
                {c.delta === 0 ? (
                  <Badge tone="ok">Matched</Badge>
                ) : (
                  <Badge tone="bad">
                    {c.delta > 0 ? '+' : ''}
                    {c.delta} hour {c.delta > 0 ? 'Over-allocation' : 'Shortfall'}
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[13px] font-bold text-ink-2">ITEM AUDIT TRAIL</p>
            {thread ? (
              <Card className="flex flex-col gap-3 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-brand">{thread.item}</p>
                  <Badge tone="bad">OUTCOME MISMATCH</Badge>
                </div>
                <p className="text-[13px]">{thread.issue}</p>
                <div className="rounded-md border border-white/40 bg-white/70 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-ink-2">{author.name} (Instructor)</p>
                    <p className="text-[10px] text-ink-3">{thread.when}</p>
                  </div>
                  <p className="mt-2 text-xs text-ink-2">&ldquo;{thread.reply}&rdquo;</p>
                </div>
              </Card>
            ) : (
              <p className="rounded-lg border border-line bg-white/70 p-4 text-[13px] text-ink-3">
                No open reviewer threads on the {syllabus.code} blueprint.
              </p>
            )}
          </div>
        </Card>

        <Card className="flex w-[400px] shrink-0 flex-col gap-5 p-5 max-xl:w-full">
          <p className="text-sm font-bold">VERIFICATION STATUS</p>
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold text-ink-2">COMPLIANCE CHECKLIST</p>
            {checklist.map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checks[key]}
                  onChange={() => setChecks((c) => ({ ...c, [key]: !c[key] }))}
                />
                <span
                  className={`flex size-[18px] shrink-0 items-center justify-center rounded border-2 ${
                    checks[key] ? 'border-emerald-600 bg-ok-bg' : 'border-line'
                  }`}
                >
                  {checks[key] && <Check size={12} className="text-ok" />}
                </span>
                <span className="min-w-0 flex-1 text-[13px] text-ink-2">{label}</span>
              </label>
            ))}
            {!allChecked && (
              <p className="text-[11px] text-ink-3">
                Every checklist item must be confirmed before the blueprint can be locked.
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-2.5">
            <Button
              variant="ghost"
              className="w-full border-bad text-bad"
              onClick={() => setRequesting(true)}
            >
              Request Revisions
            </Button>
            <Button
              className="w-full"
              icon={Lock}
              disabled={!allChecked || state === 'Approved'}
              onClick={() => setState('Approved')}
            >
              {state === 'Approved' ? 'Blueprint Locked' : 'Approve & Lock Blueprint'}
            </Button>
          </div>
        </Card>
      </div>

      {requesting && (
        <Modal
          title="Request Course Syllabus Revisions"
          subtitle={`Course: ${course.code} — ${course.title}`}
          onClose={() => setRequesting(false)}
          width={560}
          footer={
            <>
              <Button
                variant="ghost"
                className="border-transparent bg-slate-100"
                onClick={() => setRequesting(false)}
              >
                Save Draft
              </Button>
              <Button
                onClick={() => {
                  setState('Revisions')
                  setRequesting(false)
                }}
              >
                Send Revision Request
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-ink-2">REVISION SEVERITY LEVEL</p>
              <div className="flex gap-3">
                {[
                  ['Critical Mismatch', 'bad'],
                  ['Minor Adjustments', 'muted'],
                ].map(([label, tone]) => (
                  <button
                    key={label}
                    onClick={() => setSeverity(label)}
                    className={`flex-1 rounded-md border px-4 py-2 text-[13px] font-semibold ${
                      severity === label
                        ? tone === 'bad'
                          ? 'border-bad bg-bad-bg text-bad'
                          : 'border-brand bg-brand-soft text-brand'
                        : 'border-line bg-white text-ink-2'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-ink-2" htmlFor="affected">
                AFFECTED SYLLABUS OUTCOMES / ITEMS
              </label>
              <select
                id="affected"
                className="w-full rounded-lg border border-line bg-slate-50 p-3 text-[13px]"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {revisionReasons.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-ink-2" htmlFor="note">
                DETAILED REQUIREMENTS FOR APPROVAL
              </label>
              <textarea
                id="note"
                rows={4}
                className="w-full rounded-lg border border-line bg-slate-50 p-3 text-[13px]"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex flex-1 flex-col gap-2">
                <label className="text-xs font-bold text-ink-2" htmlFor="due">
                  SUBMISSION DUE DATE
                </label>
                <div className="flex items-center gap-2.5 rounded-lg border border-line bg-white p-2.5">
                  <Calendar size={14} className="shrink-0 text-ink-3" />
                  <input
                    id="due"
                    type="date"
                    className="min-w-0 flex-1 text-[13px] outline-none"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <p className="text-xs font-bold text-ink-2">NOTIFY FACULTY VIA EMAIL</p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    role="switch"
                    aria-checked={notify}
                    aria-label={`Notify ${author.name}`}
                    onClick={() => setNotify((n) => !n)}
                    className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${
                      notify ? 'bg-brand' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
                        notify ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                  <p className="text-[13px]">Notify {author.name}</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

   </AppShell>
  )
}

function InfoBlock({ label, value, note, tone = 'text-ink' }) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-xl border border-line bg-white/80 p-5">
      <p className="text-[11px] font-bold uppercase text-ink-3">{label}</p>
      <p className={`text-[15px] font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-ink-2">{note}</p>
    </div>
  )
}
