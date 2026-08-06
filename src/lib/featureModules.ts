/** Canonical per-society licensing module registry (no global toggles). */

export const FEATURE_MODULE_KEYS = [
  'whatsapp_automation',
  'election_module',
  'ai_rwa_audit',
  'smart_parking',
  'vendor_sla',
  'resident_marketplace',
  'mai_commute',
  'kid_gatekeeper',
  'amenity_booking',
  'mai_emergency_sos',
  'mai_auditor',
  'mai_energy',
  'mai_vote_recall',
  'mai_guardian',
  'mai_nyaya',
  'mai_find_asset',
  'mai_botanist',
  'mai_space',
  'mai_list'
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
    description: 'Secure society elections with anonymous ballots and live turnout (premium add-on).',
    tier: 'premium',
    defaultEnabled: false,
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
    label: 'Smart Parking Marketplace',
    description: 'Hourly visitor monetization and monthly slot leases with UPI credits — zero IoT.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/resident/parking-marketplace', '/resident/smart-parking', '/rwa/smart-parking'],
    dashboardCta: 'Parking Marketplace'
  },
  {
    key: 'vendor_sla',
    label: 'Vendor SLA Tracking',
    description: 'Daily resident ratings for housekeeping/security with monthly compliance scores (premium add-on).',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/resident/vendor-sla', '/rwa/vendor-sla'],
    dashboardCta: 'Vendor SLA'
  },
  {
    key: 'resident_marketplace',
    label: 'Resident Marketplace',
    description: 'Peer-to-peer resident listings and community exchange board (premium add-on).',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/resident/marketplace'],
    dashboardCta: 'Marketplace'
  },
  {
    key: 'mai_commute',
    label: 'maiCommute Carpool',
    description: 'Zero-commission in-society ride sharing with verified neighbors.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/resident/carpool'],
    dashboardCta: 'maiCommute'
  },
  {
    key: 'kid_gatekeeper',
    label: 'Kid Safety Gate Alert',
    description: 'Parent pre-approvals and loud alerts for unaccompanied minor exits.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/resident/kid-safety', '/gatekeeper/entry'],
    dashboardCta: 'Kid Safety'
  },
  {
    key: 'amenity_booking',
    label: 'Clubhouse & Amenity Booking',
    description: 'Instant facility slot reservations with double-booking protection.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/resident/amenities', '/admin/amenities'],
    dashboardCta: 'Amenities'
  },
  {
    key: 'mai_emergency_sos',
    label: 'maiEmergency SOS',
    description: '1-tap medical & security emergency dispatch to guards and volunteers — phones only.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/resident/sos', '/admin/emergency-logs'],
    dashboardCta: 'Emergency SOS'
  },
  {
    key: 'mai_auditor',
    label: 'mAI Auditor',
    description: 'Predictive financial leakage detection and vendor invoice anomaly scoring.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/admin/audit'],
    dashboardCta: 'mAI Auditor'
  },
  {
    key: 'mai_energy',
    label: 'maiEnergy P2P Trading',
    description: 'Peer-to-peer energy credit transfers between verified flats.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/resident/intelligence'],
    dashboardCta: 'maiEnergy'
  },
  {
    key: 'mai_vote_recall',
    label: 'mAI Vote Recall',
    description: 'Cryptographic 1-Flat-1-Vote impeachment / recall motions.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/resident/intelligence'],
    dashboardCta: 'Recall Votes'
  },
  {
    key: 'mai_guardian',
    label: 'mAI Guardian Watch',
    description: 'Family check-in windows and guard-desk vehicle flag alerts — phones only.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/gatekeeper/intelligence', '/resident/intelligence'],
    dashboardCta: 'Guardian'
  },
  {
    key: 'mai_nyaya',
    label: 'mAI Nyaya Mediation',
    description: 'AI dispute resolution drafts mapped to society bylaws.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/resident/intelligence'],
    dashboardCta: 'mAI Nyaya'
  },
  {
    key: 'mai_find_asset',
    label: 'mAI Find',
    description: 'Paired Bluetooth wearables (RSSI / proximity ping) plus Gate 1 Lost & Found photos for physical items.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/resident/find-asset', '/resident/paired-assets'],
    dashboardCta: 'mAI Find'
  },
  {
    key: 'mai_botanist',
    label: 'mAI Botanist & Green Society',
    description: 'QR plant tagging, AI plant doctor, compost delivery, and plant swap exchange.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/resident/green-society', '/admin/landscape'],
    dashboardCta: 'Green Society'
  },
  {
    key: 'mai_space',
    label: 'mAI Space Interior Engine',
    description: 'TV sizing, acoustics, furniture fit, and verified interior vendor matching.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/resident/mai-space', '/admin/interior-partners'],
    dashboardCta: 'mAI Space'
  },
  {
    key: 'mai_list',
    label: 'maiList Rental & Resale',
    description: '1-click dual-engine syndication for flat rentals and resale across top portals.',
    tier: 'premium',
    defaultEnabled: false,
    routeHints: ['/resident/my-flat/rent-out', '/resident/rentals-marketplace'],
    dashboardCta: 'maiList'
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
    marketplace: 'resident_marketplace',
    mai_commute: 'mai_commute',
    carpool: 'mai_commute',
    kid_gatekeeper: 'kid_gatekeeper',
    kid_safety: 'kid_gatekeeper',
    amenity_booking: 'amenity_booking',
    amenities: 'amenity_booking',
    mai_emergency_sos: 'mai_emergency_sos',
    sos: 'mai_emergency_sos',
    emergency_sos: 'mai_emergency_sos',
    mai_auditor: 'mai_auditor',
    auditor: 'mai_auditor',
    mai_energy: 'mai_energy',
    energy: 'mai_energy',
    mai_vote_recall: 'mai_vote_recall',
    recall: 'mai_vote_recall',
    mai_guardian: 'mai_guardian',
    guardian: 'mai_guardian',
    mai_nyaya: 'mai_nyaya',
    nyaya: 'mai_nyaya',
    mai_find_asset: 'mai_find_asset',
    find_asset: 'mai_find_asset',
    mai_botanist: 'mai_botanist',
    botanist: 'mai_botanist',
    green_society: 'mai_botanist',
    mai_space: 'mai_space',
    space: 'mai_space',
    interior: 'mai_space',
    mai_list: 'mai_list',
    mailist: 'mai_list',
    rental_syndication: 'mai_list'
  }
  return aliases[key] ?? (isFeatureModuleName(key) ? key : null)
}

export function getFeatureModuleMeta(key: FeatureModuleName): FeatureModuleMeta {
  return FEATURE_MODULE_CATALOG.find((item) => item.key === key)!
}
