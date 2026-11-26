import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CircleAlert } from 'lucide-react'
import { demoAccounts, homeByRole } from '../data/accounts.js'
import { useAppState } from '../state/context.js'

// The demo accounts. Each signs in with its own fixed role; the role decides the home screen.
const badges = { faculty: 'Faculty', chair: 'Chairperson', admin: 'Administrator' }
const accounts = demoAccounts.map((a) => ({
  ...a,
  badge: badges[a.role],
  tone: a.role === 'chair' ? 'accent' : 'brand',
}))

export default function Sso() {
  const navigate = useNavigate()
  const { signIn } = useAppState()

  function choose(account) {
    signIn(account.email)
    navigate(homeByRole[account.role])
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-r from-navy-950 via-[#1e3a8a] via-55% to-navy-900 p-8 lg:p-16">
      <div className="flex items-center gap-3 pb-10">
        <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-2xl font-extrabold text-white">
          ST
        </div>
        <p className="text-[28px] font-extrabold text-white">SyllaTest AI</p>
      </div>

      <div className="flex w-full max-w-[520px] flex-col gap-8 rounded-3xl border border-white/30 bg-white/90 p-10 shadow-[0_20px_40px_rgba(2,6,23,0.2)] backdrop-blur-md">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-[28px] font-extrabold text-navy-900">Choose an account</h1>
          <p className="text-sm text-ink-2">
            to continue to <span className="font-bold text-brand">SyllaTest PSU Academic AI</span>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {accounts.map((a) => (
            <button
              key={a.email}
              onClick={() => choose(a)}
              className="flex items-center gap-4 rounded-xl border border-line bg-white p-4 text-left transition-colors hover:border-brand hover:bg-brand-soft"
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full text-base font-bold text-white ${
                  a.tone === 'accent' ? 'bg-accent' : 'bg-brand'
                }`}
              >
                {a.name
                  .split(' ')
                  .filter((w) => !w.endsWith('.'))
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{a.name}</span>
                <span className="block text-[13px] text-ink-2">{a.email}</span>
              </span>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${
                  a.tone === 'accent' ? 'bg-accent/10 text-accent-dark' : 'bg-brand-soft text-brand'
                }`}
              >
                {a.badge}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/10 p-4">
          <CircleAlert size={20} className="shrink-0 text-accent-dark" />
          <p className="min-w-0 flex-1 text-[13px] font-medium leading-[1.4]">
            Access is restricted strictly to active{' '}
            <span className="font-bold text-accent-dark">@psu.edu.ph</span> faculty and
            administration domains.
          </p>
        </div>

        <hr className="border-line" />

        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/signin')}
            className="flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink"
          >
            <ArrowLeft size={16} />
            Cancel &amp; Go Back
          </button>
          <p className="text-xs text-slate-400">PSU SSO v1.4</p>
        </div>
      </div>
    </div>
  )
}
