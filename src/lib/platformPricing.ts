import {
  DEFAULT_PLATFORM_PRICING,
  DEFAULT_PREMIUM_ADDONS,
  PLATFORM_PRICING_SYSTEM_CONFIG_KEY,
  type ElectionAddonPricing,
  type ElectionBillingMode,
  type PlatformPricingConfig,
  type PlatformTierConfig,
  type PremiumAddonsPricingConfig,
  type PricingTierId,
  type VoiceHelpdeskAddonPricing,
  type WhatsAppAddonPricing
} from '../../types/platform-pricing'

export type {
  ElectionAddonPricing,
  ElectionBillingMode,
  PlatformPricingConfig,
  PlatformTierConfig,
  PremiumAddonsPricingConfig,
  PricingTierId,
  VoiceHelpdeskAddonPricing,
  WhatsAppAddonPricing
}

export { DEFAULT_PLATFORM_PRICING, DEFAULT_PREMIUM_ADDONS, PLATFORM_PRICING_SYSTEM_CONFIG_KEY }

export const PRICING_STORAGE_KEY = 'syncra-pricing-config'
export const PRICING_UPDATED_EVENT = 'syncra-pricing-updated'

function normalizePremiumAddons(raw: Partial<PremiumAddonsPricingConfig> | null | undefined): PremiumAddonsPricingConfig {
  const base = DEFAULT_PREMIUM_ADDONS
  const whatsapp = raw?.whatsapp
  const voiceHelpdesk = raw?.voiceHelpdesk
  const elections = raw?.elections

  const billingMode: ElectionBillingMode =
    elections?.billingMode === 'per_event' ? 'per_event' : 'monthly'

  return {
    whatsapp: {
      baseMonthlyPriceInr: Number(whatsapp?.baseMonthlyPriceInr ?? base.whatsapp.baseMonthlyPriceInr),
      includedMessagesPerMonth: Number(
        whatsapp?.includedMessagesPerMonth ?? base.whatsapp.includedMessagesPerMonth
      ),
      overageBlockSize: Number(whatsapp?.overageBlockSize ?? base.whatsapp.overageBlockSize),
      overageBlockPriceInr: Number(whatsapp?.overageBlockPriceInr ?? base.whatsapp.overageBlockPriceInr)
    },
    voiceHelpdesk: {
      monthlyFlatFeeInr: Number(voiceHelpdesk?.monthlyFlatFeeInr ?? base.voiceHelpdesk.monthlyFlatFeeInr)
    },
    elections: {
      billingMode,
      monthlyFeeInr: Number(elections?.monthlyFeeInr ?? base.elections.monthlyFeeInr),
      perEventFeeInr: Number(elections?.perEventFeeInr ?? base.elections.perEventFeeInr)
    }
  }
}

export function normalizePricing(raw: Partial<PlatformPricingConfig> | null | undefined): PlatformPricingConfig {
  const base = DEFAULT_PLATFORM_PRICING
  if (!raw) {
    return {
      ...base,
      tiers: base.tiers.map((tier) => ({ ...tier })),
      premiumAddons: normalizePremiumAddons(null)
    }
  }

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
    activationFeeInr: Number(
      raw.activationFeeInr ?? (raw as { activationFee?: number }).activationFee ?? base.activationFeeInr
    ),
    tiers,
    premiumAddons: normalizePremiumAddons(raw.premiumAddons),
    updatedAt: raw.updatedAt
  }
}

export function getPlatformPricing(): PlatformPricingConfig {
  if (typeof window === 'undefined') return normalizePricing(null)
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

export function formatWhatsAppAddonPrice(config: WhatsAppAddonPricing) {
  return `${formatInr(config.baseMonthlyPriceInr)}/month · ${config.includedMessagesPerMonth.toLocaleString('en-IN')} alerts included`
}

export function formatVoiceHelpdeskAddonPrice(config: VoiceHelpdeskAddonPricing) {
  return `${formatInr(config.monthlyFlatFeeInr)}/month per society`
}

export function formatElectionAddonPrice(config: ElectionAddonPricing) {
  if (config.billingMode === 'per_event') {
    return `${formatInr(config.perEventFeeInr)}/election event`
  }
  return `${formatInr(config.monthlyFeeInr)}/month per society`
}

export function calculateWhatsAppOverageCost(messageCount: number, config: WhatsAppAddonPricing) {
  const included = Math.max(0, config.includedMessagesPerMonth)
  const blockSize = Math.max(1, config.overageBlockSize)
  const extra = Math.max(0, messageCount - included)
  const blocks = Math.ceil(extra / blockSize)
  return {
    messageCount,
    includedMessages: included,
    overageMessages: extra,
    overageBlocks: blocks,
    overageCostInr: blocks * Math.max(0, config.overageBlockPriceInr)
  }
}

export function resolvePremiumAddonMonthlyFee(
  addon: keyof PremiumAddonsPricingConfig,
  config: PremiumAddonsPricingConfig = getPlatformPricing().premiumAddons
): number {
  if (addon === 'whatsapp') return config.whatsapp.baseMonthlyPriceInr
  if (addon === 'voiceHelpdesk') return config.voiceHelpdesk.monthlyFlatFeeInr
  return config.elections.billingMode === 'monthly' ? config.elections.monthlyFeeInr : 0
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function getSuperAdminKey() {
  return (
    import.meta.env.VITE_SUPER_ADMIN_SECRET?.trim() ||
    import.meta.env.NEXT_PUBLIC_SUPER_ADMIN_SECRET?.trim() ||
    ''
  )
}

/** Mirror pricing JSON to Supabase system_configs when admin API is reachable. */
export async function syncPlatformPricingToSystemConfigs(
  config: PlatformPricingConfig
): Promise<boolean> {
  const adminKey = getSuperAdminKey()
  if (!adminKey) return false

  try {
    const res = await fetch(`${API_BASE}/api/admin/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-super-admin-key': adminKey
      },
      body: JSON.stringify({
        key: PLATFORM_PRICING_SYSTEM_CONFIG_KEY,
        value: JSON.stringify(normalizePricing(config)),
        description: 'SaaS tier and premium add-on pricing engine'
      })
    })
    return res.ok
  } catch {
    return false
  }
}

/** Load pricing from system_configs via admin API (fallback when local cache is empty). */
export async function fetchPlatformPricingFromSystemConfigs(): Promise<PlatformPricingConfig | null> {
  const adminKey = getSuperAdminKey()
  if (!adminKey) return null

  try {
    const res = await fetch(`${API_BASE}/api/admin/config`, {
      headers: { 'x-super-admin-key': adminKey }
    })
    if (!res.ok) return null
    const rows = (await res.json()) as Array<{ key: string; value: string }>
    const row = rows.find((item) => item.key === PLATFORM_PRICING_SYSTEM_CONFIG_KEY)
    if (!row?.value) return null
    return normalizePricing(JSON.parse(row.value) as PlatformPricingConfig)
  } catch {
    return null
  }
}

/** Load pricing from /api/platform/pricing, system_configs, then browser storage. */
export async function fetchPlatformPricing(): Promise<PlatformPricingConfig> {
  try {
    const res = await fetch(`${API_BASE}/api/platform/pricing`)
    if (res.ok) {
      const data = normalizePricing((await res.json()) as PlatformPricingConfig)
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(data))
      return data
    }
  } catch {
    // fall through
  }

  const local = getPlatformPricing()
  const hasLocalOverride = Boolean(localStorage.getItem(PRICING_STORAGE_KEY))
  if (hasLocalOverride) return local

  const remote = await fetchPlatformPricingFromSystemConfigs()
  if (remote) {
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(remote))
    return remote
  }

  return local
}

/** Persist pricing to browser, platform API, and system_configs. */
export async function savePlatformPricing(
  config: PlatformPricingConfig
): Promise<{ saved: PlatformPricingConfig; remoteSynced: boolean }> {
  const local = savePlatformPricingLocal(config)
  let saved = local
  let remoteSynced = false

  try {
    const res = await fetch(`${API_BASE}/api/platform/pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(local)
    })
    if (res.ok) {
      saved = normalizePricing((await res.json()) as PlatformPricingConfig)
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(saved))
      window.dispatchEvent(new CustomEvent(PRICING_UPDATED_EVENT, { detail: saved }))
    }
  } catch {
    // API offline — local save still applies.
  }

  if (await syncPlatformPricingToSystemConfigs(saved)) {
    remoteSynced = true
  }

  return { saved, remoteSynced }
}
