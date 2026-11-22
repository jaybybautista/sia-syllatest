import { useState } from 'react'
import { Lock, Pencil, Plus, Trash2, TriangleAlert, UserRound } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Button, Card, Modal } from '../components/ui.jsx'
import { bloomTiers, bloomToneFor } from '../data/bloom.js'
import { useAppState } from '../state/context.js'

const field = 'w-full rounded-lg border border-line bg-white p-2.5 text-[13px] text-ink'
const label = 'text-[11px] font-bold uppercase text-ink-2'
const emptyDraft = { name: '', tier: 'mid', verbs: '', description: '' }

export default function BloomTaxonomy() {
  const { account, bloomLevels, saveBloomLevel, deleteBloomLevel } = useAppState()
  const [editing, setEditing] = useState(null) // null | level being added or edited
  const [deleting, setDeleting] = useState(null)
  const [touched, setTouched] = useState(false)

  const mine = bloomLevels.filter((l) => !l.standard)

  const name = editing?.name.trim() ?? ''
  const duplicate = bloomLevels.some(
    (l) => l.id !== editing?.id && l.name.toLowerCase() === name.toLowerCase(),
  )
  const error = !name
    ? 'Give the level a name.'
    : name.length > 40
      ? 'Keep the name under 40 characters.'
      : duplicate
        ? `“${name}” already exists in your taxonomy.`
        : null

  function openEditor(level) {
    setTouched(false)
    setEditing(level ?? { ...emptyDraft, id: null })
  }

  function save() {
    setTouched(true)
    if (error) return
    saveBloomLevel({
      id: editing.id ?? `custom-${Date.now().toString(36)}`,
      name,
      tier: editing.tier,
      verbs: editing.verbs.trim(),
      description: editing.description.trim(),
      standard: false,
    })
    setEditing(null)
  }

  return (
    <AppShell
      title="My Bloom's Taxonomy"
      subtitle="Standard levels are shared by everyone. Levels you add are private to your account and appear only on your own screens."
    >
      <Card className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] p-6">
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft">
            <UserRound size={20} className="text-brand" />
          </span>
          <div>
            <p className="text-base font-bold">
              {bloomLevels.length - mine.length} standard levels · {mine.length} added by you
            </p>
            <p className="text-[13px] text-ink-3">
              Your levels are saved to {account.name} ({account.email}) and no one else can see or use
              them. They appear in Verification tags, Question Bank filters, and as their own column in
              the TOS grid.
            </p>
          </div>
        </div>
        <Button variant="accent" icon={Plus} onClick={() => openEditor()}>
          Add Level
        </Button>
      </Card>

      <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-1">
        {bloomTiers.map((tier) => {
          const levels = bloomLevels.filter((l) => l.tier === tier.id)
          return (
            <Card key={tier.id} className="flex flex-col gap-4 rounded-[20px] p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-bold">{tier.label}</p>
                <p className="text-[11px] text-ink-3">{levels.length} levels</p>
              </div>
              <div className="flex flex-col gap-3">
                {levels.map((l) => (
                  <div key={l.id} className="flex flex-col gap-2 rounded-xl border border-line bg-white/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Badge className={bloomToneFor(l.name)}>{l.name}</Badge>
                      {l.standard ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-3">
                          <Lock size={11} /> Standard
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="mr-1 text-[11px] font-semibold text-violet-700">Only you</span>
                          <button
                            aria-label={`Edit ${l.name}`}
                            onClick={() => openEditor({ description: '', verbs: '', ...l })}
                            className="rounded-md p-1.5 text-ink-2 hover:bg-slate-100"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            aria-label={`Delete ${l.name}`}
                            onClick={() => setDeleting(l)}
                            className="rounded-md p-1.5 text-bad hover:bg-bad-bg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    {l.verbs && (
                      <p className="text-xs text-ink-2">
                        <span className="font-semibold text-ink-3">Verbs:</span> {l.verbs}
                      </p>
                    )}
                    {l.description && <p className="text-xs text-ink-3">{l.description}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      <p className="text-xs text-ink-3">
        A level&apos;s tier decides which share of the exam&apos;s cognitive mix it draws from: the
        TOS splits each tier&apos;s items evenly across the levels in it, so adding a level never
        changes the lower / middle / higher totals.
      </p>

      {editing && (
        <Modal
          title={editing.id ? `Edit “${editing.name || 'level'}”` : "Add a Bloom's level"}
          subtitle="Only you will see and use this level."
          onClose={() => setEditing(null)}
          width={520}
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={touched && Boolean(error)}>
                {editing.id ? 'Save Changes' : 'Add Level'}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={label} htmlFor="level-name">
                Level name
              </label>
              <input
                id="level-name"
                className={field}
                placeholder="e.g. Synthesize"
                value={editing.name}
                autoFocus
                onChange={(e) => setEditing((d) => ({ ...d, name: e.target.value }))}
                onBlur={() => setTouched(true)}
              />
              {touched && error && <p className="text-[11px] font-semibold text-bad">{error}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <p className={label}>Cognitive tier</p>
              <div className="flex gap-2 max-sm:flex-col" role="radiogroup" aria-label="Cognitive tier">
                {bloomTiers.map((t) => (
                  <button
                    key={t.id}
                    role="radio"
                    aria-checked={editing.tier === t.id}
                    onClick={() => setEditing((d) => ({ ...d, tier: t.id }))}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs ${
                      editing.tier === t.id
                        ? 'border-brand bg-brand-soft font-semibold text-brand'
                        : 'border-line bg-white font-medium text-ink-2'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={label} htmlFor="level-verbs">
                Action verbs
              </label>
              <input
                id="level-verbs"
                className={field}
                placeholder="combine, integrate, compose"
                value={editing.verbs}
                onChange={(e) => setEditing((d) => ({ ...d, verbs: e.target.value }))}
              />
              <p className="text-[11px] text-ink-3">Separate verbs with commas.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={label} htmlFor="level-description">
                Description (optional)
              </label>
              <textarea
                id="level-description"
                rows={2}
                className={field}
                placeholder="When to use this level in your outcomes and items."
                value={editing.description}
                onChange={(e) => setEditing((d) => ({ ...d, description: e.target.value }))}
              />
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal
          title={`Delete “${deleting.name}”?`}
          icon={TriangleAlert}
          tone="bad"
          onClose={() => setDeleting(null)}
          width={480}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                Keep Level
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteBloomLevel(deleting.id)
                  setDeleting(null)
                }}
              >
                Delete Level
              </Button>
            </>
          }
        >
          <p className="leading-[22px]">
            The level is removed from your dropdowns, filters and TOS grid. Anything you already
            tagged with it keeps the tag, marked as removed, until you choose another level.
          </p>
        </Modal>
      )}
    </AppShell>
  )
}
