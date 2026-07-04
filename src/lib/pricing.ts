export type ActivationStatus = 'pending' | 'activation_paid' | 'active_subscription'

export type SocietySubscription = {
  id: string
  society_id: string
  activation_status: ActivationStatus
  total_flats: number | null
  monthly_rate_per_flat: number | null
  razorpay_order_id?: string | null
  razorpay_subscription_id?: string | null
  razorpay_plan_id?: string | null
  billing_cycle_anchor?: string | null
  active_until?: string | null
  created_at?: string
  updated_at?: string
}

export type BillingStatus = {
  societyId: string
  societyName: string
  activationStatus: ActivationStatus
  totalFlats: number | null
  monthlyRatePerFlat: number
  monthlyTotalInr: number
  activationFeeInr: number
  activeUntil: string | null
  razorpayKeyId: string | null
  paymentsConfigured: boolean
}

import { getTierRate } from './platformPricing'

export function resolveMonthlyRatePerFlat(pricingSlabId?: string | null): number {
  return getTierRate(pricingSlabId)
}

export function calculateMonthlyDues(totalFlats: number, ratePerFlatInr: number) {
  const flats = Math.max(0, Math.floor(totalFlats))
  const rate = Math.max(0, ratePerFlatInr)
  const monthlyTotalInr = flats * rate
  return {
    totalFlats: flats,
    monthlyRatePerFlat: rate,
    monthlyTotalInr,
    monthlyTotalPaise: Math.round(monthlyTotalInr * 100)
  }
}

export function onboardingPathForStatus(status: ActivationStatus): string {
  if (status === 'pending') return '/onboarding/activation'
  if (status === 'activation_paid') return '/onboarding/flats'
  return '/admin/dashboard'
}
