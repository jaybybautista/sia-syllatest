import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, FileText, ShieldCheck, Table } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Button, Card, PageHeading } from '../components/ui.jsx'
import { complianceTone, term, termDeadlines } from '../data/mock.js'
import { describe } from '../data/activity.js'
import { featurePath } from '../data/features.js'
import {
  deadlineState,
  latestPerCourse,
  outcomeCoverage,
  shortDate,
  syllabusIssue,
  syllabusStage,
  syllabusStatus,
  timeAgo,
} from '../data/insights.js'
import { useAppState } from '../state/context.js'

// Queue order: what needs the chair first.
const queueOrder = { 'For Review': 0, Revisions: 1, Draft: 2, Approved: 3 }
const actionFor = {
  'For Review': 'Review Blueprint',
  Revisions: 'View Revisions',
  Draft: 'View Draft',
  Approved: 'View Approval',
}

export default function ChairDashboard() {
  const navigate = useNavigate()
  const { syllabi, activity, examConfig, bloomLevels } = useAppState()

  // Every course the department has a syllabus for, and the syllabi uploaded for the active term.
  const courseCodes = useMemo(() => new Set(syllabi.map((s) => s.code)), [syllabi])
  const current = useMemo(
    () =>
      latestPerCourse(syllabi)
        .filter((s) => s.term === term.label)
        .sort((a, b) => queueOrder[a.review.state] - queueOrder[b.review.state] || a.code.localeCompare(b.code)),
    [syllabi],
  )
  const submittedCodes = new Set(current.map((s) => s.code))

  const submittedPct = courseCodes.size ? Math.round((submittedCodes.size / courseCodes.size) * 100) : 0
  const avgCompliance = current.length
    ? Math.round(current.reduce((sum, s) => sum + s.complianceScore, 0) / current.length)
    : 0
  const withIssues = current.filter((s) => syllabusIssue(s)).length
  const awaiting = current.filter((s) => s.review.state === 'For Review')
  const locked = current.filter((s) => s.tosLocked).length

  const metrics = [
    {
      label: 'Syllabi Submitted',
      icon: FileText,
      value: `${submittedPct}%`,
      note: `${submittedCodes.size} of ${courseCodes.size} courses for ${term.label}`,
    },
    {
      label: 'Syllabus Compliance',
      icon: ShieldCheck,
      value: `${avgCompliance}%`,
      note: withIssues ? `${withIssues} syllabi with open issues` : 'No open issues',
    },
    {
      label: 'Awaiting Your Review',
      icon: Eye,
      value: awaiting.length,
      note: awaiting.length ? awaiting.map((s) => s.code).join(', ') : 'Queue is clear',
    },
    {
      label: 'TOS Locked',
      icon: Table,
      value: `${locked} / ${current.length}`,
      note: 'Ready for item generation',
    },
  ]

  const people = activity.filter((e) => !e.ai).slice(0, 5)

  return (
    <AppShell
      title="Department Chair Management"
      subtitle="Monitor curriculum compliance indexes, pending TOS blueprints, and faculty syllabus submission pipelines."
    >
      <div className="grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {metrics.map(({ label, icon: Icon, value, note }) => (
          <Card key={label} className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-ink-2">{label}</p>
              <Icon size={18} className="text-ink-2" />
            </div>
            <p className="text-[28px] font-bold">{value}</p>
            <p className="truncate text-xs text-ink-3">{note}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-6 max-xl:flex-col">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <PageHeading title="Syllabi & Exam Approval Queues" />
          <Card className="overflow-x-auto rounded-2xl shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="bg-white/60 text-xs font-bold text-ink-3">
                  <th className="w-[150px] p-3 px-5 font-bold">COURSE</th>
                  <th className="p-3 px-5 font-bold">INSTRUCTOR</th>
                  <th className="w-[130px] p-3 px-5 font-bold">STAGE</th>
                  <th className="w-[150px] p-3 px-5 font-bold">COMPLIANCE</th>
                  <th className="w-[170px] p-3 px-5 font-bold">STATUS</th>
                  <th className="w-[160px] p-3 px-5 font-bold">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {current.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-[13px] text-ink-3">
                      No syllabi have been uploaded for {term.label} yet.
                    </td>
                  </tr>
                )}
                {current.map((s) => {
                  const t = complianceTone(s.complianceScore)
                  const status = syllabusStatus(s)
                  return (
                    <tr key={s.id} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-4">
                        <p className="text-[13px] font-bold text-brand">{s.code}</p>
                        <p className="text-[11px] text-ink-3">{s.title}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold">{s.instructor}</p>
                        <p className="text-[11px] text-ink-3">Updated {timeAgo(s.updatedOn ?? s.uploadedOn)}</p>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-ink-2">{syllabusStage(s).label}</td>
                      <td className="px-5 py-4">
                        <Badge tone={t.tone}>
                          {s.complianceScore}% ({t.label})
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Button
                          variant={s.review.state === 'For Review' ? 'primary' : 'ghost'}
                          className="px-3 py-1.5 text-[11px]"
                          onClick={() => navigate(featurePath('approval', s.id))}
                        >
                          {actionFor[s.review.state] ?? 'Open'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        </div>

        <div className="flex w-[400px] shrink-0 flex-col gap-5 max-xl:w-full">
          <PageHeading title="CO Coverage by Course" />
          <Card className="flex flex-col gap-4 p-5">
            <p className="-mt-1 text-[11px] text-ink-3">
              Course outcomes with at least one question bank item mapped to them.
            </p>
            {current.map((s) => {
              const pct = outcomeCoverage(s)
              const t = complianceTone(pct)
              return (
                <div key={s.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[13px] font-semibold">
                      {s.code} ({s.title})
                    </p>
                    <p className="shrink-0 text-xs text-ink-3">{pct}% Mapped</p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded bg-slate-100">
                    <div className={`h-full ${t.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <p className="text-sm font-bold uppercase">Academic Compliance Deadlines</p>
            <div className="flex flex-col gap-3">
              {termDeadlines.map((d) => {
                const state = deadlineState(d, current, examConfig, bloomLevels)
                return (
                  <div key={d.id} className="flex items-center gap-3">
                    <span className="w-14 shrink-0 rounded-md bg-slate-100 p-1.5 text-center text-xs font-bold">
                      {shortDate(d.due)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold">{d.label}</p>
                      <p className={`truncate text-[11px] ${state.tone}`} title={state.note}>
                        {state.note}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <p className="text-sm font-bold uppercase">Department Activity</p>
            <div className="flex flex-col gap-3">
              {people.length === 0 && <p className="text-xs text-ink-3">No activity yet.</p>}
              {people.map((a) => (
                <div key={a.id}>
                  <p className="text-xs">{describe(a)}</p>
                  <p className="text-[11px] text-ink-3">{timeAgo(a.at)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
