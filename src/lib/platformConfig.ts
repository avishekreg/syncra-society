import type {
  AiUtilitiesConfig,
  CommunicationsConfig,
  ElectionModuleConfig,
  PaymentGatewaysConfig,
  PlatformConfig,
  PlatformWebhooksConfig,
  SidebarModuleKey,
  SocietyAddonKey,
  SocietyGatewayConfig,
  SurveyEngineConfig
} from '../types/platformConfig'
import {
  DEFAULT_PAYMENTS_WEBHOOK_RECEPTION_URL,
  N8N_PRODUCTION_WEBHOOK_URL
} from '../types/platformConfig'
import { fetchApiJson } from '../api/safeFetch'
import {
  migrateLegacyRazorpayKeys,
  hydratePlatformConfigFromMirror,
  mergePlatformConfigPreferLocalSecrets,
  writeSystemConfigMirror
} from './systemConfigSync'

export const PLATFORM_CONFIG_STORAGE_KEY = 'syncra-platform-config'
export const PLATFORM_CONFIG_CHANGED_EVENT = 'syncra-platform-config-changed'

const ADMIN_KEY_STORAGE = 'syncra-super-admin-key'

function getSuperAdminKey() {
  try {
    return (
      localStorage.getItem(ADMIN_KEY_STORAGE)?.trim() ||
      import.meta.env.VITE_SUPER_ADMIN_SECRET?.trim() ||
      import.meta.env.NEXT_PUBLIC_SUPER_ADMIN_SECRET?.trim() ||
      ''
    )
  } catch {
    return (
      import.meta.env.VITE_SUPER_ADMIN_SECRET?.trim() ||
      import.meta.env.NEXT_PUBLIC_SUPER_ADMIN_SECRET?.trim() ||
      ''
    )
  }
}

export const DEFAULT_SOCIETY_ADDONS: Record<SocietyAddonKey, boolean> = {
  whatsappAlerts: true,
  electionModule: true,
  voiceTicketing: true,
  smartHelpdesk: true
}

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
  aiUtilities: {
    huggingFaceToken: '',
    voiceModel: 'openai/whisper-large-v3',
    noticeEnhancerModel: 'meta-llama/Meta-Llama-3-8B-Instruct'
  },
  communications: {
    n8nWebhookUrl: N8N_PRODUCTION_WEBHOOK_URL,
    twilioSenderPhone: '+14155238886'
  },
  paymentGateways: {
    razorpayKeyId: '',
    razorpayKeySecret: '',
    razorpayWebhookSecret: '',
    stripeWebhookSecret: ''
  },
  platformWebhooks: {
    paymentsReceptionUrl: DEFAULT_PAYMENTS_WEBHOOK_RECEPTION_URL
  },
  societyAddons: {},
  societyGateways: {},
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

const MODULE_ADDON_MAP: Partial<Record<SidebarModuleKey, SocietyAddonKey>> = {
  helpdesk: 'smartHelpdesk',
  elections: 'electionModule',
  whatsappAutomation: 'whatsappAlerts',
  notices: 'whatsappAlerts'
}

function mergeSidebarModules(
  partial?: Partial<Record<SidebarModuleKey, boolean>>
): Record<SidebarModuleKey, boolean> {
  return { ...DEFAULT_PLATFORM_CONFIG.sidebarModules, ...partial }
}

function mergeAiUtilities(partial?: Partial<AiUtilitiesConfig>): AiUtilitiesConfig {
  return { ...DEFAULT_PLATFORM_CONFIG.aiUtilities, ...partial }
}

function mergeCommunications(partial?: Partial<CommunicationsConfig>): CommunicationsConfig {
  return { ...DEFAULT_PLATFORM_CONFIG.communications, ...partial }
}

function mergePaymentGateways(partial?: Partial<PaymentGatewaysConfig>): PaymentGatewaysConfig {
  return { ...DEFAULT_PLATFORM_CONFIG.paymentGateways, ...partial }
}

function mergePlatformWebhooks(partial?: Partial<PlatformWebhooksConfig>): PlatformWebhooksConfig {
  return { ...DEFAULT_PLATFORM_CONFIG.platformWebhooks, ...partial }
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
    aiUtilities: mergeAiUtilities(raw?.aiUtilities),
    communications: mergeCommunications(raw?.communications),
    paymentGateways: mergePaymentGateways(raw?.paymentGateways),
    platformWebhooks: mergePlatformWebhooks(raw?.platformWebhooks),
    societyAddons: raw?.societyAddons ?? {},
    societyGateways: raw?.societyGateways ?? {},
    surveyEngine: mergeSurveyEngine(raw?.surveyEngine),
    electionModule: mergeElectionModule(raw?.electionModule),
    updatedAt: raw?.updatedAt ?? new Date().toISOString()
  }
}

export function readPlatformConfigFromStorage(): PlatformConfig {
  try {
    const raw = localStorage.getItem(PLATFORM_CONFIG_STORAGE_KEY)
    if (!raw) {
      return hydratePlatformConfigFromMirror(
        migrateLegacyRazorpayKeys({
          ...DEFAULT_PLATFORM_CONFIG,
          updatedAt: new Date().toISOString()
        })
      )
    }
    return hydratePlatformConfigFromMirror(
      migrateLegacyRazorpayKeys(
        normalizePlatformConfig(JSON.parse(raw) as Partial<PlatformConfig>)
      )
    )
  } catch {
    return hydratePlatformConfigFromMirror(
      migrateLegacyRazorpayKeys({
        ...DEFAULT_PLATFORM_CONFIG,
        updatedAt: new Date().toISOString()
      })
    )
  }
}

export function getPlatformConfig(): PlatformConfig {
  return readPlatformConfigFromStorage()
}

export function getSocietyGatewayConfig(
  societyId: string | null | undefined,
  config = getPlatformConfig()
): SocietyGatewayConfig {
  if (!societyId) return {}
  return config.societyGateways[societyId] ?? {}
}

export function isSocietyAddonEnabled(
  societyId: string | null | undefined,
  addon: SocietyAddonKey,
  config = getPlatformConfig()
): boolean {
  if (!societyId) return true
  const societyGate = config.societyAddons[societyId]
  if (!societyGate || societyGate[addon] === undefined) return DEFAULT_SOCIETY_ADDONS[addon]
  return societyGate[addon] ?? DEFAULT_SOCIETY_ADDONS[addon]
}

export function isSidebarModuleEnabled(
  key: SidebarModuleKey,
  options?: { societyId?: string | null; config?: PlatformConfig }
): boolean {
  const config = options?.config ?? getPlatformConfig()
  if (!config.sidebarModules[key]) return false

  const addon = MODULE_ADDON_MAP[key]
  if (addon && options?.societyId) {
    if (!isSocietyAddonEnabled(options.societyId, addon, config)) return false
  }

  if (key === 'elections' && !config.electionModule.enabled) return false
  if (key === 'surveys' && !config.surveyEngine.enabled) return false

  return true
}

export function isVoiceTicketingEnabled(societyId?: string | null, config = getPlatformConfig()) {
  if (!config.sidebarModules.helpdesk) return false
  if (!isSocietyAddonEnabled(societyId, 'voiceTicketing', config)) return false
  return isSocietyAddonEnabled(societyId, 'smartHelpdesk', config)
}

export function writePlatformConfigToStorage(config: PlatformConfig) {
  const hydrated = hydratePlatformConfigFromMirror(config)
  localStorage.setItem(PLATFORM_CONFIG_STORAGE_KEY, JSON.stringify(hydrated))
  writeSystemConfigMirror(hydrated)
  window.dispatchEvent(new CustomEvent(PLATFORM_CONFIG_CHANGED_EVENT, { detail: hydrated }))
}

export function patchPlatformConfig(patch: Partial<PlatformConfig>): PlatformConfig {
  const current = readPlatformConfigFromStorage()
  const next = normalizePlatformConfig({
    ...current,
    ...patch,
    sidebarModules: patch.sidebarModules
      ? mergeSidebarModules({ ...current.sidebarModules, ...patch.sidebarModules })
      : current.sidebarModules,
    aiUtilities: patch.aiUtilities
      ? mergeAiUtilities({ ...current.aiUtilities, ...patch.aiUtilities })
      : current.aiUtilities,
    communications: patch.communications
      ? mergeCommunications({ ...current.communications, ...patch.communications })
      : current.communications,
    paymentGateways: patch.paymentGateways
      ? mergePaymentGateways({ ...current.paymentGateways, ...patch.paymentGateways })
      : current.paymentGateways,
    platformWebhooks: patch.platformWebhooks
      ? mergePlatformWebhooks({ ...current.platformWebhooks, ...patch.platformWebhooks })
      : current.platformWebhooks,
    societyAddons: patch.societyAddons
      ? { ...current.societyAddons, ...patch.societyAddons }
      : current.societyAddons,
    societyGateways: patch.societyGateways
      ? { ...current.societyGateways, ...patch.societyGateways }
      : current.societyGateways,
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

export function patchSocietyAddon(
  societyId: string,
  addon: SocietyAddonKey,
  enabled: boolean
): PlatformConfig {
  const current = readPlatformConfigFromStorage()
  const existing = current.societyAddons[societyId] ?? {}
  return patchPlatformConfig({
    societyAddons: {
      [societyId]: { ...existing, [addon]: enabled }
    }
  })
}

export function patchSocietyGateway(
  societyId: string,
  patch: Partial<SocietyGatewayConfig>
): PlatformConfig {
  const current = readPlatformConfigFromStorage()
  const existing = current.societyGateways[societyId] ?? {}
  return patchPlatformConfig({
    societyGateways: {
      [societyId]: { ...existing, ...patch }
    }
  })
}

export async function syncPlatformConfigToSupabase(config: PlatformConfig): Promise<boolean> {
  const adminKey = getSuperAdminKey()
  if (!adminKey) return false

  const result = await fetchApiJson<{ payload?: unknown }>('/api/platform/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-super-admin-key': adminKey
    },
    body: JSON.stringify({
      payload: config,
      updated_at: config.updatedAt
    })
  })

  return Boolean(result)
}

export async function loadPlatformConfigFromSupabase(): Promise<PlatformConfig | null> {
  const adminKey = getSuperAdminKey()
  if (!adminKey) return null

  const remote = await fetchApiJson<{ payload?: Partial<PlatformConfig> }>('/api/platform/config', {
    headers: { 'x-super-admin-key': adminKey }
  })

  const payload = remote?.payload
  if (!payload) return null

  try {
    const local = readPlatformConfigFromStorage()
    const normalized = hydratePlatformConfigFromMirror(
      mergePlatformConfigPreferLocalSecrets(local, normalizePlatformConfig(payload))
    )
    writePlatformConfigToStorage(normalized)
    return normalized
  } catch {
    return null
  }
}
