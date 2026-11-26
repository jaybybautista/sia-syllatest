import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Database, Eye, FileText, Sparkles, Table, TriangleAlert, UploadCloud } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Button, Card, PageHeading } from '../components/ui.jsx'
import { term, termDeadlines } from '../data/mock.js'
import { featurePath } from '../data/features.js'
import {
  deadlineState,
  isOwnedBy,
  lastChangedOn,
  latestPerCourse,
  nextFeatureFor,
  shortDate,
  syllabusIssue,
  syllabusStage,
  syllabusStatus,
  timeAgo,
} from '../data/insights.js'
import { useAppState } from '../state/context.js'

const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`

export default function Dashboard() {
  const navigate = useNavigate()
  const { syllabi, account, activity, examConfig, bloomLevels } = useAppState()

  // This term's syllabi that the signed-in faculty member teaches or uploaded, newest first.
  const current = useMemo(
    () =>
      latestPerCourse(syllabi.filter((s) => isOwnedBy(s, account)))
        .filter((s) => s.term === term.label)
        .sort((a, b) => lastChangedOn(b).localeCompare(lastChangedOn(a))),
    [syllabi, account],
  )
  const ids = new Set(current.map((s) => s.id))

  const approved = current.filter((s) => s.review.state === 'Approved').length
  const locked = current.filter((s) => s.tosLocked).length
  const inReview = current.filter((s) => s.review.state === 'For Review')
  const bankItems = current.flatMap((s) => s.bankItems)
  const imported = bankItems.filter((q) => q.imported).length

  const metrics = [
    {
      label: 'Active Syllabi',
      icon: FileText,
      value: current.length,
      line: `${approved} approved, ${current.length - approved} in progress`,
      sub: current.length ? `${Math.round((approved / current.length) * 100)}% approved` : 'None uploaded this term',
    },
    {
      label: 'Locked TOS',
      icon: Table,
      value: locked,
      line: 'Ready for item generation',
      sub: `${current.length - locked} still in draft`,
    },
    {
      label: 'Pending Review',
      icon: Eye,
      value: inReview.length,
      line: 'Waiting for Chair Audit',
      sub: inReview.length ? inReview.map((s) => s.code).join(', ') : 'Nothing waiting',
    },
    {
      label: 'Question Bank Items',
      icon: Database,
      value: bankItems.length,
      line: "Tagged to Bloom's levels",
      sub: imported ? `${imported} imported from exam files` : `Across ${plural(current.length, 'course')}`,
    },
  ]

  const aiJobs = activity.filter((e) => e.ai && ids.has(e.syllabusId)).slice(0, 4)

  return (
    <AppShell title="Faculty Dashboard" subtitle={`Welcome back, ${account.name} (${account.college})`}>
      <div className="flex items-center justify-between gap-6 rounded-[20px] border border-white/10 bg-brand p-6 shadow-[0_12px_16px_rgba(15,23,42,0.15)] max-md:flex-col max-md:items-start">
        <div className="flex flex-1 flex-col gap-1.5">
          <p className="text-xl font-bold text-white">{term.long}</p>
          <p className="text-sm text-gray-300">
            Department mandate: Ensure all final examinations align mathematically with stated
            lecture hours. Direct automated audit verification is required.
          </p>
        </div>
        <Button variant="accent" icon={UploadCloud} onClick={() => navigate('/upload')}>
          Upload New Syllabus
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {metrics.map(({ label, icon: Icon, value, line, sub }) => (
          <Card key={label} className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-ink-2">{label}</p>
              <Icon size={18} className="text-ink-2" />
            </div>
            <p className="text-[28px] font-bold">{value}</p>
            <div>
              <p className="text-xs font-medium text-brand">{line}</p>
              <p className="truncate text-[11px] text-ink-3">{sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-6 max-xl:flex-col">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <PageHeading title="Active Syllabi Management" />
          <Card className="overflow-x-auto rounded-2xl shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
            <div className="min-w-[640px]">
              <div className="flex bg-white/60 px-5 py-3 text-xs font-bold text-ink-3">
                <p className="w-[90px]">COURSE</p>
                <p className="flex-1">COURSE TITLE</p>
                <p className="w-[110px]">STAGE</p>
                <p className="w-[140px]">STATUS</p>
                <p className="w-[160px]">SYSTEM ISSUES</p>
              </div>
              {current.length === 0 && (
                <div className="flex flex-col items-start gap-3 px-5 py-6">
                  <p className="text-[13px] text-ink-2">
                    You have no syllabi for {term.label} yet. Upload one to start its verification, TOS
                    and question bank.
                  </p>
                  <Button icon={UploadCloud} onClick={() => navigate('/upload')}>
                    Upload Syllabus
                  </Button>
                </div>
              )}
              {current.map((s) => {
                const issue = syllabusIssue(s)
                const status = syllabusStatus(s)
                return (
                  <Link
                    key={s.id}
                    to={featurePath(nextFeatureFor(s), s.id)}
                    className="flex items-center border-b border-line px-5 py-4 last:border-b-0 hover:bg-white/60"
                  >
                    <p className="w-[90px] text-[13px] font-bold text-brand">{s.code}</p>
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-sm font-semibold">{s.title}</p>
                      <p className="text-[11px] text-ink-3">Updated {timeAgo(lastChangedOn(s))}</p>
                    </div>
                    <p className="w-[110px] text-[13px] text-ink-2">{syllabusStage(s).label}</p>
                    <div className="w-[140px]">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>
                    <div className={`flex w-[160px] items-center gap-1 text-xs ${issue ? 'text-bad' : 'text-ok'}`}>
                      {issue ? (
                        <TriangleAlert size={14} className="shrink-0" />
                      ) : (
                        <CheckCircle2 size={14} className="shrink-0" />
                      )}
                      <span className="truncate" title={issue?.text ?? 'None'}>
                        {issue?.text ?? 'None'}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="flex w-[380px] shrink-0 flex-col gap-5 max-xl:w-full">
          <PageHeading title="Recent AI Jobs" />
          <Card className="flex flex-col gap-4 p-5">
            {aiJobs.length === 0 && (
              <p className="text-[13px] text-ink-3">
                No AI jobs yet. Uploading a syllabus or importing an exam file runs one.
              </p>
            )}
            {aiJobs.map((job) => (
              <div key={job.id} className="flex gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft">
                  <Sparkles size={14} className="text-brand" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase text-accent-dark">{job.code}</p>
                    <p className="text-[11px] text-ink-3">{timeAgo(job.at)}</p>
                  </div>
                  <p className="text-[13px] text-ink">{job.text}</p>
                  <p className="text-[11px] font-semibold text-ok">Completed</p>
                </div>
              </div>
            ))}
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
        </div>
      </div>
    </AppShell>
  )
}
