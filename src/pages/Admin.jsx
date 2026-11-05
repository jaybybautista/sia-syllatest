import { useState } from 'react'
import { CheckCircle2, Circle, ShieldCheck, Users, X } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Button, Card, Modal } from '../components/ui.jsx'
import {
  aiProviders,
  auditLog,
  authorityClaims,
  bloomLevels,
  claimsByRole,
  deadlines,
  monthlyTokenLimit,
  systemRoles,
  timingTemplates,
} from '../data/mock.js'

function Drawer({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-navy-900/40"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex w-[420px] max-w-full flex-col gap-5 overflow-y-auto border-l border-white/40 bg-white/95 p-6 shadow-[-8px_0_32px_rgba(15,23,42,0.12)] backdrop-blur-[12px]">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-bold">{title}</p>
          <button aria-label="Close" onClick={onClose}>
            <X size={16} className="text-ink-3" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Spec({ label, value, tone = 'text-ink' }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-ink-2">{label}</p>
      <p className={`text-right font-semibold ${tone}`}>{value}</p>
    </div>
  )
}
const fieldClass = 'w-full rounded-[10px] border border-white/40 bg-white/70 p-2.5 text-[13px] text-ink'
const fieldLabel = 'text-[11px] font-bold text-ink-2'

// Cognitive mapping is constrained to the revised taxonomy levels the rest of the product uses,
// singly or as an adjacent pair, so a template cannot name a level no screen can render.
const mappingOptions = [
  ...bloomLevels,
  ...bloomLevels.slice(0, -1).map((level, i) => `${level}/${bloomLevels[i + 1]}`),
]

const yearLevels = [
  'Freshman (1st Yr)',
  'Sophomore (2nd Yr)',
  'Junior (3rd Yr)',
  'Senior (4th Yr)',
]

export default function Admin() {
  const [provider, setProvider] = useState(aiProviders[0].id)
  const [quota, setQuota] = useState('5,000,000')
  const [cost, setCost] = useState('0.12')
  const [templates, setTemplates] = useState(timingTemplates)
  const [editing, setEditing] = useState(null)
  const [managingRoles, setManagingRoles] = useState(false)
  // A new question type starts from the multiple-choice row so every column has a sane value, and
  // opens straight into the editor rather than landing as an empty row.
  function addTemplate() {
    const draft = {
      ...timingTemplates[0],
      type: `New Question Type ${templates.length + 1}`,
      label: `New Question Type ${templates.length + 1}`,
    }
    setTemplates((ts) => [...ts, draft])
    setEditing(draft)
  }

  const [roles, setRoles] = useState(systemRoles)
  const [saved, setSaved] = useState(false)
  const [providerDrawer, setProviderDrawer] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [tested, setTested] = useState(null)

  const active = aiProviders.find((p) => p.id === provider)

  if (saved) {
    return (
      <AppShell
        title="System & AI Administrative Center"
        subtitle="Administrative actions saved successfully. Integrity logs updated."
      >
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="flex w-full max-w-[640px] flex-col gap-6 rounded-3xl p-10 shadow-[0_16px_32px_rgba(15,23,42,0.12)]">
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                <CheckCircle2 size={28} className="text-white" />
              </span>
              <div>
                <p className="text-xl font-bold">Master Configuration Saved</p>
                <p className="text-[13px] font-semibold text-ok">
                  All automated validations passed with zero compliance alerts.
                </p>
              </div>
            </div>
            <hr className="border-line" />
            <div className="flex flex-col gap-4">
              <p className="text-[11px] font-bold text-ink-3">
                INTEGRITY LOG &amp; CHANGE REPORT SUMMARY
              </p>
              <div className="flex flex-col gap-3 rounded-xl border border-white/40 bg-white p-4 text-[13px]">
                <Spec label="Master Change ID" value="#AUD-8832-PSU" />
                <Spec label="Effective Time" value={`Immediate (${deadlines[0].date}, 10:14 AM)`} />
                <Spec label="Affected Departments" value="All (Main campus nodes)" tone="text-brand" />
                <Spec label="Rollback Version Point" value="v3.5.8-rollback" tone="text-accent-dark" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {[
                'Token quotas verified against institutional bounds',
                'API keys validated against cloud cognitive gateways',
              ].map((v) => (
                <div key={v} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-ok" />
                  <p className="text-xs text-ink-2">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <Button
                variant="ghost"
                className="flex-1 border-bad text-bad"
                onClick={() => {
                  setProvider(aiProviders[0].id)
                  setSaved(false)
                }}
              >
                Rollback Configuration
              </Button>
              <Button className="flex-1" onClick={() => setSaved(false)}>
                Return to Controls
              </Button>
            </div>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="System & AI Administrative Center"
      subtitle="Configure model provider targets, quota caps, token cost rules, timing profiles, and Bloom verb taxonomies."
    >
      <div className="flex min-h-0 flex-1 gap-5 max-xl:flex-col">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <Card className="flex flex-col gap-5 rounded-[20px] p-6">
            <p className="text-[15px] font-bold">ACTIVE AI PARSING ENGINE</p>
            <div className="flex items-center gap-4 rounded-xl border border-brand/20 bg-brand-soft p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-brand">{active.name}</p>
                <p className="text-xs text-ink-2">{active.note}</p>
              </div>
              <Badge tone="info">ACTIVE</Badge>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <p className={fieldLabel}>SWITCH PARSING ENGINE</p>
                <button
                  onClick={() => setProviderDrawer(true)}
                  className="text-[11px] font-semibold text-brand hover:underline"
                >
                  Open target settings
                </button>
              </div>
              <select
                id="provider"
                className={fieldClass}
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                {aiProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-ink-3">
                Changing the engine affects new parsing jobs only. Existing drafts keep the engine
                that produced them.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabel} htmlFor="quota">
                  MAX TOKENS PER COLLEGE / MO
                </label>
                <div className="flex items-center gap-2 rounded-[10px] border border-white/40 bg-white/70 p-2.5">
                  <input
                    id="quota"
                    className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
                    value={quota}
                    onChange={(e) => setQuota(e.target.value)}
                  />
                  <span className="text-[11px] font-semibold text-ink-3">TOKENS</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabel} htmlFor="cost">
                  COMPUTED COST RECOVERY TARGET
                </label>
                <div className="flex items-center gap-2 rounded-[10px] border border-white/40 bg-white/70 p-2.5">
                  <span className="text-[13px] text-ink-3">₱</span>
                  <input
                    id="cost"
                    className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                  <span className="text-[11px] font-semibold text-ink-3">PER TOS DRAFT</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-5 rounded-[20px] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[15px] font-bold">QUESTION TIME ESTIMATOR TEMPLATE</p>
                <p className="text-xs text-ink-3">
                  Governs auto-generated duration projections based on taxonomical classification.
                </p>
              </div>
              <Button className="px-3 py-1.5 text-xs" onClick={addTemplate}>
                + New Question Type
              </Button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr className="bg-brand-soft text-[11px] font-bold text-brand">
                    <th className="w-[200px] p-3 px-5 font-bold">QUESTION TYPE</th>
                    <th className="p-3 px-5 font-bold">BASE DURATION</th>
                    <th className="w-[160px] p-3 px-5 font-bold">DIFFICULTY SCALE</th>
                    <th className="w-[160px] p-3 px-5 font-bold">YEAR-LEVEL PRESET</th>
                    <th className="w-[140px] p-3 px-5 font-bold">REVIEW BUFFER</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr
                      key={t.type}
                      onClick={() => setEditing(t)}
                      className="cursor-pointer border-b border-line bg-white last:border-b-0 hover:bg-brand-soft/40"
                    >
                      <td className="p-4 px-5 text-sm font-semibold">{t.label ?? t.type}</td>
                      <td className="p-4 px-5">
                        <span className="inline-block rounded-md border border-line px-3 py-1.5 text-[13px]">
                          {t.minutes.toFixed(1)} Minutes
                        </span>
                      </td>
                      <td className="p-4 px-5 text-[13px] font-semibold text-accent">
                        {t.scale.toFixed(1)}x ({t.mapping})
                      </td>
                      <td className="p-4 px-5 text-[13px] text-ink-2">{t.yearLevel}</td>
                      {/* Figma painted every buffer green, which reads as a status rather than a
                          value; the buffer is just a number, so it is not toned. */}
                      <td className="p-4 px-5 text-[13px] font-semibold">+{t.bufferSecs} secs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <p className="text-xs text-ink-3">
                Changes apply to new examinations and to generated tables of specifications. Exams
                already locked keep the template they were built with.
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setTemplates(timingTemplates)}>
                  Reset Defaults
                </Button>
                <Button onClick={() => setSaved(true)}>Save Timing Template</Button>
              </div>
            </div>
          </Card>

          <Card className="flex items-center justify-between gap-4 rounded-[20px] p-6">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-brand" />
              <div>
                <p className="text-[15px] font-bold">USER ROLES &amp; ACCESS</p>
                <p className="text-xs text-ink-3">
                  {roles.length} accounts across the College of Computing Sciences
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setManagingRoles(true)}>
              Manage roles
            </Button>
          </Card>
        </div>

        <Card className="flex w-[400px] shrink-0 flex-col gap-5 rounded-[20px] p-5 max-xl:w-full">
          <p className="text-sm font-bold">SYSTEM SECURITY &amp; COMPLIANCE</p>
          <div className="flex flex-col gap-2 rounded-xl bg-ok-bg p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-ok" />
              <p className="text-[13px] font-bold text-ok">Google App Check Active</p>
            </div>
            <p className="text-[11px] text-ink-2">
              System endpoints validated. Unofficial API handshakes blocked.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold text-ink-2">LIVE SYSTEM AUDIT LOG</p>
            {auditLog.map((l) => (
              <div
                key={l.detail}
                className="flex flex-col gap-1.5 rounded-xl border border-white/40 bg-white/70 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold">{l.source}</p>
                  <p className="text-[10px] text-ink-3">{l.when}</p>
                </div>
                <p className="text-[11px] text-ink-2">{l.detail}</p>
                <p className="text-[10px] font-semibold text-brand">{l.status}</p>
              </div>
            ))}
          </div>

          <hr className="border-line" />
          <Button className="w-full" onClick={() => setSaved(true)}>
            Save Master Configuration
          </Button>
        </Card>
      </div>

      {editing && (
        <Modal
          title={`Edit ${editing.type} estimator`}
          onClose={() => setEditing(null)}
          width={480}
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setTemplates((ts) =>
                    ts.map((t) => (t.type === editing.type ? editing : t)),
                  )
                  setEditing(null)
                }}
              >
                Save template
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={fieldLabel} htmlFor="minutes">
                TARGET DURATION (MINUTES PER ITEM)
              </label>
              <input
                id="minutes"
                type="number"
                step="0.1"
                min="0.5"
                className="w-full rounded-md border border-line bg-white p-3 text-[13px]"
                value={editing.minutes}
                onChange={(e) => setEditing({ ...editing, minutes: Number(e.target.value) })}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <label className={fieldLabel} htmlFor="scale">
                  DIFFICULTY SCALE
                </label>
                <input
                  id="scale"
                  type="number"
                  step="0.1"
                  min="1"
                  className="w-full rounded-md border border-line bg-white p-3 text-[13px]"
                  value={editing.scale}
                  onChange={(e) => setEditing({ ...editing, scale: Number(e.target.value) })}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <label className={fieldLabel} htmlFor="buffer">
                  REVIEW BUFFER (SECONDS PER ITEM)
                </label>
                <input
                  id="buffer"
                  type="number"
                  step="5"
                  min="0"
                  className="w-full rounded-md border border-line bg-white p-3 text-[13px]"
                  value={editing.bufferSecs}
                  onChange={(e) => setEditing({ ...editing, bufferSecs: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={fieldLabel} htmlFor="mapping">
                COGNITIVE MAPPING
              </label>
              <select
                id="mapping"
                className="w-full rounded-md border border-line bg-white p-3 text-[13px]"
                value={editing.mapping}
                onChange={(e) => setEditing({ ...editing, mapping: e.target.value })}
              >
                {mappingOptions.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={fieldLabel} htmlFor="yearLevel">
                YEAR-LEVEL PRESET
              </label>
              <select
                id="yearLevel"
                className="w-full rounded-md border border-line bg-white p-3 text-[13px]"
                value={editing.yearLevel}
                onChange={(e) => setEditing({ ...editing, yearLevel: e.target.value })}
              >
                {yearLevels.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-ink-3">
              Exam configuration reads the multiple-choice row to check that the requested item count
              fits the examination window, including {editing.bufferSecs} seconds of review time per
              item.
            </p>
          </div>
        </Modal>
      )}

      {managingRoles && (
        <Modal
          title="User roles & access"
          onClose={() => setManagingRoles(false)}
          width={620}
          footer={<Button onClick={() => setManagingRoles(false)}>Done</Button>}
        >
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="bg-slate-100 text-[11px] font-bold text-ink-3">
                  <th className="p-3 font-bold">NAME</th>
                  <th className="p-3 font-bold">COLLEGE</th>
                  <th className="w-[180px] p-3 font-bold">ROLE</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.email} className="border-b border-line last:border-b-0">
                    <td className="p-3">
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-[11px] text-ink-3">{r.email}</p>
                    </td>
                    <td className="p-3 text-ink-2">{r.college}</td>
                    <td className="p-3">
                      <button
                        onClick={() =>
                          setEditingUser({ ...r, claims: claimsByRole[r.role] ?? [], limit: monthlyTokenLimit })
                        }
                        className="w-full rounded-md border border-line bg-white p-2 text-left text-xs font-semibold text-brand"
                      >
                        {r.role} · Edit claims
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {providerDrawer && (
        <Drawer title="COGNITIVE TARGET SETTINGS" onClose={() => setProviderDrawer(false)}>
          <div className="flex flex-col gap-3 rounded-xl border border-white/40 bg-white p-4">
            <p className="text-[11px] font-bold text-ink-3">ACTIVE SERVICE TARGET</p>
            <p className="text-base font-bold text-brand">{active.name}</p>
            {active.zeroTraining && (
              <div className="flex items-center gap-2 border-y border-emerald-600 py-2">
                <ShieldCheck size={16} className="text-ok" />
                <p className="text-xs font-bold text-ok">Zero Data Training Policy Active</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3.5 text-[13px]">
            <Spec label="Service Region" value={active.region} />
            <Spec label="Target Latency" value={active.latency} tone="text-brand" />
            <Spec
              label="Token Cost Ratio"
              value={
                active.costPer1k === 0
                  ? 'No metered cost'
                  : `${active.costPer1k.toFixed(2)} per 1K tokens`
              }
              tone="text-accent-dark"
            />
            <Spec label="Fallback Order" value={active.priority} />
            <div className="flex items-center justify-between">
              <p className="text-ink-2">Health Diagnostics</p>
              <Badge tone="ok">{active.uptime} ONLINE</Badge>
            </div>
          </div>

          {tested && (
            <div className="rounded-lg bg-ok-bg p-3 text-xs font-semibold text-ok">
              Connection verified — {tested} round trip.
            </div>
          )}

          <hr className="border-line" />
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1 border-brand/20 text-brand"
              onClick={() => setTested(active.latency)}
            >
              Test Connection
            </Button>
            <Button className="flex-1" onClick={() => setProviderDrawer(false)}>
              Save Selection
            </Button>
          </div>
        </Drawer>
      )}

      {editingUser && (
        <Drawer title="EDIT ACCOUNT CLAIMS" onClose={() => setEditingUser(null)}>
          <div className="flex items-center gap-3 rounded-xl border border-white/40 bg-white p-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {editingUser.name
                .split(' ')
                .filter((w) => !w.endsWith('.'))
                .slice(0, 2)
                .map((w) => w[0])
                .join('')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{editingUser.name}</p>
              <p className="truncate text-xs text-ink-3">{editingUser.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold text-ink-3">AUTHORITY LEVEL CLAIMS</p>
            {authorityClaims.map((claim) => {
              const granted = editingUser.claims.includes(claim)
              return (
                <button
                  key={claim}
                  onClick={() =>
                    setEditingUser((u) => ({
                      ...u,
                      claims: granted ? u.claims.filter((c) => c !== claim) : [...u.claims, claim],
                    }))
                  }
                  className="flex items-center justify-between rounded-lg border border-white/40 bg-white p-3"
                >
                  <span className="flex items-center gap-2.5">
                    {granted ? (
                      <CheckCircle2 size={16} className="text-ok" />
                    ) : (
                      <Circle size={16} className="text-ink-3" />
                    )}
                    <span
                      className={`text-[13px] ${granted ? 'font-semibold' : 'font-medium text-ink-2'}`}
                    >
                      {claim}
                    </span>
                  </span>
                  <span className={`text-xs font-bold ${granted ? 'text-ok' : 'text-ink-3'}`}>
                    {granted ? 'GRANTED' : 'REVOKED'}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-ink-3" htmlFor="userLimit">
              INDIVIDUAL TOKEN LIMIT / MO
            </label>
            <input
              id="userLimit"
              className="w-full rounded-lg border border-white/40 bg-white p-3 text-[13px]"
              value={editingUser.limit.toLocaleString()}
              onChange={(e) =>
                setEditingUser((u) => ({
                  ...u,
                  limit: Number(e.target.value.replace(/[^0-9]/g, '')) || 0,
                }))
              }
            />
          </div>

          <hr className="border-line" />
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1 border-bad text-bad"
              onClick={() => setEditingUser(null)}
            >
              Suspend User
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setRoles((rs) =>
                  rs.map((x) =>
                    x.email === editingUser.email
                      ? {
                          ...x,
                          role: editingUser.claims.includes('System Administrator')
                            ? 'Administrator'
                            : editingUser.claims.includes('Department Chair')
                              ? 'Department Chair'
                              : 'Faculty',
                        }
                      : x,
                  ),
                )
                setEditingUser(null)
              }}
            >
              Update Claims
            </Button>
          </div>
        </Drawer>
      )}

   </AppShell>
  )
}
