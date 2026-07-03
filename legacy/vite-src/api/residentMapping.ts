import type { UserAndFlat } from '../types/db'
import { restGet, restPatch, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { resolveSocietyByJoinCode } from '../lib/societyRegistry'
import { logActivity } from '../lib/activityLog'

export type ResidentProfile = {
  userId: string
  email: string
  fullName: string
  societyId: string
  societyName: string
  flatNumber: string
  building?: string
  linkedAt: string
}

const PROFILES_KEY = 'syncra-resident-profiles'
const FLAT_CLAIMS_KEY = 'syncra-flat-claims'

function loadProfiles(): Record<string, ResidentProfile> {
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, ResidentProfile>) : {}
  } catch {
    return {}
  }
}

function saveProfiles(profiles: Record<string, ResidentProfile>) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

function loadFlatClaims(): Record<string, string> {
  try {
    const raw = localStorage.getItem(FLAT_CLAIMS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function flatClaimKey(societyId: string, flatNumber: string, building?: string) {
  return `${societyId}:${building ?? 'MAIN'}:${flatNumber.trim().toUpperCase()}`
}

export function getLocalResidentProfile(userId: string): ResidentProfile | null {
  return loadProfiles()[userId] ?? null
}

export function getLocalResidentProfileByEmail(email: string): ResidentProfile | null {
  const normalized = email.trim().toLowerCase()
  return Object.values(loadProfiles()).find((p) => p.email.toLowerCase() === normalized) ?? null
}

export async function linkResidentAccount(input: {
  userId: string
  email: string
  fullName: string
  societyJoinCode: string
  flatNumber: string
  building?: string
}): Promise<ResidentProfile> {
  const society = resolveSocietyByJoinCode(input.societyJoinCode)
  if (!society) {
    throw new Error('Invalid society join code. Ask your RWA admin for the correct code.')
  }

  const flat = input.flatNumber.trim()
  if (!flat) throw new Error('Flat number is required.')

  const claimKey = flatClaimKey(society.id, flat, input.building)
  const claims = loadFlatClaims()
  if (claims[claimKey] && claims[claimKey] !== input.userId) {
    throw new Error(`Flat ${flat} is already linked to another resident account. Contact your society admin.`)
  }

  const profile: ResidentProfile = {
    userId: input.userId,
    email: input.email.trim().toLowerCase(),
    fullName: input.fullName,
    societyId: society.id,
    societyName: society.name,
    flatNumber: flat,
    building: input.building?.trim() || undefined,
    linkedAt: new Date().toISOString()
  }

  try {
    const existing = await restGet<UserAndFlat[]>(
      `user_and_flats?society_id=eq.${society.id}&flat_number=eq.${encodeURIComponent(flat)}&limit=1`
    )
    const row = existing?.[0]
    if (row?.user_id && row.user_id !== input.userId) {
      throw new Error(`Flat ${flat} is already registered in this society.`)
    }

    if (row) {
      await restPatch(`user_and_flats?id=eq.${row.id}`, {
        user_id: input.userId,
        email: profile.email,
        name: profile.fullName,
        role: 'resident'
      })
    } else {
      await restPost('user_and_flats', {
        user_id: input.userId,
        society_id: society.id,
        flat_number: flat,
        name: profile.fullName,
        email: profile.email,
        role: 'resident'
      })
    }
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
  }

  const profiles = loadProfiles()
  profiles[input.userId] = profile
  saveProfiles(profiles)
  claims[claimKey] = input.userId
  localStorage.setItem(FLAT_CLAIMS_KEY, JSON.stringify(claims))

  logActivity({
    societyId: society.id,
    userId: input.userId,
    category: 'account',
    action: 'resident_linked',
    summary: `${profile.fullName} linked to Flat ${flat} at ${society.name}`,
    metadata: { flatNumber: flat, building: profile.building, email: profile.email }
  })

  return profile
}

export async function resolveResidentProfile(userId: string, email: string): Promise<ResidentProfile | null> {
  const local = getLocalResidentProfile(userId) ?? getLocalResidentProfileByEmail(email)
  if (local) return local

  try {
    const byUser = await restGet<UserAndFlat[]>(`user_and_flats?user_id=eq.${userId}&limit=1`)
    const profile = byUser?.[0]
    if (profile) {
      return {
        userId,
        email: profile.email ?? email,
        fullName: profile.name,
        societyId: profile.society_id,
        societyName: 'Your Society',
        flatNumber: profile.flat_number,
        linkedAt: new Date().toISOString()
      }
    }

    const byEmail = await restGet<UserAndFlat[]>(
      `user_and_flats?email=eq.${encodeURIComponent(email.trim().toLowerCase())}&limit=1`
    )
    const emailRow = byEmail?.[0]
    if (emailRow) {
      await restPatch(`user_and_flats?id=eq.${emailRow.id}`, { user_id: userId })
      return {
        userId,
        email,
        fullName: emailRow.name,
        societyId: emailRow.society_id,
        societyName: 'Your Society',
        flatNumber: emailRow.flat_number,
        linkedAt: new Date().toISOString()
      }
    }
  } catch {
    // fall through
  }

  return null
}
