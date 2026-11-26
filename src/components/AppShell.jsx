import { useContext, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  Bell,
  BrainCircuit,
  ClipboardCheck,
  Database,
  FileCheck,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  LayoutGrid,
  LineChart,
  LogOut,
  RotateCcw,
  Settings,
  Settings2,
  Table,
  TriangleAlert,
  UploadCloud,
} from 'lucide-react'
import { SyllabusContext, useAppState } from '../state/context.js'
import { Button, Modal, glass } from './ui.jsx'
import { term } from '../data/mock.js'
import { initialsOf, roleLabel } from '../data/accounts.js'
import { formatDate } from '../data/syllabi.js'

const navByRole = {
  faculty: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { to: '/upload', label: 'Upload Syllabus', icon: UploadCloud },
    { to: '/verification', label: 'Verification', icon: FileCheck },
    { to: '/consistency', label: 'Consistency Checker', icon: TriangleAlert },
    { to: '/tos', label: 'TOS Generator', icon: Table },
    { to: '/bank', label: 'Question Bank', icon: Database },
    { to: '/bloom', label: "My Bloom's Taxonomy", icon: BrainCircuit },
  ],
  chair: [
    { to: '/chair', label: 'Chair Dashboard', icon: LayoutGrid },
    { to: '/approval', label: 'Reviewer Approval', icon: ClipboardCheck },
    { to: '/analysis', label: 'Item Analysis', icon: LineChart },
    { to: '/bank', label: 'Question Bank', icon: Database },
    { to: '/bloom', label: "My Bloom's Taxonomy", icon: BrainCircuit },
  ],
  admin: [{ to: '/admin', label: 'Admin Control Center', icon: Settings }],
}


export default function AppShell({ title, subtitle, actions, children }) {
  // The role comes from the signed-in account; using another role means signing in as that account.
  const { account, role, signOut, resetDemoData } = useAppState()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const navigate = useNavigate()
  const nav = navByRole[role]
  const initials = initialsOf(account.name)

  return (
    <div className="flex min-h-screen items-stretch">
      {/* z-30: the sidebar's blur makes it its own layer, so without this the main content's cards
          paint over the account menu that opens out of it. Modals (z-50) still sit above it. */}
      <aside
        className={`${glass} sticky top-0 z-30 flex h-screen w-[260px] shrink-0 flex-col justify-between border-y-0 border-l-0 p-6`}
      >
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand text-xl font-extrabold text-white">
              ST
            </div>
            <div>
              <p className="text-base font-bold leading-tight">SyllaTest</p>
              <p className="text-[10px] font-semibold uppercase text-accent-dark">PSU Academic AI</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1.5" aria-label="Main">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${
                    isActive ? 'bg-brand-soft font-semibold text-brand' : 'font-medium text-ink-2 hover:bg-white/80'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-4">
          <div className={`${glass} rounded-xl p-3`}>
            <p className="text-[11px] font-bold text-ink-2">INSTITUTION</p>
            <p className="text-xs font-semibold text-brand">Pangasinan State Univ.</p>
            <p className="text-[11px] text-ink-3">Campus: Lingayen (Main)</p>
          </div>
          <div className="relative">
            {menuOpen && (
              <>
                <button
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Close account menu"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  className="absolute bottom-full left-0 z-50 mb-3 flex w-[340px] flex-col gap-5 rounded-2xl border border-line bg-white p-5 shadow-[4px_12px_24px_rgba(15,23,42,0.15)]"
                  role="menu"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                      {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold">{account.name}</p>
                      <p className="truncate text-xs text-ink-2">{account.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold text-ink-2">ROLE</p>
                      <p className="truncate text-xs font-semibold text-brand">
                        {account.rank ?? roleLabel[role]}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold text-ink-2">DEPARTMENT</p>
                      <p className="truncate text-xs font-semibold">{account.college ?? 'ICT Office'}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold text-ink-2">SYSTEM ACCESS</p>
                      <p className="truncate text-xs font-semibold">{roleLabel[role]}</p>
                    </div>
                  </div>

                  <hr className="border-line" />

                  <div className="flex flex-col gap-1">
                    <MenuItem
                      icon={Settings2}
                      label="Account Settings"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/profile')
                      }}
                    />
                    <MenuItem
                      icon={Activity}
                      label="Audit Trail Activity"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate(role === 'admin' ? '/admin' : '/notifications')
                      }}
                    />
                    <MenuItem
                      icon={RotateCcw}
                      label="Reset Demo Data"
                      onClick={() => {
                        setMenuOpen(false)
                        setConfirmReset(true)
                      }}
                    />
                  </div>

                  <hr className="border-line" />

                  <MenuItem
                    icon={LogOut}
                    label="Sign Out from PSU Mail"
                    tone="text-bad"
                    onClick={() => {
                      setMenuOpen(false)
                      signOut()
                      navigate('/signin')
                    }}
                  />
                </div>
              </>
            )}

            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex w-full items-center gap-2.5 rounded-lg p-1 text-left hover:bg-white/60"
              aria-label="Open account menu"
              aria-expanded={menuOpen}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{account.name}</span>
                <span className="block truncate text-[11px] text-ink-3">{roleLabel[role]}</span>
              </span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header
          className={`${glass} flex h-20 shrink-0 items-center justify-between border-x-0 border-t-0 px-8 py-4`}
        >
          <div>
            <h1 className="text-[22px] font-bold leading-tight">{title}</h1>
            {subtitle && <p className="text-[13px] text-ink-3">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-5">
            {actions}
            <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand">
              {term.label}
            </span>
            <div className="flex gap-3">
              <NavLink
                to="/notifications"
                aria-label="Notifications"
                className={`${glass} flex size-9 items-center justify-center rounded-full`}
              >
                <Bell size={18} className="text-ink-2" />
              </NavLink>
              <NavLink
                to="/help"
                aria-label="Help and support"
                className={`${glass} flex size-9 items-center justify-center rounded-full`}
              >
                <HelpCircle size={18} className="text-ink-2" />
              </NavLink>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-7 p-8">
          <OpenSyllabusBar />
          {children}
        </div>
      </main>

      {confirmReset && (
        <Modal
          title="Reset the demo data?"
          icon={RotateCcw}
          tone="warn"
          onClose={() => setConfirmReset(false)}
          width={480}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  resetDemoData()
                  setConfirmReset(false)
                  navigate('/')
                }}
              >
                Reset Data
              </Button>
            </>
          }
        >
          <p className="leading-[22px]">
            Every account goes back to the original syllabi: uploads, TOS locks, review decisions,
            imported questions and results analyses made in this browser are removed. Custom
            Bloom&apos;s levels are kept.
          </p>
        </Modal>
      )}
    </div>
  )
}

function MenuItem({ icon: Icon, label, trailing, tone = 'text-ink', onClick }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-white/80"
    >
      <Icon size={16} className={tone === 'text-bad' ? 'text-bad' : 'text-ink-2'} />
      <span className={`flex-1 text-sm font-medium ${tone}`}>{label}</span>
      {trailing}
    </button>
  )
}

// Shown on a feature screen opened from a history list: names the syllabus (or results file) the
// screen is showing and leads back to the list it came from.
function OpenSyllabusBar() {
  const current = useContext(SyllabusContext)
  if (!current) return null
  const { syllabus: s, feature } = current
  const results = feature.results && s.analysis
  const Icon = feature.results ? FileSpreadsheet : FileText
  return (
    <div className={`${glass} -mb-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-4 py-3`}>
      <Link
        to={feature.path}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:underline"
      >
        <ArrowLeft size={14} />
        {feature.results ? 'All results files' : 'All uploaded syllabi'}
      </Link>
      <span className="h-4 w-px bg-line max-sm:hidden" />
      <span className="flex min-w-0 items-center gap-2 text-[13px]">
        <Icon size={14} className="shrink-0 text-ink-3" />
        <span className="font-bold text-brand">{s.code}</span>
        <span className="truncate font-semibold">{s.title}</span>
      </span>
      <span className="truncate text-xs text-ink-3">
        {results
          ? `${s.analysis.file} · uploaded ${formatDate(s.analysis.uploadedOn)}`
          : `${s.file} · uploaded ${formatDate(s.uploadedOn)}`}{' '}
        · {s.term}
      </span>
    </div>
  )
}
