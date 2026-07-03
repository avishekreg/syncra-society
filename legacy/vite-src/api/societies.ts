import type { Society, UserAndFlat } from '../types/db'
import { restGet, restPatch, restPost } from './supabaseClient'

export async function getSocietyById(societyId: string): Promise<Society | null> {
  const rows = await restGet<Society[]>(`societies?id=eq.${societyId}&limit=1`)
  return rows?.[0] ?? null
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

  return { society, profile }
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
  return rows?.[0] ?? null
}

export async function getUserProfile(userId: string): Promise<UserAndFlat | null> {
  const rows = await restGet<UserAndFlat[]>(`user_and_flats?user_id=eq.${userId}&limit=1`)
  return rows?.[0] ?? null
}
