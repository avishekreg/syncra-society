/** Canonical Super Admin navigation — single source of truth for sidebar and route titles. */
export const SUPER_ADMIN_HOME = '/super-admin/dashboard'

export const SUPER_ADMIN_NAV = [
  { path: '/super-admin/dashboard', label: 'Global Dashboard', description: 'Platform overview & metrics' },
  { path: '/super-admin/societies', label: 'Society Onboarding', description: 'Add & manage registered societies' },
  { path: '/super-admin/access', label: 'Global Access Management', description: 'Admin & staff role assignment' },
  { path: '/super-admin/audit-logs', label: 'Platform Audit Logs', description: 'Cross-society activity trail' },
  { path: '/super-admin/settings', label: 'System Settings', description: 'Infrastructure & integrations' }
] as const

export const SUPER_ADMIN_PAGE_TITLES: Record<string, string> = Object.fromEntries(
  SUPER_ADMIN_NAV.map((item) => [item.path, item.label])
)

export function resolveSuperAdminTitle(pathname: string) {
  return SUPER_ADMIN_PAGE_TITLES[pathname] ?? 'Global Dashboard'
}
