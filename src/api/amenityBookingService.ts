import type { Amenity, AmenityBooking } from '../types/db'
import { restGet, restPatch, restPost, supabaseRestUrl, getSupabaseRestHeaders } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { ensureSocietyFlatId } from './flatRegistry'

let localMode = false
let localAmenities: Amenity[] = []
let localBookings: AmenityBooking[] = []

function rid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

const DEFAULT_AMENITIES: Array<Omit<Amenity, 'id' | 'society_id' | 'created_at'>> = [
  { name: 'Clubhouse', capacity: 1, slot_duration_mins: 120, pricing_type: 'PAID', price_per_slot: 999, is_active: true },
  { name: 'Swimming Pool', capacity: 20, slot_duration_mins: 60, pricing_type: 'FREE', price_per_slot: 0, is_active: true },
  { name: 'Tennis Court', capacity: 2, slot_duration_mins: 60, pricing_type: 'FREE', price_per_slot: 0, is_active: true },
  { name: 'Banquet Hall', capacity: 1, slot_duration_mins: 180, pricing_type: 'PAID', price_per_slot: 4999, is_active: true },
  { name: 'Guest Room', capacity: 2, slot_duration_mins: 1440, pricing_type: 'PAID', price_per_slot: 1499, is_active: true }
]

function seedLocal(societyId: string) {
  if (localAmenities.some((a) => a.society_id === societyId)) return
  for (const item of DEFAULT_AMENITIES) {
    localAmenities.push({
      id: rid('amenity'),
      society_id: societyId,
      created_at: new Date().toISOString(),
      ...item
    })
  }
}

async function callRpc<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(supabaseRestUrl(`rpc/${fn}`), {
    method: 'POST',
    headers: getSupabaseRestHeaders(),
    body: JSON.stringify(body)
  })
  const text = await res.text()
  if (!res.ok) {
    let message = res.statusText || `RPC ${fn} failed`
    try {
      const parsed = JSON.parse(text) as { message?: string }
      message = parsed.message ?? message
    } catch {
      if (text) message = text
    }
    throw new Error(message)
  }
  return text ? (JSON.parse(text) as T) : (null as T)
}

export async function listAmenities(societyId: string): Promise<Amenity[]> {
  if (localMode) {
    seedLocal(societyId)
    return localAmenities.filter((a) => a.society_id === societyId && a.is_active)
  }
  try {
    let rows = await restGet<Amenity[]>(
      `amenities?society_id=eq.${societyId}&is_active=eq.true&order=name.asc`
    )
    if (!rows.length) {
      await callRpc('seed_default_amenities', { p_society_id: societyId })
      rows = await restGet<Amenity[]>(
        `amenities?society_id=eq.${societyId}&is_active=eq.true&order=name.asc`
      )
    }
    return rows
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listAmenities(societyId)
  }
}

export async function listAllAmenitiesAdmin(societyId: string): Promise<Amenity[]> {
  if (localMode) {
    seedLocal(societyId)
    return localAmenities.filter((a) => a.society_id === societyId)
  }
  try {
    return await restGet<Amenity[]>(`amenities?society_id=eq.${societyId}&order=name.asc`)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listAllAmenitiesAdmin(societyId)
  }
}

export async function upsertAmenity(input: {
  id?: string
  societyId: string
  name: string
  capacity: number
  slotDurationMins: number
  pricingType: 'FREE' | 'PAID'
  pricePerSlot: number
  isActive?: boolean
}): Promise<Amenity> {
  const payload = {
    society_id: input.societyId,
    name: input.name.trim(),
    capacity: Math.max(1, input.capacity),
    slot_duration_mins: Math.max(15, input.slotDurationMins),
    pricing_type: input.pricingType,
    price_per_slot: input.pricingType === 'PAID' ? Math.max(0, input.pricePerSlot) : 0,
    is_active: input.isActive ?? true
  }

  if (localMode) {
    seedLocal(input.societyId)
    if (input.id) {
      const row = localAmenities.find((a) => a.id === input.id)
      if (!row) throw new Error('Amenity not found')
      Object.assign(row, payload)
      return row
    }
    const created: Amenity = { id: rid('amenity'), created_at: new Date().toISOString(), ...payload }
    localAmenities.push(created)
    return created
  }

  try {
    if (input.id) {
      return await restPatch<Amenity>(`amenities?id=eq.${input.id}`, payload)
    }
    return await restPost<Amenity>('amenities', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return upsertAmenity(input)
  }
}

export async function listBookingsForAmenityDate(
  amenityId: string,
  bookingDate: string
): Promise<AmenityBooking[]> {
  if (localMode) {
    return localBookings.filter(
      (b) => b.amenity_id === amenityId && b.booking_date === bookingDate && b.status === 'CONFIRMED'
    )
  }
  try {
    return await restGet<AmenityBooking[]>(
      `amenity_bookings?amenity_id=eq.${amenityId}&booking_date=eq.${bookingDate}&status=eq.CONFIRMED&order=start_time.asc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listBookingsForAmenityDate(amenityId, bookingDate)
  }
}

export function buildDaySlots(slotDurationMins: number, openHour = 6, closeHour = 22) {
  const slots: Array<{ start: string; end: string }> = []
  for (let mins = openHour * 60; mins + slotDurationMins <= closeHour * 60; mins += slotDurationMins) {
    const end = mins + slotDurationMins
    const fmt = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    slots.push({ start: fmt(mins), end: fmt(end) })
  }
  return slots
}

export function isSlotAvailable(
  amenity: Amenity,
  bookings: AmenityBooking[],
  start: string,
  end: string
) {
  const overlaps = bookings.filter((b) => b.start_time.slice(0, 5) < end && b.end_time.slice(0, 5) > start)
  return overlaps.length < amenity.capacity
}

export async function bookAmenitySlot(input: {
  societyId: string
  amenityId: string
  flatNumber: string
  userId: string
  bookingDate: string
  startTime: string
  endTime: string
}): Promise<AmenityBooking> {
  const flatId = await ensureSocietyFlatId(input.societyId, input.flatNumber)

  if (localMode) {
    seedLocal(input.societyId)
    const amenity = localAmenities.find((a) => a.id === input.amenityId)
    if (!amenity) throw new Error('Amenity not available')
    const dayBookings = localBookings.filter(
      (b) =>
        b.amenity_id === input.amenityId &&
        b.booking_date === input.bookingDate &&
        b.status === 'CONFIRMED'
    )
    if (!isSlotAvailable(amenity, dayBookings, input.startTime, input.endTime)) {
      throw new Error('Slot unavailable — already booked')
    }
    const row: AmenityBooking = {
      id: rid('book'),
      society_id: input.societyId,
      amenity_id: input.amenityId,
      flat_id: flatId,
      flat_number: input.flatNumber.trim(),
      user_id: input.userId,
      booking_date: input.bookingDate,
      start_time: input.startTime,
      end_time: input.endTime,
      amount_paid: amenity.pricing_type === 'PAID' ? amenity.price_per_slot : 0,
      status: 'CONFIRMED',
      created_at: new Date().toISOString()
    }
    localBookings.unshift(row)
    return row
  }

  try {
    const result = await callRpc<AmenityBooking | AmenityBooking[]>('book_amenity_slot', {
      p_society_id: input.societyId,
      p_amenity_id: input.amenityId,
      p_flat_id: flatId,
      p_flat_number: input.flatNumber.trim(),
      p_user_id: input.userId,
      p_booking_date: input.bookingDate,
      p_start_time: input.startTime,
      p_end_time: input.endTime
    })
    return Array.isArray(result) ? result[0] : result
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return bookAmenitySlot(input)
  }
}

export async function cancelAmenityBooking(bookingId: string): Promise<AmenityBooking> {
  if (localMode) {
    const row = localBookings.find((b) => b.id === bookingId)
    if (!row) throw new Error('Booking not found')
    row.status = 'CANCELLED'
    return row
  }
  try {
    return await restPatch<AmenityBooking>(`amenity_bookings?id=eq.${bookingId}`, { status: 'CANCELLED' })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return cancelAmenityBooking(bookingId)
  }
}

export async function listMyAmenityBookings(societyId: string, userId: string): Promise<AmenityBooking[]> {
  if (localMode) {
    return localBookings.filter((b) => b.society_id === societyId && b.user_id === userId)
  }
  try {
    return await restGet<AmenityBooking[]>(
      `amenity_bookings?society_id=eq.${societyId}&user_id=eq.${encodeURIComponent(userId)}&order=booking_date.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listMyAmenityBookings(societyId, userId)
  }
}
