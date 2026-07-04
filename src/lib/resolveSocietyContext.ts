import { readPersistedSocietyId } from './authSession'
import { DEMO_SOCIETY_ID, LEGACY_SOCIETY_ID_ALIASES } from '../config/devSeed'
import { isRemoteSocietyId } from '../api/societies'

type SocietyRecord = { id: string; name: string; city?: string }

export const SOCIETY_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isSocietyUuid(value: string | null | undefined): boolean {
  return Boolean(value && SOCIETY_UUID_PATTERN.test(value.trim()))
}

/** Resolve a slug or legacy id to a PostgreSQL UUID when a static alias exists. */
export function resolveSocietyUuid(slugOrId: string | null | undefined): string | null {
  if (!slugOrId?.trim()) return null
  const trimmed = slugOrId.trim()
  if (isSocietyUuid(trimmed)) return trimmed
  return LEGACY_SOCIETY_ID_ALIASES[trimmed] ?? null
}

/** Resolve the active society key from auth context (may still be a legacy slug). */
export function resolveActiveSocietyKey(
  currentSocietyId?: string | null,
  showcaseSocietyId?: string | null
): string | null {
  return currentSocietyId?.trim() || showcaseSocietyId?.trim() || readPersistedSocietyId()
}

/** @deprecated Use resolveActiveSocietyKey + resolveSocietyUuid / useResolvedSocietyUuid. */
export function resolveActiveSocietyId(
  currentSocietyId?: string | null,
  showcaseSocietyId?: string | null
): string | null {
  return resolveActiveSocietyKey(currentSocietyId, showcaseSocietyId)
}

function readSocietiesMirror(): SocietyRecord[] {
  try {
    const raw = localStorage.getItem('syncra-societies')
    if (!raw) return []
    const parsed = JSON.parse(raw) as SocietyRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Resolve a human-readable society name from showcase data or the local roster mirror. */
export function resolveSocietyName(
  societyId: string | null | undefined,
  showcaseName?: string | null
): string | null {
  if (showcaseName?.trim()) return showcaseName.trim()
  if (!societyId) return null

  const uuid = resolveSocietyUuid(societyId) ?? societyId
  const fromMirror = readSocietiesMirror().find(
    (item) => item.id === uuid || item.id === societyId
  )
  if (fromMirror?.name) return fromMirror.name

  if (societyId === DEMO_SOCIETY_ID || uuid === LEGACY_SOCIETY_ID_ALIASES[DEMO_SOCIETY_ID]) {
    return 'Syncra Windsor Castle'
  }

  return null
}

/** True when the value is safe to use as `societies.id` in Supabase inserts. */
export function isDatabaseSocietyId(value: string | null | undefined): boolean {
  return isRemoteSocietyId(value ?? '')
}
