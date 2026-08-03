/** Canonical Super Admin feature-toggle module keys. */

export const FEATURE_MODULE_KEYS = [
  'election_module',
  'ai_rwa_audit',
  'smart_parking',
  'vendor_sla',
  'resident_marketplace'
] as const

export type FeatureModuleName = (typeof FEATURE_MODULE_KEYS)[number]

export type FeatureModuleMeta = {
  key: FeatureModuleName
  label: string
  description: string
  routeHints: string[]
}

export const FEATURE_MODULE_CATALOG: FeatureModuleMeta[] = [
  {
    key: 'election_module',
    label: 'Election Module',
    description: 'Secure society elections with anonymous ballots and live turnout.',
    routeHints: ['/resident/elections', '/admin/elections']
  },
  {
    key: 'ai_rwa_audit',
    label: 'AI RWA Audit Engine',
    description: 'Monthly Society Health Index from collections, utilities, and complaint SLA.',
    routeHints: ['/rwa/ai-rwa-audit', '/resident/society-health']
  },
  {
    key: 'smart_parking',
    label: 'Smart Parking',
    description: 'Crowdsourced slot sharing based on out-of-station status — no IoT hardware.',
    routeHints: ['/resident/smart-parking', '/rwa/smart-parking']
  },
  {
    key: 'vendor_sla',
    label: 'Vendor SLA Tracking',
    description: 'Daily resident ratings for housekeeping/security with monthly compliance scores.',
    routeHints: ['/resident/vendor-sla', '/rwa/vendor-sla']
  },
  {
    key: 'resident_marketplace',
    label: 'Resident Marketplace',
    description: 'Peer-to-peer resident listings and community exchange board.',
    routeHints: ['/resident/marketplace']
  }
]

export function isFeatureModuleName(value: string): value is FeatureModuleName {
  return (FEATURE_MODULE_KEYS as readonly string[]).includes(value)
}
