import type {
  ElectionModuleConfig,
  PlatformConfig,
  SidebarModuleKey,
  SurveyEngineConfig
} from '../types/platformConfig'
import { restGet, restPatch, restPost } from '../api/supabaseClient'

export const PLATFORM_CONFIG_STORAGE_KEY = 'syncra-platform-config'
export const PLATFORM_CONFIG_CHANGED_EVENT = 'syncra-platform-config-changed'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || ''

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  sidebarModules: {
    helpdesk: true,
    visitorLogs: true,
    surveys: true,
    gallery: true,
    elections: true,
    rewards: true,
    gatekeeper: true,
    notices: true,
    whatsappAutomation: true
  },
  surveyEngine: {
    enabled: true,
    maxQuestionsPerSurvey: 10,
    maxOptionsPerQuestion: 8,
    allowMultipleResponses: false,
    defaultClosingDays: 7
  },
  electionModule: {
    enabled: true,
    maxPositionsPerElection: 8,
    maxCandidatesPerPosition: 12,
    defaultPositionTemplates: ['President', 'Secretary', 'Treasurer', 'Joint Secretary'],
    allowAnonymousVoting: true
  },
  updatedAt: new Date(0).toISOString()
}

function mergeSidebarModules(
  partial?: Partial<Record<SidebarModuleKey, boolean>>
): Record<SidebarModuleKey, boolean> {
  return { ...DEFAULT_PLATFORM_CONFIG.sidebarModules, ...partial }
}

function mergeSurveyEngine(partial?: Partial<SurveyEngineConfig>): SurveyEngineConfig {
  return { ...DEFAULT_PLATFORM_CONFIG.surveyEngine, ...partial }
}

function mergeElectionModule(partial?: Partial<ElectionModuleConfig>): ElectionModuleConfig {
  return {
    ...DEFAULT_PLATFORM_CONFIG.electionModule,
    ...partial,
    defaultPositionTemplates:
      partial?.defaultPositionTemplates?.filter(Boolean) ??
      DEFAULT_PLATFORM_CONFIG.electionModule.defaultPositionTemplates
  }
}

export function normalizePlatformConfig(raw: Partial<PlatformConfig> | null | undefined): PlatformConfig {
  return {
    sidebarModules: mergeSidebarModules(raw?.sidebarModules),
    surveyEngine: mergeSurveyEngine(raw?.surveyEngine),
    electionModule: mergeElectionModule(raw?.electionModule),
    updatedAt: raw?.updatedAt ?? new Date().toISOString()
  }
}

export function readPlatformConfigFromStorage(): PlatformConfig {
  try {
    const raw = localStorage.getItem(PLATFORM_CONFIG_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PLATFORM_CONFIG, updatedAt: new Date().toISOString() }
    return normalizePlatformConfig(JSON.parse(raw) as Partial<PlatformConfig>)
  } catch {
    return { ...DEFAULT_PLATFORM_CONFIG, updatedAt: new Date().toISOString() }
  }
}

/** Synchronous read for API modules outside React context. */
export function getPlatformConfig(): PlatformConfig {
  return readPlatformConfigFromStorage()
}

export function isSidebarModuleEnabled(key: SidebarModuleKey, config = getPlatformConfig()): boolean {
  return config.sidebarModules[key] ?? DEFAULT_PLATFORM_CONFIG.sidebarModules[key]
}

export function writePlatformConfigToStorage(config: PlatformConfig) {
  localStorage.setItem(PLATFORM_CONFIG_STORAGE_KEY, JSON.stringify(config))
  window.dispatchEvent(new CustomEvent(PLATFORM_CONFIG_CHANGED_EVENT, { detail: config }))
}

export function patchPlatformConfig(patch: Partial<PlatformConfig>): PlatformConfig {
  const current = readPlatformConfigFromStorage()
  const next = normalizePlatformConfig({
    ...current,
    ...patch,
    sidebarModules: patch.sidebarModules
      ? mergeSidebarModules({ ...current.sidebarModules, ...patch.sidebarModules })
      : current.sidebarModules,
    surveyEngine: patch.surveyEngine
      ? mergeSurveyEngine({ ...current.surveyEngine, ...patch.surveyEngine })
      : current.surveyEngine,
    electionModule: patch.electionModule
      ? mergeElectionModule({ ...current.electionModule, ...patch.electionModule })
      : current.electionModule,
    updatedAt: new Date().toISOString()
  })
  writePlatformConfigToStorage(next)
  return next
}

/** Best-effort Supabase mirror — falls back silently to localStorage-only mode. */
export async function syncPlatformConfigToSupabase(config: PlatformConfig): Promise<boolean> {
  if (!SUPABASE_URL) return false

  const row = {
    id: 'global',
    payload: config,
    updated_at: config.updatedAt
  }

  try {
    await restPatch(`platform_settings?id=eq.global`, row)
    return true
  } catch {
    try {
      await restPost('platform_settings', row)
      return true
    } catch {
      return false
    }
  }
}

export async function loadPlatformConfigFromSupabase(): Promise<PlatformConfig | null> {
  if (!SUPABASE_URL) return null

  try {
    const rows = await restGet<Array<{ payload?: Partial<PlatformConfig> }>>(
      'platform_settings?id=eq.global&select=payload'
    )
    const payload = rows?.[0]?.payload
    if (!payload) return null
    const normalized = normalizePlatformConfig(payload)
    writePlatformConfigToStorage(normalized)
    return normalized
  } catch {
    return null
  }
}
