import { useMemo, useState } from 'react'
import { AppStateContext } from './context.js'

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

export function AppStateProvider({ children }) {
  const [role, setRole] = useState('faculty') // faculty | chair | admin
  const [signedIn, setSignedIn] = useState(false)
  const [examConfig, setExamConfig] = useState(defaultExamConfig)
  const [tosLocked, setTosLocked] = useState(false)

  const value = useMemo(
    () => ({
      role,
      setRole,
      signedIn,
      setSignedIn,
      examConfig,
      setExamConfig,
      tosLocked,
      setTosLocked,
    }),
    [role, signedIn, examConfig, tosLocked],
  )
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
