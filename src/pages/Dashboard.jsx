import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Database, Eye, FileText, Table, TriangleAlert, UploadCloud } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Button, Card, PageHeading, ProgressBar } from '../components/ui.jsx'
import { courses, deadlines, term, user } from '../data/mock.js'

const verified = courses.filter((c) => c.status === 'Verified').length
const pending = courses.filter((c) => c.status !== 'Verified')

const metrics = [
  { label: 'Active Syllabi', icon: FileText, value: 8, line: '6 Verified, 2 Draft', sub: '75% verified' },
  { label: 'Generated TOS', icon: Table, value: 5, line: 'Aligned to Midterm/Final', sub: '100% compliance' },
  {
    label: 'Pending Review',
    icon: Eye,
    value: pending.length,
    line: 'Waiting for Chair Audit',
    sub: pending.map((c) => c.code).join(', '),
  },
  { label: 'AI Test Bank Items', icon: Database, value: 150, line: "Aligned to Bloom's tags", sub: '+45 this sem' },
]

const routeForType = { Syllabus: '/verification', 'TOS Draft': '/tos', 'Exam Bank': '/bank' }

export default function Dashboard() {
  const navigate = useNavigate()
  void verified

  return (
    <AppShell
      title="Faculty Dashboard"
      subtitle={`Welcome back, ${user.name} (${user.college})`}
    >
      <div className="flex items-center justify-between gap-6 rounded-[20px] border border-white/10 bg-brand p-6 shadow-[0_12px_16px_rgba(15,23,42,0.15)]">
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

      <div className="grid grid-cols-4 gap-5 max-xl:grid-cols-2">
        {metrics.map(({ label, icon: Icon, value, line, sub }) => (
          <Card key={label} className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-ink-2">{label}</p>
              <Icon size={18} className="text-ink-2" />
            </div>
            <p className="text-[28px] font-bold">{value}</p>
            <div>
              <p className="text-xs font-medium text-brand">{line}</p>
              <p className="text-[11px] text-ink-3">{sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-6 max-xl:flex-col">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <PageHeading title="Active Syllabi Management" />
          <Card className="overflow-hidden rounded-2xl shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
            <div className="flex bg-white/60 px-5 py-3 text-xs font-bold text-ink-3">
              <p className="w-[110px]">COURSE CODE</p>
              <p className="flex-1">COURSE TITLE</p>
              <p className="w-[120px]">TYPE</p>
              <p className="w-[140px]">STATUS</p>
              <p className="w-[170px]">SYSTEM ISSUES</p>
            </div>
            {courses.map((c) => (
              <Link
                key={c.code}
                to={c.issue ? '/consistency' : routeForType[c.type]}
                className="flex items-center border-b border-line px-5 py-4 last:border-b-0 hover:bg-white/60"
              >
                <p className="w-[110px] text-[13px] font-bold text-brand">{c.code}</p>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{c.title}</p>
                  <p className="text-[11px] text-ink-3">{c.updated}</p>
                </div>
                <p className="w-[120px] text-[13px] text-ink-2">{c.type}</p>
                <div className="w-[140px]">
                  <Badge tone={c.tone}>{c.status}</Badge>
                </div>
                <div
                  className={`flex w-[170px] items-center gap-1 text-xs ${c.issue ? 'text-bad' : 'text-ok'}`}
                >
                  {c.issue ? <TriangleAlert size={14} className="shrink-0" /> : <CheckCircle2 size={14} className="shrink-0" />}
                  <span className="truncate" title={c.issue ?? 'None'}>
                    {c.issue ?? 'None'}
                  </span>
                </div>
              </Link>
            ))}
          </Card>
        </div>

        <div className="flex w-[380px] shrink-0 flex-col gap-5 max-xl:w-full">
          <PageHeading title="Active AI Jobs" />
          <Link to="/processing" className="block">
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-accent-dark">ELEC 4</p>
                <p className="text-[11px] text-ink-3">12s left</p>
              </div>
              <p className="truncate text-sm font-semibold">{courses[0].title}</p>
              <ProgressBar value={67} />
              <p className="text-xs text-ink-2">Extracting CO/ILO mappings (Page 4/6)...</p>
            </Card>
          </Link>
          <Card className="flex flex-col gap-4 p-5">
            <p className="text-sm font-bold uppercase">Academic Compliance Deadlines</p>
            <div className="flex flex-col gap-3">
              {deadlines.map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="w-14 rounded-md bg-slate-100 p-1.5 text-center text-xs font-bold">
                    {d.date}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold">{d.label}</p>
                    <p className={`text-[11px] ${d.critical ? 'text-bad' : 'text-ink-3'}`}>{d.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
