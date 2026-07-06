/** Client-side auth session persistence for hard-refresh resilience. */

export const SUPER_ADMIN_SESSION_KEY = 'syncra-super-admin-session'
export const AUTH_SNAPSHOT_KEY = 'syncra-auth-snapshot'
export const SOCIETY_ID_SESSION_KEY = 'syncra-current-society-id'

export type AuthSnapshot = {
  id: string
  email: string
  roles: string[]
  tier: 'tier1' | 'tier2' | 'tier3'
  role: string
  flatNumber?: string | null
  username?: string | null
  displayName?: string | null
  avatarUrl?: string | null
  phone?: string | null
  whatsappNumber?: string | null
  requiresPasswordChange?: boolean
  kind: 'demo' | 'super_admin' | 'supabase'
}

type SupabaseStoredSession = {
  access_token?: string
  refresh_token?: string
  expires_at?: number
  user?: {
    id: string
    email?: string | null
    user_metadata?: { role?: string; tier?: string }
    app_metadata?: { provider?: string }
  }
}

export function saveAuthSnapshot(snapshot: AuthSnapshot, societyId?: string | null) {
  localStorage.setItem(AUTH_SNAPSHOT_KEY, JSON.stringify(snapshot))
  if (societyId !== undefined) {
    if (societyId) localStorage.setItem(SOCIETY_ID_SESSION_KEY, societyId)
    else localStorage.removeItem(SOCIETY_ID_SESSION_KEY)
  }
}

export function readAuthSnapshot(): AuthSnapshot | null {
  try {
    const raw = localStorage.getItem(AUTH_SNAPSHOT_KEY)
    return raw ? (JSON.parse(raw) as AuthSnapshot) : null
  } catch {
    return null
  }
}

export function readPersistedSocietyId(): string | null {
  return localStorage.getItem(SOCIETY_ID_SESSION_KEY)
}

export function clearAuthPersistence() {
  localStorage.removeItem(AUTH_SNAPSHOT_KEY)
  localStorage.removeItem(SOCIETY_ID_SESSION_KEY)
  localStorage.removeItem(SUPER_ADMIN_SESSION_KEY)
}

export function markSuperAdminSession(active: boolean) {
  if (active) localStorage.setItem(SUPER_ADMIN_SESSION_KEY, '1')
  else localStorage.removeItem(SUPER_ADMIN_SESSION_KEY)
}

export function hasSuperAdminSession() {
  return localStorage.getItem(SUPER_ADMIN_SESSION_KEY) === '1'
}

/** Synchronously read Supabase auth payload from `sb-*-auth-token` localStorage keys. */
export function readSupabaseSessionFromStorage(): SupabaseStoredSession | null {
  if (typeof window === 'undefined') return null

  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (!key?.startsWith('sb-') || !key.endsWith('-auth-token')) continue

      const raw = localStorage.getItem(key)
      if (!raw) continue

      const parsed = JSON.parse(raw) as SupabaseStoredSession
      if (parsed?.access_token && parsed?.user?.id) return parsed
    }
  } catch {
    return null
  }

  return null
}

export function isSupabaseSessionFresh(session: SupabaseStoredSession | null) {
  if (!session?.access_token) return false
  if (!session.expires_at) return true
  return session.expires_at * 1000 > Date.now() + 30_000
}
