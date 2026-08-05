import { restGet, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import type { SocietyFlat } from '../types/db'

let localMode = false
const localFlats = new Map<string, SocietyFlat>()

function key(societyId: string, flatNumber: string) {
  return `${societyId}::${flatNumber.trim().toLowerCase()}`
}

/** Resolve or create a flats.id for society + flat_number. */
export async function ensureSocietyFlatId(
  societyId: string,
  flatNumber: string,
  ownerName = 'Owner',
  ownerPhone = ''
): Promise<string> {
  const normalized = flatNumber.trim()
  if (!societyId || !normalized) throw new Error('Society and flat number are required')

  const cacheKey = key(societyId, normalized)
  if (localMode && localFlats.has(cacheKey)) {
    return localFlats.get(cacheKey)!.id
  }

  if (localMode) {
    const row: SocietyFlat = {
      id: `local-flat-${Math.random().toString(36).slice(2, 10)}`,
      society_id: societyId,
      flat_number: normalized,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      created_at: new Date().toISOString()
    }
    localFlats.set(cacheKey, row)
    return row.id
  }

  try {
    const existing = await restGet<SocietyFlat[]>(
      `flats?society_id=eq.${societyId}&flat_number=eq.${encodeURIComponent(normalized)}&limit=1`
    )
    if (existing[0]?.id) {
      localFlats.set(cacheKey, existing[0])
      return existing[0].id
    }

    const created = await restPost<SocietyFlat>('flats', {
      society_id: societyId,
      flat_number: normalized,
      owner_name: ownerName,
      owner_phone: ownerPhone
    })
    localFlats.set(cacheKey, created)
    return created.id
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return ensureSocietyFlatId(societyId, normalized, ownerName, ownerPhone)
  }
}
