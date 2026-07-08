import type { Society, UserAndFlat } from '../types/db'
import { restGet, restPatch, restPost } from './supabaseClient'
import { fetchApiJson } from './safeFetch'
import { isSocietyUuid, resolveSocietyUuid } from '../lib/resolveSocietyContext'
import { SEED_SOCIETIES } from '../lib/seedSocieties'
import { initializeFoundingPresident } from '../lib/governanceRoles'

const SOCIETY_SELECT =
  'id,name,address,created_at,subscription_tier,subscription_status,pricing_slab_id,total_flats,opening_bank_balance'

function asString(value: unknown): string {
  if (value == null) return ''
  return String(value).trim()
}

function asNumberOrNull(value: unknown): number | null {
  if (value == null || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

/** Normalize PostgREST rows so UUID primary keys are always plain strings. */
export function normalizeSocietyRecord(raw: unknown): Society | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const id = asString(row.id)
  const name = asString(row.name)
  if (!id || !name) return null

  const tier = asString(row.pricing_slab_id) || asString(row.subscription_tier) || null

  return {
    id,
    name,
    address: row.address == null ? null : asString(row.address),
    created_at: row.created_at == null ? undefined : asString(row.created_at),
    subscription_status:
      row.subscription_status === 'active' ||
      row.subscription_status === 'trial' ||
      row.subscription_status === 'cancelled'
        ? row.subscription_status
        : undefined,
    pricing_slab_id: tier,
    total_flats: asNumberOrNull(row.total_flats),
    opening_bank_balance: asNumberOrNull(row.opening_bank_balance)
  }
}

export function normalizeSocietyList(rows: unknown): Society[] {
  if (!Array.isArray(rows)) return []
  return rows.map(normalizeSocietyRecord).filter((row): row is Society => row !== null)
}

async function fetchSocietiesFromRest(): Promise<Society[]> {
  const queries = [
    `societies?select=${SOCIETY_SELECT}&order=created_at.desc`,
    `societies?select=${SOCIETY_SELECT}`
  ]

  for (const path of queries) {
    try {
      const rows = await restGet<unknown[]>(path)
      const normalized = normalizeSocietyList(rows)
      if (normalized.length > 0) return normalized
    } catch {
      // try next query shape
    }
  }

  return []
}

export async function listSocieties(options?: { includeSeedFallback?: boolean }): Promise<Society[]> {
  const includeSeed = options?.includeSeedFallback !== false

  const fromRest = await fetchSocietiesFromRest()
  if (fromRest.length > 0) return fromRest

  const fromApi = await fetchApiJson<unknown[]>('/api/societies')
  const apiRows = normalizeSocietyList(fromApi)
  if (apiRows.length > 0) return apiRows

  if (includeSeed) return SEED_SOCIETIES

  return []
}

export async function resolveSocietyUuidFromRemote(
  slugOrId: string,
  societyName?: string | null
): Promise<string | null> {
  if (isRemoteSocietyId(slugOrId)) return slugOrId

  const alias = resolveSocietyUuid(slugOrId)
  if (alias && isSocietyUuid(alias)) return alias

  try {
    if (societyName?.trim()) {
      const rows = await restGet<Society[]>(
        `societies?name=eq.${encodeURIComponent(societyName.trim())}&select=id&limit=1`
      )
      const id = normalizeSocietyRecord(rows?.[0])?.id
      if (id) return id
    }
  } catch {
    // fall through
  }

  return alias
}

export async function insertSociety(payload: {
  name: string
  address: string
  total_flats?: number
  pricing_slab_id?: string
}): Promise<Society | null> {
  const fromApi = await fetchApiJson<unknown>('/api/societies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const apiRow = normalizeSocietyRecord(fromApi)
  if (apiRow?.id) return apiRow

  try {
    const created = await restPost<Society>('societies', {
      name: payload.name,
      address: payload.address,
      subscription_status: 'trial',
      pricing_slab_id: payload.pricing_slab_id ?? 'tier2',
      total_flats: payload.total_flats ?? null,
      opening_bank_balance: 0
    })
    return normalizeSocietyRecord(created)
  } catch {
    return null
  }
}

export async function getSocietyById(societyId: string): Promise<Society | null> {
  const rows = await restGet<Society[]>(`societies?id=eq.${societyId}&limit=1`)
  return normalizeSocietyRecord(rows?.[0])
}

export async function createSociety(payload: {
  name: string
  address: string
  admin_user_id: string
  admin_email: string
  admin_name?: string
}): Promise<{ society: Society; profile: UserAndFlat }> {
  const society = await restPost<Society>('societies', {
    name: payload.name,
    address: payload.address,
    subscription_status: 'trial',
    pricing_slab_id: 'tier2',
    opening_bank_balance: 0
  })

  const profile = await restPost<UserAndFlat>('user_and_flats', {
    user_id: payload.admin_user_id,
    society_id: society.id,
    flat_number: 'ADMIN',
    name: payload.admin_name ?? 'Society Admin',
    email: payload.admin_email,
    role: 'rwa_owner'
  })

  try {
    await restPost('society_subscriptions', {
      society_id: society.id,
      activation_status: 'pending'
    })
  } catch {
    // Table may not exist yet in remote Supabase — payment server will create on first status call.
  }

  initializeFoundingPresident(society.id, payload.admin_email)

  return { society: normalizeSocietyRecord(society)!, profile }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isRemoteSocietyId(societyId: string) {
  return UUID_PATTERN.test(societyId)
}

export async function updateSociety(
  societyId: string,
  patch: {
    name?: string
    address?: string
    total_flats?: number
    pricing_slab_id?: string
  }
): Promise<Society | null> {
  if (!isRemoteSocietyId(societyId)) return null

  const rows = await restPatch<Society[]>(`societies?id=eq.${societyId}`, patch)
  return normalizeSocietyRecord(rows?.[0])
}

export async function getUserProfile(userId: string): Promise<UserAndFlat | null> {
  const rows = await restGet<UserAndFlat[]>(`user_and_flats?user_id=eq.${userId}&limit=1`)
  return rows?.[0] ?? null
}
