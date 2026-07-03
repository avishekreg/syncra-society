import { isSuperAdminEmail } from '../config/devSeed'

type AuthUser = {
  email?: string | null
  roles?: string[]
  role?: string
  user_metadata?: { role?: string }
}

/** Global platform operator — not bound to a single society. */
export function isGlobalSuperAdmin(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (user.roles?.includes('super_admin')) return true
  const role = user.user_metadata?.role ?? user.role
  if (role === 'super_admin') return true
  if (user.email && isSuperAdminEmail(user.email)) return true
  return false
}

/** RWA owner or accountant for a specific society (excludes global super admin). */
export function isRwaStaff(user: AuthUser | null | undefined): boolean {
  if (!user || isGlobalSuperAdmin(user)) return false
  const role = user.user_metadata?.role ?? user.role ?? 'resident'
  return (
    role === 'rwa_owner' ||
    role === 'rwa_accountant' ||
    user.roles?.includes('rwa_owner') ||
    user.roles?.includes('rwa_accountant')
  )
}

/** Resident portal access — all authenticated society users except global super admin. */
export function canAccessResidentPortal(user: AuthUser | null | undefined): boolean {
  return Boolean(user) && !isGlobalSuperAdmin(user)
}
