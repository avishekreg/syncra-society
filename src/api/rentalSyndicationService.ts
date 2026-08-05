import type {
  PropertyFurnishing,
  PropertyInquiryType,
  PropertyListingInquiry,
  PropertyListingPurpose,
  PropertyMarketListing,
  PropertyOwnershipType,
  RwaResaleBadge
} from '../types/db'
import { ensureSocietyFlatId } from './flatRegistry'
import { restGet, restPatch, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'

let localMode = false
let localListings: PropertyMarketListing[] = []
let localInquiries: PropertyListingInquiry[] = []

function rid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

const RENT_PORTALS = ['MagicBricks Rent', '99acres Rent', 'Housing.com Rent', 'NoBroker Rent'] as const
const SALE_PORTALS = [
  'MagicBricks Resale',
  '99acres Resale',
  'Housing.com Resale',
  'NoBroker Seller'
] as const

/** Prefer carpet area; fall back to super area for ₹/sqft. */
export function calculatePricePerSqft(salePrice: number, carpetAreaSqft?: number | null, superAreaSqft?: number | null) {
  const area = Number(carpetAreaSqft) > 0 ? Number(carpetAreaSqft) : Number(superAreaSqft) > 0 ? Number(superAreaSqft) : 0
  if (!salePrice || area <= 0) return null
  return Math.round((salePrice / area) * 100) / 100
}

/** Standard reducing-balance EMI estimate. */
export function estimateHomeLoanEmi(input: {
  principalInr: number
  annualRatePct?: number
  tenureYears?: number
}) {
  const principal = Math.max(0, input.principalInr)
  const annualRate = input.annualRatePct ?? 8.5
  const tenureYears = input.tenureYears ?? 20
  const months = tenureYears * 12
  const r = annualRate / 12 / 100
  if (principal <= 0 || months <= 0) return { emi: 0, totalPayable: 0, totalInterest: 0, months }
  if (r === 0) {
    const emi = principal / months
    return { emi, totalPayable: principal, totalInterest: 0, months }
  }
  const factor = Math.pow(1 + r, months)
  const emi = (principal * r * factor) / (factor - 1)
  const totalPayable = emi * months
  return {
    emi: Math.round(emi),
    totalPayable: Math.round(totalPayable),
    totalInterest: Math.round(totalPayable - principal),
    months
  }
}

export function buildVerifiedRwaResaleBadge(input: {
  maintenanceDuesClear: boolean
  societySecurityScore: number
  societyNocStatus: boolean
}): RwaResaleBadge {
  return {
    label: 'Verified RWA Resale Certificate',
    maintenanceDuesClear: input.maintenanceDuesClear,
    societySecurityScore: Math.max(0, Math.min(100, Math.round(input.societySecurityScore))),
    nocCleared: input.societyNocStatus,
    zeroBrokerage: true,
    issuedAt: new Date().toISOString()
  }
}

export type SyndicationPortalPayload = {
  portal: string
  purpose: PropertyListingPurpose
  title: string
  price: number
  priceUnit: 'PER_MONTH' | 'TOTAL'
  pricePerSqft?: number | null
  areaSqft?: number | null
  bhk?: string | null
  parking: boolean
  ownershipType?: string | null
  negotiable?: boolean
  badge?: RwaResaleBadge | null
  zeroBrokerage: boolean
}

export function buildSyndicationPayloads(listing: {
  listing_purpose: PropertyListingPurpose
  flat_number: string
  bhk?: string | null
  monthly_rent?: number | null
  expected_sale_price?: number | null
  price_per_sqft?: number | null
  carpet_area_sqft?: number | null
  super_area_sqft?: number | null
  parking_available: boolean
  ownership_type?: string | null
  is_negotiable: boolean
  rwa_resale_badge?: RwaResaleBadge | null
}): { portals: string[]; payloads: SyndicationPortalPayload[] } {
  const portals = listing.listing_purpose === 'SALE' ? [...SALE_PORTALS] : [...RENT_PORTALS]
  const area = listing.carpet_area_sqft || listing.super_area_sqft || null
  const price =
    listing.listing_purpose === 'SALE'
      ? Number(listing.expected_sale_price || 0)
      : Number(listing.monthly_rent || 0)

  const payloads = portals.map((portal) => ({
    portal,
    purpose: listing.listing_purpose,
    title:
      listing.listing_purpose === 'SALE'
        ? `Resale · Flat ${listing.flat_number}${listing.bhk ? ` · ${listing.bhk}` : ''}`
        : `Rent · Flat ${listing.flat_number}${listing.bhk ? ` · ${listing.bhk}` : ''}`,
    price,
    priceUnit: listing.listing_purpose === 'SALE' ? ('TOTAL' as const) : ('PER_MONTH' as const),
    pricePerSqft: listing.listing_purpose === 'SALE' ? listing.price_per_sqft : null,
    areaSqft: area,
    bhk: listing.bhk,
    parking: listing.parking_available,
    ownershipType: listing.ownership_type,
    negotiable: listing.is_negotiable,
    badge: listing.listing_purpose === 'SALE' ? listing.rwa_resale_badge || null : null,
    zeroBrokerage: true
  }))

  return { portals, payloads }
}

export function buildInvestorBroadcast(listing: PropertyMarketListing) {
  const purpose = listing.listing_purpose === 'SALE' ? 'RESALE' : 'RENT'
  const price =
    listing.listing_purpose === 'SALE'
      ? `₹${Number(listing.expected_sale_price || 0).toLocaleString('en-IN')}`
      : `₹${Number(listing.monthly_rent || 0).toLocaleString('en-IN')}/mo`

  const whatsapp = [
    `maiList ${purpose} alert — Flat ${listing.flat_number}`,
    `Price: ${price}${listing.listing_purpose === 'SALE' && listing.price_per_sqft ? ` · ₹${listing.price_per_sqft}/sqft` : ''}`,
    listing.listing_purpose === 'SALE' ? 'Badge: Verified RWA Resale Certificate · Zero Brokerage' : 'Zero Brokerage rental',
    'Reply INTERESTED to connect with owner.'
  ].join('\n')

  const email = {
    subject: `maiList ${purpose}: Flat ${listing.flat_number} · ${price}`,
    body: `${whatsapp}\n\nSyndicated portals: ${asStringArray(listing.syndication_portals).join(', ') || 'pending'}`
  }

  return { whatsapp, email, audience: ['society_investors', 'verified_buyer_network'] as const }
}

function asStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  return []
}

export function parseResaleBadge(raw: unknown): RwaResaleBadge | null {
  if (!raw || typeof raw !== 'object') return null
  const badge = raw as Partial<RwaResaleBadge>
  if (!badge.label) return null
  return {
    label: String(badge.label),
    maintenanceDuesClear: Boolean(badge.maintenanceDuesClear),
    societySecurityScore: Number(badge.societySecurityScore || 0),
    nocCleared: Boolean(badge.nocCleared),
    zeroBrokerage: badge.zeroBrokerage !== false,
    issuedAt: String(badge.issuedAt || new Date().toISOString())
  }
}

export async function listPropertyListings(
  societyId: string,
  opts?: { purpose?: PropertyListingPurpose; statusPublishedOnly?: boolean }
): Promise<PropertyMarketListing[]> {
  if (localMode) {
    return localListings.filter((l) => {
      if (l.society_id !== societyId) return false
      if (opts?.purpose && l.listing_purpose !== opts.purpose) return false
      if (opts?.statusPublishedOnly && !['PUBLISHED', 'SYNDICATED'].includes(l.status)) return false
      return true
    })
  }
  try {
    const filters = [`society_id=eq.${societyId}`]
    if (opts?.purpose) filters.push(`listing_purpose=eq.${opts.purpose}`)
    if (opts?.statusPublishedOnly) filters.push(`status=in.(PUBLISHED,SYNDICATED)`)
    return await restGet<PropertyMarketListing[]>(
      `property_market_listings?${filters.join('&')}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listPropertyListings(societyId, opts)
  }
}

export async function listMyPropertyListings(societyId: string, userId: string): Promise<PropertyMarketListing[]> {
  if (localMode) {
    return localListings.filter((l) => l.society_id === societyId && l.listed_by_user_id === userId)
  }
  try {
    return await restGet<PropertyMarketListing[]>(
      `property_market_listings?society_id=eq.${societyId}&listed_by_user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listMyPropertyListings(societyId, userId)
  }
}

export type CreateListingInput = {
  societyId: string
  flatNumber: string
  userId: string
  listingPurpose: PropertyListingPurpose
  monthlyRent?: number
  securityDeposit?: number
  availableFrom?: string
  furnishing?: PropertyFurnishing
  expectedSalePrice?: number
  carpetAreaSqft?: number
  superAreaSqft?: number
  ownershipType?: PropertyOwnershipType
  societyNocStatus?: boolean
  isNegotiable?: boolean
  titleDocumentUrl?: string
  bhk?: string
  parkingAvailable?: boolean
  parkingCount?: number
  description?: string
  contactPhone?: string
  contactEmail?: string
  maintenanceDuesClear?: boolean
  societySecurityScore?: number
}

export async function createPropertyListing(input: CreateListingInput): Promise<PropertyMarketListing> {
  const flatId = await ensureSocietyFlatId(input.societyId, input.flatNumber)
  const pricePerSqft =
    input.listingPurpose === 'SALE'
      ? calculatePricePerSqft(input.expectedSalePrice || 0, input.carpetAreaSqft, input.superAreaSqft)
      : null

  const badge =
    input.listingPurpose === 'SALE'
      ? buildVerifiedRwaResaleBadge({
          maintenanceDuesClear: input.maintenanceDuesClear ?? false,
          societySecurityScore: input.societySecurityScore ?? 78,
          societyNocStatus: input.societyNocStatus ?? false
        })
      : null

  const payload = {
    society_id: input.societyId,
    flat_id: flatId,
    flat_number: input.flatNumber.trim(),
    listed_by_user_id: input.userId,
    listing_purpose: input.listingPurpose,
    monthly_rent: input.listingPurpose === 'RENT' ? input.monthlyRent ?? null : null,
    security_deposit: input.listingPurpose === 'RENT' ? input.securityDeposit ?? null : null,
    available_from: input.availableFrom || null,
    furnishing: input.furnishing || null,
    expected_sale_price: input.listingPurpose === 'SALE' ? input.expectedSalePrice ?? null : null,
    carpet_area_sqft: input.carpetAreaSqft ?? null,
    super_area_sqft: input.superAreaSqft ?? null,
    price_per_sqft: pricePerSqft,
    ownership_type: input.ownershipType || null,
    society_noc_status: input.societyNocStatus ?? false,
    is_negotiable: input.isNegotiable ?? true,
    title_document_url: input.titleDocumentUrl || null,
    bhk: input.bhk || null,
    parking_available: input.parkingAvailable ?? false,
    parking_count: input.parkingCount ?? 0,
    description: input.description || null,
    contact_phone: input.contactPhone || null,
    contact_email: input.contactEmail || null,
    status: 'DRAFT' as const,
    syndication_portals: [],
    syndication_payload: null,
    rwa_resale_badge: badge,
    maintenance_dues_clear: input.maintenanceDuesClear ?? false,
    society_security_score: input.societySecurityScore ?? 78,
    broadcast_sent_at: null,
    updated_at: new Date().toISOString()
  }

  if (localMode) {
    const row: PropertyMarketListing = {
      id: rid('listing'),
      created_at: new Date().toISOString(),
      ...payload
    }
    localListings.unshift(row)
    return row
  }
  try {
    return await restPost<PropertyMarketListing>('property_market_listings', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return createPropertyListing(input)
  }
}

/** 1-click publish + multi-portal syndication + investor broadcast. */
export async function publishAndSyndicateListing(listingId: string): Promise<{
  listing: PropertyMarketListing
  broadcast: ReturnType<typeof buildInvestorBroadcast>
}> {
  const listing = await getListingById(listingId)
  if (!listing) throw new Error('Listing not found')

  const badge =
    listing.listing_purpose === 'SALE'
      ? parseResaleBadge(listing.rwa_resale_badge) ||
        buildVerifiedRwaResaleBadge({
          maintenanceDuesClear: listing.maintenance_dues_clear,
          societySecurityScore: listing.society_security_score ?? 78,
          societyNocStatus: listing.society_noc_status
        })
      : null

  const { portals, payloads } = buildSyndicationPayloads({
    ...listing,
    rwa_resale_badge: badge
  })

  const patch = {
    status: 'SYNDICATED' as const,
    syndication_portals: portals,
    syndication_payload: payloads,
    rwa_resale_badge: badge,
    broadcast_sent_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  let updated: PropertyMarketListing
  if (localMode) {
    Object.assign(listing, patch)
    updated = listing
  } else {
    try {
      updated = await restPatch<PropertyMarketListing>(`property_market_listings?id=eq.${listingId}`, patch)
    } catch (err) {
      if (!shouldUseLocalFallback(err)) throw err
      localMode = true
      return publishAndSyndicateListing(listingId)
    }
  }

  return { listing: updated, broadcast: buildInvestorBroadcast(updated) }
}

async function getListingById(listingId: string): Promise<PropertyMarketListing | null> {
  if (localMode) return localListings.find((l) => l.id === listingId) ?? null
  try {
    const rows = await restGet<PropertyMarketListing[]>(`property_market_listings?id=eq.${listingId}&limit=1`)
    return rows[0] ?? null
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return getListingById(listingId)
  }
}

export async function closePropertyListing(listingId: string): Promise<PropertyMarketListing> {
  if (localMode) {
    const row = localListings.find((l) => l.id === listingId)
    if (!row) throw new Error('Listing not found')
    row.status = 'CLOSED'
    return row
  }
  try {
    return await restPatch<PropertyMarketListing>(`property_market_listings?id=eq.${listingId}`, {
      status: 'CLOSED',
      updated_at: new Date().toISOString()
    })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return closePropertyListing(listingId)
  }
}

export async function createListingInquiry(input: {
  societyId: string
  listingId: string
  userId?: string
  name: string
  phone?: string
  email?: string
  message?: string
  inquiryType?: PropertyInquiryType
}): Promise<PropertyListingInquiry> {
  const payload = {
    society_id: input.societyId,
    listing_id: input.listingId,
    inquirer_user_id: input.userId || null,
    inquirer_name: input.name.trim(),
    inquirer_phone: input.phone || null,
    inquirer_email: input.email || null,
    message: input.message || null,
    inquiry_type: input.inquiryType || ('CONTACT' as const)
  }

  if (localMode) {
    const row: PropertyListingInquiry = { id: rid('inq'), created_at: new Date().toISOString(), ...payload }
    localInquiries.unshift(row)
    return row
  }
  try {
    return await restPost<PropertyListingInquiry>('property_listing_inquiries', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return createListingInquiry(input)
  }
}
