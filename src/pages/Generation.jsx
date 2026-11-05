import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Eye, Loader, TriangleAlert } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Button, Card, ProgressBar } from '../components/ui.jsx'
import { aiProviders, syllabus } from '../data/mock.js'
import { buildMatrix } from '../data/tos.js'
import { useAppState } from '../state/context.js'

// Tier label per chapter position, matching the completion summary in the design.
const tierLabel = ['Lower-Order', 'Mid-Order', 'Mid-Order', 'High-Order']

// Figma's failure panel named Claude-3-Opus / Claude-3-Sonnet as the compiler, a fourth vendor
// after Contra Core (admin card, sign-in footer) and Vertex Gemini (provider drawer). The
// configured provider list is used instead.
const [primaryProvider, fallbackProvider] = aiProviders

export default function Generation() {
  const navigate = useNavigate()
  const { examConfig } = useAppState()

  const selectedChapters = useMemo(
    () => syllabus.chapters.filter((c) => examConfig.chapters.includes(c.n)),
    [examConfig.chapters],
  )
  const { rows } = useMemo(
    () => buildMatrix(selectedChapters, examConfig.items, examConfig.mix),
    [selectedChapters, examConfig.items, examConfig.mix],
  )

  const [done, setDone] = useState(0)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(1)
  const [provider, setProvider] = useState(fallbackProvider.id)
  const timer = useRef(null)

  const target = examConfig.items
  const progress = Math.round((done / target) * 100)
  const complete = done >= target

  useEffect(() => {
    if (failed || complete) return undefined
    timer.current = setInterval(() => setDone((d) => Math.min(target, d + 2)), 180)
    return () => clearInterval(timer.current)
  }, [failed, complete, target, attempt])

  // Per-chapter job state derives from the single generated-item counter.
  const jobs = useMemo(() => {
    let consumed = done
    return rows.map((r, i) => {
      const completed = Math.max(0, Math.min(r.items, consumed))
      consumed -= completed
      return {
        ...r,
        completed,
        state: completed === r.items ? 'done' : completed > 0 ? 'running' : 'queued',
        tier: tierLabel[i] ?? 'Mid-Order',
      }
    })
  }, [rows, done])

  // On failure the last chapter is the one that could not be compiled.
  const failedJob = jobs[jobs.length - 1]
  const preserved = rows.slice(0, -1).reduce((sum, r) => sum + r.items, 0)
  const secondsLeft = Math.max(0, Math.ceil(((target - done) * 180) / 1000))
  const tokens = 2847 * done

  function retry() {
    setFailed(false)
    setAttempt((a) => a + 1)
  }

  const shell = {
    title: 'Generative AI Pipeline Status',
    subtitle:
      'Compiling diagnostic items. The system validates syntax and logic constructs automatically.',
  }

  if (failed) {
    return (
      <AppShell {...shell}>
        <div className="flex items-center gap-3 rounded-xl border border-bad bg-bad-bg p-4">
          <TriangleAlert size={18} className="shrink-0 text-bad" />
          <p className="min-w-0 flex-1 text-[13px] font-medium">
            <span className="font-bold text-bad">Partial Compilation Failure: </span>
            Ch {failedJob.n} ({failedJob.title}) - {failedJob.tier} Items failed to generate due to
            rate limiting (429) on the primary LLM compiler. {preserved} items were safely preserved.
          </p>
        </div>

        <div className="flex gap-6 max-xl:flex-col">
          <Card className="flex min-w-0 flex-1 flex-col gap-5 p-6">
            <p className="text-base font-bold">TOS Allocation Matrix Compilation Summary</p>
            <div className="flex flex-col gap-3">
              {jobs.map((j, i) => {
                const isFailed = i === jobs.length - 1
                return (
                  <div
                    key={j.n}
                    className={`flex items-center justify-between gap-4 rounded-md p-3 ${
                      isFailed ? 'border border-bad bg-bad-bg' : 'bg-ok-bg'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {isFailed && <TriangleAlert size={16} className="shrink-0 text-bad" />}
                      <p
                        className={`truncate text-[13px] font-semibold ${
                          isFailed ? 'text-red-800' : ''
                        }`}
                      >
                        Ch {j.n} ({j.title}) - {j.tier} Items
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-[11px] font-bold ${
                        isFailed ? 'text-bad' : 'text-ok'
                      }`}
                    >
                      {isFailed ? 'FAILED (API 429 LIMIT OVERLOAD)' : `PRESERVED (${j.items}/${j.items})`}
                    </p>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="flex w-[420px] shrink-0 flex-col gap-5 p-6 max-xl:w-full">
            <p className="text-base font-bold">Fault Resolution Panel</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-ink-3" htmlFor="compiler">
                CHANGE AI COMPILER PROVIDER
              </label>
              <select
                id="compiler"
                className="w-full rounded-md border border-line bg-white p-3 text-[13px]"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                {aiProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.priority.split(' (')[1]?.replace(')', '') ?? 'Primary'})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-bold text-ink-3">ERROR DETAIL LOG</p>
              <p className="text-xs leading-[1.4] text-ink-2">
                [14:22:04] HTTP 429: Too Many Requests. {primaryProvider.name} token rate limit
                exhausted. System context safely cached and preserved.
              </p>
            </div>
            <hr className="border-line" />
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => navigate('/tos')}>
                Cancel Job
              </Button>
              <Button className="flex-1" onClick={retry}>
                Retry Failed Cell
              </Button>
            </div>
          </Card>
        </div>
      </AppShell>
    )
  }

  if (complete) {
    return (
      <AppShell {...shell}>
        <div className="flex items-center gap-3 rounded-xl border border-emerald-600 bg-ok-bg p-4">
          <CheckCircle2 size={18} className="shrink-0 text-ok" />
          <p className="min-w-0 flex-1 text-[13px] font-medium">
            <span className="font-bold text-ok">Generation Completed: </span>
            All {target} diagnostic exam items produced, compiled, and validated against your Table
            of Specifications. No syntactic errors detected.
          </p>
        </div>

        <div className="flex gap-6 max-xl:flex-col">
          <Card className="flex min-w-0 flex-1 flex-col gap-5 p-6">
            <p className="text-base font-bold">TOS Allocation Matrix Compilation Summary</p>
            <div className="flex flex-col gap-3">
              {jobs.map((j) => (
                <div
                  key={j.n}
                  className="flex items-center justify-between gap-4 rounded-md bg-ok-bg p-3"
                >
                  <p className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                    Ch {j.n} ({j.title}) - {j.tier} Items
                  </p>
                  <p className="shrink-0 text-[11px] font-bold text-ok">
                    COMPLETED ({j.items}/{j.items})
                  </p>
                </div>
              ))}
            </div>
            <div className="flex gap-4 max-md:flex-col">
              <div className="flex flex-1 flex-col gap-1 rounded-lg border border-line bg-white p-4">
                <p className="text-[11px] font-bold text-ink-3">SIMILARITY &amp; DUPLICATE SCAN</p>
                <p className="text-sm font-bold text-ok">0% Duplicates Detected</p>
              </div>
              <div className="flex flex-1 flex-col gap-1 rounded-lg border border-line bg-white p-4">
                <p className="text-[11px] font-bold text-ink-3">PEDAGOGICAL QUALITY SCORE</p>
                <p className="text-sm font-bold text-brand">98.4% (Excellent Alignment)</p>
              </div>
            </div>
          </Card>

          <Card className="flex w-[420px] shrink-0 flex-col gap-5 p-6 max-xl:w-full">
            <p className="text-base font-bold">Pipeline Metrics</p>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[11px] font-bold text-ink-3">PIPELINE STATUS</p>
                <p className="text-[15px] font-semibold text-ok">Asynchronous AST Sync Passed</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-ink-3">TOTAL RUN TIME</p>
                <p className="text-xl font-bold text-brand">
                  {Math.floor((target * 180) / 60000)}m {Math.round(((target * 180) % 60000) / 1000)}s
                  total
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-ink-3">TOKEN CONSUMED</p>
                <p className="text-[15px] font-semibold">
                  {tokens.toLocaleString()} / 450k Tokens
                </p>
              </div>
            </div>
            <hr className="border-line" />
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setDone(0)
                  setAttempt((a) => a + 1)
                }}
              >
                Regenerate All
              </Button>
              <Button className="flex-1" onClick={() => navigate('/review')}>
                Open Verification Workspace
              </Button>
            </div>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell {...shell}>
      <div className="flex items-center gap-3 rounded-xl border border-brand bg-brand-soft p-4">
        <Loader size={18} className="shrink-0 animate-spin text-brand" />
        <p className="min-w-0 flex-1 text-[13px] font-medium">
          <span className="font-bold">System Generation Active:</span> You can safely navigate away
          to other university portals. The cognitive compiler is asynchronous; the Question Bank will
          automatically sync and flag pending validations on state completion.
        </p>
      </div>

      <div className="flex gap-6 max-xl:flex-col">
        <Card className="flex min-w-0 flex-1 flex-col gap-5 p-6">
          <div className="flex items-center justify-between">
            <p className="text-base font-bold">Cell-by-Cell LLM Jobs Status</p>
            <p className="text-xs font-semibold text-ink-3">
              {done} / {target} items
            </p>
          </div>
          <ProgressBar value={progress} />
          <div className="flex flex-col gap-3">
            {jobs.map((j) => (
              <div
                key={j.n}
                className={`flex items-center justify-between gap-4 rounded-md p-3 ${
                  j.state === 'done' ? 'bg-ok-bg' : j.state === 'running' ? 'bg-brand-soft' : 'bg-slate-100'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {j.state === 'done' ? (
                    <CheckCircle2 size={16} className="shrink-0 text-ok" />
                  ) : j.state === 'running' ? (
                    <Loader size={16} className="shrink-0 animate-spin text-brand" />
                  ) : (
                    <Eye size={16} className="shrink-0 text-ink-3" />
                  )}
                  <p className="truncate text-[13px] font-semibold">
                    Ch {j.n} ({j.title}) - {j.tier} Items
                  </p>
                </div>
                <p
                  className={`shrink-0 text-[11px] font-bold ${
                    j.state === 'done' ? 'text-ok' : j.state === 'running' ? 'text-brand' : 'text-ink-3'
                  }`}
                >
                  {j.state === 'done'
                    ? `VALIDATED (${j.items}/${j.items})`
                    : j.state === 'running'
                      ? `RUNNING (${j.completed}/${j.items} COMPLETED)`
                      : `QUEUED (0/${j.items})`}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex w-[420px] shrink-0 flex-col gap-5 p-6 max-xl:w-full">
          <p className="text-base font-bold">Diagnostic Telemetry</p>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[11px] font-bold text-ink-3">PIPELINE STAGE</p>
              <p className="text-[15px] font-semibold">Bloom Cognitive Verification Engine</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-ink-3">ESTIMATED TIME REMAINING</p>
              <p className="text-xl font-bold text-accent-dark">
                {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}m{' '}
                {String(secondsLeft % 60).padStart(2, '0')}s
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-ink-3">TOKEN USAGE</p>
              <p className="text-[15px] font-semibold">
                {tokens.toLocaleString()} / 450,000 max tokens
              </p>
            </div>
            <hr className="border-line" />
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-bold text-ink-3">AUTOMATED CODE COMPILER CHECKS</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-ok" />
                <p className="text-xs text-ink-2">Programming item structures pass AST syntax</p>
              </div>
              <div className="flex items-center gap-2">
                <Loader size={14} className="animate-spin text-brand" />
                <p className="text-xs text-ink-2">Bloom tags reconcile with the locked TOS grid</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setFailed(true)}>
            Simulate compiler fault
          </Button>
        </Card>
      </div>
    </AppShell>
  )
}
