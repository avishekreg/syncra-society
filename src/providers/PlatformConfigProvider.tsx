import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  isSidebarModuleEnabled as resolveSidebarModuleEnabled,
  isSocietyAddonEnabled as resolveSocietyAddonEnabled,
  isVoiceTicketingEnabled as resolveVoiceTicketingEnabled,
  loadPlatformConfigFromSupabase,
  patchPlatformConfig,
  patchSocietyAddon,
  patchSocietyGateway,
  PLATFORM_CONFIG_CHANGED_EVENT,
  readPlatformConfigFromStorage,
  syncPlatformConfigToSupabase
} from '../lib/platformConfig'
import {
  migrateLegacyRazorpayKeys,
  syncInfrastructureFromPlatformConfig,
  writeSystemConfigMirror
} from '../lib/systemConfigSync'
import type { PlatformConfig, SidebarModuleKey, SocietyAddonKey, SocietyGatewayConfig } from '../types/platformConfig'

type PlatformConfigContextValue = {
  config: PlatformConfig
  loading: boolean
  supabaseSynced: boolean
  systemConfigSynced: boolean
  updateConfig: (patch: Partial<PlatformConfig>) => PlatformConfig
  saveGlobalSettings: (patch?: Partial<PlatformConfig>) => Promise<{ config: PlatformConfig; remoteSynced: boolean }>
  setSidebarModule: (key: SidebarModuleKey, enabled: boolean) => PlatformConfig
  setSocietyAddon: (societyId: string, addon: SocietyAddonKey, enabled: boolean) => PlatformConfig
  setSocietyGateway: (societyId: string, patch: Partial<SocietyGatewayConfig>) => PlatformConfig
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
  const [systemConfigSynced, setSystemConfigSynced] = useState(false)

  const refresh = useCallback(() => {
    setConfig(readPlatformConfigFromStorage())
  }, [])

  useEffect(() => {
    let active = true

    void (async () => {
      const remote = await loadPlatformConfigFromSupabase()
      if (!active) return
      if (remote) {
        const migrated = migrateLegacyRazorpayKeys(remote)
        setConfig(migrated)
        writeSystemConfigMirror(migrated)
        setSupabaseSynced(true)
      } else {
        const local = migrateLegacyRazorpayKeys(readPlatformConfigFromStorage())
        setConfig(local)
        writeSystemConfigMirror(local)
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
    writeSystemConfigMirror(next)
    void syncPlatformConfigToSupabase(next).then(setSupabaseSynced)
    return next
  }, [])

  const saveGlobalSettings = useCallback(async (patch?: Partial<PlatformConfig>) => {
    const next = patch ? patchPlatformConfig(patch) : readPlatformConfigFromStorage()
    setConfig(next)
    writeSystemConfigMirror(next)
    const supabaseOk = await syncPlatformConfigToSupabase(next)
    setSupabaseSynced(supabaseOk)
    const { remoteSynced } = await syncInfrastructureFromPlatformConfig(next)
    setSystemConfigSynced(remoteSynced)
    return { config: next, remoteSynced }
  }, [])

  const setSidebarModule = useCallback(
    (key: SidebarModuleKey, enabled: boolean) =>
      updateConfig({ sidebarModules: { ...config.sidebarModules, [key]: enabled } }),
    [config.sidebarModules, updateConfig]
  )

  const setSocietyAddon = useCallback((societyId: string, addon: SocietyAddonKey, enabled: boolean) => {
    const next = patchSocietyAddon(societyId, addon, enabled)
    setConfig(next)
    writeSystemConfigMirror(next)
    void syncPlatformConfigToSupabase(next).then(setSupabaseSynced)
    return next
  }, [])

  const setSocietyGateway = useCallback((societyId: string, patch: Partial<SocietyGatewayConfig>) => {
    const next = patchSocietyGateway(societyId, patch)
    setConfig(next)
    writeSystemConfigMirror(next)
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
      systemConfigSynced,
      updateConfig,
      saveGlobalSettings,
      setSidebarModule,
      setSocietyAddon,
      setSocietyGateway,
      isModuleEnabled,
      isSocietyAddonEnabled,
      isVoiceTicketingEnabled,
      refresh
    }),
    [
      config,
      loading,
      supabaseSynced,
      systemConfigSynced,
      updateConfig,
      saveGlobalSettings,
      setSidebarModule,
      setSocietyAddon,
      setSocietyGateway,
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
