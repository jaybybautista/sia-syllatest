import { useRef, useState } from 'react'
import { CheckCircle2, FileDown, UploadCloud, XCircle } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Button, Card, Modal, ProgressBar } from '../components/ui.jsx'
import { useAppState, useSyllabus } from '../state/context.js'
import { attainmentTarget, difficultyLabel, itemVerdict } from '../data/mock.js'
import { sampleAnalysis } from '../data/syllabi.js'

const discriminationWord = (v) =>
  v >= 0.4 ? 'Very Good' : v >= 0.3 ? 'Good' : v >= 0.15 ? 'Poor' : 'Very Poor'

export default function Analysis() {
  const { examConfig, updateSyllabus } = useAppState()
  const { syllabus } = useSyllabus()
  const course = syllabus
  const outcomeText = Object.fromEntries(
    syllabus.outcomes.map((o) => [o.id, o.text.replace(/\.$/, '')]),
  )
  // The results file this screen was opened for; null until one is uploaded for the syllabus.
  const data = syllabus.analysis
  const fileInput = useRef(null)
  const [results, setResults] = useState(data ? { name: data.file } : null)
  const [mapping, setMapping] = useState(false)
  const [columns, setColumns] = useState({})
  const [anonymize, setAnonymize] = useState(true)
  const students = data?.cohortSize ?? sampleAnalysis(syllabus, '').cohortSize
  const mappingErrors = 0
  // Which way the faculty wants each flagged item handled, keyed by item id.
  const [decisions, setDecisions] = useState({})
  const mappingRows = [
    { field: 'STUDENT_ID', column: 'Col 1: Student Number', preview: '2021-00942, 2021-00943, ...' },
    { field: 'ITEM_1_RESPONSE', column: 'Col 2: Item 1', preview: 'A, B, A, C, A, A, D, B, A...' },
    { field: 'ITEM_2_RESPONSE', column: 'Col 3: Item 2', preview: 'B, B, C, D, B, B, A, B, C...' },
  ]
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [synced, setSynced] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [exported, setExported] = useState(false)
  const [detail, setDetail] = useState(null)
  const attainment = data?.attainment ?? []
  const belowTarget = attainment.filter((a) => a.pct < attainmentTarget).length

  // Running the analysis on a newly picked file records it against the syllabus, so it shows in
  // the results history from then on.
  function runAnalysis() {
    if (results && results.name !== data?.file) {
      updateSyllabus(syllabus.id, (s) => ({
        analysis: s.analysis
          ? { ...s.analysis, file: results.name, uploadedOn: new Date().toISOString() }
          : sampleAnalysis(s, results.name),
      }))
    }
    setMapping(false)
  }

  function pick(file) {
    if (!file) return
    setResults({ name: file.name })
    setMapping(true)
  }

  function sync() {
    setSyncing(true)
    setSyncProgress(0)
    const timer = setInterval(() => {
      setSyncProgress((p) => {
        if (p >= 100) {
          clearInterval(timer)
          setSyncing(false)
          setSynced(true)
          return 100
        }
        return p + 20
      })
    }, 150)
  }

  if (exported) {
    return (
      <AppShell
        title="CHED Quality Reports Center"
        subtitle="Prepare and download accreditation bundles matching standard Regional 3.1 specifications."
      >
        <Card className="flex flex-col gap-8 rounded-3xl border-line p-10">
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ok-bg">
              <CheckCircle2 size={28} className="text-ok" />
            </span>
            <div>
              <p className="text-lg font-bold">CHED Accreditation Package Generated</p>
              <p className="text-[13px] text-ok">
                Compilation completed with zero warnings. Manifest signature and metadata checksum
                generated.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold text-ink-2">
              INCLUDED ACCREDITATION MANIFEST CONTENTS
            </p>
            <div className="overflow-hidden rounded-lg border border-line">
              {[
                [
                  'Part A: CO Attainment Matrix Report',
                  `Includes ${attainment.length} outcome metrics & class averages`,
                ],
                [
                  'Part B: Mathematically Locked Table of Specifications (TOS)',
                  'Lectures matched with final exam items',
                ],
                [
                  'Part C: Diagnostic Item Discrimination Analysis Logs',
                  `Includes KR-20 reliability metrics (${data?.stats[0].value ?? '—'})`,
                ],
              ].map(([part, note]) => (
                <div
                  key={part}
                  className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-white p-4 last:border-b-0"
                >
                  <p className="text-[13px] font-semibold">{part}</p>
                  <p className="text-xs text-ink-3">{note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-5">
            <div>
              <p className="text-[11px] font-bold text-ink-3">SECURE CHECKSUM HASH</p>
              <p className="text-xs text-ink-2">
                SHA256: d8f3a38a7c2e0b... (Verified Lock Signature)
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="border-brand text-brand" onClick={() => setExported(false)}>
                Download XLSX
              </Button>
              <Button onClick={() => setExported(false)}>Download Signed PDF Packet</Button>
            </div>
          </div>
        </Card>
      </AppShell>
    )
  }

  // After an import the screen becomes the column-mapping view before statistics are produced.
  if (mapping) {
    return (
      <AppShell
        title="Diagnostic Item Analysis"
        subtitle="Verify and map diagnostic student responses against the validated syllabus blueprint."
      >
        <Card className="flex flex-col gap-6 rounded-[20px] border-line p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-bold">CSV response Matrix Mapping</p>
              <p className="text-[13px] text-ink-3">
                Source file: {results?.name} ({students} students found)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <p className="text-xs text-ink-2">Anonymize Student Data</p>
                <button
                  role="switch"
                  aria-checked={anonymize}
                  aria-label="Anonymize student data"
                  onClick={() => setAnonymize((a) => !a)}
                  className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${
                    anonymize ? 'bg-brand' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
                      anonymize ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
              {/* Figma styled a zero-error badge in red; zero errors reads as a pass here. */}
              <Badge tone={mappingErrors > 0 ? 'bad' : 'ok'}>
                {mappingErrors} mapping error{mappingErrors === 1 ? '' : 's'}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex bg-white/60 px-4 py-3 text-xs font-bold text-ink-2">
              <p className="w-[200px]">DATA FIELD</p>
              <p className="w-[240px]">UPLOADED FILE COLUMN</p>
              <p className="flex-1">VALIDATION PREVIEW EXAMPLES</p>
            </div>
            {mappingRows.map((row) => (
              <div
                key={row.field}
                className="flex items-center rounded-lg border-b border-line bg-white/50 p-4"
              >
                <p className="w-[200px] text-[13px] font-bold text-brand">{row.field}</p>
                <select
                  aria-label={`Column for ${row.field}`}
                  className={`w-[240px] rounded-md border bg-white px-3 py-1.5 text-[13px] ${
                    row.field === 'STUDENT_ID' ? 'border-brand' : 'border-line'
                  }`}
                  value={columns[row.field] ?? row.column}
                  onChange={(e) => setColumns((c) => ({ ...c, [row.field]: e.target.value }))}
                >
                  <option>{row.column}</option>
                  {mappingRows
                    .filter((r) => r.column !== row.column)
                    .map((r) => (
                      <option key={r.column}>{r.column}</option>
                    ))}
                </select>
                <p className="flex-1 pl-4 text-[13px] text-ink-3">
                  {row.field === 'STUDENT_ID' && anonymize ? '[Anonymized] (e.g., 2021-****-942)' : row.preview}
                </p>
              </div>
            ))}
            <div className="rounded-lg bg-slate-100 p-3 text-center text-xs text-ink-3">
              ... mapped columns 4 through {examConfig.items} automatically matched based on header
              index ...
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[13px] text-ok">
              System validated: all {examConfig.items} item responses align with the {course.code}{' '}
              Midterm TOS blueprint.
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="border-brand text-brand"
                onClick={() => {
                  setResults(null)
                  setMapping(false)
                }}
              >
                Re-upload File
              </Button>
              <Button onClick={runAnalysis}>Run Statistical Item Analysis</Button>
            </div>
          </div>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Item Analysis & CO Attainment"
      subtitle="Upload diagnostic test results to measure class performance, KR-20 reliability, and curriculum alignment."
    >
      <div className="flex min-h-0 flex-1 gap-5 max-xl:flex-col">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              pick(e.dataTransfer.files?.[0])
            }}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brand bg-white/70 p-8 backdrop-blur-[9px]"
          >
            {results ? (
              <>
                <CheckCircle2 size={36} className="text-ok" />
                <p className="text-[15px] font-bold">{results.name} imported</p>
                <button
                  onClick={() => setMapping(true)}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Review column mapping
                </button>
              </>
            ) : (
              <>
                <UploadCloud size={36} className="text-brand" />
                <p className="text-[15px] font-bold">Upload Midterm Results (CSV/XLSX)</p>
                <p className="text-xs text-ink-3">
                  Drag and drop diagnostic answer matrices or scan files.
                </p>
                <Button variant="accent" onClick={() => fileInput.current?.click()}>
                  Browse files
                </Button>
              </>
            )}
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </div>

          {!data && (
            <Card className="flex flex-col gap-1.5 rounded-2xl p-6">
              <p className="text-sm font-bold">No results file for {course.code} yet</p>
              <p className="text-[13px] text-ink-3">
                Upload the {course.code} answer matrix above. Item statistics and outcome attainment
                appear here once the analysis runs.
              </p>
            </Card>
          )}

          {data && (
          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
            {data.stats.map((s) => (
              <Card key={s.label} className="flex flex-col gap-2 p-4">
                <p className="text-xs font-bold uppercase text-ink-3">{s.label}</p>
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="text-[11px] text-ink-2">{s.note}</p>
              </Card>
            ))}
          </div>
          )}

          {data && (
          <Card className="overflow-x-auto rounded-2xl shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-white/60 text-[11px] font-bold text-ink-3">
                  <th className="w-[90px] p-3 px-4 font-bold">ITEM ID</th>
                  <th className="w-[140px] p-3 px-4 font-bold">DIFFICULTY INDEX</th>
                  <th className="w-[140px] p-3 px-4 font-bold">DISCRIMINATION</th>
                  <th className="p-3 px-4 font-bold">ALIGNED OUTCOME</th>
                  <th className="w-[130px] p-3 px-4 font-bold">RECOMMENDATION</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((it) => {
                  const v = itemVerdict(it.discrimination)
                  return (
                    <tr
                      key={it.id}
                      onClick={() => setDetail(it)}
                      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-white/60"
                    >
                      <td className="px-4 py-3.5 text-[13px] font-bold text-brand">{it.id}</td>
                      <td className="px-4 py-3.5 text-[13px]">
                        {it.difficulty.toFixed(2)} ({difficultyLabel(it.difficulty)})
                      </td>
                      <td className="px-4 py-3.5 text-[13px]">
                        {it.discrimination.toFixed(2)} ({discriminationWord(it.discrimination)})
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-ink-2">
                        {it.co} - {outcomeText[it.co]}
                      </td>
                      <td className="px-4 py-3.5">
                        {/* A decision taken in the audit drawer overrides the suggested verdict. */}
                        <Badge tone={decisions[it.id] && decisions[it.id] !== v.label ? 'info' : v.tone}>
                          {decisions[it.id] ?? v.label}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
          )}
        </div>

        <Card className="flex w-[400px] shrink-0 flex-col gap-5 p-5 max-xl:w-full">
          <p className="text-sm font-bold">COURSE OUTCOME ATTAINMENT</p>
          <div className="flex flex-col gap-4">
            {attainment.length === 0 && (
              <p className="text-[13px] text-ink-3">Attainment is computed from an uploaded results file.</p>
            )}
            {attainment.map((a) => {
              const met = a.pct >= attainmentTarget
              return (
                <div key={a.co} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="font-bold text-brand">{a.co}</span>
                      <span className="truncate text-ink-2">{outcomeText[a.co]}</span>
                    </span>
                    <span className={`font-bold ${met ? 'text-ink' : 'text-bad'}`}>{a.pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded bg-slate-100">
                    <div
                      className={`h-full ${met ? 'bg-emerald-600' : 'bg-bad'}`}
                      style={{ width: `${a.pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-ink-3">
            Target attainment is {attainmentTarget}%. Outcomes below target are flagged for the next
            curriculum review.
          </p>
          <hr className="border-line" />
          <div className="flex flex-col gap-2.5">
            <Button className="w-full" disabled={!results || synced} onClick={sync}>
              {synced ? 'Attainment Synced' : 'Sync Attainment to PSU Registrar'}
            </Button>
            <Button
              variant="ghost"
              icon={FileDown}
              className="w-full"
              disabled={!data}
              onClick={() => setExported(true)}
            >
              Export CHED Accreditation PDF
            </Button>
            {!results && (
              <p className="text-[11px] text-ink-3">
                Import a results file before syncing to the registrar.
              </p>
            )}
          </div>
        </Card>
      </div>


      {syncing && (
        <Modal title="Syncing to registrar" width={460}>
          <p className="mb-4">
            Posting {course.code} outcome attainment for {attainment.length} course outcomes.
          </p>
          <ProgressBar value={syncProgress} />
        </Modal>
      )}

      {synced && !syncing && !dismissed && (
        <Modal
          title="Outcomes Synced successfully"
          subtitle="Course attainment data updated in PSU Registrar databases."
          icon={CheckCircle2}
          tone="ok"
          onClose={() => setDismissed(true)}
          width={540}
          footer={
            <div className="flex w-full items-center gap-3">
              <p className="min-w-0 flex-1 text-xs text-ink-3">
                Sync history: 1 previous retry (timeout solved)
              </p>
              <Button className="px-5" onClick={() => setDismissed(true)}>
                Dismiss &amp; Close
              </Button>
            </div>
          }
        >
          <hr className="-mt-2 mb-5 border-line" />
          <p className="text-xs font-bold text-ink-2">SYNCHRONIZATION RECEIPT</p>
          <div className="mt-3 flex flex-col gap-2.5 rounded-lg bg-slate-50 p-4 text-[13px]">
            <div className="flex justify-between gap-4">
              <p className="text-ink-3">Course / Section</p>
              <p className="font-semibold">
                {course.code} — {data?.section}
              </p>
            </div>
            <div className="flex justify-between gap-4">
              <p className="text-ink-3">Sync Reference ID</p>
              <p className="font-semibold text-brand">PSU-REG-SYNC-883492</p>
            </div>
            <div className="flex justify-between gap-4">
              <p className="text-ink-3">Outcome Attainment Passed</p>
              {/* Figma read "4 of 4 COs"; the syllabus defines three. */}
              <p className="font-semibold text-ok">
                {attainment.length} of {attainment.length} COs Uploaded
              </p>
            </div>
            <div className="flex justify-between gap-4">
              <p className="text-ink-3">Below {attainmentTarget}% target</p>
              <p
                className={`font-semibold ${
                  belowTarget > 0 ? 'text-warn' : 'text-ok'
                }`}
              >
                {belowTarget} outcome{belowTarget === 1 ? '' : 's'} flagged
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1.5 rounded-lg bg-ok-bg p-3 text-xs">
            <p className="font-bold text-ok">PRIVACY SAFEGUARDS ACTIVE</p>
            <p className="text-ink-2">
              All student names and individual identifiers were fully stripped. Data was
              synchronized with randomized anonymous numeric hash sequences.
            </p>
          </div>
        </Modal>
      )}

      {/* Item audit opens as a right-hand drawer over the dimmed table, as the design specifies,
          so the row that was clicked stays in view behind it. */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Close item audit"
            onClick={() => setDetail(null)}
            className="flex-1 cursor-default bg-navy-900/30"
          />
          <aside className="flex w-[480px] max-w-full flex-col gap-6 overflow-y-auto border-l border-line bg-white p-6 shadow-[-8px_0_16px_rgba(15,23,42,0.15)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-bold">{detail.id} Audit Detail</p>
                <p className="text-xs text-ink-3">
                  Aligned: {detail.co} — {outcomeText[detail.co]}
                </p>
              </div>
              <button
                onClick={() => setDetail(null)}
                aria-label="Close item audit"
                className="shrink-0 rounded-full bg-slate-100 p-1.5 text-ink-2 hover:bg-slate-200"
              >
                <XCircle size={14} />
              </button>
            </div>

            <div className="flex gap-3">
              <div className="min-w-0 flex-1 rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] text-ink-3">DIFFICULTY INDEX</p>
                <p
                  className={`text-xl font-extrabold ${
                    detail.difficulty < 0.4 ? 'text-bad' : 'text-ink'
                  }`}
                >
                  {detail.difficulty.toFixed(2)} ({difficultyLabel(detail.difficulty)})
                </p>
              </div>
              <div className="min-w-0 flex-1 rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] text-ink-3">DISCRIMINATION INDEX</p>
                <p
                  className={`text-xl font-extrabold ${
                    detail.discrimination < 0.3 ? 'text-bad' : 'text-ink'
                  }`}
                >
                  {detail.discrimination.toFixed(2)} ({discriminationWord(detail.discrimination)})
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-bold text-ink-2">RESPONSE DISTRIBUTION</p>
              {/* Counts come from one cohort size, so a share and its tally cannot disagree.
                  Figma's panel read 21% = 11 students and 64% = 32 students, which imply two
                  different class sizes (52 and 50). */}
              {detail.distribution.map((o, i) => (
                <div key={o.key} className="flex flex-col gap-1">
                  <div className="flex items-start justify-between text-[13px]">
                    <p>
                      {i === 0 ? '*' : ''}Option {o.key} {i === 0 ? '(Key)' : '(Distractor)'}
                    </p>
                    <p>
                      {o.pct}% ({Math.round((o.pct / 100) * students)} students)
                    </p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded bg-line">
                    <div
                      className={`h-full rounded ${
                        i === 0 ? 'bg-emerald-500' : o.pct > detail.distribution[0].pct ? 'bg-bad' : 'bg-slate-300'
                      }`}
                      style={{ width: `${o.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {detail.flag && (
              <div className="flex flex-col gap-1.5 rounded-lg border border-bad bg-bad-bg p-3">
                <p className="text-[11px] font-bold text-bad">STUDENT MISCONCEPTION FLAG</p>
                <p className="text-xs text-ink-2">
                  {Math.max(...detail.distribution.map((o) => o.pct))}% of the cohort (
                  {Math.round(
                    (Math.max(...detail.distribution.map((o) => o.pct)) / 100) * students,
                  )}{' '}
                  students) {detail.flag}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-ink-2">BLUEPRINT ACTION DECISION</p>
              <div className="flex gap-2">
                {['Retain', 'Revise', 'Reject'].map((choice) => {
                  // The statistics already imply a verdict; it is preselected rather than left to
                  // the reader to match the badge in the table.
                  const active =
                    (decisions[detail.id] ?? itemVerdict(detail.discrimination).label) ===
                    choice.toUpperCase()
                  const tone =
                    choice === 'Revise'
                      ? 'border-accent text-accent bg-warn-bg'
                      : choice === 'Reject'
                        ? 'border-bad text-bad bg-bad-bg'
                        : 'border-ok text-ok bg-ok-bg'
                  return (
                    <button
                      key={choice}
                      onClick={() =>
                        setDecisions((d) => ({ ...d, [detail.id]: choice.toUpperCase() }))
                      }
                      className={`flex-1 rounded-md border px-3 py-2 text-xs font-semibold ${
                        active ? tone : 'border-line text-ink-2 hover:bg-slate-50'
                      }`}
                    >
                      {choice}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-ink-2" htmlFor="revision">
                REVISION INSTRUCTION NOTE
              </label>
              <textarea
                id="revision"
                rows={3}
                defaultValue={detail.revisionNote ?? ''}
                placeholder="Describe the change the item author should make."
                className="w-full rounded-lg border border-line bg-slate-50 p-3 text-[13px] text-ink"
              />
            </div>

            <Button className="mt-auto w-full" onClick={() => setDetail(null)}>
              Update Item &amp; Revise Bank
            </Button>
          </aside>
        </div>
      )}

   </AppShell>
  )
}
