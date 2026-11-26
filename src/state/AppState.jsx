import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppStateContext } from './context.js'
import { accountByEmail } from '../data/accounts.js'
import { seedActivity } from '../data/activity.js'
import { orderLevels, standardBloom } from '../data/bloom.js'
import { seedSyllabi } from '../data/syllabi.js'

const defaultExamConfig = {
  examType: 'Midterm Diagnostic Examination',
  weighting: 'Combined (Lecture 60% + Lab 40%)',
  translation: 'English & Filipino Dual Mode',
  items: 50,
  duration: 60,
  // Chapters included in the exam (null = all of them); the TOS allocates across these only.
  chapters: null,
  mix: { lower: 30, mid: 50, higher: 20 },
}

// There is no backend, so the app keeps its records in this browser's storage: the signed-in
// account, the syllabi and everything done to them, and each user's own Bloom's levels. Storage
// can be unavailable (private mode, blocked site data); the app then works for the session only.
const keys = {
  session: 'syllatest.session.v1',
  data: 'syllatest.data.v1',
  bloom: 'syllatest.customBloom.v1',
}

function load(key, fallback, isValid) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    const parsed = JSON.parse(raw)
    return isValid(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // See above: without storage the data lasts until the tab closes.
  }
}

const freshData = () => ({
  syllabi: seedSyllabi,
  examConfig: defaultExamConfig,
  activity: seedActivity(seedSyllabi),
})

const isData = (d) =>
  d && Array.isArray(d.syllabi) && Array.isArray(d.activity) && d.examConfig && typeof d.examConfig === 'object'
const isObject = (o) => o && typeof o === 'object' && !Array.isArray(o)

const noLevels = []

export function AppStateProvider({ children }) {
  const [accountEmail, setAccountEmail] = useState(() =>
    load(keys.session, null, (e) => typeof e === 'string' && e in accountByEmail),
  )
  const [data, setData] = useState(() => {
    const stored = load(keys.data, null, isData)
    if (!stored) return freshData()
    // Data saved before "all chapters" became the default kept the old fixed 1–4 selection.
    if (JSON.stringify(stored.examConfig.chapters) === '[1,2,3,4]') stored.examConfig.chapters = null
    return stored
  })
  // The syllabus most recently opened from a history list; flow screens that are not tied to a
  // list (exam setup, generation) use it to route back to the right syllabus.
  const [activeSyllabusId, setActiveSyllabusId] = useState(null)
  const [customBloom, setCustomBloom] = useState(() => load(keys.bloom, {}, isObject))

  useEffect(() => save(keys.session, accountEmail), [accountEmail])
  useEffect(() => save(keys.data, data), [data])
  useEffect(() => save(keys.bloom, customBloom), [customBloom])

  const account = accountEmail ? accountByEmail[accountEmail] : null
  const role = account?.role ?? null
  // The syllabus that exam setup and generation work on: the one last opened, else the user's newest.
  const activeSyllabus = useMemo(() => {
    const list = data.syllabi
    const own = account ? list.filter((s) => s.instructor === account.name || s.uploadedBy === account.name) : []
    return (
      list.find((s) => s.id === activeSyllabusId) ??
      [...(own.length ? own : list)].sort((a, b) => b.uploadedOn.localeCompare(a.uploadedOn))[0]
    )
  }, [data.syllabi, activeSyllabusId, account])
  const myLevels = (account && customBloom[account.email]) ?? noLevels
  const bloomLevels = useMemo(() => orderLevels([...standardBloom, ...myLevels]), [myLevels])

  const signIn = useCallback((email) => setAccountEmail(email), [])
  const signOut = useCallback(() => {
    setAccountEmail(null)
    setActiveSyllabusId(null)
  }, [])

  const actorName = account?.name ?? 'Unknown user'

  /** Adds an entry to the activity log. `ai: true` marks work done by the AI rather than a person. */
  const logActivity = useCallback(
    (entry) => {
      const at = new Date().toISOString()
      setData((d) => ({
        ...d,
        activity: [
          { id: `${Date.now().toString(36)}-${d.activity.length}`, at, actor: entry.ai ? 'SyllaTest AI' : actorName, ...entry },
          ...d.activity,
        ],
      }))
    },
    [actorName],
  )

  const updateSyllabus = useCallback((id, patch) => {
    setData((d) => ({
      ...d,
      syllabi: d.syllabi.map((s) =>
        s.id === id
          ? { ...s, ...(typeof patch === 'function' ? patch(s) : patch), updatedOn: new Date().toISOString() }
          : s,
      ),
    }))
  }, [])

  const addSyllabus = useCallback((record) => setData((d) => ({ ...d, syllabi: [record, ...d.syllabi] })), [])

  const setExamConfig = useCallback(
    (next) => setData((d) => ({ ...d, examConfig: typeof next === 'function' ? next(d.examConfig) : next })),
    [],
  )

  /** Puts the syllabi, exam setup and activity back to the demo's starting point. */
  const resetDemoData = useCallback(() => {
    setData(freshData())
    setActiveSyllabusId(null)
  }, [])

  const saveBloomLevel = useCallback(
    (level) => {
      if (!account) return
      setCustomBloom((all) => {
        const mine = all[account.email] ?? []
        const exists = mine.some((l) => l.id === level.id)
        return {
          ...all,
          [account.email]: exists ? mine.map((l) => (l.id === level.id ? level : l)) : [...mine, level],
        }
      })
    },
    [account],
  )

  const deleteBloomLevel = useCallback(
    (id) => {
      if (!account) return
      setCustomBloom((all) => ({
        ...all,
        [account.email]: (all[account.email] ?? []).filter((l) => l.id !== id),
      }))
    },
    [account],
  )

  const value = useMemo(
    () => ({
      account,
      role,
      signedIn: Boolean(account),
      signIn,
      signOut,
      examConfig: data.examConfig,
      setExamConfig,
      syllabi: data.syllabi,
      activity: data.activity,
      updateSyllabus,
      addSyllabus,
      logActivity,
      resetDemoData,
      activeSyllabusId,
      setActiveSyllabusId,
      activeSyllabus,
      bloomLevels,
      saveBloomLevel,
      deleteBloomLevel,
    }),
    [
      account,
      role,
      signIn,
      signOut,
      data,
      setExamConfig,
      updateSyllabus,
      addSyllabus,
      logActivity,
      resetDemoData,
      activeSyllabusId,
      activeSyllabus,
      bloomLevels,
      saveBloomLevel,
      deleteBloomLevel,
    ],
  )
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
