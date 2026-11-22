import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppStateContext } from './context.js'
import { accountByRole } from '../data/mock.js'
import { orderLevels, standardBloom } from '../data/bloom.js'
import { seedSyllabi } from '../data/syllabi.js'

const defaultExamConfig = {
  examType: 'Midterm Diagnostic Examination',
  weighting: 'Combined (Lecture 60% + Lab 40%)',
  translation: 'English & Filipino Dual Mode',
  items: 50,
  duration: 60,
  // Chapters included in the exam; the TOS allocates across these only.
  chapters: [1, 2, 3, 4],
  mix: { lower: 30, mid: 50, higher: 20 },
}

// Bloom levels a user adds are stored per account email, so they only ever appear for the person
// who created them. The prototype has no backend, so they live in this browser's storage.
const bloomStorageKey = 'syllatest.customBloom.v1'

function loadCustomBloom() {
  try {
    const parsed = JSON.parse(localStorage.getItem(bloomStorageKey) ?? '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

const noLevels = []

export function AppStateProvider({ children }) {
  const [role, setRole] = useState('faculty') // faculty | chair | admin
  const [signedIn, setSignedIn] = useState(false)
  const [examConfig, setExamConfig] = useState(defaultExamConfig)
  const [syllabi, setSyllabi] = useState(seedSyllabi)
  // The syllabus most recently opened from a history list; flow screens that are not tied to a
  // list (exam setup, generation) use it to route back to the right syllabus.
  const [activeSyllabusId, setActiveSyllabusId] = useState(null)
  const [customBloom, setCustomBloom] = useState(loadCustomBloom)

  useEffect(() => {
    try {
      localStorage.setItem(bloomStorageKey, JSON.stringify(customBloom))
    } catch {
      // Storage can be unavailable (private mode, blocked site data); levels then last the session.
    }
  }, [customBloom])

  const account = accountByRole[role]
  const myLevels = customBloom[account.email] ?? noLevels
  const bloomLevels = useMemo(() => orderLevels([...standardBloom, ...myLevels]), [myLevels])

  const updateSyllabus = useCallback((id, patch) => {
    setSyllabi((list) =>
      list.map((s) => (s.id === id ? { ...s, ...(typeof patch === 'function' ? patch(s) : patch) } : s)),
    )
  }, [])

  const addSyllabus = useCallback((record) => setSyllabi((list) => [record, ...list]), [])

  const saveBloomLevel = useCallback(
    (level) => {
      setCustomBloom((all) => {
        const mine = all[account.email] ?? []
        const exists = mine.some((l) => l.id === level.id)
        return {
          ...all,
          [account.email]: exists ? mine.map((l) => (l.id === level.id ? level : l)) : [...mine, level],
        }
      })
    },
    [account.email],
  )

  const deleteBloomLevel = useCallback(
    (id) => {
      setCustomBloom((all) => ({
        ...all,
        [account.email]: (all[account.email] ?? []).filter((l) => l.id !== id),
      }))
    },
    [account.email],
  )

  const value = useMemo(
    () => ({
      role,
      setRole,
      account,
      signedIn,
      setSignedIn,
      examConfig,
      setExamConfig,
      syllabi,
      updateSyllabus,
      addSyllabus,
      activeSyllabusId,
      setActiveSyllabusId,
      bloomLevels,
      saveBloomLevel,
      deleteBloomLevel,
    }),
    [
      role,
      account,
      signedIn,
      examConfig,
      syllabi,
      updateSyllabus,
      addSyllabus,
      activeSyllabusId,
      bloomLevels,
      saveBloomLevel,
      deleteBloomLevel,
    ],
  )
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
