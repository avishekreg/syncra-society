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

import {
  calculateWhatsAppOverageCost,
  getPlatformPricing,
  getTierRate,
  resolvePremiumAddonMonthlyFee,
  type PremiumAddonsPricingConfig
} from './platformPricing'

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

export type SocietyAddonBillLine = {
  addon: keyof PremiumAddonsPricingConfig
  label: string
  amountInr: number
  billingNote?: string
}

export function calculateSocietyAddonMonthlyDues(
  activeAddons: Array<keyof PremiumAddonsPricingConfig>,
  config: PremiumAddonsPricingConfig = getPlatformPricing().premiumAddons
): { lines: SocietyAddonBillLine[]; monthlyAddonTotalInr: number } {
  const lines: SocietyAddonBillLine[] = activeAddons.flatMap((addon) => {
    const amountInr = resolvePremiumAddonMonthlyFee(addon, config)
    if (amountInr <= 0) return []

    const labels: Record<keyof PremiumAddonsPricingConfig, string> = {
      whatsapp: 'WhatsApp Automation',
      voiceHelpdesk: 'AI Voice Ticketing & Smart Helpdesk',
      elections: 'Encrypted Election Module'
    }

    return [
      {
        addon,
        label: labels[addon],
        amountInr,
        billingNote:
          addon === 'elections' && config.elections.billingMode === 'per_event'
            ? 'Billed per election event'
            : undefined
      }
    ]
  })

  return {
    lines,
    monthlyAddonTotalInr: lines.reduce((sum, line) => sum + line.amountInr, 0)
  }
}

export function calculateWhatsAppMonthlyBill(messageCount: number) {
  const config = getPlatformPricing().premiumAddons.whatsapp
  const base = config.baseMonthlyPriceInr
  const overage = calculateWhatsAppOverageCost(messageCount, config)
  return {
    baseMonthlyPriceInr: base,
    ...overage,
    totalInr: base + overage.overageCostInr
  }
}
