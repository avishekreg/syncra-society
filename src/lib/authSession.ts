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
  kind: 'demo' | 'super_admin' | 'supabase'
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
