import type {
  InteriorRoomType,
  InteriorSpatialScan,
  InteriorVendorCategory,
  InteriorVendorLead,
  InteriorVendorLeadStatus
} from '../types/db'
import { ensureSocietyFlatId } from './flatRegistry'
import { restGet, restPatch, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'

let localMode = false
let localScans: InteriorSpatialScan[] = []
let localLeads: InteriorVendorLead[] = []

function rid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

const STANDARD_TV_SIZES = [32, 43, 50, 55, 65, 75, 85] as const

/** TV size inches from viewing distance: (distance_ft * 12) / 1.6, snapped to retail sizes. */
export function computeRecommendedTvSizeInches(viewingDistanceFt: number): {
  exactInches: number
  recommendedLabel: string
  snappedInches: number
} {
  const distanceInches = Math.max(24, viewingDistanceFt * 12)
  const exact = distanceInches / 1.6
  let snapped: number = STANDARD_TV_SIZES[0]
  let bestDelta = Math.abs(exact - snapped)
  for (const size of STANDARD_TV_SIZES) {
    const delta = Math.abs(exact - size)
    if (delta < bestDelta) {
      bestDelta = delta
      snapped = size
    }
  }
  return {
    exactInches: Math.round(exact * 10) / 10,
    snappedInches: snapped,
    recommendedLabel: `${snapped}"`
  }
}

export type SpatialGuidance = {
  sofaType: string
  acoustics: string
  guidance: string[]
}

/** Room acoustics & furniture fit stub based on room type + viewing distance. */
export function buildSpatialGuidance(input: {
  roomType: InteriorRoomType
  viewingDistanceFt: number
  tvSizeLabel: string
}): SpatialGuidance {
  const dist = input.viewingDistanceFt
  const wideRoom = dist >= 10
  const compact = dist <= 7

  let sofaType = '3-seater sofa (parallel to TV wall)'
  if (input.roomType === 'LIVING_ROOM') {
    sofaType = wideRoom
      ? 'L-shaped sectional (keep 30–36" walkway to balcony/kitchen)'
      : compact
        ? 'Compact 2–3 seater + ottoman (avoid deep sectionals)'
        : '3-seater sofa facing TV with side chair'
  } else if (input.roomType === 'BEDROOM') {
    sofaType = compact ? 'Bench / daybed at foot of bed' : 'Loveseat against secondary wall'
  } else if (input.roomType === 'BALCONY') {
    sofaType = 'Slim outdoor loveseat or foldable lounge chairs'
  } else if (input.roomType === 'KITCHEN') {
    sofaType = 'No full sofa — consider breakfast bar stools (24–26" seat height)'
  }

  let acoustics = 'Soundbar under TV for dialogue clarity'
  if (input.roomType === 'LIVING_ROOM') {
    acoustics = wideRoom
      ? '5.1 surround candidates if rear speakers clear walkways; else premium soundbar + wireless sub'
      : 'Compact soundbar preferred — avoid bulky rear speakers in tight living rooms'
  } else if (input.roomType === 'BEDROOM') {
    acoustics = 'Soundbar or bookshelf speakers at low volume; prioritize night-mode EQ'
  } else if (input.roomType === 'BALCONY') {
    acoustics = 'Portable Bluetooth speaker — avoid permanent surround installs outdoors'
  } else if (input.roomType === 'KITCHEN') {
    acoustics = 'Under-cabinet or shelf Bluetooth speaker; skip soundbar unless open-plan'
  }

  const guidance = [
    `Target display: ${input.tvSizeLabel} for ${dist} ft viewing distance (distance″ / 1.6).`,
    sofaType.includes('L-shaped')
      ? 'Leave a clear walkway of at least 30" between sofa chaise and coffee table.'
      : 'Keep primary seating centered on the TV axis within ±15°.',
    input.roomType === 'LIVING_ROOM'
      ? 'Layer warm 2700–3000K lighting behind TV to reduce eye strain at night.'
      : input.roomType === 'BEDROOM'
        ? 'Use dimmable bedside + soft cove lighting; avoid glare on TV glass.'
        : input.roomType === 'BALCONY'
          ? 'Prefer weather-rated furniture under 24" depth for corridor balconies.'
          : 'Prioritize task lighting over ambient for prep zones.',
    acoustics.includes('surround')
      ? 'If choosing surround, mount rears at ear height and cable-manage along skirting.'
      : 'Place soundbar flush with TV bottom edge; keep subwoofer near a front corner.',
    'Photograph existing outlets and AC vents before ordering furniture footprints.'
  ]

  return { sofaType, acoustics, guidance }
}

export const VERIFIED_INTERIOR_PARTNERS: Array<{
  name: string
  category: InteriorVendorCategory
  specialty: string
  budgetBands: string[]
}> = [
  {
    name: 'Urban Nest Interiors',
    category: 'INTERIOR',
    specialty: 'Full-home makeovers & modular living rooms',
    budgetBands: ['₹1–3L', '₹3–7L', '₹7L+']
  },
  {
    name: 'Teak & Timber Co.',
    category: 'WOODCRAFT',
    specialty: 'Custom sofas, TV units, and carpentry',
    budgetBands: ['₹50k–1.5L', '₹1.5–4L', '₹4L+']
  },
  {
    name: 'Pixel Home Electronics',
    category: 'ELECTRONICS',
    specialty: 'TV, soundbar, and home theatre installs',
    budgetBands: ['₹25–60k', '₹60k–1.5L', '₹1.5L+']
  },
  {
    name: 'Lumen Living Lights',
    category: 'LIGHTING',
    specialty: 'Layered lighting & false-ceiling moods',
    budgetBands: ['₹15–40k', '₹40–90k', '₹90k+']
  }
]

function parseGuidance(raw: InteriorSpatialScan['spatial_guidance']): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      return Array.isArray(parsed) ? parsed.map(String) : [raw]
    } catch {
      return [raw]
    }
  }
  return []
}

export function guidanceFromScan(scan: InteriorSpatialScan): string[] {
  return parseGuidance(scan.spatial_guidance)
}

export async function listSpatialScans(societyId: string, flatNumber?: string): Promise<InteriorSpatialScan[]> {
  if (localMode) {
    return localScans.filter(
      (s) => s.society_id === societyId && (!flatNumber || s.flat_number === flatNumber)
    )
  }
  try {
    const flatFilter = flatNumber ? `&flat_number=eq.${encodeURIComponent(flatNumber)}` : ''
    return await restGet<InteriorSpatialScan[]>(
      `interior_spatial_scans?society_id=eq.${societyId}${flatFilter}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listSpatialScans(societyId, flatNumber)
  }
}

export async function createSpatialScan(input: {
  societyId: string
  flatNumber: string
  userId: string
  roomType: InteriorRoomType
  viewingDistanceFt: number
  roomPhotoUrl?: string
}): Promise<InteriorSpatialScan> {
  const tv = computeRecommendedTvSizeInches(input.viewingDistanceFt)
  const spatial = buildSpatialGuidance({
    roomType: input.roomType,
    viewingDistanceFt: input.viewingDistanceFt,
    tvSizeLabel: tv.recommendedLabel
  })
  const flatId = await ensureSocietyFlatId(input.societyId, input.flatNumber)

  const payload = {
    society_id: input.societyId,
    flat_id: flatId,
    flat_number: input.flatNumber.trim(),
    user_id: input.userId,
    room_type: input.roomType,
    room_photo_url: input.roomPhotoUrl || null,
    viewing_distance_ft: input.viewingDistanceFt,
    recommended_tv_size_inches: tv.recommendedLabel,
    recommended_sofa_type: spatial.sofaType,
    acoustics_recommendation: spatial.acoustics,
    spatial_guidance: spatial.guidance
  }

  if (localMode) {
    const row: InteriorSpatialScan = {
      id: rid('scan'),
      created_at: new Date().toISOString(),
      ...payload
    }
    localScans.unshift(row)
    return row
  }
  try {
    return await restPost<InteriorSpatialScan>('interior_spatial_scans', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return createSpatialScan(input)
  }
}

export async function listVendorLeads(societyId: string): Promise<InteriorVendorLead[]> {
  if (localMode) return localLeads.filter((l) => l.society_id === societyId)
  try {
    return await restGet<InteriorVendorLead[]>(
      `interior_vendor_leads?society_id=eq.${societyId}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listVendorLeads(societyId)
  }
}

export async function dispatchInteriorVendorLead(input: {
  societyId: string
  flatNumber: string
  userId: string
  vendorName: string
  vendorCategory: InteriorVendorCategory
  budgetRange: string
  scanId?: string
  notes?: string
}): Promise<InteriorVendorLead> {
  const flatId = await ensureSocietyFlatId(input.societyId, input.flatNumber)
  const payload = {
    society_id: input.societyId,
    scan_id: input.scanId || null,
    flat_id: flatId,
    flat_number: input.flatNumber.trim(),
    vendor_name: input.vendorName.trim(),
    vendor_category: input.vendorCategory,
    budget_range: input.budgetRange.trim(),
    status: 'LEAD_GENERATED' as const,
    notes: input.notes?.trim() || null,
    created_by_user_id: input.userId
  }

  if (localMode) {
    const row: InteriorVendorLead = { id: rid('lead'), created_at: new Date().toISOString(), ...payload }
    localLeads.unshift(row)
    return row
  }
  try {
    return await restPost<InteriorVendorLead>('interior_vendor_leads', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return dispatchInteriorVendorLead(input)
  }
}

export async function updateVendorLeadStatus(
  leadId: string,
  status: InteriorVendorLeadStatus
): Promise<InteriorVendorLead> {
  if (localMode) {
    const row = localLeads.find((l) => l.id === leadId)
    if (!row) throw new Error('Lead not found')
    row.status = status
    return row
  }
  try {
    return await restPatch<InteriorVendorLead>(`interior_vendor_leads?id=eq.${leadId}`, { status })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return updateVendorLeadStatus(leadId, status)
  }
}

export function leadMonetizationSummary(leads: InteriorVendorLead[]) {
  return leads.reduce(
    (acc, lead) => {
      acc.total += 1
      if (lead.status === 'LEAD_GENERATED') acc.generated += 1
      if (lead.status === 'CONNECTED') acc.connected += 1
      if (lead.status === 'CLOSED') acc.closed += 1
      acc.byCategory[lead.vendor_category] = (acc.byCategory[lead.vendor_category] || 0) + 1
      return acc
    },
    {
      total: 0,
      generated: 0,
      connected: 0,
      closed: 0,
      byCategory: {} as Record<string, number>
    }
  )
}
