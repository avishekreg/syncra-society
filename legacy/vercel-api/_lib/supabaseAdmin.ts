import { config } from './config'

export type ActivationStatus = 'pending' | 'activation_paid' | 'active_subscription'

export type SocietySubscriptionRow = {
  id: string
  society_id: string
  activation_status: ActivationStatus
  total_flats: number | null
  monthly_rate_per_flat: number | null
  razorpay_order_id: string | null
  razorpay_subscription_id: string | null
  razorpay_plan_id: string | null
  billing_cycle_anchor: string | null
  active_until: string | null
  created_at?: string
  updated_at?: string
}

type SocietyRow = {
  id: string
  name: string
  pricing_slab_id?: string | null
  total_flats?: number | null
  subscription_status?: string | null
}

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: config.supabaseServiceRoleKey,
    Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    Prefer: 'return=representation'
  }
}

function restUrl(path: string) {
  return `${config.supabaseUrl}/rest/v1/${path}`
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  const parsed = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(parsed?.message ?? parsed?.error ?? res.statusText)
  return parsed as T
}

export async function getSocietyById(societyId: string): Promise<SocietyRow | null> {
  const res = await fetch(restUrl(`societies?id=eq.${societyId}&limit=1`), { headers: adminHeaders() })
  const rows = await handleResponse<SocietyRow[]>(res)
  return rows?.[0] ?? null
}

export async function getSocietySubscription(societyId: string): Promise<SocietySubscriptionRow | null> {
  const res = await fetch(restUrl(`society_subscriptions?society_id=eq.${societyId}&limit=1`), {
    headers: adminHeaders()
  })
  const rows = await handleResponse<SocietySubscriptionRow[]>(res)
  return rows?.[0] ?? null
}

export async function createSocietySubscription(societyId: string): Promise<SocietySubscriptionRow> {
  const res = await fetch(restUrl('society_subscriptions'), {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ society_id: societyId, activation_status: 'pending' })
  })
  const rows = await handleResponse<SocietySubscriptionRow[]>(res)
  return rows[0]
}

export async function patchSocietySubscription(
  societyId: string,
  patch: Partial<SocietySubscriptionRow>
): Promise<SocietySubscriptionRow> {
  const res = await fetch(restUrl(`society_subscriptions?society_id=eq.${societyId}`), {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() })
  })
  const rows = await handleResponse<SocietySubscriptionRow[]>(res)
  return rows[0]
}

export async function patchSociety(societyId: string, patch: Partial<SocietyRow>) {
  const res = await fetch(restUrl(`societies?id=eq.${societyId}`), {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify(patch)
  })
  return handleResponse(res)
}

export async function recordWebhookEvent(input: {
  razorpayEventId: string
  eventType: string
  societyId?: string | null
  payload: unknown
}) {
  const res = await fetch(restUrl('payment_webhook_events'), {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({
      razorpay_event_id: input.razorpayEventId,
      event_type: input.eventType,
      society_id: input.societyId ?? null,
      payload: input.payload
    })
  })
  return handleResponse(res)
}

export async function webhookEventExists(razorpayEventId: string): Promise<boolean> {
  const res = await fetch(restUrl(`payment_webhook_events?razorpay_event_id=eq.${razorpayEventId}&limit=1`), {
    headers: adminHeaders()
  })
  const rows = await handleResponse<Array<{ id: string }>>(res)
  return rows.length > 0
}

export async function getSubscriptionByRazorpayId(
  razorpaySubscriptionId: string
): Promise<SocietySubscriptionRow | null> {
  const res = await fetch(
    restUrl(`society_subscriptions?razorpay_subscription_id=eq.${razorpaySubscriptionId}&limit=1`),
    { headers: adminHeaders() }
  )
  const rows = await handleResponse<SocietySubscriptionRow[]>(res)
  return rows?.[0] ?? null
}

export function extendActiveUntil(current: string | null | undefined, days = 30): string {
  const base = current && new Date(current) > new Date() ? new Date(current) : new Date()
  base.setDate(base.getDate() + days)
  return base.toISOString()
}
