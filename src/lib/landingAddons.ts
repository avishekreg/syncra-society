import type { FeatureModuleName } from './featureModules'

export const LANDING_CHECKOUT_INTENT_KEY = 'mai_landing_checkout_intent'

export type LandingAddonId =
  | 'whatsapp_automation'
  | 'election_module'
  | 'ai_rwa_audit'
  | 'smart_parking'
  | 'vendor_sla'
  | 'resident_marketplace'
  | 'mai_commute'
  | 'kid_gatekeeper'
  | 'amenity_booking'
  | 'mai_emergency_sos'
  | 'mai_auditor'
  | 'mai_energy'
  | 'mai_vote_recall'
  | 'mai_guardian'
  | 'mai_nyaya'
  | 'mai_find_asset'
  | 'mai_botanist'
  | 'mai_space'
  | 'mai_list'

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
  },
  {
    id: 'mai_commute',
    moduleName: 'mai_commute',
    label: 'maiCommute (In-Society Carpool)',
    shortLabel: 'maiCommute',
    description: 'Zero-commission peer-to-peer ride sharing with verified neighbors.',
    monthlyPriceInr: 99
  },
  {
    id: 'kid_gatekeeper',
    moduleName: 'kid_gatekeeper',
    label: 'Kid Safety Gate Alert',
    shortLabel: 'Kid Safety',
    description: 'Automated parent alerts for unaccompanied minor exits.',
    monthlyPriceInr: 149
  },
  {
    id: 'amenity_booking',
    moduleName: 'amenity_booking',
    label: 'Clubhouse & Amenity Booking',
    shortLabel: 'Amenities',
    description: 'Instant slot reservations & payment collection for facilities.',
    monthlyPriceInr: 199
  },
  {
    id: 'mai_emergency_sos',
    moduleName: 'mai_emergency_sos',
    label: 'maiEmergency SOS Mesh',
    shortLabel: 'Emergency SOS',
    description: '1-tap medical & security emergency dispatch to guards & volunteers.',
    monthlyPriceInr: 249
  },
  {
    id: 'mai_auditor',
    moduleName: 'mai_auditor',
    label: 'mAI Auditor',
    shortLabel: 'mAI Auditor',
    description: 'Predictive financial leakage detection & vendor invoice auditing.',
    monthlyPriceInr: 399
  },
  {
    id: 'mai_find_asset',
    moduleName: 'mai_find_asset',
    label: 'mAI Find Asset',
    shortLabel: 'Find Asset',
    description: 'Community Bluetooth mesh to locate lost phones, keys, and vehicles.',
    monthlyPriceInr: 149
  },
  {
    id: 'mai_nyaya',
    moduleName: 'mai_nyaya',
    label: 'mAI Nyaya Mediation',
    shortLabel: 'mAI Nyaya',
    description: 'Automated dispute resolution based on society bylaws.',
    monthlyPriceInr: 199
  },
  {
    id: 'mai_vote_recall',
    moduleName: 'mai_vote_recall',
    label: 'Impeachment / Recall Elections',
    shortLabel: 'Recall Votes',
    description: 'Cryptographic 1-Flat-1-Vote recall motions for committee accountability.',
    monthlyPriceInr: 299
  },
  {
    id: 'mai_energy',
    moduleName: 'mai_energy',
    label: 'maiEnergy P2P Trading',
    shortLabel: 'maiEnergy',
    description: 'Peer-to-peer energy credit transfers between verified flats.',
    monthlyPriceInr: 179
  },
  {
    id: 'mai_guardian',
    moduleName: 'mai_guardian',
    label: 'mAI Guardian Mesh',
    shortLabel: 'Guardian',
    description: 'Kid/senior geofence and unauthorized vehicle motion alerts.',
    monthlyPriceInr: 229
  },
  {
    id: 'mai_botanist',
    moduleName: 'mai_botanist',
    label: 'mAI Botanist & Green Society',
    shortLabel: 'mAI Botanist',
    description: 'QR plant tagging, AI plant doctor, compost delivery, and plant swap.',
    monthlyPriceInr: 249
  },
  {
    id: 'mai_space',
    moduleName: 'mai_space',
    label: 'mAI Space Interior Engine',
    shortLabel: 'mAI Space',
    description: 'TV sizing, acoustics, furniture fit, and verified interior lead matching.',
    monthlyPriceInr: 199
  },
  {
    id: 'mai_list',
    moduleName: 'mai_list',
    label: 'maiList Rental & Resale Syndication',
    shortLabel: 'maiList',
    description: '1-click rent + resale syndication across major property portals and zero-brokerage networks.',
    monthlyPriceInr: 299
  }
]

/** Core base rate inclusions — never billed as modular add-ons. */
export const LANDING_BASE_INCLUSIONS = [
  'Billing & ledgers',
  'Notices & guidebook',
  'mAI Gatekeeper (staff passes, delivery pre-approve, visitors)',
  'Smart Helpdesk & Complaints',
  'Digital tenant onboarding workflow'
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
