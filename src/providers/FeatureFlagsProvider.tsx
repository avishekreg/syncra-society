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
import { FEATURE_MODULE_KEYS, type FeatureModuleName } from '../lib/featureModules'
import { useAuth } from './AuthProvider'

type FeatureFlagsContextValue = {
  societyId: string | null
  loading: boolean
  toggles: FeatureToggleRow[]
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
  /** Super Admin can bind a selected society for the control panel. */
  societyIdOverride?: string | null
}) {
  const { currentSocietyId } = useAuth()
  const societyId = societyIdOverride ?? currentSocietyId
  const [toggles, setToggles] = useState<FeatureToggleRow[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!societyId) {
      setToggles([])
      return
    }
    setLoading(true)
    try {
      const rows = await listFeatureToggles(societyId)
      setToggles(rows)
    } catch {
      setToggles(
        FEATURE_MODULE_KEYS.map((moduleName) => ({
          id: `${societyId}:${moduleName}`,
          societyId,
          moduleName,
          isEnabled: false,
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
    return subscribeFeatureToggles(societyId, setToggles)
  }, [societyId])

  const isEnabled = useCallback(
    (moduleName: FeatureModuleName | string) => {
      const row = toggles.find((item) => item.moduleName === moduleName)
      return Boolean(row?.isEnabled)
    },
    [toggles]
  )

  const setEnabled = useCallback(
    async (moduleName: FeatureModuleName, enabled: boolean) => {
      if (!societyId) throw new Error('Select a society first')
      const updated = await setFeatureToggle(societyId, moduleName, enabled)
      setToggles((prev) => {
        const next = prev.filter((row) => row.moduleName !== moduleName)
        return [...next, updated].sort((a, b) => a.moduleName.localeCompare(b.moduleName))
      })
    },
    [societyId]
  )

  const value = useMemo(
    () => ({
      societyId,
      loading,
      toggles,
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

/** Lightweight hook: `useFeatureFlag('smart_parking')` */
export function useFeatureFlag(moduleName: FeatureModuleName | string): boolean {
  const { isEnabled } = useFeatureFlags()
  return isEnabled(moduleName)
}
