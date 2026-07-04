export type PricingTierId = 'tier1' | 'tier2' | 'tier3'

export type PlatformTierConfig = {
  id: PricingTierId
  label: string
  price: number
  description: string
  headline: string
  features: string[]
}

export type WhatsAppAddonPricing = {
  baseMonthlyPriceInr: number
  includedMessagesPerMonth: number
  overageBlockSize: number
  overageBlockPriceInr: number
}

export type VoiceHelpdeskAddonPricing = {
  monthlyFlatFeeInr: number
}

export type ElectionBillingMode = 'monthly' | 'per_event'

export type ElectionAddonPricing = {
  billingMode: ElectionBillingMode
  monthlyFeeInr: number
  perEventFeeInr: number
}

export type PremiumAddonsPricingConfig = {
  whatsapp: WhatsAppAddonPricing
  voiceHelpdesk: VoiceHelpdeskAddonPricing
  elections: ElectionAddonPricing
}

export type PlatformPricingConfig = {
  activationFeeInr: number
  tiers: PlatformTierConfig[]
  premiumAddons: PremiumAddonsPricingConfig
  updatedAt?: string
}

export const DEFAULT_PREMIUM_ADDONS: PremiumAddonsPricingConfig = {
  whatsapp: {
    baseMonthlyPriceInr: 499,
    includedMessagesPerMonth: 3000,
    overageBlockSize: 1000,
    overageBlockPriceInr: 199
  },
  voiceHelpdesk: {
    monthlyFlatFeeInr: 799
  },
  elections: {
    billingMode: 'monthly',
    monthlyFeeInr: 599,
    perEventFeeInr: 2499
  }
}

export const DEFAULT_PLATFORM_PRICING: PlatformPricingConfig = {
  activationFeeInr: 2499,
  tiers: [
    {
      id: 'tier1',
      label: 'Tier 1',
      price: 149,
      headline: 'Small Societies',
      description: 'Basic society operations for up to 50 flats.',
      features: ['Resident dashboard', 'Notice Board', 'Syncra Gate Visitor Log', 'Basic ledger view']
    },
    {
      id: 'tier2',
      label: 'Tier 2',
      price: 99,
      headline: 'Medium Portfolio',
      description: 'Extended management for 51–150 flats.',
      features: ['Multi-block RWA', 'Contract tracking', 'Role management', 'Priority support']
    },
    {
      id: 'tier3',
      label: 'Tier 3',
      price: 75,
      headline: 'Enterprise Townships',
      description: 'Enterprise orchestration for large portfolios.',
      features: ['Enterprise orchestration', 'Advanced analytics', 'Dedicated onboarding', 'SLA support']
    }
  ],
  premiumAddons: DEFAULT_PREMIUM_ADDONS
}

export const PLATFORM_PRICING_SYSTEM_CONFIG_KEY = 'PLATFORM_PRICING_CONFIG'
