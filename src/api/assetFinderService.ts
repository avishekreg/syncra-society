import type { LostAssetSignal, LostAssetType } from '../types/db'
import { restGet, restPatch, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'

let localMode = false
let localAssets: LostAssetSignal[] = []

function rid() {
  return `asset-${Math.random().toString(36).slice(2, 10)}`
}

function fingerprint(assetName: string, assetType: LostAssetType) {
  let hash = 0
  const seed = `${assetType}:${assetName}`.toLowerCase()
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 33 + seed.charCodeAt(i)) >>> 0
  return `BLE-${assetType.slice(0, 3)}-${hash.toString(16).padStart(8, '0')}`
}

export async function markAssetLost(input: {
  societyId: string
  ownerUserId: string
  ownerFlatNumber?: string
  assetName: string
  assetType: LostAssetType
  lastSeenLocation?: string
}): Promise<LostAssetSignal> {
  const payload = {
    society_id: input.societyId,
    owner_user_id: input.ownerUserId,
    owner_flat_number: input.ownerFlatNumber ?? null,
    asset_name: input.assetName.trim(),
    asset_type: input.assetType,
    last_seen_location: input.lastSeenLocation?.trim() || 'Last known: Tower lobby mesh',
    last_seen_at: new Date().toISOString(),
    ble_fingerprint: fingerprint(input.assetName, input.assetType),
    status: 'LOST' as const,
    detected_by_user_id: null
  }

  if (localMode) {
    const row: LostAssetSignal = { id: rid(), created_at: new Date().toISOString(), ...payload }
    localAssets.unshift(row)
    return row
  }
  try {
    return await restPost<LostAssetSignal>('lost_asset_signals', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return markAssetLost(input)
  }
}

export async function listLostAssets(societyId: string): Promise<LostAssetSignal[]> {
  if (localMode) return localAssets.filter((a) => a.society_id === societyId)
  try {
    return await restGet<LostAssetSignal[]>(
      `lost_asset_signals?society_id=eq.${societyId}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listLostAssets(societyId)
  }
}

/** Community device reports a BLE sighting — notify owner by updating last-seen. */
export async function reportAssetSighting(input: {
  assetId: string
  detectedByUserId: string
  locationLabel: string
}): Promise<LostAssetSignal> {
  const patch = {
    last_seen_location: input.locationLabel,
    last_seen_at: new Date().toISOString(),
    detected_by_user_id: input.detectedByUserId
  }

  if (localMode) {
    const row = localAssets.find((a) => a.id === input.assetId)
    if (!row) throw new Error('Asset not found')
    Object.assign(row, patch)
    return row
  }
  try {
    return await restPatch<LostAssetSignal>(`lost_asset_signals?id=eq.${input.assetId}`, patch)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return reportAssetSighting(input)
  }
}

export async function markAssetFound(assetId: string): Promise<LostAssetSignal> {
  if (localMode) {
    const row = localAssets.find((a) => a.id === assetId)
    if (!row) throw new Error('Asset not found')
    row.status = 'FOUND'
    return row
  }
  try {
    return await restPatch<LostAssetSignal>(`lost_asset_signals?id=eq.${assetId}`, { status: 'FOUND' })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return markAssetFound(assetId)
  }
}

export function societyMapPins(assets: LostAssetSignal[]) {
  const zones = ['North Gate', 'Clubhouse lawn', 'Basement B2', 'Tower A lobby', 'Kids park', 'Visitor parking']
  return assets
    .filter((a) => a.status === 'LOST')
    .map((asset, index) => ({
      id: asset.id,
      label: asset.asset_name,
      type: asset.asset_type,
      location: asset.last_seen_location || zones[index % zones.length],
      x: 12 + ((index * 17) % 76),
      y: 18 + ((index * 23) % 64)
    }))
}
