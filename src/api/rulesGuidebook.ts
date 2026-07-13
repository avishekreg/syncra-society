import type { GuidebookAmenity, GuidebookCustomSection, SocietyRulesGuidebook } from '../types/db'
import { restGet, restPatch, restPost } from './supabaseClient'
import { isRemoteSocietyId } from './societies'
import { logActivity } from '../lib/activityLog'
import {
  composeWhatsAppGuidebookReply,
  exportGuidebookAsKnowledgeText,
  searchGuidebookKnowledge
} from '../lib/guidebookKnowledge'

const TABLE = 'society_rules_guidebook'

function storageKey(societyId: string) {
  return `syncra-rules-guidebook-${societyId}`
}

export const FACILITY_TYPE_LABELS: Record<GuidebookAmenity['facility_type'], string> = {
  swimming_pool: 'Swimming Pool',
  gym: 'Gym / Fitness Centre',
  community_hall: 'Community Hall',
  clubhouse: 'Clubhouse',
  tennis_court: 'Tennis / Sports Court',
  kids_play_area: 'Kids Play Area',
  library: 'Library / Reading Room',
  parking: 'Parking / Basement',
  other: 'Other Facility'
}

const DEFAULT_GUIDEBOOK = {
  security_rules: '',
  community_rules: '',
  visitor_vehicle_policy: '',
  amenities: [] as GuidebookAmenity[],
  custom_sections: [] as GuidebookCustomSection[]
}

function loadLocalGuidebook(societyId: string): SocietyRulesGuidebook | null {
  try {
    const raw = localStorage.getItem(storageKey(societyId))
    return raw ? (JSON.parse(raw) as SocietyRulesGuidebook) : null
  } catch {
    return null
  }
}

function saveLocalGuidebook(guidebook: SocietyRulesGuidebook) {
  localStorage.setItem(storageKey(guidebook.society_id), JSON.stringify(guidebook))
}

function normalizeGuidebook(societyId: string, raw: Partial<SocietyRulesGuidebook> | null): SocietyRulesGuidebook {
  return {
    society_id: societyId,
    security_rules: raw?.security_rules ?? '',
    community_rules: raw?.community_rules ?? '',
    visitor_vehicle_policy: raw?.visitor_vehicle_policy ?? '',
    amenities: Array.isArray(raw?.amenities) ? raw!.amenities : [],
    custom_sections: Array.isArray(raw?.custom_sections) ? raw!.custom_sections : [],
    updated_at: raw?.updated_at ?? new Date().toISOString(),
    updated_by: raw?.updated_by ?? null
  }
}

function rowToGuidebook(societyId: string, row: Record<string, unknown>): SocietyRulesGuidebook {
  return normalizeGuidebook(societyId, {
    society_id: societyId,
    security_rules: String(row.security_rules ?? ''),
    community_rules: String(row.community_rules ?? ''),
    visitor_vehicle_policy: String(row.visitor_vehicle_policy ?? ''),
    amenities: (row.amenities as GuidebookAmenity[]) ?? [],
    custom_sections: (row.custom_sections as GuidebookCustomSection[]) ?? [],
    updated_at: String(row.updated_at ?? new Date().toISOString()),
    updated_by: row.updated_by == null ? null : String(row.updated_by)
  })
}

export async function fetchSocietyRulesGuidebook(societyId: string): Promise<SocietyRulesGuidebook> {
  if (isRemoteSocietyId(societyId)) {
    try {
      const rows = await restGet<Record<string, unknown>[]>(
        `${TABLE}?society_id=eq.${encodeURIComponent(societyId)}&limit=1`
      )
      if (rows?.[0]) {
        const guidebook = rowToGuidebook(societyId, rows[0])
        saveLocalGuidebook(guidebook)
        return guidebook
      }
    } catch {
      // fall through to local cache
    }
  }

  const cached = loadLocalGuidebook(societyId)
  if (cached) return normalizeGuidebook(societyId, cached)

  return {
    society_id: societyId,
    ...DEFAULT_GUIDEBOOK,
    updated_at: new Date().toISOString(),
    updated_by: null
  }
}

export async function upsertSocietyRulesGuidebook(
  societyId: string,
  payload: Omit<SocietyRulesGuidebook, 'society_id' | 'updated_at' | 'updated_by'>,
  updatedBy?: string | null
): Promise<SocietyRulesGuidebook> {
  const now = new Date().toISOString()
  const guidebook: SocietyRulesGuidebook = {
    society_id: societyId,
    ...payload,
    updated_at: now,
    updated_by: updatedBy ?? null
  }

  saveLocalGuidebook(guidebook)

  if (isRemoteSocietyId(societyId)) {
    try {
      const existing = await restGet<Record<string, unknown>[]>(
        `${TABLE}?society_id=eq.${encodeURIComponent(societyId)}&limit=1`
      )
      const body = {
        security_rules: guidebook.security_rules,
        community_rules: guidebook.community_rules,
        visitor_vehicle_policy: guidebook.visitor_vehicle_policy,
        amenities: guidebook.amenities,
        custom_sections: guidebook.custom_sections,
        updated_by: guidebook.updated_by,
        updated_at: now
      }
      if (existing?.[0]) {
        await restPatch(`${TABLE}?society_id=eq.${encodeURIComponent(societyId)}`, body)
      } else {
        await restPost(TABLE, { society_id: societyId, ...body, created_at: now })
      }
    } catch {
      // Local cache remains source of truth for demo / offline societies.
    }
  }

  logActivity({
    societyId,
    userId: updatedBy ?? null,
    category: 'governance',
    action: 'guidebook_updated',
    summary: 'Rules & regulations guidebook updated',
    metadata: {
      amenityCount: guidebook.amenities.length,
      customSectionCount: guidebook.custom_sections.length
    }
  })

  return guidebook
}

export function createEmptyAmenity(sortOrder: number): GuidebookAmenity {
  return {
    id: `amenity-${Date.now()}-${sortOrder}`,
    name: '',
    facility_type: 'other',
    open_time: '',
    close_time: '',
    operating_days: 'Mon – Sun',
    charges: '',
    charge_notes: '',
    facility_rules: '',
    sort_order: sortOrder
  }
}

export function createEmptyCustomSection(sortOrder: number): GuidebookCustomSection {
  return {
    id: `section-${Date.now()}-${sortOrder}`,
    title: '',
    body: '',
    sort_order: sortOrder
  }
}

export async function queryGuidebookForWhatsApp(
  societyId: string,
  query: string,
  societyName?: string
) {
  const guidebook = await fetchSocietyRulesGuidebook(societyId)
  const hits = searchGuidebookKnowledge(guidebook, query)
  return {
    hits,
    reply: composeWhatsAppGuidebookReply(hits, societyName),
    knowledgeText: exportGuidebookAsKnowledgeText(guidebook, societyName)
  }
}

export async function exportSocietyGuidebookKnowledge(societyId: string, societyName?: string) {
  const guidebook = await fetchSocietyRulesGuidebook(societyId)
  return exportGuidebookAsKnowledgeText(guidebook, societyName)
}
