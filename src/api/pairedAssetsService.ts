/**
 * Paired Bluetooth accessories + community Lost & Found.
 * Honest scope: only the resident's own paired wearables/TWS/phones report disconnect/RSSI
 * via their phone OS — no society-wide mesh, no RFID, no tracking of non-electronic items digitally.
 */

import type {
  LostFoundPost,
  LostFoundCategory,
  LostFoundStatus,
  PairedBluetoothDevice,
  PairedDeviceSighting,
  PairedDeviceType
} from '../types/db'
import { restGet, restPatch, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'

let localMode = false
let localDevices: PairedBluetoothDevice[] = []
let localSightings: PairedDeviceSighting[] = []
let localLostFound: LostFoundPost[] = []

function rid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export const PAIRED_DEVICE_TYPES: Array<{ id: PairedDeviceType; label: string }> = [
  { id: 'SMARTWATCH', label: 'Smartwatch' },
  { id: 'TWS', label: 'TWS earbuds' },
  { id: 'SECONDARY_PHONE', label: 'Secondary phone' }
]

export const LOST_FOUND_CATEGORIES: Array<{ id: LostFoundCategory; label: string }> = [
  { id: 'KEYS', label: 'Keys' },
  { id: 'WALLET', label: 'Wallet' },
  { id: 'BAG', label: 'Bag / backpack' },
  { id: 'DOCUMENTS', label: 'Documents' },
  { id: 'OTHER', label: 'Other physical item' }
]

// ---------------------------------------------------------------------------
// Paired devices
// ---------------------------------------------------------------------------

export async function listPairedDevices(
  societyId: string,
  ownerUserId?: string
): Promise<PairedBluetoothDevice[]> {
  if (localMode) {
    return localDevices.filter(
      (d) => d.society_id === societyId && d.is_active && (!ownerUserId || d.owner_user_id === ownerUserId)
    )
  }
  try {
    let q = `paired_bluetooth_devices?society_id=eq.${societyId}&is_active=eq.true&order=updated_at.desc`
    if (ownerUserId) q += `&owner_user_id=eq.${encodeURIComponent(ownerUserId)}`
    return await restGet<PairedBluetoothDevice[]>(q)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listPairedDevices(societyId, ownerUserId)
  }
}

export async function registerPairedDevice(input: {
  societyId: string
  ownerUserId: string
  ownerFlatNumber?: string
  deviceName: string
  deviceType: PairedDeviceType
  bluetoothName?: string
}): Promise<PairedBluetoothDevice> {
  const payload = {
    society_id: input.societyId,
    owner_user_id: input.ownerUserId,
    owner_flat_number: input.ownerFlatNumber ?? null,
    device_name: input.deviceName.trim(),
    device_type: input.deviceType,
    bluetooth_name: input.bluetoothName?.trim() || input.deviceName.trim(),
    last_seen_zone: 'Registered · home flat',
    last_seen_at: new Date().toISOString(),
    is_active: true,
    updated_at: new Date().toISOString()
  }

  if (localMode) {
    const row: PairedBluetoothDevice = {
      id: rid('pbt'),
      created_at: new Date().toISOString(),
      ...payload
    }
    localDevices.unshift(row)
    return row
  }
  try {
    return await restPost<PairedBluetoothDevice>('paired_bluetooth_devices', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return registerPairedDevice(input)
  }
}

/** Log last-seen when the owner's phone reports a Bluetooth disconnect / RSSI drop. */
export async function logPairedDisconnect(input: {
  deviceId: string
  societyId: string
  rssi?: number
  zoneLabel: string
  note?: string
}): Promise<PairedBluetoothDevice> {
  const now = new Date().toISOString()
  const patch = {
    last_seen_zone: input.zoneLabel.trim(),
    last_seen_at: now,
    last_rssi: input.rssi ?? -70,
    updated_at: now
  }

  const sighting = {
    device_id: input.deviceId,
    society_id: input.societyId,
    event_type: 'DISCONNECT_RSSI' as const,
    rssi: input.rssi ?? -70,
    zone_label: input.zoneLabel.trim(),
    note: input.note ?? 'Bluetooth disconnect / weak RSSI from paired phone'
  }

  if (localMode) {
    const device = localDevices.find((d) => d.id === input.deviceId)
    if (!device) throw new Error('Device not found')
    Object.assign(device, patch)
    localSightings.unshift({ id: rid('sight'), created_at: now, ...sighting })
    return device
  }

  try {
    await restPost('paired_device_sightings', sighting)
    return await restPatch<PairedBluetoothDevice>(
      `paired_bluetooth_devices?id=eq.${input.deviceId}`,
      patch
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return logPairedDisconnect(input)
  }
}

/**
 * In-range proximity ping for a device the resident already pairs on their phone.
 * Uses Web Bluetooth when the browser exposes it; otherwise records a ping request
 * for the native app shell (Capacitor) — never claims society-wide radio coverage.
 */
export async function requestProximityPing(input: {
  deviceId: string
  societyId: string
}): Promise<{ ok: boolean; message: string; device: PairedBluetoothDevice }> {
  const now = new Date().toISOString()
  let webBtAttempted = false
  let webBtNote = ''

  if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
    webBtAttempted = true
    try {
      // Request device picker — user must select their already-paired accessory nearby.
      const bt = (navigator as Navigator & { bluetooth: { requestDevice: (o: object) => Promise<{ name?: string }> } })
        .bluetooth
      const device = await bt.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'generic_access']
      })
      webBtNote = `Browser linked to “${device.name || 'device'}”. Play a find-my tone from the accessory's companion app if supported.`
    } catch {
      webBtNote =
        'Bluetooth picker cancelled or unavailable. On Android/iOS, open mAI Society and use Find My Device for this accessory.'
    }
  } else {
    webBtNote =
      'This browser has no Web Bluetooth. Use the mAI Society mobile app near the device — it rings via your phone’s existing Bluetooth pairing (no extra tags to buy).'
  }

  const patch = { last_ping_at: now, updated_at: now }
  const sighting = {
    device_id: input.deviceId,
    society_id: input.societyId,
    event_type: 'PROXIMITY_PING' as const,
    zone_label: 'In-range ping requested',
    note: webBtNote
  }

  let device: PairedBluetoothDevice
  if (localMode) {
    const found = localDevices.find((d) => d.id === input.deviceId)
    if (!found) throw new Error('Device not found')
    Object.assign(found, patch)
    localSightings.unshift({ id: rid('sight'), created_at: now, ...sighting })
    device = found
  } else {
    try {
      await restPost('paired_device_sightings', sighting)
      device = await restPatch<PairedBluetoothDevice>(
        `paired_bluetooth_devices?id=eq.${input.deviceId}`,
        patch
      )
    } catch (err) {
      if (!shouldUseLocalFallback(err)) throw err
      localMode = true
      return requestProximityPing(input)
    }
  }

  return {
    ok: true,
    message: webBtAttempted
      ? `Proximity ping logged. ${webBtNote}`
      : `Proximity ping logged. ${webBtNote}`,
    device
  }
}

export async function deactivatePairedDevice(deviceId: string): Promise<void> {
  if (localMode) {
    const d = localDevices.find((x) => x.id === deviceId)
    if (d) d.is_active = false
    return
  }
  try {
    await restPatch(`paired_bluetooth_devices?id=eq.${deviceId}`, {
      is_active: false,
      updated_at: new Date().toISOString()
    })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return deactivatePairedDevice(deviceId)
  }
}

// ---------------------------------------------------------------------------
// Community Lost & Found (physical items — photo + Gate 1 claim)
// ---------------------------------------------------------------------------

export async function listLostFoundPosts(
  societyId: string,
  status: LostFoundStatus | 'ALL' = 'OPEN'
): Promise<LostFoundPost[]> {
  if (localMode) {
    return localLostFound
      .filter((p) => p.society_id === societyId && (status === 'ALL' || p.status === status))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  try {
    let q = `lost_found_posts?society_id=eq.${societyId}&order=created_at.desc`
    if (status !== 'ALL') q += `&status=eq.${status}`
    return await restGet<LostFoundPost[]>(q)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listLostFoundPosts(societyId, status)
  }
}

export async function createLostFoundPost(input: {
  societyId: string
  postedByUserId: string
  postedByFlatNumber?: string
  category: LostFoundCategory
  title: string
  description?: string
  photoDataUrl?: string | null
  claimDesk?: string
}): Promise<LostFoundPost> {
  const payload = {
    society_id: input.societyId,
    posted_by_user_id: input.postedByUserId,
    posted_by_flat_number: input.postedByFlatNumber ?? null,
    item_category: input.category,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    photo_url: input.photoDataUrl ?? null,
    claim_desk: input.claimDesk?.trim() || 'Gate 1',
    status: 'OPEN' as const
  }

  if (localMode) {
    const row: LostFoundPost = { id: rid('lf'), created_at: new Date().toISOString(), ...payload }
    localLostFound.unshift(row)
    return row
  }
  try {
    return await restPost<LostFoundPost>('lost_found_posts', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return createLostFoundPost(input)
  }
}

export async function claimLostFoundPost(input: {
  postId: string
  claimedByUserId: string
}): Promise<LostFoundPost> {
  const patch = {
    status: 'CLAIMED' as const,
    claimed_by_user_id: input.claimedByUserId,
    claimed_at: new Date().toISOString()
  }
  if (localMode) {
    const row = localLostFound.find((p) => p.id === input.postId)
    if (!row) throw new Error('Post not found')
    Object.assign(row, patch)
    return row
  }
  try {
    return await restPatch<LostFoundPost>(`lost_found_posts?id=eq.${input.postId}`, patch)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return claimLostFoundPost(input)
  }
}

/** Read a local image file as a data URL for Lost & Found posts (no CDN required). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read photo'))
    reader.readAsDataURL(file)
  })
}
