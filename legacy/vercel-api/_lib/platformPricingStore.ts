import defaultPricing from '../data/platform-pricing.json'
import { getRuntimeStore, setRuntimeStore } from './runtimeStore'

export type PlatformTierConfig = {
  id: 'tier1' | 'tier2' | 'tier3'
  label: string
  price: number
  description: string
  headline?: string
  features?: string[]
}

export type PlatformPricingConfig = {
  activationFeeInr: number
  tiers: PlatformTierConfig[]
  premiumAddons?: PremiumAddonsPricingConfig
  updatedAt?: string
}

export type PremiumAddonsPricingConfig = {
  whatsapp: {
    baseMonthlyPriceInr: number
    includedMessagesPerMonth: number
    overageBlockSize: number
    overageBlockPriceInr: number
  }
  voiceHelpdesk: {
    monthlyFlatFeeInr: number
  }
  elections: {
    billingMode: 'monthly' | 'per_event'
    monthlyFeeInr: number
    perEventFeeInr: number
  }
}

const DEFAULT_PREMIUM_ADDONS: PremiumAddonsPricingConfig = {
  whatsapp: {
    baseMonthlyPriceInr: 499,
    includedMessagesPerMonth: 3000,
    overageBlockSize: 1000,
    overageBlockPriceInr: 199
  },
  voiceHelpdesk: { monthlyFlatFeeInr: 799 },
  elections: { billingMode: 'monthly', monthlyFeeInr: 599, perEventFeeInr: 2499 }
}

const STORE_KEY = 'platform:pricing'

function normalizePremiumAddons(raw: PremiumAddonsPricingConfig | undefined): PremiumAddonsPricingConfig {
  const base = DEFAULT_PREMIUM_ADDONS
  if (!raw) return { ...base, whatsapp: { ...base.whatsapp }, elections: { ...base.elections } }
  return {
    whatsapp: {
      baseMonthlyPriceInr: Number(raw.whatsapp?.baseMonthlyPriceInr ?? base.whatsapp.baseMonthlyPriceInr),
      includedMessagesPerMonth: Number(
        raw.whatsapp?.includedMessagesPerMonth ?? base.whatsapp.includedMessagesPerMonth
      ),
      overageBlockSize: Number(raw.whatsapp?.overageBlockSize ?? base.whatsapp.overageBlockSize),
      overageBlockPriceInr: Number(raw.whatsapp?.overageBlockPriceInr ?? base.whatsapp.overageBlockPriceInr)
    },
    voiceHelpdesk: {
      monthlyFlatFeeInr: Number(raw.voiceHelpdesk?.monthlyFlatFeeInr ?? base.voiceHelpdesk.monthlyFlatFeeInr)
    },
    elections: {
      billingMode: raw.elections?.billingMode === 'per_event' ? 'per_event' : 'monthly',
      monthlyFeeInr: Number(raw.elections?.monthlyFeeInr ?? base.elections.monthlyFeeInr),
      perEventFeeInr: Number(raw.elections?.perEventFeeInr ?? base.elections.perEventFeeInr)
    }
  }
}

function normalize(input: Partial<PlatformPricingConfig> | null | undefined): PlatformPricingConfig {
  const base = defaultPricing as PlatformPricingConfig
  if (!input) {
    return {
      ...base,
      tiers: base.tiers.map((t) => ({ ...t })),
      premiumAddons: normalizePremiumAddons(undefined)
    }
  }

  const tierMap = new Map((input.tiers ?? []).map((tier) => [tier.id, tier]))
  return {
    activationFeeInr: Number(input.activationFeeInr ?? base.activationFeeInr),
    tiers: base.tiers.map((defaults) => {
      const saved = tierMap.get(defaults.id)
      return {
        ...defaults,
        ...saved,
        id: defaults.id,
        price: Number(saved?.price ?? defaults.price)
      }
    }),
    premiumAddons: normalizePremiumAddons(input.premiumAddons),
    updatedAt: input.updatedAt
  }
}

export async function loadPlatformPricing(): Promise<PlatformPricingConfig> {
  const stored = await getRuntimeStore<PlatformPricingConfig>(STORE_KEY)
  return normalize(stored ?? (defaultPricing as PlatformPricingConfig))
}

export async function savePlatformPricing(config: PlatformPricingConfig): Promise<PlatformPricingConfig> {
  const payload = normalize({ ...config, updatedAt: new Date().toISOString() })
  await setRuntimeStore(STORE_KEY, payload)
  return payload
}

export async function getActivationFeeInr() {
  return (await loadPlatformPricing()).activationFeeInr
}

export async function getTierRateInr(pricingSlabId?: string | null) {
  const pricing = await loadPlatformPricing()
  const tier = pricing.tiers.find((item) => item.id === pricingSlabId)
  return tier?.price ?? pricing.tiers.find((item) => item.id === 'tier2')?.price ?? 75
}
