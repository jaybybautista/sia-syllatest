import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, CheckCircle2, Loader, Sparkles } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Button, Card, Modal } from '../components/ui.jsx'
import { auditChecks, severityTone } from '../data/mock.js'
import { featurePath } from '../data/features.js'
import { useSyllabus } from '../state/context.js'

const weight = { CRITICAL: 14, MEDIUM: 6, LOW: 2 }

export default function Consistency() {
  const navigate = useNavigate()
  const { syllabus } = useSyllabus()
  const course = syllabus
  const { bankItems, complianceScore, findings: allFindings } = syllabus
  const computedHours = syllabus.chapters.reduce((sum, c) => sum + c.hours, 0) + (syllabus.otherHours ?? 0)
  const [findings, setFindings] = useState(allFindings)
  const [resolved, setResolved] = useState([])
  const [auditing, setAuditing] = useState(false)
  const [auditProgress, setAuditProgress] = useState(0)
  const [reviewFixes, setReviewFixes] = useState(false)
  const [accepted, setAccepted] = useState([])
  const [resolving, setResolving] = useState(null)
  const [rationale, setRationale] = useState('')
  const [mapped, setMapped] = useState([])

  const score = Math.min(
    100,
    complianceScore + resolved.reduce((sum, id) => sum + weight[byId(id).severity], 0),
  )
  const clean = findings.length === 0
  const critical = findings.find((f) => f.severity === 'CRITICAL')

  function byId(id) {
    return allFindings.find((f) => f.id === id)
  }

  // An unassessed-outcome finding names a CO; the dialog then offers bank items that already
  // sit in that outcome's chapters so faculty can map coverage without drafting new questions.
  const targetOutcome = resolving?.targetCo
    ? syllabus.outcomes.find((o) => o.id === resolving.targetCo)
    : null
  const mappableItems = targetOutcome
    ? bankItems.filter((i) => i.co === targetOutcome.id)
    : []

  function runAudit() {
    setAuditing(true)
    setAuditProgress(0)
    const timer = setInterval(() => {
      setAuditProgress((p) => {
        if (p >= 100) {
          clearInterval(timer)
          setAuditing(false)
          setAccepted(findings.map((f) => f.id))
          setReviewFixes(true)
          return 100
        }
        return p + 10
      })
    }, 140)
  }

  function resolve(id) {
    setFindings((fs) => fs.filter((f) => f.id !== id))
    setResolved((r) => [...r, id])
    setResolving(null)
    setRationale('')
    setMapped([])
  }

  function applyAccepted() {
    setResolved((r) => [...r, ...accepted])
    setFindings((fs) => fs.filter((f) => !accepted.includes(f.id)))
    setAccepted([])
    setReviewFixes(false)
  }

  const tone = score >= 90 ? 'ok' : score >= 80 ? 'warn' : 'bad'
  const ring = {
    ok: 'bg-ok-bg border-emerald-200 text-ok',
    warn: 'bg-warn-bg border-amber-200 text-warn',
    bad: 'bg-bad-bg border-red-200 text-bad',
  }[tone]

  // The auto-fix review is a full page in the design, not a dialog: the title changes and the
  // findings are shown as before/after diffs the faculty member ticks individually.
  if (reviewFixes) {
    return (
      <AppShell
        title="Syllabus Integrity & AI Resolution Control"
        subtitle="Diagnostic review of computed-versus-stated compliance variables. Review before writing to master database."
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold">
            Select &amp; Apply Suggested Compliancy Corrections
          </h2>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setReviewFixes(false)}>
              Keep All Original
            </Button>
            <Button disabled={accepted.length === 0} onClick={applyAccepted}>
              Apply Selected Fixes ({accepted.length})
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {findings.map((f) => {
            const checked = accepted.includes(f.id)
            return (
              <div
                key={f.id}
                className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Badge tone={severityTone[f.severity]}>{f.tag ?? f.severity}</Badge>
                    <p className="text-[15px] font-bold">{f.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p
                      className={`text-[13px] font-semibold ${
                        f.confidence === 'High Confidence AI Fix' ? 'text-ok' : 'text-ink-3'
                      }`}
                    >
                      {f.confidence}
                    </p>
                    <button
                      role="checkbox"
                      aria-checked={checked}
                      aria-label={`Apply fix for ${f.title}`}
                      onClick={() =>
                        setAccepted((a) =>
                          a.includes(f.id) ? a.filter((x) => x !== f.id) : [...a, f.id],
                        )
                      }
                      className={`flex size-5 items-center justify-center rounded ${
                        checked ? 'bg-brand' : 'border-2 border-line bg-white'
                      }`}
                    >
                      {checked && <Check size={12} className="text-white" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-6 max-lg:flex-col">
                  <div className="flex flex-1 flex-col gap-2 rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-bold text-ink-3">CURRENT STATE IN DOCUMENT</p>
                    <p
                      className={`font-bold text-bad ${
                        f.severity === 'CRITICAL' ? 'text-xl' : 'text-[15px] text-ink'
                      }`}
                    >
                      {f.before?.headline}
                    </p>
                    {f.before?.detail && <p className="text-[13px] text-ink-2">{f.before.detail}</p>}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 rounded-lg bg-brand-soft p-4">
                    <p className="text-xs font-bold text-brand">
                      PROPOSED ADJUSTED COMPLIANT STATE
                    </p>
                    <p
                      className={`font-bold ${
                        f.severity === 'CRITICAL' ? 'text-xl text-ok' : 'text-[15px] text-brand'
                      }`}
                    >
                      {f.after?.headline}
                    </p>
                    {f.after?.detail && <p className="text-[13px] text-brand">{f.after.detail}</p>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Syllabus Integrity & Consistency Audit"
      subtitle="Diagnostic review of computed-versus-stated compliance variables."
    >
      <Card className="flex items-center justify-between gap-6 rounded-[20px] p-6">
        <div className="flex items-center gap-5">
          <div
            className={`flex size-[72px] shrink-0 flex-col items-center justify-center rounded-full border ${ring}`}
          >
            <p className="text-[22px] font-extrabold">{score}%</p>
          </div>
          <div className="max-w-[460px]">
            <p className="text-lg font-bold">
              {clean ? 'Compliance Index Cleared' : 'Compliance Index Deficit'}
            </p>
            <p className="text-[13px] text-ink-3">
              {clean
                ? `All detected discrepancies in ${course.code} (${course.title}) have been resolved. The syllabus is ready for TOS generation.`
                : `SyllaTest detected mathematical and logical validation errors in ${course.code} (${course.title}) syllabus. Mismatch violates regional standards.`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button variant="ghost" onClick={() => navigate(featurePath('verification', syllabus.id))}>
            Return to Verification
          </Button>
          {clean ? (
            <Button onClick={() => navigate('/exam-config')}>Continue to Exam Setup</Button>
          ) : (
            <Button variant="accent" icon={Sparkles} onClick={runAudit}>
              Apply AI Auto-Fixes
            </Button>
          )}
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <h2 className="text-base font-bold">Integrity Warnings &amp; Discrepancy Gaps</h2>

        {clean && (
          <Card className="flex items-center gap-3 rounded-2xl p-6">
            <CheckCircle2 size={20} className="text-ok" />
            <p className="text-sm font-semibold text-ok">
              No open findings. {resolved.length} discrepancies resolved in this audit pass.
            </p>
          </Card>
        )}

        {critical && (
          <Card className="flex flex-col gap-5 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge tone={severityTone[critical.severity]}>{critical.severity}</Badge>
                <p className="text-base font-bold">{critical.title}</p>
              </div>
              <p className="text-xs text-ink-3">ID: {critical.id}</p>
            </div>
            <div className="flex gap-10 max-lg:flex-col max-lg:gap-5">
              <div className="flex-1">
                <p className="text-xs font-bold text-ink-2">STATED TOTAL HOURS</p>
                <p className="text-[28px] font-bold">{critical.stated}</p>
                <p className="text-xs text-ink-3">Document Cover Page Specification</p>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-ink-2">SUM OF CHAPTER LECTURES</p>
                <p className="text-[28px] font-bold text-bad">{critical.computed}</p>
                <p className="text-xs text-ink-3">Aggregated duration of physical schedules</p>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-ink-2">RECOMMENDED FIX</p>
                <p className="text-sm font-semibold text-ok">{critical.fix}</p>
                <p className="text-xs text-ink-3">{critical.fixNote}</p>
              </div>
            </div>
            <Button className="self-start" onClick={() => setResolving(critical)}>
              Resolve discrepancy
            </Button>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          {findings
            .filter((f) => f.severity !== 'CRITICAL')
            .map((f) => (
              <Card key={f.id} className="flex items-center gap-5 rounded-[14px] p-5">
                <div className="w-[120px] shrink-0">
                  <Badge tone={severityTone[f.severity]}>{f.severity}</Badge>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{f.title}</p>
                  <p className="text-[13px] text-ink-2">{f.detail}</p>
                </div>
                <Button
                  variant="ghost"
                  className="shrink-0 px-3 py-1.5 text-xs text-brand"
                  onClick={() => setResolving(f)}
                >
                  Resolve
                </Button>
              </Card>
            ))}
        </div>
      </div>

      {auditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-8">
          <div className="flex w-full max-w-[420px] flex-col gap-6 rounded-2xl border border-white/40 bg-white/95 p-6 shadow-[-4px_12px_24px_rgba(15,23,42,0.1)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-bold">AI Consistency Audit</p>
                <p className="text-xs text-ink-3">Mathematical &amp; Pedagogical Audit Run</p>
              </div>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10">
                <Loader size={14} className="animate-spin text-brand" />
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[13px]">
                <p className="font-semibold text-ink-2">Audit Process Depth</p>
                <p className="font-bold text-brand">{auditProgress}% Complete</p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-[3px] bg-line">
                <div
                  className="h-full rounded-[3px] bg-brand transition-all"
                  style={{ width: `${auditProgress}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {auditChecks.map((check, i) => {
                const end = ((i + 1) / auditChecks.length) * 100
                const start = (i / auditChecks.length) * 100
                const state =
                  auditProgress >= end ? 'done' : auditProgress >= start ? 'running' : 'waiting'
                return (
                  <div
                    key={check}
                    className={`flex items-center gap-3 ${state === 'waiting' ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                        state === 'done' ? 'bg-ok-bg' : 'bg-brand/10'
                      }`}
                    >
                      {state === 'done' ? (
                        <Check size={12} className="text-ok" />
                      ) : (
                        <Loader size={12} className={state === 'running' ? 'animate-spin text-brand' : 'text-ink-3'} />
                      )}
                    </span>
                    <p className="min-w-0 flex-1 text-[13px] font-semibold">{check}</p>
                    <p
                      className={`shrink-0 text-xs ${
                        state === 'done'
                          ? 'text-ok'
                          : state === 'running'
                            ? 'font-semibold text-brand'
                            : 'text-ink-3'
                      }`}
                    >
                      {state === 'done' ? 'Done' : state === 'running' ? 'Running' : 'Queued'}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-slate-50 p-3 text-[11px]">
              <p className="font-bold text-ink-3">CONSOLE DIAGNOSTIC LOG</p>
              <p className="text-ink-2">
                [LOG] Verifying {syllabus.outcomes.length} course outcomes against diagnostic
                question-bank items...
              </p>
              {auditProgress > 60 && (
                <p className="text-ink-2">
                  [LOG] Found {findings.length} open finding{findings.length === 1 ? '' : 's'} in the{' '}
                  {course.code} syllabus.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {resolving && (
        <Modal
          title="Resolve Compliance Discrepancy"
          onClose={() => setResolving(null)}
          width={640}
          footer={
            <>
              <Button variant="ghost" onClick={() => setResolving(null)}>
                Discard
              </Button>
              <Button className="px-6" disabled={!rationale.trim()} onClick={() => resolve(resolving.id)}>
                Save Resolution
              </Button>
            </>
          }
        >
          <p className="-mt-2 mb-5 text-[13px] font-semibold text-bad">
            {resolving.severity === 'CRITICAL'
              ? `Warning: computed hours exceed the stated total by ${computedHours - syllabus.statedHours}`
              : `Warning: ${resolving.title} — finding ${resolving.id}`}
          </p>

          {targetOutcome && (
            <div className="rounded-xl border border-line bg-slate-50 p-4">
              <p className="text-[11px] font-bold text-ink-3">
                TARGET UNASSESSED COURSE OUTCOME ({targetOutcome.id.replace(' ', '-')})
              </p>
              <p className="mt-2 text-sm font-semibold text-brand">
                {targetOutcome.text} (Tag: {targetOutcome.bloom})
              </p>
            </div>
          )}

          {!targetOutcome && (
            <div className="rounded-xl border border-line bg-slate-50 p-4">
              <p className="text-[11px] font-bold text-ink-3">FINDING DETAIL</p>
              <p className="mt-2 text-[13px]">{resolving.detail}</p>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3">
            <p className="text-[13px] font-bold text-ink">
              {targetOutcome
                ? 'Select Pre-Validated Diagnostic Items to Map'
                : 'Recommended corrective action'}
            </p>
            {targetOutcome ? (
              <div className="flex flex-col gap-2">
                {mappableItems.length === 0 && (
                  <p className="text-xs text-ink-3">
                    No bank items sit in {targetOutcome.id}&apos;s chapters yet.
                  </p>
                )}
                {mappableItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-white p-3"
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={mapped.includes(item.id)}
                      onChange={() =>
                        setMapped((m) =>
                          m.includes(item.id) ? m.filter((x) => x !== item.id) : [...m, item.id],
                        )
                      }
                    />
                    <span
                      className={`flex size-[18px] shrink-0 items-center justify-center rounded ${
                        mapped.includes(item.id) ? 'bg-brand' : 'border-2 border-line bg-white'
                      }`}
                    >
                      {mapped.includes(item.id) && <Check size={10} className="text-white" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold">
                        {item.id}: &ldquo;{item.text}&rdquo;
                      </span>
                      <span className="block text-[11px] text-ok">
                        Bloom&apos;s Level: {item.bloom} • Chapter {item.chapter}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-ok-bg/60 p-4">
                <p className="text-[13px] font-semibold text-ok">{resolving.fix}</p>
                <p className="text-xs text-ink-3">{resolving.fixNote}</p>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <label className="text-[13px] font-bold text-ink" htmlFor="rationale">
              Faculty Curricular Adjustment Rationale (CHED Mandatory)
            </label>
            <textarea
              id="rationale"
              rows={3}
              className="w-full rounded-lg border border-line bg-white p-3 text-[13px] text-ink"
              placeholder="Record why this adjustment maintains curriculum alignment."
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
            />
            {!rationale.trim() && (
              <p className="text-[11px] text-ink-3">
                A rationale is required before the resolution can be saved.
              </p>
            )}
          </div>
        </Modal>
      )}
    </AppShell>
  )
}
