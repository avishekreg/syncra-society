import type { LostAssetSignal, LostAssetType } from '../types/db'
import { restGet, restPatch, restPost, supabaseRestUrl, getSupabaseRestHeaders } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { dispatchPushNotification } from '../lib/pushNotifications'

let localMode = false
let localAssets: LostAssetSignal[] = []
let localQueue: BleSignalQueueItem[] = []

export type BleSignalQueueItem = {
  id: string
  society_id: string
  ble_fingerprint: string
  location_label: string
  rssi?: number | null
  detected_by_user_id?: string | null
  processed_at?: string | null
  matched_asset_id?: string | null
  created_at: string
}

function rid(prefix = 'asset') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function fingerprint(assetName: string, assetType: LostAssetType) {
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
  bleFingerprint?: string
}): Promise<LostAssetSignal> {
  const payload = {
    society_id: input.societyId,
    owner_user_id: input.ownerUserId,
    owner_flat_number: input.ownerFlatNumber ?? null,
    asset_name: input.assetName.trim(),
    asset_type: input.assetType,
    last_seen_location: input.lastSeenLocation?.trim() || 'Last known: Tower lobby mesh',
    last_seen_at: new Date().toISOString(),
    ble_fingerprint: input.bleFingerprint || fingerprint(input.assetName, input.assetType),
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

/** Community device / native BLE scanner enqueues a raw signal for background matching. */
export async function enqueueBleSignal(input: {
  societyId: string
  bleFingerprint: string
  locationLabel: string
  rssi?: number
  detectedByUserId?: string
}): Promise<BleSignalQueueItem> {
  const payload = {
    society_id: input.societyId,
    ble_fingerprint: input.bleFingerprint.trim(),
    location_label: input.locationLabel.trim(),
    rssi: input.rssi ?? null,
    detected_by_user_id: input.detectedByUserId || null
  }

  if (localMode) {
    const row: BleSignalQueueItem = {
      id: rid('ble'),
      created_at: new Date().toISOString(),
      processed_at: null,
      matched_asset_id: null,
      ...payload
    }
    localQueue.unshift(row)
    return row
  }
  try {
    return await restPost<BleSignalQueueItem>('ble_signal_queue', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return enqueueBleSignal(input)
  }
}

async function callRpcMatch(queueId: string): Promise<LostAssetSignal | null> {
  const res = await fetch(supabaseRestUrl('rpc/match_ble_signal'), {
    method: 'POST',
    headers: getSupabaseRestHeaders(),
    body: JSON.stringify({ p_queue_id: queueId })
  })
  const text = await res.text()
  if (!res.ok) throw new Error(text || 'match_ble_signal failed')
  if (!text || text === 'null') return null
  return JSON.parse(text) as LostAssetSignal
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

  let row: LostAssetSignal
  if (localMode) {
    const found = localAssets.find((a) => a.id === input.assetId)
    if (!found) throw new Error('Asset not found')
    Object.assign(found, patch)
    row = found
  } else {
    try {
      row = await restPatch<LostAssetSignal>(`lost_asset_signals?id=eq.${input.assetId}`, patch)
    } catch (err) {
      if (!shouldUseLocalFallback(err)) throw err
      localMode = true
      return reportAssetSighting(input)
    }
  }

  await dispatchPushNotification({
    societyId: row.society_id,
    type: 'system.alert',
    title: 'Asset mesh ping',
    body: `${row.asset_name} spotted near ${input.locationLabel}.`,
    url: '/resident/find-asset',
    audience: 'flat',
    flatId: row.owner_flat_number || undefined,
    metadata: { assetId: row.id, silent: false }
  }).catch(() => undefined)

  return row
}

/**
 * Drain pending BLE queue and auto-match fingerprints to LOST assets.
 * Triggers owner location-pin push on match.
 */
export async function processBleSignalQueue(societyId: string): Promise<LostAssetSignal[]> {
  const matched: LostAssetSignal[] = []

  if (localMode) {
    const pending = localQueue.filter((q) => q.society_id === societyId && !q.processed_at)
    for (const item of pending) {
      const asset = localAssets.find(
        (a) =>
          a.society_id === societyId &&
          a.status === 'LOST' &&
          a.ble_fingerprint === item.ble_fingerprint
      )
      item.processed_at = new Date().toISOString()
      if (asset) {
        asset.last_seen_location = item.location_label
        asset.last_seen_at = item.created_at
        asset.detected_by_user_id = item.detected_by_user_id
        item.matched_asset_id = asset.id
        matched.push(asset)
        await dispatchPushNotification({
          societyId,
          type: 'system.alert',
          title: 'Lost asset located',
          body: `${asset.asset_name} matched on mesh near ${item.location_label}.`,
          url: '/resident/find-asset',
          audience: 'flat',
          flatId: asset.owner_flat_number || undefined,
          metadata: { assetId: asset.id }
        }).catch(() => undefined)
      }
    }
    return matched
  }

  try {
    const pending = await restGet<BleSignalQueueItem[]>(
      `ble_signal_queue?society_id=eq.${societyId}&processed_at=is.null&order=created_at.asc&limit=40`
    )
    for (const item of pending) {
      try {
        const asset = await callRpcMatch(item.id)
        if (asset) {
          matched.push(asset)
          await dispatchPushNotification({
            societyId,
            type: 'system.alert',
            title: 'Lost asset located',
            body: `${asset.asset_name} matched on mesh near ${item.location_label}.`,
            url: '/resident/find-asset',
            audience: 'flat',
            flatId: asset.owner_flat_number || undefined,
            metadata: { assetId: asset.id }
          }).catch(() => undefined)
        }
      } catch {
        // Continue draining remaining queue items.
      }
    }
    return matched
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return processBleSignalQueue(societyId)
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
      y: 18 + ((index * 23) % 64),
      updatedAt: asset.last_seen_at
    }))
}
