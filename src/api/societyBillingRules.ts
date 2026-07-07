import { restGet, restPatch, restPost } from './supabaseClient'
import type { SocietyBillingRules } from '../types/db'

const TABLE = 'society_billing_rules'

const DEFAULT_RULES: Omit<SocietyBillingRules, 'society_id' | 'created_at' | 'updated_at'> = {
  maintenance_due_date: 5,
  late_fee_grace_period_days: 7,
  late_fee_flat_amount: 0,
  interest_rate_percentage: 0
}

export async function fetchSocietyBillingRules(societyId: string): Promise<SocietyBillingRules> {
  try {
    const rows = await restGet<SocietyBillingRules[]>(
      `${TABLE}?society_id=eq.${encodeURIComponent(societyId)}&limit=1`
    )
    if (rows?.[0]) return rows[0]
  } catch {
    // Fall through to defaults.
  }

  return {
    society_id: societyId,
    ...DEFAULT_RULES,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export async function upsertSocietyBillingRules(
  societyId: string,
  payload: Omit<SocietyBillingRules, 'society_id' | 'created_at' | 'updated_at'>
): Promise<SocietyBillingRules> {
  const now = new Date().toISOString()
  const existing = await fetchSocietyBillingRules(societyId).catch(() => null)

  if (existing?.created_at) {
    await restPatch(`${TABLE}?society_id=eq.${encodeURIComponent(societyId)}`, {
      ...payload,
      updated_at: now
    })
    return { ...existing, ...payload, updated_at: now }
  }

  return restPost<SocietyBillingRules>(TABLE, {
    society_id: societyId,
    ...payload,
    created_at: now,
    updated_at: now
  })
}
