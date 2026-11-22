import { Fragment, useEffect, useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { SyllabusContext, useAppState } from '../state/context.js'
import { features } from '../data/features.js'

/**
 * Opens a feature screen for the syllabus named in the URL. An unknown id (a deleted or mistyped
 * link) goes back to that feature's history list instead of rendering an empty screen.
 */
export default function SyllabusRoute({ feature, children }) {
  const { syllabusId } = useParams()
  const { syllabi, setActiveSyllabusId } = useAppState()
  const syllabus = syllabi.find((s) => s.id === syllabusId)
  const found = Boolean(syllabus)

  useEffect(() => {
    if (found) setActiveSyllabusId(syllabusId)
  }, [found, syllabusId, setActiveSyllabusId])

  const value = useMemo(
    () => (syllabus ? { syllabus, featureKey: feature, feature: features[feature] } : null),
    [syllabus, feature],
  )

  if (!syllabus) return <Navigate to={features[feature].path} replace />

  return (
    <SyllabusContext.Provider value={value}>
      {/* Keyed so switching syllabus resets the screen's local edits instead of carrying them over. */}
      <Fragment key={syllabus.id}>{children}</Fragment>
    </SyllabusContext.Provider>
  )
}
