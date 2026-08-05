import type { CarpoolRequest, CarpoolRide } from '../types/db'
import { restGet, restPatch, restPost, supabaseRestUrl, getSupabaseRestHeaders } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { ensureSocietyFlatId } from './flatRegistry'

let localMode = false
let localRides: CarpoolRide[] = []
let localRequests: CarpoolRequest[] = []

function rid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
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

export async function listActiveCarpoolRides(societyId: string): Promise<CarpoolRide[]> {
  if (localMode) {
    return localRides
      .filter((r) => r.society_id === societyId && r.status === 'ACTIVE')
      .sort((a, b) => +new Date(a.departure_time) - +new Date(b.departure_time))
  }
  try {
    return await restGet<CarpoolRide[]>(
      `carpool_rides?society_id=eq.${societyId}&status=eq.ACTIVE&order=departure_time.asc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listActiveCarpoolRides(societyId)
  }
}

export async function offerCarpoolRide(input: {
  societyId: string
  flatNumber: string
  userId: string
  destination: string
  departureTime: string
  availableSeats: number
  notes?: string
}): Promise<CarpoolRide> {
  if (!input.destination.trim()) throw new Error('Destination is required')
  if (!input.departureTime) throw new Error('Departure time is required')
  const seats = Math.max(1, Math.min(6, input.availableSeats || 1))
  const flatId = await ensureSocietyFlatId(input.societyId, input.flatNumber)
  const payload = {
    society_id: input.societyId,
    offered_by_flat_id: flatId,
    offered_by_flat_number: input.flatNumber.trim(),
    offered_by_user_id: input.userId,
    destination: input.destination.trim(),
    departure_time: input.departureTime,
    available_seats: seats,
    notes: input.notes?.trim() || null,
    status: 'ACTIVE' as const
  }

  if (localMode) {
    const row: CarpoolRide = { id: rid('ride'), created_at: new Date().toISOString(), ...payload }
    localRides.unshift(row)
    return row
  }
  try {
    return await restPost<CarpoolRide>('carpool_rides', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return offerCarpoolRide(input)
  }
}

export async function requestCarpoolSeat(input: {
  rideId: string
  passengerUserId: string
  passengerFlatNumber: string
  societyId: string
}): Promise<CarpoolRequest> {
  const flatId = await ensureSocietyFlatId(input.societyId, input.passengerFlatNumber)
  const payload = {
    ride_id: input.rideId,
    passenger_user_id: input.passengerUserId,
    passenger_flat_id: flatId,
    passenger_flat_number: input.passengerFlatNumber.trim(),
    status: 'PENDING' as const
  }
  if (localMode) {
    const row: CarpoolRequest = { id: rid('creq'), created_at: new Date().toISOString(), ...payload }
    localRequests.unshift(row)
    return row
  }
  try {
    return await restPost<CarpoolRequest>('carpool_requests', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return requestCarpoolSeat(input)
  }
}

export async function listRequestsForRide(rideId: string): Promise<CarpoolRequest[]> {
  if (localMode) return localRequests.filter((r) => r.ride_id === rideId)
  try {
    return await restGet<CarpoolRequest[]>(`carpool_requests?ride_id=eq.${rideId}&order=created_at.desc`)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listRequestsForRide(rideId)
  }
}

export async function acceptCarpoolRequest(requestId: string): Promise<CarpoolRequest> {
  if (localMode) {
    const req = localRequests.find((r) => r.id === requestId)
    if (!req) throw new Error('Request not found')
    const ride = localRides.find((r) => r.id === req.ride_id)
    if (!ride || ride.available_seats < 1) throw new Error('No seats available')
    ride.available_seats -= 1
    if (ride.available_seats === 0) ride.status = 'COMPLETED'
    req.status = 'ACCEPTED'
    return req
  }
  try {
    const result = await callRpc<CarpoolRequest | CarpoolRequest[]>('accept_carpool_request', {
      p_request_id: requestId
    })
    return Array.isArray(result) ? result[0] : result
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return acceptCarpoolRequest(requestId)
  }
}

export async function rejectCarpoolRequest(requestId: string): Promise<CarpoolRequest> {
  if (localMode) {
    const req = localRequests.find((r) => r.id === requestId)
    if (!req) throw new Error('Request not found')
    req.status = 'REJECTED'
    return req
  }
  try {
    return await restPatch<CarpoolRequest>(`carpool_requests?id=eq.${requestId}`, { status: 'REJECTED' })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return rejectCarpoolRequest(requestId)
  }
}

export async function cancelCarpoolRide(rideId: string): Promise<CarpoolRide> {
  if (localMode) {
    const ride = localRides.find((r) => r.id === rideId)
    if (!ride) throw new Error('Ride not found')
    ride.status = 'CANCELLED'
    return ride
  }
  try {
    return await restPatch<CarpoolRide>(`carpool_rides?id=eq.${rideId}`, { status: 'CANCELLED' })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return cancelCarpoolRide(rideId)
  }
}
