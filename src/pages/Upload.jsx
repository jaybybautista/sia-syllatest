import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  CheckCircle2,
  Circle,
  FileText,
  Info,
  Loader,
  MonitorPlay,
  Paperclip,
  Trash2,
  TriangleAlert,
  UploadCloud,
} from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Button, Card, Modal } from '../components/ui.jsx'
import { groundingLibrary, groundingSizeLimitMb, term, uploadSizeLimitMb } from '../data/mock.js'
import { buildSyllabusRecord } from '../data/syllabi.js'
import { featurePath } from '../data/features.js'
import { fileSizeLabel, isOwnedBy, timeAgo } from '../data/insights.js'
import { extractText } from '../lib/extractText.js'
import { auditSyllabus, parseSyllabus } from '../lib/syllabusParser.js'
import { useAppState } from '../state/context.js'

const fileIcons = { presentation: MonitorPlay, book: BookOpen, file: FileText }

// The real stages of reading a syllabus. The first is the slow one (PDF/Word reading, or OCR for
// scanned pages); the rest run on the extracted text.
const parseSteps = [
  'Reading the document (OCR for scanned pages)',
  'Finding the course code, title, units and contact hours',
  "Extracting course outcomes and their Bloom's levels",
  'Extracting the course outline, chapter hours and CO mapping',
  'Checking hour totals and outcome coverage',
]

const field = 'w-full rounded-md border border-white/40 bg-white/70 p-3 text-sm text-ink backdrop-blur-[6px]'
const label = 'text-xs font-bold text-ink-2'
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)))

export default function Upload() {
  const navigate = useNavigate()
  const { syllabi, addSyllabus, account, logActivity, bloomLevels } = useAppState()
  const fileInput = useRef(null)
  const groundingInput = useRef(null)
  const run = useRef(0)

  const [file, setFile] = useState(null)
  const [files, setFiles] = useState(groundingLibrary)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  // null | { status: 'running', step, progress } | { status: 'done', ... } | { status: 'error', ... }
  const [parse, setParse] = useState(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [meta, setMeta] = useState({ code: '', title: '', term: term.label })

  const recent = useMemo(
    () =>
      syllabi
        .filter((s) => isOwnedBy(s, account))
        .sort((a, b) => b.uploadedOn.localeCompare(a.uploadedOn))
        .slice(0, 3),
    [syllabi, account],
  )

  async function pickFile(selected) {
    if (!selected) return
    const sizeMb = selected.size / 1024 / 1024
    const token = ++run.current
    setFile({ raw: selected, name: selected.name, size: fileSizeLabel(sizeMb) })
    setMeta((m) => ({ ...m, code: '', title: '' }))
    if (!/\.(pdf|docx)$/i.test(selected.name)) {
      setParse({ status: 'error', message: 'Upload the syllabus as a PDF or Word (.docx) file.' })
      return
    }
    if (sizeMb > uploadSizeLimitMb) {
      setParse({ status: 'error', message: `The file is larger than the ${uploadSizeLimitMb} MB limit.` })
      return
    }

    const live = () => run.current === token
    setParse({ status: 'running', step: 0, progress: 0 })
    try {
      const extracted = await extractText(selected, (p) =>
        live() && setParse({ status: 'running', step: 0, progress: p.progress * 0.8, stage: p.stage }),
      )
      if (!live()) return
      // The remaining stages are quick; each is shown as it runs.
      for (let step = 1; step < parseSteps.length; step++) {
        setParse({ status: 'running', step, progress: 0.8 + step * 0.04 })
        await nextFrame()
        if (!live()) return
      }
      const parsed = parseSyllabus(extracted.text, bloomLevels)
      const audit = auditSyllabus(parsed)
      const hours = parsed.chapters.reduce((sum, c) => sum + c.hours, 0)
      const missing = [
        !parsed.outcomes.length && 'a Course Outcomes section',
        !parsed.chapters.length && 'a course outline with topics',
        parsed.chapters.length > 0 && hours === 0 && 'hours in the course outline',
      ].filter(Boolean)
      if (missing.length) {
        setParse({
          status: 'error',
          message: `This file does not look like a course syllabus. Not found: ${missing.join('; ')}.`,
          extracted,
        })
        return
      }
      setMeta((m) => ({ ...m, code: parsed.code ?? '', title: parsed.title ?? '' }))
      setParse({ status: 'done', parsed, audit, extracted })
    } catch (e) {
      if (!live()) return
      console.error(e)
      setParse({ status: 'error', message: e?.message || 'The file could not be read.' })
    }
  }

  const attached = files.filter((f) => f.enabled)
  const usedMb = files.reduce((sum, f) => sum + f.size, 0)
  const ready = parse?.status === 'done' && meta.code.trim() !== ''

  function discard() {
    run.current++
    setFile(null)
    setParse(null)
    setMeta((m) => ({ ...m, code: '', title: '' }))
    setFiles(files.map((f) => ({ ...f, enabled: false })))
    setConfirmDiscard(false)
  }

  function proceed() {
    const { parsed, audit, extracted } = parse
    const record = buildSyllabusRecord({
      parsed,
      audit,
      code: meta.code.trim().toUpperCase(),
      title: meta.title.trim() || file.name.replace(/\.[^.]+$/, ''),
      term: meta.term,
      file: file.raw,
      extracted,
      uploader: account,
    })
    addSyllabus(record)
    logActivity({ syllabusId: record.id, code: record.code, text: `uploaded ${record.file} for ${record.code}` })
    logActivity({
      ai: true,
      syllabusId: record.id,
      code: record.code,
      text: `Parsed ${record.file}: ${record.outcomes.length} course outcomes, ${record.chapters.length} chapters, ${record.findings.length} findings`,
    })
    navigate(featurePath('verification', record.id))
  }

  return (
    <AppShell
      title="Upload Syllabus Document"
      subtitle="Step 1 of 3: Stage course documents for optical parsing and compliance validation."
    >
      <div className="flex gap-7 max-xl:flex-col">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {file ? (
            // Staged state: the dropzone keeps its brand border and holds the file detail card,
            // the completed upload bar, and the replace action, as the design specifies.
            <div className="flex flex-col items-center gap-6 rounded-2xl border-2 border-brand bg-white/90 p-10 shadow-[0_10px_24px_rgba(30,58,138,0.06)]">
              <div className="flex w-full items-center gap-4 rounded-xl border border-brand/20 bg-brand-soft p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-[10px] bg-blue-500/10">
                  <FileText size={24} className="text-brand" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold">{file.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] text-ink-2">{file.size}</p>
                    <p className="text-[13px] text-slate-400">•</p>
                    {parse?.status === 'done' ? (
                      <span className="rounded bg-ok-bg px-2 py-0.5 text-[11px] font-semibold text-ok">
                        Parsed
                      </span>
                    ) : parse?.status === 'error' ? (
                      <span className="rounded bg-bad-bg px-2 py-0.5 text-[11px] font-semibold text-bad">
                        Not readable as a syllabus
                      </span>
                    ) : (
                      <span className="rounded bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">
                        Reading…
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setConfirmDiscard(true)}
                  aria-label={`Remove ${file.name}`}
                  className="shrink-0 rounded-lg border border-line bg-white p-2 text-bad hover:bg-bad-bg"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {parse?.status === 'done' && <ParseSummary parse={parse} />}

              {parse?.status === 'error' && (
                <div className="flex w-full flex-col gap-2 rounded-xl border border-red-200 bg-bad-bg p-4 text-[13px] text-bad">
                  <p className="flex items-start gap-2 font-semibold">
                    <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                    {parse.message}
                  </p>
                  {parse.extracted && (
                    <details className="text-ink-2">
                      <summary className="cursor-pointer font-semibold text-brand">Show the text that was read</summary>
                      <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-white p-3 text-[11px]">
                        {parse.extracted.text || '(no text found)'}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <Button variant="ghost" className="border-brand text-brand" onClick={() => fileInput.current?.click()}>
                Choose different file
              </Button>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                pickFile(e.dataTransfer.files?.[0])
              }}
              className={`flex h-80 flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed p-12 backdrop-blur-[9px] transition-colors ${
                dragging ? 'border-accent bg-accent/10' : 'border-brand bg-white/70'
              }`}
            >
              <UploadCloud size={48} className="text-brand" />
              <div className="flex flex-col items-center gap-1">
                <p className="text-lg font-bold">Drag &amp; Drop Syllabus Document</p>
                <p className="text-sm text-ink-2">Supported: PDF, DOCX, Scanned PDF up to {uploadSizeLimitMb}MB</p>
              </div>
              <Button variant="accent" onClick={() => fileInput.current?.click()}>
                Browse files
              </Button>
            </div>
          )}
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => {
              pickFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />

          <Card className="flex flex-col gap-4 rounded-xl p-6">
            <div>
              <p className="text-base font-bold">Grounding &amp; Lecture Materials (Optional)</p>
              <p className="text-[13px] text-ink-3">
                Upload handouts, laboratory manuals, or lecture presentations (PPTX) to improve the
                AI&apos;s question drafting relevance.
              </p>
            </div>
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center justify-center gap-3 rounded-lg border border-dashed border-white/40 bg-white/70 p-4 text-[13px] font-medium text-ink-2 backdrop-blur-[6px] hover:border-brand hover:text-brand"
            >
              <Paperclip size={16} />
              Attach companion handouts, slide decks, or lecture scripts...
            </button>
            <input
              ref={groundingInput}
              type="file"
              multiple
              accept=".pdf,.docx,.pptx"
              className="hidden"
              onChange={(e) =>
                setFiles((g) => [
                  ...g,
                  ...Array.from(e.target.files ?? []).map((f) => ({
                    name: f.name,
                    kind: f.name.endsWith('.pptx') ? 'PowerPoint Presentation' : 'PDF Document',
                    size: Number((f.size / 1024 / 1024).toFixed(1)),
                    icon: f.name.endsWith('.pptx') ? 'presentation' : 'file',
                    purpose: 'Use for Topic Mapping',
                    enabled: true,
                  })),
                ])
              }
            />
            {attached.length > 0 && (
              <ul className="flex flex-col gap-2">
                {attached.map((f) => (
                  <li
                    key={f.name}
                    className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-[13px]"
                  >
                    <Paperclip size={14} className="shrink-0 text-ink-3" />
                    <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
                    <span className="shrink-0 text-[11px] text-ink-3">{f.purpose}</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setPickerOpen(true)}
              className="self-start text-xs font-semibold text-brand hover:underline"
            >
              Manage grounding materials ({attached.length} of {files.length} active)
            </button>
          </Card>

          {/* Figma's staged state read "Regional GPU-OCR Enabled" and, in the same sentence, that
              the document was "verified as vector-text native". OCR is precisely what vector text
              does not need, so the notice now reports whichever path actually applies. */}
          <Card className="flex items-center gap-3 rounded-xl p-4">
            <Info size={20} className="shrink-0 text-brand" />
            {parse?.extracted ? (
              <p className="text-xs">
                <span className="font-bold text-brand">Read with {parse.extracted.method}:</span>{' '}
                {parse.extracted.ocrPages > 0
                  ? `${parse.extracted.ocrPages} scanned page${parse.extracted.ocrPages === 1 ? ' was' : 's were'} read with OCR. Check the extracted values closely on the next screen.`
                  : 'The document has a text layer, so no OCR was needed.'}
              </p>
            ) : (
              <p className="text-xs">
                <span className="font-bold text-brand">Scanned syllabi are supported:</span> pages
                without a text layer are read with OCR, which downloads its language data the first
                time it runs.
              </p>
            )}
          </Card>
        </div>

        <div className="flex w-[420px] shrink-0 flex-col gap-6 max-xl:w-full">
          <Card className="flex flex-col gap-5 rounded-xl p-6">
            {/* The fields are entered by hand until a document is staged; once one is, they hold
                what the parser pulled out of it, so the card and its labels say so. */}
            <p className="text-base font-bold">
              {file ? 'Extracted Context Metadata' : 'Course Context Metadata'}
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={label} htmlFor="code">
                  {file ? 'DETECTED COURSE CODE' : 'COURSE CODE'}
                </label>
                <input
                  id="code"
                  className={field}
                  placeholder={parse?.status === 'done' ? 'Not found in the file; type it in' : 'Read from the file'}
                  value={meta.code}
                  onChange={(e) => setMeta({ ...meta, code: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={label} htmlFor="title">
                  {file ? 'DETECTED COURSE TITLE' : 'COURSE TITLE'}
                </label>
                <input
                  id="title"
                  className={field}
                  placeholder="Read from the file"
                  value={meta.title}
                  onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={label} htmlFor="term">
                  ACADEMIC YEAR &amp; TERM
                </label>
                {/* A fixed list, so uploads always match the term the dashboards report on. */}
                <select
                  id="term"
                  className={field}
                  value={meta.term}
                  onChange={(e) => setMeta({ ...meta, term: e.target.value })}
                >
                  {[...new Set([term.label, ...syllabi.map((s) => s.term)])].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button className="w-full" disabled={!ready} onClick={proceed}>
              {parse?.status === 'running' ? 'Parsing document…' : 'Proceed to Parsing Verification'}
            </Button>
            {!file && (
              <p className="-mt-2 text-[11px] text-ink-3">
                Stage a syllabus document to enable parsing.
              </p>
            )}
            {parse?.status === 'done' && !meta.code.trim() && (
              <p className="-mt-2 text-[11px] font-semibold text-bad">
                The course code was not found in the file. Type it in to continue.
              </p>
            )}
          </Card>

          <Card className="flex flex-col gap-4 rounded-xl p-5">
            <p className="text-sm font-bold uppercase">Your Recent Uploads</p>
            <div className="flex flex-col gap-3">
              {recent.length === 0 && <p className="text-[13px] text-ink-3">No uploads yet.</p>}
              {recent.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0 text-ok" />
                    <p className="truncate text-[13px] font-semibold" title={s.file}>
                      {s.file}
                    </p>
                  </div>
                  <p className="shrink-0 text-[11px] text-ink-3">Parsed {timeAgo(s.uploadedOn)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {parse?.status === 'running' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-8">
          <div className="flex w-full max-w-[860px] flex-col gap-8 rounded-[20px] bg-white/95 p-10 shadow-[0_12px_24px_rgba(15,23,42,0.1)]">
            <div className="flex items-center justify-between gap-6">
              <div className="min-w-0">
                <p className="truncate text-xl font-bold">Analyzing {file?.name}</p>
                <p className="text-sm text-ink-3">{parse.stage ?? parseSteps[parse.step]}…</p>
              </div>
              <p className="text-[28px] font-extrabold text-brand">{Math.round(parse.progress * 100)}%</p>
            </div>

            <div className="h-2 w-full overflow-hidden rounded bg-line">
              <div
                className="h-full rounded bg-brand transition-all"
                style={{ width: `${Math.round(parse.progress * 100)}%` }}
              />
            </div>

            <div className="flex flex-col gap-4">
              {parseSteps.map((step, i) => {
                const state = i < parse.step ? 'done' : i === parse.step ? 'running' : 'waiting'
                return (
                  <div key={step} className={`flex items-center gap-4 ${state === 'waiting' ? 'opacity-50' : ''}`}>
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                        state === 'done' ? 'bg-ok-bg' : state === 'running' ? 'bg-brand-soft' : 'bg-slate-100'
                      }`}
                    >
                      {state === 'done' ? (
                        <CheckCircle2 size={14} className="text-ok" />
                      ) : state === 'running' ? (
                        <Loader size={14} className="animate-spin text-brand" />
                      ) : (
                        <Circle size={12} className="text-ink-3" />
                      )}
                    </span>
                    <p className="min-w-0 flex-1 text-sm font-semibold">{step}</p>
                    <p
                      className={`shrink-0 text-[13px] ${
                        state === 'done' ? 'text-ok' : state === 'running' ? 'font-semibold text-brand' : 'text-ink-3'
                      }`}
                    >
                      {state === 'done' ? 'Done' : state === 'running' ? 'Processing...' : 'Waiting'}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-brand-soft p-4">
              <Info size={20} className="shrink-0 text-brand" />
              <p className="min-w-0 flex-1 text-[13px] text-brand">
                The file is read in your browser. Course outcomes get Bloom&apos;s levels from their
                action verbs, using your own Bloom&apos;s levels too. You confirm everything on the
                verification screen next.
              </p>
            </div>
          </div>
        </div>
      )}

      {pickerOpen && (
        <Modal
          title="Grounding Material Attachment Manager"
          subtitle={`${attached.length} files configured for deep semantic assessment grounding`}
          onClose={() => setPickerOpen(false)}
          width={720}
          footer={
            <>
              <Button
                variant="ghost"
                className="border-brand text-brand"
                onClick={() => groundingInput.current?.click()}
              >
                Add More Files
              </Button>
              <Button className="px-6" onClick={() => setPickerOpen(false)}>
                Attach Selected Materials ({attached.length} Files)
              </Button>
            </>
          }
        >
          <div className="-mt-2 mb-5 flex items-center justify-end gap-2">
            <p className="text-[13px] font-semibold text-brand">
              Total Size: {usedMb.toFixed(1)} MB / {groundingSizeLimitMb} MB limit
            </p>
            <div className="h-1.5 w-[120px] overflow-hidden rounded-[3px] bg-line">
              <div
                className="h-full rounded-[3px] bg-brand"
                style={{ width: `${Math.min(100, (usedMb / groundingSizeLimitMb) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {files.map((f) => {
              const Icon = fileIcons[f.icon] ?? FileText
              return (
                <div
                  key={f.name}
                  className="flex items-center gap-5 rounded-xl border border-line bg-white p-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                        f.icon === 'presentation' ? 'bg-rose-50 text-rose-600' : 'bg-brand-soft text-brand'
                      }`}
                    >
                      <Icon size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{f.name}</p>
                      <p className="text-[11px] text-ink-3">
                        {f.kind} • {f.size} MB • Status: Validated
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink-2">{f.purpose}</span>
                      <button
                        role="switch"
                        aria-checked={f.enabled}
                        aria-label={`${f.purpose} for ${f.name}`}
                        onClick={() =>
                          setFiles((fs) =>
                            fs.map((x) => (x.name === f.name ? { ...x, enabled: !x.enabled } : x)),
                          )
                        }
                        className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${
                          f.enabled ? 'bg-brand' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
                            f.enabled ? 'left-[22px]' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                    <button
                      onClick={() => setFiles((fs) => fs.filter((x) => x.name !== f.name))}
                      className="text-[13px] font-semibold text-bad hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </Modal>
      )}

      {confirmDiscard && (
        <Modal
          title="Discard staged draft?"
          onClose={() => setConfirmDiscard(false)}
          width={460}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmDiscard(false)}>
                Keep draft
              </Button>
              <Button variant="danger" onClick={discard}>
                Discard draft
              </Button>
            </>
          }
        >
          <p>
            The staged document and any attached grounding materials will be removed. Parsed data
            from earlier uploads is not affected.
          </p>
        </Modal>
      )}
    </AppShell>
  )
}

/** What the parser found, shown on the staged file so faculty can check it before continuing. */
function ParseSummary({ parse }) {
  const { parsed, audit } = parse
  const hours = parsed.chapters.reduce((sum, c) => sum + c.hours, 0)
  const facts = [
    ['Course outcomes', parsed.outcomes.length],
    ['Chapters / units', parsed.chapters.length],
    ['Outline hours', `${hours}${parsed.statedHours != null ? ` of ${parsed.statedHours} stated` : ''}`],
    ['Credit split', parsed.creditSplit],
  ]
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-line bg-white p-4">
      <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2">
        {facts.map(([k, v]) => (
          <div key={k}>
            <p className="text-[11px] font-semibold text-ink-3">{k}</p>
            <p className="text-sm font-bold">{v}</p>
          </div>
        ))}
      </div>
      {audit.findings.length > 0 ? (
        <p className="flex items-start gap-2 text-xs text-warn">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" />
          {audit.findings.length} finding{audit.findings.length === 1 ? '' : 's'} to review (compliance{' '}
          {audit.complianceScore}%): {audit.findings.map((f) => f.title).join('; ')}
        </p>
      ) : (
        <p className="flex items-center gap-2 text-xs text-ok">
          <CheckCircle2 size={14} /> Hours reconcile and every course outcome is covered.
        </p>
      )}
      {parsed.warnings.map((w) => (
        <p key={w} className="text-[11px] text-ink-3">
          {w}
        </p>
      ))}
    </div>
  )
}
