import { createContext, useContext } from 'react'

export const AppStateContext = createContext(null)

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider')
  return ctx
}

// Set by SyllabusRoute when a feature screen is opened for one syllabus from its history list.
export const SyllabusContext = createContext(null)

/** The syllabus a feature screen was opened for, plus the feature it was opened from. */
export function useSyllabus() {
  const ctx = useContext(SyllabusContext)
  if (!ctx) throw new Error('useSyllabus must be used inside SyllabusRoute')
  return ctx
}
