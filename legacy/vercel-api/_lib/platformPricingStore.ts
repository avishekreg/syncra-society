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
  updatedAt?: string
}

const STORE_KEY = 'platform:pricing'

function normalize(input: Partial<PlatformPricingConfig> | null | undefined): PlatformPricingConfig {
  const base = defaultPricing as PlatformPricingConfig
  if (!input) return { ...base, tiers: base.tiers.map((t) => ({ ...t })) }

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
