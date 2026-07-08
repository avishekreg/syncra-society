import supabase from './supabaseSdk'
import type { SaasSubscription, UsageCounter } from '../types/db'
import { getMaxFlatsForPlan, type PaidSaasPlanType } from '../lib/saasBilling'

export const WHATSAPP_MONTHLY_ALERT_LIMIT = 3000

const DEFAULT_TRIAL_SUBSCRIPTION = (societyId: string): SaasSubscription => ({
  id: '',
  society_id: societyId,
  plan_type: 'trial',
  status: 'trialing',
  max_flats: 5,
  trial_start: new Date().toISOString(),
  trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  razorpay_sub_id: null
})

const DEFAULT_USAGE_COUNTER = (societyId: string): UsageCounter => ({
  id: '',
  society_id: societyId,
  billing_cycle_start: new Date().toISOString(),
  whatsapp_alerts_sent: 0,
  whatsapp_addon_active: false
})

export async function fetchSocietySubscription(societyId: string): Promise<SaasSubscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('society_id', societyId)
    .maybeSingle()

  if (error) {
    console.warn('[subscriptions] fetch failed:', error.message)
  }

  return (data as SaasSubscription | null) ?? DEFAULT_TRIAL_SUBSCRIPTION(societyId)
}

export async function fetchUsageCounter(societyId: string): Promise<UsageCounter> {
  const { data, error } = await supabase
    .from('usage_counters')
    .select('*')
    .eq('society_id', societyId)
    .maybeSingle()

  if (error) {
    console.warn('[usage_counters] fetch failed:', error.message)
  }

  return (data as UsageCounter | null) ?? DEFAULT_USAGE_COUNTER(societyId)
}

export async function ensureUsageCounterRow(societyId: string): Promise<UsageCounter> {
  const existing = await fetchUsageCounter(societyId)
  if (existing.id) return existing

  const { data, error } = await supabase
    .from('usage_counters')
    .upsert(
      {
        society_id: societyId,
        billing_cycle_start: new Date().toISOString(),
        whatsapp_alerts_sent: 0,
        whatsapp_addon_active: false
      },
      { onConflict: 'society_id' }
    )
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as UsageCounter
}

export async function incrementWhatsAppAlertCounter(societyId: string): Promise<number> {
  const row = await ensureUsageCounterRow(societyId)
  const nextCount = Math.min(row.whatsapp_alerts_sent + 1, WHATSAPP_MONTHLY_ALERT_LIMIT)

  const { data, error } = await supabase
    .from('usage_counters')
    .update({ whatsapp_alerts_sent: nextCount })
    .eq('society_id', societyId)
    .select('whatsapp_alerts_sent')
    .single()

  if (error) {
    console.warn('[usage_counters] increment failed:', error.message)
    return nextCount
  }

  return Number(data?.whatsapp_alerts_sent ?? nextCount)
}

export type MockUpgradePlan = PaidSaasPlanType

/** Sandbox upgrade — applies tier-specific plan_type, status, and max_flats caps. */
export async function mockUpgradeSubscription(
  societyId: string,
  planType: MockUpgradePlan
): Promise<SaasSubscription> {
  const payload = {
    society_id: societyId,
    plan_type: planType,
    status: 'active' as const,
    max_flats: getMaxFlatsForPlan(planType),
    razorpay_sub_id: `mock_sub_${Date.now()}`
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(payload, { onConflict: 'society_id' })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as SaasSubscription
}

/** Sandbox WhatsApp add-on activation for test mode. */
export async function mockActivateWhatsAppAddon(societyId: string): Promise<UsageCounter> {
  await ensureUsageCounterRow(societyId)

  const { data, error } = await supabase
    .from('usage_counters')
    .update({ whatsapp_addon_active: true })
    .eq('society_id', societyId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as UsageCounter
}
