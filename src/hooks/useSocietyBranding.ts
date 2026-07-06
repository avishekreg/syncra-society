import { useEffect, useState } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { restGet } from '../api/supabaseClient'
import type { Society } from '../types/db'
import { DEMO_SOCIETY_ID, isDemoSocietyId } from '../config/devSeed'

export function useSocietyBranding() {
  const { currentSocietyId, showcaseData, societyName: cachedName } = useAuth()
  const [societyName, setSocietyName] = useState<string | null>(cachedName ?? showcaseData?.society.name ?? null)

  useEffect(() => {
    if (cachedName) {
      setSocietyName(cachedName)
      return
    }
    if (showcaseData?.society.name) {
      setSocietyName(showcaseData.society.name)
      return
    }
    if (!currentSocietyId) {
      setSocietyName(null)
      return
    }
    if (isDemoSocietyId(currentSocietyId)) {
      setSocietyName('Windsor Castle RWA')
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const rows = await restGet<Society[]>(
          `societies?id=eq.${encodeURIComponent(currentSocietyId)}&select=name&limit=1`
        )
        if (!cancelled) {
          setSocietyName(rows?.[0]?.name ?? null)
        }
      } catch {
        if (!cancelled) setSocietyName(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [cachedName, currentSocietyId, showcaseData?.society.name])

  return {
    societyId: currentSocietyId,
    societyName: societyName ?? 'Your Society'
  }
}
