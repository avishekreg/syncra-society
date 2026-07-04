import { createAdminClient } from '@/lib/supabase/admin'
import {
  MODULE_TO_LEGACY_ADDON,
  normalizePurchasedModule,
  type SocietyModuleConfig,
  type SocietyModuleKey
} from '@/types/society-modules'

const DEFAULT_MODULE_CONFIG: Omit<SocietyModuleConfig, 'society_id'> = {
  whatsapp_alerts: false,
  election_engine: false,
  voice_ticketing: false,
  smart_helpdesk: false
}

export async function getSocietyModuleConfig(
  societyId: string
): Promise<SocietyModuleConfig | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('society_module_configs')
    .select('*')
    .eq('society_id', societyId)
    .maybeSingle()

  if (error) {
    console.error('[society-modules] fetch failed', { societyId, error: error.message })
    return null
  }

  return data as SocietyModuleConfig | null
}

export async function isSocietyModuleActive(
  societyId: string,
  module: SocietyModuleKey
): Promise<boolean> {
  const config = await getSocietyModuleConfig(societyId)
  if (!config) return false
  return config[module] === true
}

export async function activateSocietyModule(
  societyId: string,
  purchasedModuleRaw: string
): Promise<{ activated: SocietyModuleKey | null; config: SocietyModuleConfig | null }> {
  const module = normalizePurchasedModule(purchasedModuleRaw)
  if (!module) {
    console.error('[society-modules] unknown purchased module', {
      societyId,
      purchasedModule: purchasedModuleRaw
    })
    return { activated: null, config: null }
  }

  const supabase = createAdminClient()
  const existing = await getSocietyModuleConfig(societyId)
  const patch: SocietyModuleConfig = {
    society_id: societyId,
    ...DEFAULT_MODULE_CONFIG,
    ...(existing ?? {}),
    [module]: true,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('society_module_configs')
    .upsert(patch, { onConflict: 'society_id' })
    .select('*')
    .single()

  if (error) {
    console.error('[society-modules] upsert failed', {
      societyId,
      module,
      error: error.message
    })
    throw new Error(error.message)
  }

  const legacyAddon = MODULE_TO_LEGACY_ADDON[module]
  if (legacyAddon) {
    const { data: society } = await supabase
      .from('societies')
      .select('active_addons')
      .eq('id', societyId)
      .maybeSingle()

    const current = (society?.active_addons as string[] | null) ?? []
    if (!current.includes(legacyAddon)) {
      const { error: addonError } = await supabase
        .from('societies')
        .update({ active_addons: [...current, legacyAddon] })
        .eq('id', societyId)

      if (addonError) {
        console.error('[society-modules] legacy active_addons sync failed', {
          societyId,
          legacyAddon,
          error: addonError.message
        })
      }
    }
  }

  console.info('[society-modules] module activated', { societyId, module })
  return { activated: module, config: data as SocietyModuleConfig }
}
