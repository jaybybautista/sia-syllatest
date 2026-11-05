import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Button, Card, Modal } from '../components/ui.jsx'
import { chair, term, user } from '../data/mock.js'
import { useAppState } from '../state/context.js'

const roleLabel = { faculty: 'Faculty', chair: 'Department Chair', admin: 'Administrator' }

const accountByRole = {
  faculty: { ...user, scope: user.college },
  chair: { ...chair, college: chair.role, scope: 'College of Computing Sciences' },
  admin: {
    name: 'ICT Systems Admin',
    email: 'ict-admin@psu.edu.ph',
    college: 'ICT Office',
    scope: 'All colleges',
  },
}

const prefsList = [
  ['parsing', 'Parsing and generation finished'],
  ['comments', 'Reviewer comments on my items'],
  ['deadlines', 'Compliance deadline reminders'],
  ['approvals', 'Approval and lock decisions'],
]

export default function Profile() {
  const navigate = useNavigate()
  const { role, setRole, setSignedIn } = useAppState()
  const account = accountByRole[role]
  const [prefs, setPrefs] = useState({
    parsing: true,
    comments: true,
    deadlines: true,
    approvals: false,
  })
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const initials = account.name
    .split(' ')
    .filter((w) => !w.endsWith('.'))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')

  return (
    <AppShell
      title="Profile & Account"
      subtitle="Your university account, active role, and notification preferences."
    >
      <div className="flex max-w-[760px] flex-col gap-6">
        <Card className="flex items-center gap-5 p-6">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold">{account.name}</p>
            <p className="text-[13px] text-ink-2">{account.email}</p>
            <p className="text-xs text-ink-3">{account.college}</p>
          </div>
          <Badge tone="info">{roleLabel[role]}</Badge>
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-2">
            <UserRound size={18} className="text-brand" />
            <p className="text-base font-bold">Active role</p>
          </div>
          <p className="text-[13px] text-ink-2">
            Your role determines which screens and approval actions are available. Accounts can hold
            one role per college.
          </p>
          <div className="flex flex-col gap-2">
            {Object.keys(roleLabel).map((r) => (
              <label
                key={r}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 ${
                  role === r ? 'border-brand bg-brand-soft' : 'border-line bg-white/70'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  checked={role === r}
                  onChange={() => setRole(r)}
                  className="accent-[#1e3a8a]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold">{roleLabel[r]}</span>
                  <span className="block text-[11px] text-ink-3">
                    {accountByRole[r].name} · {accountByRole[r].scope}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-brand" />
            <p className="text-base font-bold">Notification preferences</p>
          </div>
          <div className="flex flex-col gap-2">
            {prefsList.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-4 py-1.5">
                <span className="text-[13px] text-ink-2">{label}</span>
                <button
                  role="switch"
                  aria-checked={prefs[key]}
                  aria-label={label}
                  onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    prefs[key] ? 'bg-brand' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${
                      prefs[key] ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand" />
            <p className="text-base font-bold">Session</p>
          </div>
          <div className="flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between gap-4">
              <p className="text-ink-2">Signed in with</p>
              <p className="font-semibold">PSU Google Workspace</p>
            </div>
            <div className="flex justify-between gap-4">
              <p className="text-ink-2">Active term</p>
              <p className="font-semibold">{term.label}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            icon={LogOut}
            className="self-start border-bad text-bad"
            onClick={() => setConfirmSignOut(true)}
          >
            Sign out
          </Button>
        </Card>
      </div>

      {confirmSignOut && (
        <Modal
          title="Sign out of SyllaTest?"
          onClose={() => setConfirmSignOut(false)}
          width={440}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmSignOut(false)}>
                Stay signed in
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setSignedIn(false)
                  navigate('/signin')
                }}
              >
                Sign out
              </Button>
            </>
          }
        >
          <p>
            Draft syllabi, TOS allocations and unsubmitted item edits are kept. You will need to sign
            in again with your PSU account.
          </p>
        </Modal>
      )}
    </AppShell>
  )
}
