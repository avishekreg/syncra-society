/**
 * Crowdsourced Smart Parking — zero-hardware allocation.
 * Static slots are mapped per flat; visitors borrow slots from out-of-station flats.
 */

import { restGet, restPatch, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'

export type ParkingSlot = {
  id: string
  societyId: string
  flatNumber: string
  slotCode: string
  isStatic: boolean
}

export type ParkingPresence = {
  flatNumber: string
  status: 'in_station' | 'out_of_station'
}

export type ParkingAllocation = {
  id: string
  slotId: string
  visitorLabel: string
  allocatedToFlat: string | null
  status: 'active' | 'released' | 'expired'
}

const LOCAL_SLOTS = 'mai_parking_slots_v1'
const LOCAL_PRESENCE = 'mai_parking_presence_v1'
const LOCAL_ALLOC = 'mai_parking_allocations_v1'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

/** Ensure each flat has one static slot (P-{flat}). */
export async function ensureStaticSlotsForFlats(
  societyId: string,
  flats: string[]
): Promise<ParkingSlot[]> {
  const unique = Array.from(new Set(flats.map((f) => f.trim()).filter(Boolean)))

  try {
    const existing = await restGet<Array<Record<string, unknown>>>(
      `parking_slots?society_id=eq.${societyId}&select=id,society_id,flat_number,slot_code,is_static`
    )
    const have = new Set((existing ?? []).map((row) => String(row.flat_number)))
    const created: ParkingSlot[] = []

    for (const flat of unique) {
      if (have.has(flat)) continue
      const row = await restPost<Record<string, unknown>>('parking_slots', {
        society_id: societyId,
        flat_number: flat,
        slot_code: `P-${flat}`,
        is_static: true
      })
      created.push({
        id: String(row.id),
        societyId,
        flatNumber: flat,
        slotCode: String(row.slot_code),
        isStatic: true
      })
    }

    const all = await listParkingSlots(societyId)
    return all
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    const store = readJson<Record<string, ParkingSlot[]>>(LOCAL_SLOTS, {})
    const current = store[societyId] ?? []
    const have = new Set(current.map((s) => s.flatNumber))
    const next = [...current]
    for (const flat of unique) {
      if (have.has(flat)) continue
      next.push({
        id: crypto.randomUUID(),
        societyId,
        flatNumber: flat,
        slotCode: `P-${flat}`,
        isStatic: true
      })
    }
    store[societyId] = next
    writeJson(LOCAL_SLOTS, store)
    return next
  }
}

export async function listParkingSlots(societyId: string): Promise<ParkingSlot[]> {
  try {
    const rows = await restGet<Array<Record<string, unknown>>>(
      `parking_slots?society_id=eq.${societyId}&select=id,society_id,flat_number,slot_code,is_static&order=slot_code.asc`
    )
    return (rows ?? []).map((row) => ({
      id: String(row.id),
      societyId: String(row.society_id),
      flatNumber: String(row.flat_number),
      slotCode: String(row.slot_code),
      isStatic: Boolean(row.is_static)
    }))
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    return readJson<Record<string, ParkingSlot[]>>(LOCAL_SLOTS, {})[societyId] ?? []
  }
}

export async function setFlatPresence(
  societyId: string,
  flatNumber: string,
  status: ParkingPresence['status']
): Promise<void> {
  try {
    await restPost('parking_presence', {
      society_id: societyId,
      flat_number: flatNumber,
      status,
      updated_at: new Date().toISOString()
    })
  } catch (err) {
    // upsert-style patch fallback
    try {
      await restPatch(
        `parking_presence?society_id=eq.${societyId}&flat_number=eq.${encodeURIComponent(flatNumber)}`,
        { status, updated_at: new Date().toISOString() }
      )
    } catch (inner) {
      if (!shouldUseLocalFallback(inner) && !shouldUseLocalFallback(err)) throw inner
      const store = readJson<Record<string, Record<string, ParkingPresence['status']>>>(LOCAL_PRESENCE, {})
      store[societyId] = { ...(store[societyId] ?? {}), [flatNumber]: status }
      writeJson(LOCAL_PRESENCE, store)
    }
  }
}

export async function listPresence(societyId: string): Promise<ParkingPresence[]> {
  try {
    const rows = await restGet<Array<Record<string, unknown>>>(
      `parking_presence?society_id=eq.${societyId}&select=flat_number,status`
    )
    return (rows ?? []).map((row) => ({
      flatNumber: String(row.flat_number),
      status: row.status === 'out_of_station' ? 'out_of_station' : 'in_station'
    }))
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    const map = readJson<Record<string, Record<string, ParkingPresence['status']>>>(LOCAL_PRESENCE, {})[
      societyId
    ]
    if (!map) return []
    return Object.entries(map).map(([flatNumber, status]) => ({ flatNumber, status }))
  }
}

/**
 * Allocate a temporary visitor slot from an out-of-station flat's static bay.
 */
export async function allocateVisitorSlot(input: {
  societyId: string
  visitorLabel: string
  guestFlat?: string | null
}): Promise<ParkingAllocation> {
  const [slots, presence, active] = await Promise.all([
    listParkingSlots(input.societyId),
    listPresence(input.societyId),
    listActiveAllocations(input.societyId)
  ])

  const outFlats = new Set(
    presence.filter((p) => p.status === 'out_of_station').map((p) => p.flatNumber)
  )
  const usedSlotIds = new Set(active.map((a) => a.slotId))

  const free = slots.find((slot) => outFlats.has(slot.flatNumber) && !usedSlotIds.has(slot.id))
  if (!free) {
    throw new Error('No temporary visitor slots available. Ask an out-of-station resident to mark status.')
  }

  try {
    const row = await restPost<Record<string, unknown>>('parking_allocations', {
      society_id: input.societyId,
      slot_id: free.id,
      visitor_label: input.visitorLabel,
      allocated_to_flat: input.guestFlat ?? null,
      status: 'active'
    })
    return {
      id: String(row.id),
      slotId: free.id,
      visitorLabel: input.visitorLabel,
      allocatedToFlat: input.guestFlat ?? null,
      status: 'active'
    }
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    const allocation: ParkingAllocation = {
      id: crypto.randomUUID(),
      slotId: free.id,
      visitorLabel: input.visitorLabel,
      allocatedToFlat: input.guestFlat ?? null,
      status: 'active'
    }
    const store = readJson<Record<string, ParkingAllocation[]>>(LOCAL_ALLOC, {})
    store[input.societyId] = [...(store[input.societyId] ?? []), allocation]
    writeJson(LOCAL_ALLOC, store)
    return allocation
  }
}

export async function listActiveAllocations(societyId: string): Promise<ParkingAllocation[]> {
  try {
    const rows = await restGet<Array<Record<string, unknown>>>(
      `parking_allocations?society_id=eq.${societyId}&status=eq.active&select=id,slot_id,visitor_label,allocated_to_flat,status`
    )
    return (rows ?? []).map((row) => ({
      id: String(row.id),
      slotId: String(row.slot_id),
      visitorLabel: String(row.visitor_label),
      allocatedToFlat: row.allocated_to_flat != null ? String(row.allocated_to_flat) : null,
      status: 'active'
    }))
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    return (readJson<Record<string, ParkingAllocation[]>>(LOCAL_ALLOC, {})[societyId] ?? []).filter(
      (a) => a.status === 'active'
    )
  }
}
