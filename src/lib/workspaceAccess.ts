import { isGlobalSuperAdmin, type AuthUser } from './roles'

export type WorkspaceRole = 'super_admin' | 'president' | 'secretary' | 'accountant' | 'resident'

export function resolveWorkspaceRole(user: AuthUser | null | undefined): WorkspaceRole {
  if (!user) return 'resident'
  if (isGlobalSuperAdmin(user)) return 'super_admin'

  const role = user.user_metadata?.role ?? user.role ?? 'resident'
  const roles = user.roles ?? []

  if (role === 'rwa_owner' || roles.includes('rwa_owner')) return 'president'
  if (role === 'rwa_secretary' || roles.includes('rwa_secretary')) return 'secretary'
  if (role === 'rwa_accountant' || roles.includes('rwa_accountant')) return 'accountant'
  return 'resident'
}

export function workspaceRoleLabel(role: WorkspaceRole): string {
  switch (role) {
    case 'super_admin':
      return 'Global Platform Admin'
    case 'president':
      return 'Society President'
    case 'secretary':
      return 'Society Secretary'
    case 'accountant':
      return 'Society Accountant'
    default:
      return 'Resident'
  }
}

export function defaultPathForRole(role: WorkspaceRole): string {
  switch (role) {
    case 'super_admin':
      return '/super-admin'
    case 'president':
      return '/admin/dashboard'
    case 'secretary':
      return '/admin/helpdesk'
    case 'accountant':
      return '/finance/ledger'
    default:
      return '/resident'
  }
}

export function canAccessResidentPortal(user: AuthUser | null | undefined): boolean {
  const role = resolveWorkspaceRole(user)
  return role === 'resident' || role === 'president' || role === 'super_admin'
}

export function canAccessPresidentConsole(user: AuthUser | null | undefined): boolean {
  const role = resolveWorkspaceRole(user)
  return role === 'president' || role === 'super_admin'
}

export function canAccessFinancialConsole(user: AuthUser | null | undefined): boolean {
  const role = resolveWorkspaceRole(user)
  return role === 'president' || role === 'accountant' || role === 'super_admin'
}

export function canAccessNoticesManagement(user: AuthUser | null | undefined): boolean {
  const role = resolveWorkspaceRole(user)
  return role === 'president' || role === 'secretary' || role === 'super_admin'
}

export function canAccessHelpdeskDashboard(user: AuthUser | null | undefined): boolean {
  const role = resolveWorkspaceRole(user)
  return role === 'president' || role === 'secretary' || role === 'super_admin'
}

export function canAccessRwaControls(user: AuthUser | null | undefined): boolean {
  const role = resolveWorkspaceRole(user)
  return role === 'president' || role === 'secretary' || role === 'super_admin'
}

export function canAccessSocietyConfiguration(user: AuthUser | null | undefined): boolean {
  return canAccessPresidentConsole(user)
}

export function canAccessGuardConsole(user: AuthUser | null | undefined): boolean {
  return canAccessPresidentConsole(user)
}

export function canAccessWhatsappAutomation(user: AuthUser | null | undefined): boolean {
  return canAccessPresidentConsole(user)
}

export function canAccessRwaSettings(user: AuthUser | null | undefined): boolean {
  return canAccessPresidentConsole(user)
}

export function canAccessWorkspaceCashflow(user: AuthUser | null | undefined): boolean {
  return canAccessPresidentConsole(user)
}

export function canAccessWorkspaceComplaints(user: AuthUser | null | undefined): boolean {
  const role = resolveWorkspaceRole(user)
  return role === 'president' || role === 'secretary' || role === 'super_admin'
}

export function canAccessWorkspaceFlats(user: AuthUser | null | undefined): boolean {
  return canAccessPresidentConsole(user)
}

export function canAccessAdministration(user: AuthUser | null | undefined): boolean {
  const role = resolveWorkspaceRole(user)
  return role !== 'resident'
}

export function isStaffRole(role: WorkspaceRole): boolean {
  return role === 'president' || role === 'secretary' || role === 'accountant'
}
