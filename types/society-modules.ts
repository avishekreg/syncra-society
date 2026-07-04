/** Purchasable SaaS modules — webhook metadata keys and DB column names. */
export const SOCIETY_MODULE_KEYS = [
  'whatsapp_alerts',
  'election_engine',
  'voice_ticketing',
  'smart_helpdesk'
] as const

export type SocietyModuleKey = (typeof SOCIETY_MODULE_KEYS)[number]

export type SocietyModuleConfig = {
  society_id: string
  whatsapp_alerts: boolean
  election_engine: boolean
  voice_ticketing: boolean
  smart_helpdesk: boolean
  updated_at?: string
}

/** Normalize gateway metadata aliases to canonical module keys. */
export function normalizePurchasedModule(raw: string | undefined | null): SocietyModuleKey | null {
  if (!raw) return null
  const key = raw.trim()
  const aliases: Record<string, SocietyModuleKey> = {
    whatsapp_alerts: 'whatsapp_alerts',
    whatsappAlerts: 'whatsapp_alerts',
    whatsapp_automation: 'whatsapp_alerts',
    election_engine: 'election_engine',
    electionModule: 'election_engine',
    elections: 'election_engine',
    voice_ticketing: 'voice_ticketing',
    voiceTicketing: 'voice_ticketing',
    smart_helpdesk: 'smart_helpdesk',
    smartHelpdesk: 'smart_helpdesk'
  }
  return aliases[key] ?? (SOCIETY_MODULE_KEYS.includes(key as SocietyModuleKey) ? (key as SocietyModuleKey) : null)
}

/** Legacy active_addons entries kept in sync for existing API guards. */
export const MODULE_TO_LEGACY_ADDON: Partial<Record<SocietyModuleKey, string>> = {
  whatsapp_alerts: 'whatsapp_automation',
  election_engine: 'elections'
}
