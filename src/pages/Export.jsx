import { useState } from 'react'
import { CheckCircle2, Download, FileText, Info, Shuffle } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Button, Card, Modal, ProgressBar } from '../components/ui.jsx'
import { courses, deadlines, exportFormats, questions, term } from '../data/mock.js'
import { useAppState } from '../state/context.js'

const course = courses[0]

const formatLabel = (f) => `${f.name} (.${f.ext})`

const options = {
  format: exportFormats.map(formatLabel),
  overlay: ['PSU Official Letterhead & Header', 'Department header only', 'No overlay (plain)'],
  sets: [
    'Sets A, B, and C (Choice & Item Shuffle)',
    'Sets A and B (Item Shuffle only)',
    'Single Set (no randomization)',
  ],
  annex: [
    'TOS Document + Separate Answer Key',
    'Answer Key only',
    'TOS Document only',
    'No annex documents',
  ],
  accessibility: [
    'High-contrast Screen-Reader Optimized',
    'Large print (16pt base)',
    'Standard layout',
  ],
  watermark: ['Confidential - Faculty Use Only', 'Draft - Not for Release', 'No watermark'],
}

// Dates sit inside 2nd Sem A.Y. 2023-2024 (Jan–May 2024). The Figma ledger showed October 2024,
// which falls in the following first semester.
const ledger = [
  {
    date: 'Mar 12, 2024',
    file: 'ELEC4_Midterm_Compliance_TOS.docx',
    sets: 'A, B',
    status: 'Verified',
  },
  {
    date: 'Mar 11, 2024',
    file: 'IT312_Diagnostic_TOS_Matrix.pdf',
    sets: 'Single Set',
    status: 'Verified',
  },
]

// Deterministic rotation, so a given seed always reproduces the same sets and the preview matches
// what a compile would emit. Every set draws from the one item pool: Figma's "Set C (Deep
// Shuffled)" contained an item that appeared in neither Set A nor Set B and gave another item
// different choices altogether, which cannot be a shuffle and cannot be equivalent.
function rotate(list, by) {
  const n = list.length
  const offset = ((by % n) + n) % n
  return list.map((_, i) => list[(i + offset) % n])
}

// Offset for set `si` at a given seed. Set A is the baseline and never rotates; every later set
// rotates by a non-zero amount that stays distinct from the other sets however often the shuffle is
// regenerated, so no two sets can come out identical.
function offsetFor(si, seed, length) {
  if (si === 0 || length < 2) return 0
  return 1 + ((si - 1 + seed) % (length - 1))
}

const setNames = ['Set A (Baseline)', 'Set B (Shuffled Items)', 'Set C (Deep Shuffled)']

const labels = {
  format: 'TARGET FILE FORMAT',
  overlay: 'UNIVERSITY DESIGN OVERLAYS',
  sets: 'RANDOMIZED TEST SETS',
  annex: 'ADDITIONAL ANNEX DOCUMENTS',
  accessibility: 'ACCESSIBILITY MODE',
  watermark: 'SECURITY WATERMARK',
}

const selectClass =
  'w-full rounded-md border border-white/40 bg-white/70 p-3 text-[13px] text-ink backdrop-blur-[6px]'

export default function Export() {
  const { examConfig } = useAppState()
  const [config, setConfig] = useState({
    format: options.format[0],
    overlay: options.overlay[0],
    sets: options.sets[0],
    annex: options.annex[0],
    accessibility: options.accessibility[0],
    watermark: options.watermark[0],
  })
  const [compiling, setCompiling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [succeeded, setSucceeded] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [seed, setSeed] = useState(0)
  const [setsFinalized, setSetsFinalized] = useState(false)

  const setCount = config.sets.startsWith('Sets A, B, and C')
    ? 3
    : config.sets.startsWith('Sets A and B')
      ? 2
      : 1

  const chosen = exportFormats.find((f) => formatLabel(f) === config.format) ?? exportFormats[0]
  const prefix = course.code.replace(' ', '')

  // The produced files follow the chosen format. Figma's archive listed a PDF, a Moodle XML and an
  // XLSX every time, so the downloads ignored whichever format had just been selected.
  const bundles = [
    {
      file: `${prefix}_Midterm_Set_${['A', 'B', 'C'].slice(0, setCount).join('_')}.${chosen.ext}`,
      size: chosen.size,
      note: chosen.note.toLowerCase(),
      action: `Download ${chosen.ext.toUpperCase()} Bundle`,
    },
    {
      file: `${prefix}_Answer_Keys.${chosen.ext === 'pdf' ? 'pdf' : 'csv'}`,
      size: '96 KB',
      note: `keys for ${setCount} set${setCount > 1 ? 's' : ''}`,
      action: 'Download Answer Keys',
    },
    {
      file: `${prefix}_TOS_Compliance_Matrix.xlsx`,
      size: '1.1 MB',
      note: 'complete Bloom alignment',
      action: 'Download Compliance',
    },
  ]

  function compile() {
    setCompiling(true)
    setProgress(0)
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer)
          setCompiling(false)
          setSucceeded(true)
          return 100
        }
        return p + 10
      })
    }, 130)
  }

  // Randomization review is a full page of its own, not a dialog: it carries the whole set matrix
  // plus the regenerate and finalize decisions.
  if (previewing) {
    const bands = [
      ['Remember/Understand', examConfig.mix.lower],
      ['Apply/Analyze', examConfig.mix.mid],
      ['Evaluate/Create', examConfig.mix.higher],
    ]
    return (
      <AppShell
        title="Set Randomization & Shuffling Matrix"
        subtitle={`Pre-verification of equivalence, item and choice distribution across ${
          ['Set A', 'Sets A and B', 'Sets A, B, and C'][setCount - 1]
        }.`}
      >
        <Card className="flex flex-wrap items-center justify-between gap-4 rounded-xl p-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-6">
            <p className="text-[15px] font-bold">{course.code} Midterm Sets</p>
            <div className="flex items-center gap-2 text-[13px] text-ink-2">
              <CheckCircle2 size={14} className="shrink-0 text-ok" />
              {/* Figma printed a fixed "99.4%". Each set holds the same items in a different order,
                  so content equivalence is exact by construction and is stated as such. */}
              <span>
                Content Equivalence: <strong className="text-ok">100% (identical TOS coverage)</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-ink-2">
              <Info size={14} className="shrink-0 text-brand" />
              {/* Figma read "Analyze (40%), Evaluate (30%), Create (30%)", which is neither the
                  configured mix nor a distribution any other screen shows. */}
              <span>
                Bloom&apos;s Mapping:{' '}
                <strong>{bands.map(([name, pct]) => `${name} ${pct}%`).join(', ')}</strong>
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Button variant="ghost" icon={Shuffle} onClick={() => setSeed((s) => s + 1)}>
              Regenerate Shuffle
            </Button>
            <Button
              onClick={() => {
                setSetsFinalized(true)
                setPreviewing(false)
              }}
            >
              Accept &amp; Finalize Sets
            </Button>
          </div>
        </Card>

        <div className="flex gap-4 max-lg:flex-col">
          {['A', 'B', 'C'].slice(0, setCount).map((letter, si) => {
            // Set A keeps the authored order; each later set rotates further.
            const ordered = rotate(questions, offsetFor(si, seed, questions.length))
            return (
              <div
                key={letter}
                className="flex min-w-0 flex-1 flex-col gap-4 rounded-xl border border-line bg-white p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[15px] font-bold">{setNames[si]}</p>
                  {/* Figma stamped the keys "A-2024"; the term these sets belong to is 2023-2024. */}
                  <span className="shrink-0 rounded bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">
                    KEY ID: {letter}-{term.label.split('A.Y. ')[1]}
                  </span>
                </div>
                <hr className="border-line" />
                <div className="flex flex-col gap-3">
                  {ordered.map((q, qi) => {
                    const source = questions.indexOf(q) + 1
                    const choices = rotate(q.options, offsetFor(si, seed + qi, q.options.length))
                    return (
                      <div key={q.id} className="flex flex-col gap-1.5">
                        <p className="text-[13px] font-semibold">
                          Q{qi + 1}. {q.short}
                          {source !== qi + 1 && (
                            <span className="ml-1 font-semibold text-accent">(Was Q{source})</span>
                          )}
                        </p>
                        {choices.map((o, oi) => (
                          <p
                            key={o.key}
                            className={`text-xs ${o.correct ? 'text-ink-2' : 'text-ink-3'}`}
                          >
                            {String.fromCharCode(65 + oi)}. {o.text}
                            {o.correct && <span className="font-semibold"> (Correct)</span>}
                          </p>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <Card className="flex flex-wrap items-center gap-4 rounded-xl p-5">
          <p className="min-w-0 flex-1 text-[13px] text-ink-2">
            Every set contains the same {questions.length} items against the same TOS cells. Only the
            item order and the order of choices differ, so the sets stay interchangeable for grading.
          </p>
          <Button variant="ghost" onClick={() => setPreviewing(false)}>
            Back to export settings
          </Button>
        </Card>
      </AppShell>
    )
  }

  // Successful compilation swaps the page for the archive view described by the design.
  if (succeeded) {
    return (
      <AppShell
        title="Export Status & Archives"
        subtitle="Verify generated test bundles, metadata formats, and official institutional copies."
      >
        <div className="flex flex-col gap-5 rounded-[20px] bg-brand p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-white" />
              <p className="text-lg font-bold text-white">
                {course.code} Midterm Exam Compilation Completed
              </p>
            </div>
            <p className="text-[13px] text-gray-300">
              A.Y. {term.label.split('A.Y. ')[1]} • CCS Dept
            </p>
          </div>
          <hr className="border-white/20" />
          <div className="flex gap-6 max-md:flex-col">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-300">CHECKSUM (SHA-256)</p>
              <p className="truncate text-xs font-bold text-white">
                8f5b12a3d098e91cbf7a34cd21e905a8d423e2012
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-300">GENERATED TIMESTAMP</p>
              {/* Figma stamped this PST; a Lingayen campus export is PHT. */}
              <p className="truncate text-xs font-bold text-white">
                {deadlines[0].date}, 2024 - 10:24 AM (PHT)
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm font-bold">Generated Test Bundles &amp; Keys</p>
        <div className="flex gap-4 max-lg:flex-col">
          {bundles.map((b) => (
            <div
              key={b.file}
              className="flex min-h-[220px] flex-1 flex-col gap-4 rounded-xl border border-line bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <FileText size={20} className="shrink-0 text-brand" />
                <p className="min-w-0 flex-1 truncate text-sm font-bold">{b.file}</p>
              </div>
              <p className="text-xs text-ink-3">
                Size: {b.size} • {b.note}
              </p>
              <Button className="mt-auto self-start px-4 py-2 text-xs">{b.action}</Button>
            </div>
          ))}
        </div>

        <Card className="flex flex-wrap items-center gap-4 rounded-xl p-5">
          <p className="min-w-0 flex-1 text-[13px] text-ink-2">
            Need to share this bundle directly with co-faculty?
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="px-4 py-2 text-[13px]"
              onClick={() => setCopied(true)}
            >
              {copied ? 'Link copied' : 'Copy Secure Share Link'}
            </Button>
            <Button
              variant="ghost"
              className="border-transparent bg-slate-100 px-4 py-2 text-[13px]"
              onClick={() => {
                setSucceeded(false)
                setCopied(false)
              }}
            >
              Export Another Format
            </Button>
          </div>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Export & Generation Ledgers"
      subtitle="Download compliant materials and answer keys configured to multiple randomized sets."
    >
      <div className="flex gap-6 max-xl:flex-col">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Card className="flex flex-col gap-5 p-6">
            <p className="text-base font-bold">Format and Compilation Settings</p>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              {Object.keys(labels).map((key) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-ink-3" htmlFor={key}>
                    {labels[key]}
                  </label>
                  <select
                    id={key}
                    className={selectClass}
                    value={config[key]}
                    onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.value }))}
                  >
                    {options[key].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  {key === 'format' && (
                    <p className="text-[11px] text-ink-3">
                      {chosen.note}
                      {chosen.recommended && (
                        <span className="ml-1 font-semibold text-ok">· Recommended</span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 p-3">
              <Info size={16} className="shrink-0 text-brand" />
              <p className="min-w-0 flex-1 text-xs text-ink-2">
                <span className="font-bold">System Note:</span> Moodle XML and QTI carry question
                banks and images directly. PDF renders the university header branding automatically.
              </p>
            </div>
            {setCount > 1 && (
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" icon={Shuffle} onClick={() => setPreviewing(true)}>
                  {setsFinalized ? 'Review randomization' : 'Preview randomization'}
                </Button>
                {setsFinalized && <Badge tone="ok">Sets finalized</Badge>}
              </div>
            )}
          </Card>

          <Card className="flex flex-col gap-5 p-6">
            <p className="text-base font-bold">Historical Download Ledgers</p>
            <div className="overflow-hidden rounded-lg border border-white/40">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-slate-100 text-left text-[11px] font-bold text-ink-3">
                    <th className="w-[180px] p-3 font-bold">DATE COMPILED</th>
                    <th className="p-3 font-bold">COMPILED SCHEMAS / FILES</th>
                    <th className="w-[120px] p-3 font-bold">SETS</th>
                    <th className="w-[110px] p-3 font-bold">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((row) => (
                    <tr key={row.file} className="border-b border-white/40 last:border-b-0">
                      <td className="p-4">{row.date}</td>
                      <td className="p-4 font-semibold">{row.file}</td>
                      <td className="p-4 text-ink-3">{row.sets}</td>
                      <td className="p-4">
                        <Badge tone="ok">{row.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="w-[380px] shrink-0 max-xl:w-full">
          <div className="sticky top-8 flex flex-col gap-5 rounded-[20px] border border-white/10 bg-brand p-6 shadow-[0_12px_16px_rgba(15,23,42,0.15)]">
            <p className="text-base font-bold text-white">Compilation Target</p>
            <div className="flex flex-col gap-3 text-[13px]">
              <div className="flex justify-between gap-4">
                <p className="text-gray-300">Diagnostic Exam Name</p>
                <p className="text-right font-bold text-white">{course.code} Midterm</p>
              </div>
              <div className="flex justify-between gap-4">
                <p className="text-gray-300">Assessed Items</p>
                <p className="font-bold text-white">{examConfig.items} Items Aligned</p>
              </div>
              <div className="flex justify-between gap-4">
                <p className="text-gray-300">Randomized Sets</p>
                <p className="font-bold text-white">{setCount}</p>
              </div>
              <div className="flex justify-between gap-4">
                <p className="text-gray-300">Files Produced</p>
                <p className="font-bold text-white">
                  {setCount + (config.annex === 'No annex documents' ? 0 : config.annex.includes('+') ? 2 : 1)}
                </p>
              </div>
            </div>
            <hr className="border-white/20" />
            <Button variant="accent" icon={Download} className="w-full" onClick={compile}>
              Compile and Export Sets
            </Button>
          </div>
        </div>
      </div>

      {compiling && (
        <Modal title="Compiling export package" width={480}>
          <div className="flex flex-col gap-4">
            <p>
              Rendering {setCount} randomized set{setCount > 1 ? 's' : ''} of {examConfig.items} items
              with the {config.overlay.toLowerCase()}.
            </p>
            <ProgressBar value={progress} />
            <p className="text-xs text-ink-3">
              {progress < 50 ? 'Shuffling items and choices…' : 'Applying layout and watermark…'}{' '}
              {progress}%
            </p>
          </div>
        </Modal>
      )}

    </AppShell>
  )
}
