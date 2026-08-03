/** Canonical per-society licensing module registry (no global toggles). */

export const FEATURE_MODULE_KEYS = [
  'whatsapp_automation',
  'election_module',
  'ai_rwa_audit',
  'smart_parking',
  'vendor_sla',
  'resident_marketplace'
] as const

export type FeatureModuleName = (typeof FEATURE_MODULE_KEYS)[number]

export type FeatureModuleTier = 'core' | 'premium'
export type FeatureToggleSource = 'base' | 'purchased' | 'super_admin'

export type FeatureModuleMeta = {
  key: FeatureModuleName
  label: string
  description: string
  tier: FeatureModuleTier
  /** Default when a society is created (base plan). */
  defaultEnabled: boolean
  routeHints: string[]
  dashboardCta?: string
}

export const FEATURE_MODULE_CATALOG: FeatureModuleMeta[] = [
  {
    key: 'whatsapp_automation',
    label: 'WhatsApp Automation',
    description: 'Live WhatsApp alerts for notices, payments, and gate events (₹499/mo add-on).',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/rwa/whatsapp', '/admin/notices'],
    dashboardCta: 'WhatsApp Integration'
  },
  {
    key: 'election_module',
    label: 'Election Module',
    description: 'Secure society elections with anonymous ballots and live turnout.',
    tier: 'core',
    defaultEnabled: true,
    routeHints: ['/resident/elections', '/rwa/elections'],
    dashboardCta: 'Elections'
  },
  {
    key: 'ai_rwa_audit',
    label: 'AI RWA Audit Engine',
    description: 'Monthly Society Health Index from collections, utilities, and complaint SLA.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/rwa/ai-rwa-audit', '/resident/society-health'],
    dashboardCta: 'AI Audit'
  },
  {
    key: 'smart_parking',
    label: 'Smart Parking',
    description: 'Crowdsourced slot sharing based on out-of-station status — no IoT hardware.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/resident/smart-parking', '/rwa/smart-parking'],
    dashboardCta: 'Smart Parking'
  },
  {
    key: 'vendor_sla',
    label: 'Vendor SLA Tracking',
    description: 'Daily resident ratings for housekeeping/security with monthly compliance scores.',
    tier: 'core',
    defaultEnabled: true,
    routeHints: ['/resident/vendor-sla', '/rwa/vendor-sla'],
    dashboardCta: 'Vendor SLA'
  },
  {
    key: 'resident_marketplace',
    label: 'Resident Marketplace',
    description: 'Peer-to-peer resident listings and community exchange board.',
    tier: 'core',
    defaultEnabled: true,
    routeHints: ['/resident/marketplace'],
    dashboardCta: 'Marketplace'
  }
]

export const CORE_FEATURE_MODULES = FEATURE_MODULE_CATALOG.filter((m) => m.tier === 'core').map(
  (m) => m.key
)

export const PREMIUM_FEATURE_MODULES = FEATURE_MODULE_CATALOG.filter((m) => m.tier === 'premium').map(
  (m) => m.key
)

export function isFeatureModuleName(value: string): value is FeatureModuleName {
  return (FEATURE_MODULE_KEYS as readonly string[]).includes(value)
}

/** Normalize checkout/webhook aliases → canonical feature_toggles.module_name */
export function normalizeLicensedModule(raw: string | null | undefined): FeatureModuleName | null {
  if (!raw) return null
  const key = raw.trim()
  const aliases: Record<string, FeatureModuleName> = {
    whatsapp_automation: 'whatsapp_automation',
    whatsapp_alerts: 'whatsapp_automation',
    whatsappAlerts: 'whatsapp_automation',
    whatsapp: 'whatsapp_automation',
    election_module: 'election_module',
    election_engine: 'election_module',
    electionModule: 'election_module',
    elections: 'election_module',
    ai_rwa_audit: 'ai_rwa_audit',
    ai_audit: 'ai_rwa_audit',
    smart_parking: 'smart_parking',
    smartParking: 'smart_parking',
    vendor_sla: 'vendor_sla',
    vendorSla: 'vendor_sla',
    resident_marketplace: 'resident_marketplace',
    marketplace: 'resident_marketplace'
  }
  return aliases[key] ?? (isFeatureModuleName(key) ? key : null)
}

export function getFeatureModuleMeta(key: FeatureModuleName): FeatureModuleMeta {
  return FEATURE_MODULE_CATALOG.find((item) => item.key === key)!
}
