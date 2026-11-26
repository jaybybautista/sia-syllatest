import { useEffect, useRef, useState } from 'react'
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
  UploadCloud,
} from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Button, Card, Modal } from '../components/ui.jsx'
import {
  groundingLibrary,
  groundingSizeLimitMb,
  term,
  uploadSizeLimitMb,
  uploadSteps,
} from '../data/mock.js'
import { createSyllabusRecord } from '../data/syllabi.js'
import { featurePath } from '../data/features.js'
import { useAppState } from '../state/context.js'

const fileIcons = { presentation: MonitorPlay, book: BookOpen, file: FileText }

// Figma's queue listed "ELEC4_WebMobile2_Syllabus.pdf — 85% complete" beside the ELEC 4 file the
// user is staging on this very screen, so the same document appeared as both pending and in flight
// under two different names. Only the genuinely earlier upload is listed.
const queue = [{ name: 'IT_312_HCI_Syllabus.docx', note: 'Parsed 1h ago', done: true }]

const field = 'w-full rounded-md border border-white/40 bg-white/70 p-3 text-sm text-ink backdrop-blur-[6px]'
const label = 'text-xs font-bold text-ink-2'

export default function Upload() {
  const navigate = useNavigate()
  const { syllabi, addSyllabus, account, logActivity } = useAppState()
  const fileInput = useRef(null)
  const groundingInput = useRef(null)

  const [file, setFile] = useState(null)
  const [files, setFiles] = useState(groundingLibrary)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  // The record being parsed; once the progress bar completes, its verification screen opens.
  const [parsedId, setParsedId] = useState(null)

  const timer = useRef(null)

  useEffect(() => {
    if (parsedId && progress >= 100) navigate(featurePath('verification', parsedId))
  }, [parsedId, progress, navigate])
  useEffect(() => () => clearInterval(timer.current), [])
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [meta, setMeta] = useState({
    code: 'ELEC 4',
    title: 'Special Topics on Web and Mobile 2',
    term: term.label,
  })

  function pickFile(selected) {
    if (!selected) return
    setFile({ name: selected.name, size: (selected.size / 1024 / 1024).toFixed(1) })
  }

  const attached = files.filter((f) => f.enabled)
  const usedMb = files.reduce((sum, f) => sum + f.size, 0)

  function discard() {
    setFile(null)
    setFiles(files.map((f) => ({ ...f, enabled: false })))
    setConfirmDiscard(false)
  }

  function proceed() {
    // The upload joins the syllabus history straight away, so every feature list shows it.
    const record = createSyllabusRecord(syllabi, {
      code: meta.code.trim() || 'Untitled',
      title: meta.title.trim() || file.name,
      term: meta.term.trim() || term.label,
      file: file.name,
      fileSize: Number(file.size),
      uploader: account,
    })
    addSyllabus(record)
    logActivity({ syllabusId: record.id, code: record.code, text: `uploaded ${record.file} for ${record.code}` })
    logActivity({
      ai: true,
      syllabusId: record.id,
      code: record.code,
      text: `Parsed ${record.file}: ${record.outcomes.length} course outcomes, ${record.chapters.length} chapters`,
    })
    setProcessing(true)
    setProgress(0)
    setParsedId(record.id)
    clearInterval(timer.current)
    timer.current = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 5)
        if (next >= 100) clearInterval(timer.current)
        return next
      })
    }, 120)
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
                    <p className="text-[13px] text-ink-2">{file.size} MB</p>
                    <p className="text-[13px] text-slate-400">•</p>
                    <span className="rounded bg-ok-bg px-2 py-0.5 text-[11px] font-semibold text-ok">
                      Ready to Process
                    </span>
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

              <div className="flex w-full flex-col gap-2">
                <div className="flex items-start justify-between text-[13px] font-semibold">
                  {/* Figma labelled this bar "Optical PDF Layout Validation" at 100%, which claims
                      validation has already run; validation is what the Proceed action starts. */}
                  <p className="text-ink-2">Document Transfer</p>
                  <p className="text-brand">100% Uploaded</p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded bg-line">
                  <div className="h-full w-full rounded bg-brand" />
                </div>
              </div>

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
            onChange={(e) => pickFile(e.target.files?.[0])}
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
            {file ? (
              <p className="text-xs">
                <span className="font-bold text-brand">Vector text detected:</span> This document
                carries a native text layer, so OCR is not required. Layout extraction will map
                directly onto the physical CHED outcomes template.
              </p>
            ) : (
              <p className="text-xs">
                <span className="font-bold text-brand">Scanned Document Fallback Enabled:</span> If
                your syllabus is a scanned image, the optical parser will automatically invoke
                regional GPU-accelerated OCR pipelines to recreate native layout schemas. Mappings
                will preserve physical CHED forms.
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
            <Button className="w-full" disabled={!file || processing} onClick={proceed}>
              {processing ? 'Parsing document…' : 'Proceed to Parsing Verification'}
            </Button>
            {!file && (
              <p className="-mt-2 text-[11px] text-ink-3">
                Stage a syllabus document to enable parsing.
              </p>
            )}
          </Card>

          <Card className="flex flex-col gap-4 rounded-xl p-5">
            <p className="text-sm font-bold uppercase">Recent Processing Queue</p>
            <div className="flex flex-col gap-3">
              {queue.map((q) => (
                <div key={q.name} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {q.done ? (
                      <CheckCircle2 size={14} className="shrink-0 text-ok" />
                    ) : (
                      <Loader size={14} className="shrink-0 animate-spin text-brand" />
                    )}
                    <p className="truncate text-[13px] font-semibold">{q.name}</p>
                  </div>
                  <p className={`shrink-0 text-[11px] ${q.done ? 'text-ink-3' : 'text-brand'}`}>
                    {q.note}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-8">
          <div className="flex w-full max-w-[860px] flex-col gap-8 rounded-[20px] bg-white/95 p-10 shadow-[0_12px_24px_rgba(15,23,42,0.1)]">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-xl font-bold">Analyzing {file?.name}</p>
                <p className="text-sm text-ink-3">
                  Step 2 of 3: Multimodal Extraction and CHED compliance alignment in progress.
                </p>
              </div>
              <p className="text-[28px] font-extrabold text-brand">{progress}%</p>
            </div>

            <div className="h-2 w-full overflow-hidden rounded bg-line">
              <div
                className="h-full rounded bg-brand transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex flex-col gap-4">
              {uploadSteps.map((step, i) => {
                // Each step owns an equal slice of the run, so status follows real progress.
                const start = (i / uploadSteps.length) * 100
                const end = ((i + 1) / uploadSteps.length) * 100
                const state = progress >= end ? 'done' : progress >= start ? 'running' : 'waiting'
                return (
                  <div
                    key={step.label}
                    className={`flex items-center gap-4 ${state === 'waiting' ? 'opacity-50' : ''}`}
                  >
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
                    <p className="min-w-0 flex-1 text-sm font-semibold">{step.label}</p>
                    <p
                      className={`shrink-0 text-[13px] ${
                        state === 'done'
                          ? 'text-ok'
                          : state === 'running'
                            ? 'font-semibold text-brand'
                            : 'text-ink-3'
                      }`}
                    >
                      {state === 'done' ? step.done : state === 'running' ? 'Processing...' : 'Waiting'}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-brand-soft p-4">
              <Info size={20} className="shrink-0 text-brand" />
              <p className="min-w-0 flex-1 text-[13px] text-brand">
                Syllabus ingestion parses course content and maps Bloom&apos;s Taxonomy tags to
                outcomes automatically. Once complete, you will be redirected to the verification
                editor.
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
