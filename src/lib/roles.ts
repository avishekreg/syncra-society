import { isSuperAdminEmail } from '../config/devSeed'

export type AuthUser = {
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

/** RWA owner, secretary, or accountant for a specific society (excludes global super admin). */
export function isRwaStaff(user: AuthUser | null | undefined): boolean {
  if (!user || isGlobalSuperAdmin(user)) return false
  const role = user.user_metadata?.role ?? user.role ?? 'resident'
  return (
    role === 'rwa_owner' ||
    role === 'rwa_secretary' ||
    role === 'rwa_accountant' ||
    Boolean(user.roles?.includes('rwa_owner')) ||
    Boolean(user.roles?.includes('rwa_secretary')) ||
    Boolean(user.roles?.includes('rwa_accountant'))
  )
}

/** Map metadata role string to roles array for session hydration. */
export function rolesFromStaffRole(role: string | undefined): string[] {
  if (role === 'rwa_owner') return ['rwa_owner']
  if (role === 'rwa_secretary') return ['rwa_secretary']
  if (role === 'rwa_accountant') return ['rwa_accountant']
  if (role === 'gatekeeper') return ['gatekeeper']
  if (role === 'resident') return ['resident']
  return []
}

export function isGatekeeper(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  const role = user.user_metadata?.role ?? user.role
  return role === 'gatekeeper' || Boolean(user.roles?.includes('gatekeeper'))
}

/** Resident portal access — residents and presidents only. */
export function canAccessResidentPortal(user: AuthUser | null | undefined): boolean {
  if (!user || isGlobalSuperAdmin(user)) return false
  const role = user.user_metadata?.role ?? user.role ?? 'resident'
  const roles = user.roles ?? []
  if (role === 'rwa_secretary' || roles.includes('rwa_secretary')) return false
  if (role === 'rwa_accountant' || roles.includes('rwa_accountant')) return false
  return true
}
