import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Clock, FileCheck, MessageSquare, Settings, XCircle } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Card } from '../components/ui.jsx'
import { notifications as seed } from '../data/mock.js'

const icons = { file: FileCheck, message: MessageSquare, clock: Clock, x: XCircle }

const toneStyles = {
  info: { card: 'bg-brand-soft border-blue-200', pill: 'bg-blue-500/10 text-brand', dot: 'bg-brand' },
  warn: { card: 'bg-warn-bg border-amber-200', pill: 'bg-amber-500/10 text-warn', dot: 'bg-accent' },
  bad: { card: 'bg-white border-line', pill: 'bg-red-500/10 text-bad', dot: 'bg-bad' },
}

const groups = ['Today', 'Earlier']

export default function Notifications() {
  const [items, setItems] = useState(seed)
  const unread = items.filter((n) => n.unread).length

  return (
    <AppShell
      title="Notification Center"
      subtitle="Pipeline events, reviewer comments, and compliance deadlines for your courses."
    >
      <div className="flex max-w-[640px] flex-col gap-6">
        <Card className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Bell size={20} className="text-brand" />
              <h2 className="text-lg font-bold">Notifications</h2>
              {unread > 0 && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setItems((ns) => ns.map((n) => ({ ...n, unread: false })))}
                disabled={unread === 0}
                className="text-[13px] font-semibold text-brand disabled:text-ink-3"
              >
                Mark all read
              </button>
              <Link to="/profile" aria-label="Notification settings">
                <Settings size={18} className="text-ink-2" />
              </Link>
            </div>
          </div>

          {groups.map((group) => {
            const groupItems = items.filter((n) => n.group === group)
            if (groupItems.length === 0) return null
            return (
              <div key={group} className="flex flex-col gap-3">
                <p className="text-xs font-bold uppercase text-slate-400">{group}</p>
                {groupItems.map((n) => {
                  const Icon = icons[n.icon]
                  const t = toneStyles[n.tone]
                  return (
                    <Link
                      key={n.id}
                      to={n.to}
                      onClick={() =>
                        setItems((ns) => ns.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))
                      }
                      className={`flex gap-3 rounded-xl border p-3.5 ${t.card} ${
                        n.unread ? '' : 'opacity-90'
                      }`}
                    >
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${t.pill}`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[13px] ${n.unread ? 'font-bold' : 'font-semibold'}`}
                          >
                            {n.title}
                          </span>
                          {n.unread && <span className={`size-1.5 rounded-full ${t.dot}`} />}
                        </span>
                        <span className="mt-1 block text-xs leading-[1.4] text-ink-2">
                          {n.bold && <span className="font-bold">{n.bold}</span>}
                          {n.body}
                        </span>
                        <span className="mt-1 block text-[11px] text-slate-400">{n.when}</span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </Card>
      </div>
    </AppShell>
  )
}
