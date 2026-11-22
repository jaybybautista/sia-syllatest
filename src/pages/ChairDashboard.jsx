import { useNavigate } from 'react-router-dom'
import { Award, Coins, FileText, ShieldCheck } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Button, Card, PageHeading } from '../components/ui.jsx'
import {
  approvalQueue,
  chairMetrics,
  coCoverage,
  complianceTone,
  facultyActivity,
} from '../data/mock.js'
import { featurePath } from '../data/features.js'
import { latestForCode } from '../data/syllabi.js'
import { useAppState } from '../state/context.js'

const icons = { file: FileText, shield: ShieldCheck, coins: Coins, award: Award }

export default function ChairDashboard() {
  const navigate = useNavigate()
  const { syllabi } = useAppState()

  return (
    <AppShell
      title="Department Chair Management"
      subtitle="Monitor curriculum compliance indexes, pending TOS blueprints, and faculty syllabus submission pipelines."
    >
      <div className="grid grid-cols-4 gap-5 max-xl:grid-cols-2">
        {chairMetrics.map((m) => {
          const Icon = icons[m.icon]
          return (
            <Card key={m.label} className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-ink-2">{m.label}</p>
                <Icon size={18} className="text-ink-2" />
              </div>
              <p className="text-[28px] font-bold">{m.value}</p>
              <p className="text-xs text-ink-3">{m.note}</p>
            </Card>
          )
        })}
      </div>

      <div className="flex gap-6 max-xl:flex-col">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <PageHeading title="Syllabi & Exam Approval Queues" />
          <Card className="overflow-x-auto rounded-2xl shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-white/60 text-xs font-bold text-ink-3">
                  <th className="w-[130px] p-3 px-5 font-bold">COURSE</th>
                  <th className="p-3 px-5 font-bold">INSTRUCTOR</th>
                  <th className="w-[130px] p-3 px-5 font-bold">TYPE</th>
                  <th className="w-[140px] p-3 px-5 font-bold">COMPLIANCE</th>
                  <th className="w-[160px] p-3 px-5 font-bold">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {approvalQueue.map((r) => {
                  const t = complianceTone(r.compliance)
                  return (
                    <tr key={r.code} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-4">
                        <p className="text-[13px] font-bold text-brand">{r.code}</p>
                        <p className="text-[11px] text-ink-3">{r.title}</p>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold">{r.instructor}</td>
                      <td className="px-5 py-4 text-[13px] text-ink-2">{r.type}</td>
                      <td className="px-5 py-4">
                        <Badge tone={t.tone}>
                          {r.compliance}% ({t.label})
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Button className="px-3 py-1.5 text-[11px]" onClick={() => navigate(featurePath('approval', latestForCode(syllabi, r.code)?.id))}>
                          {r.action}
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
            {coCoverage.map((c) => {
              const t = complianceTone(c.pct)
              return (
                <div key={c.code} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold">{c.label}</p>
                    <p className="text-xs text-ink-3">{c.pct}% Mapped</p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded bg-slate-100">
                    <div className={`h-full ${t.bar}`} style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              )
            })}
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <p className="text-sm font-bold uppercase">Faculty Activity</p>
            <div className="flex flex-col gap-3">
              {facultyActivity.map((a) => (
                <div key={a.text}>
                  <p className="text-xs">{a.text}</p>
                  <p className="text-[11px] text-ink-3">{a.when}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
