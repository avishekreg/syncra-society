/**
 * Strategic module visibility registry.
 * Soft-disables modules without deleting code — draft modules stay in Super Admin only.
 */

import type { FeatureModuleName } from '../lib/featureModules'

export type ModuleVisibilityStatus = 'live' | 'draft_admin_only' | 'retired'

export type ModuleRegistryEntry = {
  key: FeatureModuleName
  status: ModuleVisibilityStatus
  /** Short reason shown in Super Admin Feature Controls */
  draftNote?: string
}

/** Soft-disabled modules — code retained, public/resident/RWA surfaces hide them. */
export const DRAFT_ADMIN_ONLY_MODULES = [
  'mai_space',
  'mai_botanist',
  'mai_find_asset'
] as const satisfies readonly FeatureModuleName[]

export type DraftAdminOnlyModule = (typeof DRAFT_ADMIN_ONLY_MODULES)[number]

export const MODULE_REGISTRY: ModuleRegistryEntry[] = [
  { key: 'whatsapp_automation', status: 'live' },
  { key: 'election_module', status: 'live' },
  { key: 'ai_rwa_audit', status: 'live' },
  { key: 'smart_parking', status: 'live' },
  { key: 'vendor_sla', status: 'live' },
  { key: 'resident_marketplace', status: 'live' },
  { key: 'mai_commute', status: 'live' },
  { key: 'kid_gatekeeper', status: 'live' },
  { key: 'amenity_booking', status: 'live' },
  { key: 'mai_emergency_sos', status: 'live' },
  { key: 'mai_auditor', status: 'live' },
  { key: 'mai_energy', status: 'live' },
  { key: 'mai_vote_recall', status: 'live' },
  { key: 'mai_guardian', status: 'live' },
  { key: 'mai_nyaya', status: 'live' },
  {
    key: 'mai_find_asset',
    status: 'draft_admin_only',
    draftNote: 'Parked — low utility vs paired BT + Gate L&F; Super Admin draft only.'
  },
  {
    key: 'mai_botanist',
    status: 'draft_admin_only',
    draftNote: 'Parked Green Society / Botanist — Super Admin draft only.'
  },
  {
    key: 'mai_space',
    status: 'draft_admin_only',
    draftNote: 'Parked Interior Engine — Super Admin draft only.'
  },
  { key: 'mai_list', status: 'live' },
  { key: 'mai_maintain', status: 'live' }
]

const byKey = new Map(MODULE_REGISTRY.map((row) => [row.key, row]))

export function getModuleRegistryEntry(key: FeatureModuleName): ModuleRegistryEntry | undefined {
  return byKey.get(key)
}

export function getModuleVisibility(key: FeatureModuleName): ModuleVisibilityStatus {
  return byKey.get(key)?.status ?? 'live'
}

export function isDraftAdminOnlyModule(key: FeatureModuleName | string): boolean {
  return getModuleVisibility(key as FeatureModuleName) === 'draft_admin_only'
}

/** True when module may appear on landing, resident/RWA nav, and licensing menus. */
export function isPublicFacingModule(key: FeatureModuleName | string): boolean {
  return getModuleVisibility(key as FeatureModuleName) === 'live'
}

export function listDraftAdminOnlyModules(): FeatureModuleName[] {
  return MODULE_REGISTRY.filter((row) => row.status === 'draft_admin_only').map((row) => row.key)
}

export function listLiveModules(): FeatureModuleName[] {
  return MODULE_REGISTRY.filter((row) => row.status === 'live').map((row) => row.key)
}
