import { getSystemConfig } from '@/lib/config/system-config'
import {
  DEFAULT_PLATFORM_PRICING,
  PLATFORM_PRICING_SYSTEM_CONFIG_KEY,
  type PlatformPricingConfig
} from '@/types/platform-pricing'

function normalizePremiumAddons(raw: PlatformPricingConfig['premiumAddons'] | undefined) {
  const base = DEFAULT_PLATFORM_PRICING.premiumAddons
  const whatsapp = raw?.whatsapp ?? base.whatsapp
  const voiceHelpdesk = raw?.voiceHelpdesk ?? base.voiceHelpdesk
  const elections = raw?.elections ?? base.elections

  return {
    whatsapp: {
      baseMonthlyPriceInr: Number(whatsapp.baseMonthlyPriceInr ?? base.whatsapp.baseMonthlyPriceInr),
      includedMessagesPerMonth: Number(
        whatsapp.includedMessagesPerMonth ?? base.whatsapp.includedMessagesPerMonth
      ),
      overageBlockSize: Number(whatsapp.overageBlockSize ?? base.whatsapp.overageBlockSize),
      overageBlockPriceInr: Number(whatsapp.overageBlockPriceInr ?? base.whatsapp.overageBlockPriceInr)
    },
    voiceHelpdesk: {
      monthlyFlatFeeInr: Number(voiceHelpdesk.monthlyFlatFeeInr ?? base.voiceHelpdesk.monthlyFlatFeeInr)
    },
    elections: {
      billingMode: (elections.billingMode === 'per_event' ? 'per_event' : 'monthly') as 'monthly' | 'per_event',
      monthlyFeeInr: Number(elections.monthlyFeeInr ?? base.elections.monthlyFeeInr),
      perEventFeeInr: Number(elections.perEventFeeInr ?? base.elections.perEventFeeInr)
    }
  } as PlatformPricingConfig['premiumAddons']
}

export function normalizePlatformPricing(
  raw: Partial<PlatformPricingConfig> | null | undefined
): PlatformPricingConfig {
  const base = DEFAULT_PLATFORM_PRICING
  if (!raw) return { ...base, tiers: base.tiers.map((tier) => ({ ...tier })) }

  const tierMap = new Map((raw.tiers ?? []).map((tier) => [tier.id, tier]))
  return {
    activationFeeInr: Number(raw.activationFeeInr ?? base.activationFeeInr),
    tiers: base.tiers.map((defaults) => {
      const saved = tierMap.get(defaults.id)
      return {
        ...defaults,
        ...saved,
        id: defaults.id,
        price: Number(saved?.price ?? defaults.price)
      }
    }),
    premiumAddons: normalizePremiumAddons(raw.premiumAddons),
    updatedAt: raw.updatedAt
  }
}

/** Authoritative pricing for server-side billing — system_configs with static defaults. */
export async function loadPlatformPricingConfig(): Promise<PlatformPricingConfig> {
  const raw = await getSystemConfig(PLATFORM_PRICING_SYSTEM_CONFIG_KEY)
  if (!raw) return normalizePlatformPricing(null)

  try {
    return normalizePlatformPricing(JSON.parse(raw) as PlatformPricingConfig)
  } catch {
    return normalizePlatformPricing(null)
  }
}

export async function getTierRateInr(pricingSlabId?: string | null) {
  const pricing = await loadPlatformPricingConfig()
  const tier = pricing.tiers.find((item) => item.id === pricingSlabId)
  return tier?.price ?? pricing.tiers.find((item) => item.id === 'tier2')?.price ?? 75
}

export async function getActivationFeeInr() {
  return (await loadPlatformPricingConfig()).activationFeeInr
}
