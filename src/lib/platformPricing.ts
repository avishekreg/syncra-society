export type PricingTierId = 'tier1' | 'tier2' | 'tier3'

export type PlatformTierConfig = {
  id: PricingTierId
  label: string
  price: number
  description: string
  headline: string
  features: string[]
}

export type PlatformPricingConfig = {
  activationFeeInr: number
  tiers: PlatformTierConfig[]
  updatedAt?: string
}

export const PRICING_STORAGE_KEY = 'syncra-pricing-config'
export const PRICING_UPDATED_EVENT = 'syncra-pricing-updated'

export const DEFAULT_PLATFORM_PRICING: PlatformPricingConfig = {
  activationFeeInr: 2499,
  tiers: [
    {
      id: 'tier1',
      label: 'Tier 1',
      price: 149,
      headline: 'Small Societies',
      description: 'Basic society operations for up to 50 flats.',
      features: ['Resident dashboard', 'Notice Board', 'Syncra Gatekeeper', 'Basic ledger view']
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
  ]
}

function normalizePricing(raw: Partial<PlatformPricingConfig> | null | undefined): PlatformPricingConfig {
  const base = DEFAULT_PLATFORM_PRICING
  if (!raw) return { ...base, tiers: base.tiers.map((tier) => ({ ...tier })) }

  const tierMap = new Map((raw.tiers ?? []).map((tier) => [tier.id, tier]))
  const tiers = base.tiers.map((defaults) => {
    const saved = tierMap.get(defaults.id)
    return {
      ...defaults,
      ...saved,
      id: defaults.id,
      label: saved?.label ?? defaults.label,
      price: Number(saved?.price ?? defaults.price),
      headline: saved?.headline ?? defaults.headline,
      description: saved?.description ?? defaults.description,
      features: saved?.features?.length ? saved.features : defaults.features
    }
  })

  return {
    activationFeeInr: Number(raw.activationFeeInr ?? (raw as { activationFee?: number }).activationFee ?? base.activationFeeInr),
    tiers,
    updatedAt: raw.updatedAt
  }
}

export function getPlatformPricing(): PlatformPricingConfig {
  if (typeof window === 'undefined') return DEFAULT_PLATFORM_PRICING
  const saved = localStorage.getItem(PRICING_STORAGE_KEY)
  if (!saved) return normalizePricing(null)
  try {
    return normalizePricing(JSON.parse(saved) as PlatformPricingConfig)
  } catch {
    return normalizePricing(null)
  }
}

export function savePlatformPricingLocal(config: PlatformPricingConfig) {
  const payload: PlatformPricingConfig = {
    ...normalizePricing(config),
    updatedAt: new Date().toISOString()
  }
  localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(payload))
  window.dispatchEvent(new CustomEvent(PRICING_UPDATED_EVENT, { detail: payload }))
  return payload
}

export function getTierRate(pricingSlabId?: string | null, config = getPlatformPricing()): number {
  const tier = config.tiers.find((item) => item.id === pricingSlabId)
  return tier?.price ?? config.tiers.find((item) => item.id === 'tier2')?.price ?? 75
}

export function formatInr(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

/** Load pricing from /api/platform/pricing, falling back to browser storage. */
export async function fetchPlatformPricing(): Promise<PlatformPricingConfig> {
  try {
    const res = await fetch(`${API_BASE}/api/platform/pricing`)
    if (!res.ok) throw new Error('Pricing API unavailable')
    const data = (await res.json()) as PlatformPricingConfig
    const normalized = normalizePricing(data)
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(normalized))
    return normalized
  } catch {
    return getPlatformPricing()
  }
}

/** Persist pricing to browser + API so checkout uses the same values. */
export async function savePlatformPricing(config: PlatformPricingConfig): Promise<PlatformPricingConfig> {
  const local = savePlatformPricingLocal(config)
  try {
    const res = await fetch(`${API_BASE}/api/platform/pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(local)
    })
    if (res.ok) {
      const data = normalizePricing((await res.json()) as PlatformPricingConfig)
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(data))
      window.dispatchEvent(new CustomEvent(PRICING_UPDATED_EVENT, { detail: data }))
      return data
    }
  } catch {
    // API offline — local save still applies to marketing pages.
  }
  return local
}
