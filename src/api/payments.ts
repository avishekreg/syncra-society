import type { ActivationStatus, BillingStatus } from '../lib/pricing'
import { getPlatformPricing, getTierRate } from '../lib/platformPricing'
import { isDemoSocietyId } from '../config/devSeed'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function paymentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error ?? res.statusText)
  }
  return data as T
}

export async function fetchBillingStatus(societyId: string): Promise<BillingStatus> {
  return paymentFetch<BillingStatus>(`/api/payments/status/${societyId}`)
}

export type ActivationOrderResponse = {
  orderId?: string
  amount?: number
  currency?: string
  keyId?: string
  societyName?: string
  activationFeeInr?: number
  alreadyPaid?: boolean
  demoMode?: boolean
  activationStatus?: ActivationStatus
  message?: string
}

export async function createActivationOrder(societyId: string): Promise<ActivationOrderResponse> {
  return paymentFetch<ActivationOrderResponse>('/api/payments/activate', {
    method: 'POST',
    body: JSON.stringify({ societyId })
  })
}

export async function verifyActivationPayment(payload: {
  societyId: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}) {
  return paymentFetch<{ success: boolean; activationStatus: ActivationStatus }>(
    '/api/payments/activate/verify',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  )
}

export type SubscribeResponse = {
  subscriptionId?: string
  planId?: string
  keyId?: string
  monthlyTotalInr?: number
  monthlyRatePerFlat?: number
  totalFlats?: number
  shortUrl?: string | null
  alreadyActive?: boolean
  demoMode?: boolean
  activationStatus?: ActivationStatus
  message?: string
}

export async function createRecurringSubscription(payload: {
  societyId: string
  totalFlats: number
  customerEmail?: string
  customerName?: string
}): Promise<SubscribeResponse> {
  return paymentFetch<SubscribeResponse>('/api/payments/subscribe', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function verifySubscriptionAuthorization(payload: {
  societyId: string
  razorpay_subscription_id: string
  razorpay_payment_id?: string
  razorpay_signature?: string
}) {
  return paymentFetch<{ success: boolean; activationStatus: ActivationStatus; activeUntil: string }>(
    '/api/payments/subscribe/verify',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  )
}

/** Local fallback when payment API is unreachable (offline demo). */
export function readLocalBillingStatus(societyId: string): BillingStatus | null {
  const raw = localStorage.getItem(`syncra-billing-${societyId}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as BillingStatus
  } catch {
    return null
  }
}

export function writeLocalBillingStatus(societyId: string, patch: Partial<BillingStatus>) {
  const pricing = getPlatformPricing()
  const existing =
    readLocalBillingStatus(societyId) ??
    ({
      societyId,
      societyName: 'My Society',
      activationStatus: 'pending',
      totalFlats: null,
      monthlyRatePerFlat: getTierRate('tier2', pricing),
      monthlyTotalInr: 0,
      activationFeeInr: pricing.activationFeeInr,
      activeUntil: null,
      razorpayKeyId: null,
      paymentsConfigured: false
    } satisfies BillingStatus)

  localStorage.setItem(
    `syncra-billing-${societyId}`,
    JSON.stringify({ ...existing, ...patch, societyId })
  )
}

export async function fetchBillingStatusWithFallback(societyId: string, societyName = 'My Society') {
  const pricing = getPlatformPricing()

  if (isDemoSocietyId(societyId)) {
    const local = readLocalBillingStatus(societyId)
    if (local) {
      return { ...local, activationFeeInr: pricing.activationFeeInr }
    }
    return {
      societyId,
      societyName: societyName || 'Syncra Windsor Castle',
      activationStatus: 'active_subscription' as ActivationStatus,
      totalFlats: 120,
      monthlyRatePerFlat: getTierRate('tier2', pricing),
      monthlyTotalInr: 120 * getTierRate('tier2', pricing),
      activationFeeInr: pricing.activationFeeInr,
      activeUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      razorpayKeyId: null,
      paymentsConfigured: false
    }
  }

  try {
    const status = await fetchBillingStatus(societyId)
    return { ...status, activationFeeInr: status.activationFeeInr ?? pricing.activationFeeInr }
  } catch {
    const local = readLocalBillingStatus(societyId)
    if (local) {
      return { ...local, activationFeeInr: pricing.activationFeeInr }
    }
    return {
      societyId,
      societyName,
      activationStatus: 'pending' as ActivationStatus,
      totalFlats: null,
      monthlyRatePerFlat: getTierRate('tier2', pricing),
      monthlyTotalInr: 0,
      activationFeeInr: pricing.activationFeeInr,
      activeUntil: null,
      razorpayKeyId: null,
      paymentsConfigured: false
    }
  }
}
