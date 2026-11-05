import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Info, Lock } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Button, Card, Modal } from '../components/ui.jsx'
import { courses, syllabus } from '../data/mock.js'
import { bloomColumns, buildMatrix } from '../data/tos.js'
import { useAppState } from '../state/context.js'

const course = courses[0]
const splits = ['Lecture Split (60%)', 'Laboratory Split (40%)']

export default function TosBuilder() {
  const navigate = useNavigate()
  const { examConfig, tosLocked, setTosLocked } = useAppState()
  const [split, setSplit] = useState(splits[0])
  const [confirmLock, setConfirmLock] = useState(false)
  const [nonce, setNonce] = useState(0)

  // Only the chapters selected on the configuration screen take part in the allocation.
  const selectedChapters = useMemo(
    () => syllabus.chapters.filter((c) => examConfig.chapters.includes(c.n)),
    [examConfig.chapters],
  )

  const { rows, totals } = useMemo(
    () => buildMatrix(selectedChapters, examConfig.items, examConfig.mix),
    // nonce lets "Recalculate values" re-run the allocation explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [examConfig.items, examConfig.mix, selectedChapters, nonce],
  )

  const aligned = totals.items === examConfig.items
  const hoursReconcile = totals.hours === syllabus.statedHours

  return (
    <AppShell
      title="Table of Specifications (TOS) Builder"
      subtitle="Stated syllabus hours are used to deterministically compute item counts using the Largest-Remainder Method."
    >
      <div className="flex flex-col gap-3 rounded-[20px] border border-white/10 bg-brand p-5 shadow-[0_12px_16px_rgba(15,23,42,0.15)]">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-white" />
          <p className="text-sm font-bold text-white">
            Largest-Remainder Allocation Algorithm Active
          </p>
        </div>
        <p className="text-[13px] leading-[1.5] text-gray-300">
          Formula:{' '}
          <span className="font-bold text-white">
            Item Count = (Topic Hours / Total Hours) × Target Exam Items
          </span>
          . Remainders are dynamically rounded and distributed to the highest fractional values to
          maintain an exact target count of {examConfig.items}.
        </p>
      </div>

      <Card className="flex flex-col gap-5 rounded-[20px] p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <p className="text-base font-bold">
              {selectedChapters.length === syllabus.chapters.length ? `Chapters 1-${syllabus.chapters.length}` : `${selectedChapters.length} selected chapters`} Distribution Grid
            </p>
            <Badge tone={aligned ? 'ok' : 'bad'}>
              {totals.items} / {examConfig.items} Items Aligned
            </Badge>
            {tosLocked && (
              <Badge tone="info">
                <Lock size={11} className="mr-1" /> Locked
              </Badge>
            )}
          </div>
          <div
            role="tablist"
            aria-label="Weighting split"
            className="flex gap-1 rounded-md bg-slate-100 p-1"
          >
            {splits.map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={split === s}
                onClick={() => setSplit(s)}
                className={`rounded px-3 py-1.5 text-xs ${
                  split === s ? 'bg-white font-semibold text-ink' : 'font-medium text-ink-3'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[900px] border-collapse text-[13px]">
            <thead>
              <tr className="bg-slate-100 text-left text-[11px] font-bold text-ink-3">
                <th className="w-[260px] p-3 font-bold">CHAPTER TOPIC</th>
                <th className="w-[60px] p-3 font-bold">HOURS</th>
                <th className="w-[80px] p-3 font-bold">WEIGHT %</th>
                <th className="w-[80px] p-3 font-bold">ITEMS</th>
                <th className="p-3 text-center font-bold" colSpan={bloomColumns.length}>
                  BLOOM DISTRIBUTION (REM / UND / APP / ANA / EVA / CRE)
                </th>
                <th className="w-[80px] p-3 text-right font-bold">POINTS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.n} className="border-b border-line">
                  <td className="p-4">
                    <p className="text-[13px] font-bold">
                      Ch {r.n}. {r.title}
                    </p>
                    <p className="text-[11px] text-ink-3">{r.co} Mapped</p>
                  </td>
                  <td className="p-4">{r.hours}h</td>
                  <td className="p-4">{r.weight.toFixed(2)}%</td>
                  <td className="p-4 font-bold text-brand">{r.items}</td>
                  {r.bloom.map((count, i) => (
                    <td
                      key={bloomColumns[i]}
                      className={`w-10 p-4 text-center ${
                        count > 0 ? 'font-semibold text-ink' : 'text-ink-3'
                      }`}
                    >
                      {count}
                    </td>
                  ))}
                  <td className="p-4 text-right font-bold">{r.items}</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold">
                <td className="p-4">Live Totals</td>
                <td className="p-4">{totals.hours}h</td>
                <td className="p-4">{totals.weight.toFixed(2)}%</td>
                <td className="p-4 font-extrabold text-brand">{totals.items}</td>
                {totals.bloom.map((count, i) => (
                  <td key={bloomColumns[i]} className="w-10 p-4 text-center">
                    {count}
                  </td>
                ))}
                <td className="p-4 text-right font-extrabold">{totals.items}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className={aligned ? 'text-ok' : 'text-bad'} />
            <p className="text-[13px] font-semibold text-ink-2">
              {aligned
                ? 'Calculated metrics match university threshold constraints.'
                : 'Allocation does not reconcile with the configured item target.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setNonce((n) => n + 1)}>
              Recalculate Values
            </Button>
            <Button disabled={!aligned || tosLocked} onClick={() => setConfirmLock(true)}>
              {tosLocked ? 'TOS Locked' : 'Approve and Lock TOS'}
            </Button>
          </div>
        </div>

        <p className="text-xs text-ink-3">
          Hours total {totals.hours} across {rows.length} chapters, against{' '}
          {syllabus.statedHours} stated on the cover page.{' '}
          {totals.hours === syllabus.statedHours
            ? 'Figures reconcile.'
            : 'Resolve the hour discrepancy in the consistency audit before submitting for approval.'}
        </p>
      </Card>

      {confirmLock && (
        <Modal
          title="Confirm TOS Allocation & Lock"
          onClose={() => setConfirmLock(false)}
          width={540}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmLock(false)}>
                Cancel &amp; Edit
              </Button>
              <Button
                onClick={() => {
                  setTosLocked(true)
                  setConfirmLock(false)
                  navigate('/generation')
                }}
              >
                Approve and Generate Items
              </Button>
            </>
          }
        >
          <p className="-mt-2 text-[13px]">
            You are locking the {course.code} {examConfig.examType.split(' ')[0]} Table of
            Specifications. Once locked, the cognitive target mix cannot be modified without system
            recalculation.
          </p>

          <div className="mt-5 flex flex-col gap-3 rounded-xl bg-brand-soft p-4 text-[13px]">
            <Row label="Target Exam Items" value={`${totals.items} Items Aligned`} tone="text-brand" />
            <Row label="Total Syllabus Hours" value={`${totals.hours} computed hours`} />
            <Row
              label="Largest-Remainder Method"
              value={aligned ? '100% compliant' : 'Not reconciled'}
              tone={aligned ? 'text-ok' : 'text-bad'}
            />
            <Row
              label="Bloom Cognitive Distribution"
              value={`${examConfig.mix.lower}% LOP / ${examConfig.mix.mid}% MOP / ${examConfig.mix.higher}% HOP`}
            />
          </div>

          {/* Figma asserted "compliance checks passed" while showing 91 computed against 90 stated.
              The banner now reflects whichever is actually true. */}
          {hoursReconcile ? (
            <div className="mt-4 rounded-lg border border-emerald-600 bg-ok-bg p-3">
              <p className="text-xs leading-[1.4]">
                University compliance checks passed. The item distribution mathematically aligns with
                stated lecture and laboratory split constraints.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-accent bg-warn-bg p-3">
              <p className="text-xs leading-[1.4]">
                <span className="font-bold">Hours not reconciled:</span> chapter hours total{' '}
                {totals.hours} against {syllabus.statedHours} stated on the cover page. Item counts
                are internally consistent, but the hour discrepancy stays open until it is resolved
                in the consistency audit.
              </p>
            </div>
          )}
        </Modal>
      )}
    </AppShell>
  )
}

function Row({ label, value, tone = 'text-ink' }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="font-semibold text-ink-2">{label}</p>
      <p className={`text-right font-bold ${tone}`}>{value}</p>
    </div>
  )
}
