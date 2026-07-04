import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PlatformConfig, SidebarModuleKey, SocietyAddonKey } from '../types/platformConfig'
import {
  isSidebarModuleEnabled as resolveSidebarModuleEnabled,
  isSocietyAddonEnabled as resolveSocietyAddonEnabled,
  isVoiceTicketingEnabled as resolveVoiceTicketingEnabled,
  loadPlatformConfigFromSupabase,
  patchPlatformConfig,
  patchSocietyAddon,
  PLATFORM_CONFIG_CHANGED_EVENT,
  readPlatformConfigFromStorage,
  syncPlatformConfigToSupabase
} from '../lib/platformConfig'

type PlatformConfigContextValue = {
  config: PlatformConfig
  loading: boolean
  supabaseSynced: boolean
  updateConfig: (patch: Partial<PlatformConfig>) => PlatformConfig
  setSidebarModule: (key: SidebarModuleKey, enabled: boolean) => PlatformConfig
  setSocietyAddon: (societyId: string, addon: SocietyAddonKey, enabled: boolean) => PlatformConfig
  isModuleEnabled: (key: SidebarModuleKey, societyId?: string | null) => boolean
  isSocietyAddonEnabled: (societyId: string | null | undefined, addon: SocietyAddonKey) => boolean
  isVoiceTicketingEnabled: (societyId?: string | null) => boolean
  refresh: () => void
}

const PlatformConfigContext = createContext<PlatformConfigContextValue | null>(null)

export function PlatformConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PlatformConfig>(() => readPlatformConfigFromStorage())
  const [loading, setLoading] = useState(true)
  const [supabaseSynced, setSupabaseSynced] = useState(false)

  const refresh = useCallback(() => {
    setConfig(readPlatformConfigFromStorage())
  }, [])

  useEffect(() => {
    let active = true

    void (async () => {
      const remote = await loadPlatformConfigFromSupabase()
      if (!active) return
      if (remote) {
        setConfig(remote)
        setSupabaseSynced(true)
      }
      setLoading(false)
    })()

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'syncra-platform-config') refresh()
    }

    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent<PlatformConfig>).detail
      if (detail) setConfig(detail)
      else refresh()
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener(PLATFORM_CONFIG_CHANGED_EVENT, onCustom)

    return () => {
      active = false
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(PLATFORM_CONFIG_CHANGED_EVENT, onCustom)
    }
  }, [refresh])

  const updateConfig = useCallback((patch: Partial<PlatformConfig>) => {
    const next = patchPlatformConfig(patch)
    setConfig(next)
    void syncPlatformConfigToSupabase(next).then(setSupabaseSynced)
    return next
  }, [])

  const setSidebarModule = useCallback(
    (key: SidebarModuleKey, enabled: boolean) =>
      updateConfig({ sidebarModules: { ...config.sidebarModules, [key]: enabled } }),
    [config.sidebarModules, updateConfig]
  )

  const setSocietyAddon = useCallback((societyId: string, addon: SocietyAddonKey, enabled: boolean) => {
    const next = patchSocietyAddon(societyId, addon, enabled)
    setConfig(next)
    void syncPlatformConfigToSupabase(next).then(setSupabaseSynced)
    return next
  }, [])

  const isModuleEnabled = useCallback(
    (key: SidebarModuleKey, societyId?: string | null) =>
      resolveSidebarModuleEnabled(key, { societyId, config }),
    [config]
  )

  const isSocietyAddonEnabled = useCallback(
    (societyId: string | null | undefined, addon: SocietyAddonKey) =>
      resolveSocietyAddonEnabled(societyId, addon, config),
    [config]
  )

  const isVoiceTicketingEnabled = useCallback(
    (societyId?: string | null) => resolveVoiceTicketingEnabled(societyId, config),
    [config]
  )

  const value = useMemo<PlatformConfigContextValue>(
    () => ({
      config,
      loading,
      supabaseSynced,
      updateConfig,
      setSidebarModule,
      setSocietyAddon,
      isModuleEnabled,
      isSocietyAddonEnabled,
      isVoiceTicketingEnabled,
      refresh
    }),
    [
      config,
      loading,
      supabaseSynced,
      updateConfig,
      setSidebarModule,
      setSocietyAddon,
      isModuleEnabled,
      isSocietyAddonEnabled,
      isVoiceTicketingEnabled,
      refresh
    ]
  )

  return <PlatformConfigContext.Provider value={value}>{children}</PlatformConfigContext.Provider>
}

export function usePlatformConfig() {
  const ctx = useContext(PlatformConfigContext)
  if (!ctx) {
    throw new Error('usePlatformConfig must be used within PlatformConfigProvider')
  }
  return ctx
}
