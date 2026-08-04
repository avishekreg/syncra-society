import type { FeatureModuleName } from './featureModules'

export const LANDING_CHECKOUT_INTENT_KEY = 'mai_landing_checkout_intent'

export type LandingAddonId =
  | 'whatsapp_automation'
  | 'election_module'
  | 'ai_rwa_audit'
  | 'smart_parking'
  | 'vendor_sla'
  | 'resident_marketplace'

export type LandingAddon = {
  id: LandingAddonId
  moduleName: FeatureModuleName
  label: string
  shortLabel: string
  description: string
  monthlyPriceInr: number
}

/** Modular premium add-ons for the landing pricing calculator (not part of base rate). */
export const LANDING_ADDONS: LandingAddon[] = [
  {
    id: 'whatsapp_automation',
    moduleName: 'whatsapp_automation',
    label: 'WhatsApp AI Bot Automation',
    shortLabel: 'WhatsApp Bot',
    description: '24/7 resident query resolution & guidebook lookup.',
    monthlyPriceInr: 499
  },
  {
    id: 'election_module',
    moduleName: 'election_module',
    label: 'Secret Digital Elections',
    shortLabel: 'Digital Elections',
    description: '1-Flat-1-Vote secrecy, live turnout, and scheduled result reveal.',
    monthlyPriceInr: 599
  },
  {
    id: 'ai_rwa_audit',
    moduleName: 'ai_rwa_audit',
    label: 'AI RWA Audit Engine',
    shortLabel: 'AI Audit',
    description: '0–100 Society Health Index with collection & SLA signals.',
    monthlyPriceInr: 299
  },
  {
    id: 'smart_parking',
    moduleName: 'smart_parking',
    label: 'Smart Crowdsourced Parking',
    shortLabel: 'Smart Parking',
    description: 'Visitor bay allocation from out-of-station status — zero IoT.',
    monthlyPriceInr: 199
  },
  {
    id: 'vendor_sla',
    moduleName: 'vendor_sla',
    label: 'Vendor SLA Tracking',
    shortLabel: 'Vendor SLA',
    description: 'Daily service scoring & monthly compliance audits.',
    monthlyPriceInr: 199
  },
  {
    id: 'resident_marketplace',
    moduleName: 'resident_marketplace',
    label: 'Hyperlocal Resident Marketplace',
    shortLabel: 'Marketplace',
    description: 'Trusted peer-to-peer community buy/sell portal.',
    monthlyPriceInr: 149
  }
]

/** Core base rate inclusions — never billed as modular add-ons. */
export const LANDING_BASE_INCLUSIONS = [
  'Billing & ledgers',
  'Notices & guidebook',
  'mAI Gatekeeper',
  'Smart Helpdesk & Complaints'
] as const

export type LandingCheckoutIntent = {
  flats: number
  billing: 'monthly' | 'annual'
  tierId: string
  addons: LandingAddonId[]
  createdAt: string
}

export function saveLandingCheckoutIntent(intent: LandingCheckoutIntent) {
  sessionStorage.setItem(LANDING_CHECKOUT_INTENT_KEY, JSON.stringify(intent))
}

export function readLandingCheckoutIntent(): LandingCheckoutIntent | null {
  try {
    const raw = sessionStorage.getItem(LANDING_CHECKOUT_INTENT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as LandingCheckoutIntent
  } catch {
    return null
  }
}

export function clearLandingCheckoutIntent() {
  sessionStorage.removeItem(LANDING_CHECKOUT_INTENT_KEY)
}

export function buildOnboardingHref(intent: LandingCheckoutIntent) {
  const params = new URLSearchParams()
  params.set('flats', String(intent.flats))
  params.set('billing', intent.billing)
  params.set('tier', intent.tierId)
  if (intent.addons.length) params.set('addons', intent.addons.join(','))
  return `/onboarding?${params.toString()}`
}
