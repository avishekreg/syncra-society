import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import {
  listFeatureToggles,
  setFeatureToggle,
  subscribeFeatureToggles,
  type FeatureToggleRow
} from '../api/featureToggles'
import { FEATURE_MODULE_CATALOG, type FeatureModuleName } from '../lib/featureModules'
import { useAuth } from './AuthProvider'

type FeatureFlagsContextValue = {
  societyId: string | null
  loading: boolean
  toggles: FeatureToggleRow[]
  /** True only when the active society's matrix has the module enabled. */
  isEnabled: (moduleName: FeatureModuleName | string) => boolean
  refresh: () => Promise<void>
  setEnabled: (moduleName: FeatureModuleName, isEnabled: boolean) => Promise<void>
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null)

export function FeatureFlagsProvider({
  children,
  societyIdOverride = null
}: {
  children: ReactNode
  /** Super Admin control panel may bind a selected society (never global). */
  societyIdOverride?: string | null
}) {
  const { currentSocietyId } = useAuth()
  const societyId = societyIdOverride ?? currentSocietyId
  const [boundSocietyId, setBoundSocietyId] = useState<string | null>(societyId)
  const [toggles, setToggles] = useState<FeatureToggleRow[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!societyId) {
      setBoundSocietyId(null)
      setToggles([])
      return
    }
    setLoading(true)
    try {
      const rows = await listFeatureToggles(societyId)
      // Reject any accidental cross-society rows.
      setToggles(rows.filter((row) => row.societyId === societyId))
      setBoundSocietyId(societyId)
    } catch {
      setBoundSocietyId(societyId)
      setToggles(
        FEATURE_MODULE_CATALOG.map((module) => ({
          id: `${societyId}:${module.key}`,
          societyId,
          moduleName: module.key,
          isEnabled: module.defaultEnabled,
          source: 'base' as const,
          updatedAt: new Date().toISOString()
        }))
      )
    } finally {
      setLoading(false)
    }
  }, [societyId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!societyId) return
    return subscribeFeatureToggles(societyId, (rows) => {
      setToggles(rows.filter((row) => row.societyId === societyId))
      setBoundSocietyId(societyId)
    })
  }, [societyId])

  const isEnabled = useCallback(
    (moduleName: FeatureModuleName | string) => {
      if (!societyId || boundSocietyId !== societyId) return false
      const row = toggles.find(
        (item) => item.societyId === societyId && item.moduleName === moduleName
      )
      return Boolean(row?.isEnabled)
    },
    [societyId, boundSocietyId, toggles]
  )

  const setEnabled = useCallback(
    async (moduleName: FeatureModuleName, enabled: boolean) => {
      if (!societyId) throw new Error('Select a society first')
      const updated = await setFeatureToggle(societyId, moduleName, enabled)
      if (updated.societyId !== societyId) {
        throw new Error('Feature toggle society mismatch')
      }
      setToggles((prev) => {
        const next = prev.filter(
          (row) => !(row.societyId === societyId && row.moduleName === moduleName)
        )
        return [...next, updated].sort((a, b) => a.moduleName.localeCompare(b.moduleName))
      })
    },
    [societyId]
  )

  const value = useMemo(
    () => ({
      societyId,
      loading,
      toggles: societyId ? toggles.filter((row) => row.societyId === societyId) : [],
      isEnabled,
      refresh,
      setEnabled
    }),
    [societyId, loading, toggles, isEnabled, refresh, setEnabled]
  )

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>
}

export function useFeatureFlags() {
  const ctx = useContext(FeatureFlagsContext)
  if (!ctx) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider')
  }
  return ctx
}

/** Per-society flag: always false when no active society is bound. */
export function useFeatureFlag(moduleName: FeatureModuleName | string): boolean {
  const { isEnabled } = useFeatureFlags()
  return isEnabled(moduleName)
}
