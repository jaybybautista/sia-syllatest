import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, FileSpreadsheet, FileText, Search, UploadCloud } from 'lucide-react'
import AppShell from './AppShell.jsx'
import { Badge, Button, Card } from './ui.jsx'
import { useAppState } from '../state/context.js'
import { featurePath, features } from '../data/features.js'
import { formatDate } from '../data/syllabi.js'
import { fileSizeLabel, isOwnedBy } from '../data/insights.js'

const hoursOf = (s) => s.chapters.reduce((sum, c) => sum + c.hours, 0)
const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`

// What each feature reports about a syllabus in its list, so the row says why it is worth opening.
const statusFor = {
  verification: (s) => {
    const total = hoursOf(s)
    return total === s.statedHours
      ? { tone: 'ok', label: 'Hours reconcile', note: `${total} / ${s.statedHours} hrs` }
      : { tone: 'bad', label: 'Hours mismatch', note: `${total} / ${s.statedHours} hrs` }
  },
  consistency: (s) =>
    s.findings.length
      ? {
          tone: s.findings.some((f) => f.severity === 'CRITICAL') ? 'bad' : 'warn',
          label: plural(s.findings.length, 'open finding'),
          note: `Compliance ${s.complianceScore}%`,
        }
      : { tone: 'ok', label: 'Cleared', note: `Compliance ${s.complianceScore}%` },
  tos: (s) =>
    s.tosLocked
      ? { tone: 'info', label: 'TOS locked', note: plural(s.chapters.length, 'chapter') }
      : { tone: 'muted', label: 'Draft', note: `${plural(s.chapters.length, 'chapter')} · ${hoursOf(s)} hrs` },
  bank: (s) => ({ tone: 'info', label: plural(s.bankItems.length, 'item'), note: plural(s.outcomes.length, 'course outcome') }),
  approval: (s) => ({
    tone: { Approved: 'ok', Revisions: 'bad', 'For Review': 'warn' }[s.review.state] ?? 'muted',
    label: s.review.state,
    note: s.instructor,
  }),
  analysis: (s) =>
    s.analysis
      ? {
          tone: 'ok',
          label: 'Analysed',
          note: `${s.analysis.cohortSize} students · KR-20 ${s.analysis.stats[0].value}`,
        }
      : { tone: 'muted', label: 'Awaiting results', note: 'Upload a results file' },
}

export default function SyllabusHistory({ feature }) {
  const navigate = useNavigate()
  const { syllabi: all, role, account } = useAppState()
  // Faculty see the syllabi they teach or uploaded; the chair sees the whole department.
  const syllabi = useMemo(
    () => (role === 'faculty' ? all.filter((s) => isOwnedBy(s, account)) : all),
    [all, role, account],
  )
  const config = features[feature]
  const [query, setQuery] = useState('')
  const [termFilter, setTermFilter] = useState('all')

  const terms = useMemo(() => [...new Set(syllabi.map((s) => s.term))], [syllabi])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const dateOf = (s) => (config.results ? (s.analysis?.uploadedOn ?? '') : s.uploadedOn)
    return syllabi
      .filter((s) => termFilter === 'all' || s.term === termFilter)
      .filter(
        (s) =>
          !q ||
          [s.code, s.title, s.file, s.analysis?.file ?? ''].some((v) => v.toLowerCase().includes(q)),
      )
      .sort((a, b) => dateOf(b).localeCompare(dateOf(a)) || b.uploadedOn.localeCompare(a.uploadedOn))
  }, [syllabi, query, termFilter, config.results])

  const resultCount = syllabi.filter((s) => s.analysis).length
  const summary = config.results
    ? `${plural(resultCount, 'results file')} uploaded across ${plural(syllabi.length, 'syllabus', 'syllabi')}`
    : `${plural(syllabi.length, 'syllabus', 'syllabi')} uploaded`

  return (
    <AppShell title={config.title} subtitle={config.listSubtitle}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">
            {config.results ? 'Uploaded Results Files' : 'Uploaded Syllabi'}
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">
            {summary}. Select one to open it here.
          </p>
        </div>
        {role === 'faculty' && !config.results && (
          <Button variant="accent" icon={UploadCloud} onClick={() => navigate('/upload')}>
            Upload New Syllabus
          </Button>
        )}
      </div>

      <Card className="flex flex-col overflow-hidden rounded-2xl shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white/60 p-4">
          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2">
            <Search size={14} className="shrink-0 text-ink-3" />
            <input
              aria-label="Search uploads"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
              placeholder={config.results ? 'Search course or results file' : 'Search course code, title or file'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter by term"
            className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] font-semibold"
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
          >
            <option value="all">All terms</option>
            {terms.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden bg-white/40 px-5 py-3 text-[11px] font-bold text-ink-3 xl:flex">
          <p className="flex-1">{config.results ? 'RESULTS FILE' : 'SYLLABUS'}</p>
          <p className="w-[170px]">TERM</p>
          <p className="w-[170px]">UPLOADED</p>
          <p className="w-[190px]">STATUS</p>
          <span className="w-4" />
        </div>

        {rows.length === 0 && (
          <p className="p-6 text-[13px] text-ink-3">
            No uploads match {query ? `“${query}”` : 'this term'}. Clear the search or pick another term.
          </p>
        )}

        {rows.map((s) => {
          const status = statusFor[feature](s)
          const Icon = config.results ? FileSpreadsheet : FileText
          const uploaded = config.results && s.analysis ? s.analysis.uploadedOn : s.uploadedOn
          return (
            <Link
              key={s.id}
              to={featurePath(feature, s.id)}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-4 last:border-b-0 hover:bg-white/60 xl:flex-nowrap"
            >
              <div className="flex min-w-0 flex-1 basis-full items-center gap-3 xl:basis-auto">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft">
                  <Icon size={18} className="text-brand" />
                </span>
                <div className="min-w-0">
                  {config.results ? (
                    <>
                      <p className={`truncate text-sm font-semibold ${s.analysis ? '' : 'text-ink-3'}`}>
                        {s.analysis?.file ?? 'No results file uploaded'}
                      </p>
                      <p className="truncate text-[11px] text-ink-3">
                        <span className="font-bold text-brand">{s.code}</span> · {s.title}
                        {s.analysis && ` · ${s.analysis.exam}, ${s.analysis.section}`}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="truncate text-sm font-semibold">
                        <span className="text-brand">{s.code}</span> · {s.title}
                      </p>
                      <p className="truncate text-[11px] text-ink-3">
                        {s.file} · {fileSizeLabel(s.fileSize)}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <p className="w-[170px] text-[13px] text-ink-2 max-xl:w-auto">{s.term}</p>
              <div className="w-[170px] max-xl:w-auto">
                <p className="text-[13px] text-ink-2">
                  {config.results && !s.analysis ? '—' : formatDate(uploaded)}
                </p>
                {!config.results && <p className="truncate text-[11px] text-ink-3">by {s.uploadedBy}</p>}
              </div>
              <div className="w-[190px] max-xl:w-auto">
                <Badge tone={status.tone}>{status.label}</Badge>
                <p className="mt-1 truncate text-[11px] text-ink-3">{status.note}</p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-ink-3 max-xl:ml-auto" />
            </Link>
          )
        })}
      </Card>
    </AppShell>
  )
}
