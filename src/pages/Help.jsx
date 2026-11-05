import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  FileCheck,
  LifeBuoy,
  Search,
  Table,
  TriangleAlert,
  UploadCloud,
} from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Button, Card } from '../components/ui.jsx'
import {
  aiProviders,
  chair,
  helpCategories,
  helpTopics,
  recentArticles,
  user,
} from '../data/mock.js'
import { useAppState } from '../state/context.js'

const icons = { upload: UploadCloud, table: Table, fileCheck: FileCheck, alert: TriangleAlert }

const accountByRole = { faculty: user, chair, admin: { name: 'ICT Systems Admin' } }
const primary = aiProviders[0]

export default function Help() {
  const { role } = useAppState()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(null)

  // Greeting follows the signed-in account rather than hard-coding the faculty name.
  const firstName = accountByRole[role].name.replace(/^(Dr|Prof|Engr)\.\s*/, '').split(' ')[0]

  const q = query.trim().toLowerCase()
  const categories = q
    ? helpCategories.filter(
        (c) => c.title.toLowerCase().includes(q) || c.body.toLowerCase().includes(q),
      )
    : helpCategories
  const articles = q
    ? recentArticles.filter((a) => a.title.toLowerCase().includes(q))
    : recentArticles
  const faqs = q
    ? helpTopics.filter(
        (t) => t.q.toLowerCase().includes(q) || t.a.toLowerCase().includes(q),
      )
    : []

  return (
    <AppShell
      title="Help & Support Portal"
      subtitle="Search articles, guides, and system compliance instructions"
    >
      <div className="flex flex-col gap-4 rounded-2xl bg-brand p-8">
        <p className="text-2xl font-bold text-white">
          How can we help you today, {accountByRole[role].name.startsWith('Dr') ? 'Dr. ' : ''}
          {firstName}?
        </p>
        <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3">
          <Search size={20} className="shrink-0 text-ink-3" />
          <label className="sr-only" htmlFor="help-search">
            Search help
          </label>
          <input
            id="help-search"
            className="min-w-0 flex-1 text-[15px] outline-none placeholder:text-slate-400"
            placeholder="Search syllabus extraction, Bloom's Revised Taxonomy, CHED audit templates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-1 gap-6 max-xl:flex-col">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <h2 className="text-lg font-bold">
            {q ? `Results for "${query}"` : 'Getting Started Categories'}
          </h2>

          {categories.length === 0 && faqs.length === 0 && articles.length === 0 && (
            <Card className="p-6 text-[13px] text-ink-3">
              Nothing matched that search. Try a broader term, or contact the help desk.
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            {categories.map((c) => {
              const Icon = icons[c.icon]
              return (
                <Link
                  key={c.title}
                  to={c.to}
                  className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5 hover:border-brand"
                >
                  <Icon size={24} className="text-brand" />
                  <p className="text-base font-bold">{c.title}</p>
                  <p className="text-[13px] leading-[1.4] text-ink-2">{c.body}</p>
                </Link>
              )
            })}
          </div>

          {faqs.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-bold">Answers</h2>
              {faqs.map((t) => (
                <div key={t.q} className="rounded-xl border border-line bg-white">
                  <button
                    onClick={() => setOpen(open === t.q ? null : t.q)}
                    aria-expanded={open === t.q}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left"
                  >
                    <span className="text-[13px] font-semibold">{t.q}</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-ink-3 transition-transform ${
                        open === t.q ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {open === t.q && (
                    <p className="border-t border-line p-4 text-[13px] leading-[1.5] text-ink-2">
                      {t.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex w-[380px] shrink-0 flex-col gap-5 max-xl:w-full">
          <Card className="flex flex-1 flex-col gap-4 rounded-xl border-line bg-white p-5">
            <p className="text-[15px] font-bold">Recent Articles</p>
            <div className="flex flex-col gap-3">
              {articles.map((a) => (
                <Link
                  key={a.title}
                  to={a.to}
                  className="text-[13px] font-semibold text-brand underline underline-offset-2"
                >
                  {a.title}
                </Link>
              ))}
              {articles.length === 0 && (
                <p className="text-[13px] text-ink-3">No articles match that search.</p>
              )}
            </div>
          </Card>

          <div className="flex flex-col gap-4 rounded-xl border border-brand/20 bg-brand-soft p-5">
            <div className="flex items-center gap-2">
              <LifeBuoy size={18} className="text-brand" />
              <p className="text-[15px] font-bold text-brand">Faculty Help Desk</p>
            </div>
            <p className="text-[13px] leading-[1.4] text-ink-2">
              Our local university IT support is available Mon-Fri 8:00 AM - 5:00 PM for CHED
              compliance audits.
            </p>
            <Button
              className="self-start"
              onClick={() => {
                window.location.href = 'mailto:ict-support@psu.edu.ph?subject=SyllaTest%20support'
              }}
            >
              Contact PSU Support
            </Button>
          </div>

          <Card className="flex flex-col gap-3 rounded-xl border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-ink-2">System Status</p>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <p className="text-[13px] font-semibold text-ok">All Operational</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              {primary.name.split(' (')[0]} request latency: {primary.latency}
            </p>
            <p className="text-[11px] text-slate-400">
              Average syllabus parse: 12s end-to-end
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
