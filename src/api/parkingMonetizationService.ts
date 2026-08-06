/**
 * Monetized Parking Marketplace — dual-mode, zero-hardware.
 * Mode A: Hourly visitor rent while owner is at work (UPI → owner wallet).
 * Mode B: Monthly zero-brokerage lease of unused slots to neighbors.
 * Security: auto-vacate reminder 30 minutes before owner_return_at.
 */

import type {
  ParkingMarketplaceBooking,
  ParkingMarketplaceListing,
  ParkingOwnerWallet,
  ParkingListingMode,
  ParkingListingStatus,
  ParkingBookingPaymentStatus
} from '../types/db'
import { restGet, restPatch, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { setFlatPresence } from './smartParking'

let localMode = false
let localListings: ParkingMarketplaceListing[] = []
let localBookings: ParkingMarketplaceBooking[] = []
let localWallets: ParkingOwnerWallet[] = []

function rid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function hoursBetween(startIso: string, endIso: string) {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime()
  return Math.max(0.5, Math.round((ms / 3_600_000) * 100) / 100)
}

function ensureLocalWallet(societyId: string, ownerUserId: string, flat: string): ParkingOwnerWallet {
  let w = localWallets.find((x) => x.society_id === societyId && x.owner_user_id === ownerUserId)
  if (!w) {
    w = {
      id: rid('pwallet'),
      society_id: societyId,
      owner_user_id: ownerUserId,
      owner_flat_number: flat,
      balance_inr: 0,
      lifetime_earned_inr: 0,
      upi_id: null,
      updated_at: new Date().toISOString()
    }
    localWallets.push(w)
  }
  return w
}

export async function getParkingWallet(
  societyId: string,
  ownerUserId: string
): Promise<ParkingOwnerWallet | null> {
  if (localMode) {
    return localWallets.find((w) => w.society_id === societyId && w.owner_user_id === ownerUserId) ?? null
  }
  try {
    const rows = await restGet<ParkingOwnerWallet[]>(
      `parking_owner_wallets?society_id=eq.${societyId}&owner_user_id=eq.${encodeURIComponent(ownerUserId)}&limit=1`
    )
    return rows[0] ?? null
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return getParkingWallet(societyId, ownerUserId)
  }
}

export async function upsertParkingWalletUpi(input: {
  societyId: string
  ownerUserId: string
  ownerFlatNumber: string
  upiId: string
}): Promise<ParkingOwnerWallet> {
  if (localMode) {
    const w = ensureLocalWallet(input.societyId, input.ownerUserId, input.ownerFlatNumber)
    w.upi_id = input.upiId.trim()
    w.updated_at = new Date().toISOString()
    return w
  }
  try {
    const existing = await getParkingWallet(input.societyId, input.ownerUserId)
    if (existing) {
      return await restPatch<ParkingOwnerWallet>(`parking_owner_wallets?id=eq.${existing.id}`, {
        upi_id: input.upiId.trim(),
        owner_flat_number: input.ownerFlatNumber,
        updated_at: new Date().toISOString()
      })
    }
    return await restPost<ParkingOwnerWallet>('parking_owner_wallets', {
      society_id: input.societyId,
      owner_user_id: input.ownerUserId,
      owner_flat_number: input.ownerFlatNumber,
      upi_id: input.upiId.trim(),
      balance_inr: 0,
      lifetime_earned_inr: 0
    })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return upsertParkingWalletUpi(input)
  }
}

export async function listParkingListings(
  societyId: string,
  opts?: { status?: ParkingListingStatus | 'ALL'; mode?: ParkingListingMode; ownerUserId?: string }
): Promise<ParkingMarketplaceListing[]> {
  if (localMode) {
    return localListings
      .filter((l) => {
        if (l.society_id !== societyId) return false
        if (opts?.ownerUserId && l.owner_user_id !== opts.ownerUserId) return false
        if (opts?.mode && l.mode !== opts.mode) return false
        if (opts?.status && opts.status !== 'ALL' && l.status !== opts.status) return false
        return true
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  try {
    let q = `parking_marketplace_listings?society_id=eq.${societyId}&order=created_at.desc`
    if (opts?.ownerUserId) q += `&owner_user_id=eq.${encodeURIComponent(opts.ownerUserId)}`
    if (opts?.mode) q += `&mode=eq.${opts.mode}`
    if (opts?.status && opts.status !== 'ALL') q += `&status=eq.${opts.status}`
    return await restGet<ParkingMarketplaceListing[]>(q)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listParkingListings(societyId, opts)
  }
}

export async function listActiveMarketplaceListings(
  societyId: string
): Promise<ParkingMarketplaceListing[]> {
  return listParkingListings(societyId, { status: 'ACTIVE' })
}

/**
 * Mode A / B listing. Also marks flat out-of-station for hourly earn windows
 * so legacy Smart Parking allocation stays consistent.
 */
export async function createParkingListing(input: {
  societyId: string
  ownerUserId: string
  ownerFlatNumber: string
  slotCode?: string
  mode: ParkingListingMode
  hourlyRateInr?: number
  availableFromLocal?: string
  availableToLocal?: string
  ownerReturnAt?: string
  monthlyRateInr?: number
  leaseAvailableFrom?: string
  notes?: string
  upiId?: string
}): Promise<ParkingMarketplaceListing> {
  if (input.mode === 'HOURLY') {
    if (!input.hourlyRateInr || input.hourlyRateInr <= 0) {
      throw new Error('Set an hourly rate (e.g. ₹20/hour).')
    }
    if (!input.ownerReturnAt) {
      throw new Error('Set your return time so we can send a 30-minute vacate reminder.')
    }
  } else if (!input.monthlyRateInr || input.monthlyRateInr <= 0) {
    throw new Error('Set a monthly lease rate.')
  }

  if (input.upiId) {
    await upsertParkingWalletUpi({
      societyId: input.societyId,
      ownerUserId: input.ownerUserId,
      ownerFlatNumber: input.ownerFlatNumber,
      upiId: input.upiId
    })
  }

  const payload = {
    society_id: input.societyId,
    owner_user_id: input.ownerUserId,
    owner_flat_number: input.ownerFlatNumber.trim(),
    slot_code: (input.slotCode || `P-${input.ownerFlatNumber}`).trim(),
    mode: input.mode,
    available_from_local: input.availableFromLocal ?? (input.mode === 'HOURLY' ? '09:00' : null),
    available_to_local: input.availableToLocal ?? (input.mode === 'HOURLY' ? '18:00' : null),
    hourly_rate_inr: input.mode === 'HOURLY' ? input.hourlyRateInr! : null,
    owner_return_at: input.mode === 'HOURLY' ? input.ownerReturnAt! : null,
    monthly_rate_inr: input.mode === 'MONTHLY' ? input.monthlyRateInr! : null,
    lease_available_from:
      input.mode === 'MONTHLY' ? input.leaseAvailableFrom || new Date().toISOString().slice(0, 10) : null,
    status: 'ACTIVE' as const,
    earn_enabled: true,
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString()
  }

  let listing: ParkingMarketplaceListing
  if (localMode) {
    listing = { id: rid('plist'), created_at: new Date().toISOString(), ...payload }
    localListings.unshift(listing)
  } else {
    try {
      listing = await restPost<ParkingMarketplaceListing>('parking_marketplace_listings', payload)
    } catch (err) {
      if (!shouldUseLocalFallback(err)) throw err
      localMode = true
      return createParkingListing(input)
    }
  }

  if (input.mode === 'HOURLY') {
    await setFlatPresence(input.societyId, input.ownerFlatNumber, 'out_of_station').catch(() => undefined)
  }

  return listing
}

export async function setEarnFromMySlot(input: {
  societyId: string
  ownerUserId: string
  ownerFlatNumber: string
  enabled: boolean
  hourlyRateInr?: number
  availableFromLocal?: string
  availableToLocal?: string
  ownerReturnAt?: string
  upiId?: string
}): Promise<ParkingMarketplaceListing | null> {
  const mine = await listParkingListings(input.societyId, {
    ownerUserId: input.ownerUserId,
    mode: 'HOURLY',
    status: 'ALL'
  })
  const active = mine.find((l) => l.status === 'ACTIVE' || l.status === 'PAUSED')

  if (!input.enabled) {
    if (active) {
      const patch = {
        earn_enabled: false,
        status: 'PAUSED' as const,
        updated_at: new Date().toISOString()
      }
      if (localMode) {
        Object.assign(active, patch)
      } else {
        try {
          await restPatch(`parking_marketplace_listings?id=eq.${active.id}`, patch)
        } catch (err) {
          if (!shouldUseLocalFallback(err)) throw err
          localMode = true
          Object.assign(active, patch)
        }
      }
      await setFlatPresence(input.societyId, input.ownerFlatNumber, 'in_station').catch(() => undefined)
      return { ...active, ...patch }
    }
    return null
  }

  const returnAt =
    input.ownerReturnAt ||
    (() => {
      const d = new Date()
      d.setHours(18, 0, 0, 0)
      if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1)
      return d.toISOString()
    })()

  if (active) {
    const patch = {
      earn_enabled: true,
      status: 'ACTIVE' as const,
      hourly_rate_inr: input.hourlyRateInr ?? active.hourly_rate_inr ?? 20,
      available_from_local: input.availableFromLocal ?? active.available_from_local ?? '09:00',
      available_to_local: input.availableToLocal ?? active.available_to_local ?? '18:00',
      owner_return_at: returnAt,
      vacate_reminder_sent_at: null,
      updated_at: new Date().toISOString()
    }
    if (input.upiId) {
      await upsertParkingWalletUpi({
        societyId: input.societyId,
        ownerUserId: input.ownerUserId,
        ownerFlatNumber: input.ownerFlatNumber,
        upiId: input.upiId
      })
    }
    if (localMode) {
      Object.assign(active, patch)
    } else {
      try {
        await restPatch(`parking_marketplace_listings?id=eq.${active.id}`, patch)
      } catch (err) {
        if (!shouldUseLocalFallback(err)) throw err
        localMode = true
        Object.assign(active, patch)
      }
    }
    await setFlatPresence(input.societyId, input.ownerFlatNumber, 'out_of_station').catch(() => undefined)
    return { ...active, ...patch }
  }

  return createParkingListing({
    societyId: input.societyId,
    ownerUserId: input.ownerUserId,
    ownerFlatNumber: input.ownerFlatNumber,
    mode: 'HOURLY',
    hourlyRateInr: input.hourlyRateInr ?? 20,
    availableFromLocal: input.availableFromLocal ?? '09:00',
    availableToLocal: input.availableToLocal ?? '18:00',
    ownerReturnAt: returnAt,
    upiId: input.upiId
  })
}

export async function bookHourlySlot(input: {
  listingId: string
  societyId: string
  renterUserId: string
  renterFlatNumber?: string
  renterLabel: string
  vehicleLabel?: string
  startsAt: string
  endsAt: string
}): Promise<ParkingMarketplaceBooking> {
  const listings = await listParkingListings(input.societyId, { status: 'ALL' })
  const listing = listings.find((l) => l.id === input.listingId)
  if (!listing || listing.status !== 'ACTIVE' || listing.mode !== 'HOURLY') {
    throw new Error('This hourly listing is not available.')
  }
  if (listing.owner_user_id === input.renterUserId) {
    throw new Error('You cannot book your own slot.')
  }

  const hours = hoursBetween(input.startsAt, input.endsAt)
  const rate = Number(listing.hourly_rate_inr || 0)
  const amount = Math.round(hours * rate * 100) / 100

  if (listing.owner_return_at && new Date(input.endsAt) > new Date(listing.owner_return_at)) {
    throw new Error('Booking must end before the owner’s scheduled return.')
  }

  return createBookingRow({
    listing,
    societyId: input.societyId,
    renterUserId: input.renterUserId,
    renterFlatNumber: input.renterFlatNumber,
    renterLabel: input.renterLabel,
    vehicleLabel: input.vehicleLabel,
    mode: 'HOURLY',
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    hoursBooked: hours,
    amountInr: amount
  })
}

export async function bookMonthlyLease(input: {
  listingId: string
  societyId: string
  renterUserId: string
  renterFlatNumber?: string
  renterLabel: string
  vehicleLabel?: string
  months?: number
}): Promise<ParkingMarketplaceBooking> {
  const listings = await listParkingListings(input.societyId, { status: 'ALL' })
  const listing = listings.find((l) => l.id === input.listingId)
  if (!listing || listing.status !== 'ACTIVE' || listing.mode !== 'MONTHLY') {
    throw new Error('This monthly lease is not available.')
  }
  if (listing.owner_user_id === input.renterUserId) {
    throw new Error('You cannot lease your own slot.')
  }

  const months = Math.max(1, input.months ?? 1)
  const start = new Date()
  const end = new Date(start)
  end.setMonth(end.getMonth() + months)
  const amount = Math.round(Number(listing.monthly_rate_inr || 0) * months * 100) / 100

  const booking = await createBookingRow({
    listing,
    societyId: input.societyId,
    renterUserId: input.renterUserId,
    renterFlatNumber: input.renterFlatNumber,
    renterLabel: input.renterLabel,
    vehicleLabel: input.vehicleLabel,
    mode: 'MONTHLY',
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    hoursBooked: null,
    amountInr: amount
  })

  // Mark listing booked for exclusivity
  await patchListingStatus(listing.id, 'BOOKED')
  return booking
}

async function patchListingStatus(listingId: string, status: ParkingListingStatus) {
  const patch = { status, updated_at: new Date().toISOString() }
  if (localMode) {
    const l = localListings.find((x) => x.id === listingId)
    if (l) Object.assign(l, patch)
    return
  }
  try {
    await restPatch(`parking_marketplace_listings?id=eq.${listingId}`, patch)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    await patchListingStatus(listingId, status)
  }
}

async function createBookingRow(input: {
  listing: ParkingMarketplaceListing
  societyId: string
  renterUserId: string
  renterFlatNumber?: string
  renterLabel: string
  vehicleLabel?: string
  mode: ParkingListingMode
  startsAt: string
  endsAt: string
  hoursBooked: number | null
  amountInr: number
}): Promise<ParkingMarketplaceBooking> {
  const payload = {
    listing_id: input.listing.id,
    society_id: input.societyId,
    renter_user_id: input.renterUserId,
    renter_flat_number: input.renterFlatNumber ?? null,
    renter_label: input.renterLabel.trim(),
    vehicle_label: input.vehicleLabel?.trim() || null,
    mode: input.mode,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    hours_booked: input.hoursBooked,
    amount_inr: input.amountInr,
    payment_method: 'UPI',
    payment_status: 'PENDING_UPI' as const,
    status: 'ACTIVE' as const
  }

  if (localMode) {
    const row: ParkingMarketplaceBooking = {
      id: rid('pbook'),
      created_at: new Date().toISOString(),
      upi_reference: null,
      ...payload
    }
    localBookings.unshift(row)
    return row
  }
  try {
    return await restPost<ParkingMarketplaceBooking>('parking_marketplace_bookings', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return createBookingRow(input)
  }
}

export async function listParkingBookings(
  societyId: string,
  opts?: { renterUserId?: string; listingIds?: string[] }
): Promise<ParkingMarketplaceBooking[]> {
  if (localMode) {
    return localBookings
      .filter((b) => {
        if (b.society_id !== societyId) return false
        if (opts?.renterUserId && b.renter_user_id !== opts.renterUserId) return false
        if (opts?.listingIds && !opts.listingIds.includes(b.listing_id)) return false
        return true
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  try {
    let q = `parking_marketplace_bookings?society_id=eq.${societyId}&order=created_at.desc&limit=80`
    if (opts?.renterUserId) q += `&renter_user_id=eq.${encodeURIComponent(opts.renterUserId)}`
    return await restGet<ParkingMarketplaceBooking[]>(q)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listParkingBookings(societyId, opts)
  }
}

/** Renter confirms UPI payment → credits owner wallet (DB trigger or local). */
export async function confirmUpiPayment(input: {
  bookingId: string
  upiReference: string
}): Promise<ParkingMarketplaceBooking> {
  const ref = input.upiReference.trim()
  if (!ref) throw new Error('Enter the UPI transaction reference.')

  if (localMode) {
    const booking = localBookings.find((b) => b.id === input.bookingId)
    if (!booking) throw new Error('Booking not found')
    booking.upi_reference = ref
    booking.payment_status = 'CREDITED'
    const listing = localListings.find((l) => l.id === booking.listing_id)
    if (listing) {
      const w = ensureLocalWallet(listing.society_id, listing.owner_user_id, listing.owner_flat_number)
      w.balance_inr = Number(w.balance_inr) + Number(booking.amount_inr)
      w.lifetime_earned_inr = Number(w.lifetime_earned_inr) + Number(booking.amount_inr)
      w.updated_at = new Date().toISOString()
    }
    return booking
  }

  try {
    return await restPatch<ParkingMarketplaceBooking>(
      `parking_marketplace_bookings?id=eq.${input.bookingId}`,
      {
        upi_reference: ref,
        payment_status: 'PAID' as ParkingBookingPaymentStatus
      }
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return confirmUpiPayment(input)
  }
}

export function estimateHourlyAmount(rateInr: number, startsAt: string, endsAt: string) {
  return Math.round(hoursBetween(startsAt, endsAt) * rateInr * 100) / 100
}

/**
 * Security rail: listings with owner_return_at within 30 minutes get a vacate reminder flag.
 * Call from UI poll or autonomous jobs — never depends on cameras/sensors.
 */
export async function processVacateReminders(societyId: string): Promise<ParkingMarketplaceListing[]> {
  const listings = await listParkingListings(societyId, { status: 'ACTIVE', mode: 'HOURLY' })
  const now = Date.now()
  const due: ParkingMarketplaceListing[] = []

  for (const listing of listings) {
    if (!listing.owner_return_at || listing.vacate_reminder_sent_at) continue
    const returnMs = new Date(listing.owner_return_at).getTime()
    const minsLeft = (returnMs - now) / 60_000
    if (minsLeft > 0 && minsLeft <= 30) {
      const patch = { vacate_reminder_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      if (localMode) {
        Object.assign(listing, patch)
      } else {
        try {
          await restPatch(`parking_marketplace_listings?id=eq.${listing.id}`, patch)
        } catch (err) {
          if (!shouldUseLocalFallback(err)) throw err
          localMode = true
          Object.assign(listing, patch)
        }
      }
      due.push({ ...listing, ...patch })
    }
  }
  return due
}

export function formatInr(amount: number) {
  return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}
