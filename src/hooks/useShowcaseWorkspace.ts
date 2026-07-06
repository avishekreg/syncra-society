import { useEffect } from 'react'
import { useAuth, type ShowcaseData } from '../providers/AuthProvider'

export function emptyShowcase(societyId: string, name = 'My Society'): ShowcaseData {
  return {
    society: {
      id: societyId,
      name,
      subscription: 'Trial',
      totalFlats: 0
    },
    units: [],
    defaulters: [],
    ledgerEntries: []
  }
}

/** Ensures showcase state exists for society-scoped workspace pages. */
export function useShowcaseWorkspace() {
  const { showcaseData, user, setShowcaseData, currentSocietyId } = useAuth()

  useEffect(() => {
    if (!showcaseData && currentSocietyId && setShowcaseData) {
      setShowcaseData(emptyShowcase(currentSocietyId))
    }
  }, [showcaseData, currentSocietyId, setShowcaseData])

  const workingShowcase =
    showcaseData ?? (currentSocietyId ? emptyShowcase(currentSocietyId) : null)

  return { user, workingShowcase, currentSocietyId, setShowcaseData }
}
