import { restGet } from '../api/supabaseClient'
import { isRemoteSocietyId } from '../api/societies'
import { isSocietyAddonEnabled } from './platformConfig'
import type { SocietyModuleConfig } from '../../types/society-modules'

/** Live DB feature flag — falls back to local platform config for demo societies. */
export async function isWhatsAppAlertsActive(societyId: string): Promise<boolean> {
  if (!isRemoteSocietyId(societyId)) {
    return isSocietyAddonEnabled(societyId, 'whatsappAlerts')
  }

  try {
    const rows = await restGet<Pick<SocietyModuleConfig, 'whatsapp_alerts'>[]>(
      `society_module_configs?society_id=eq.${societyId}&select=whatsapp_alerts&limit=1`
    )
    const row = rows?.[0]
    if (row) return row.whatsapp_alerts === true

    const societies = await restGet<Array<{ active_addons?: string[] }>>(
      `societies?id=eq.${societyId}&select=active_addons&limit=1`
    )
    const legacy = societies?.[0]?.active_addons ?? []
    if (legacy.includes('whatsapp_automation') || legacy.includes('whatsapp_alerts')) {
      return true
    }
  } catch (err) {
    console.warn('[societyModuleConfig] DB lookup failed — using local fallback', err)
  }

  return isSocietyAddonEnabled(societyId, 'whatsappAlerts')
}
