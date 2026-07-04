export const DEV_SUPER_ADMIN = {
  email: 'superadmin@syncra.com',
  password: 'SyncraAdmin@2026',
  id: 'dev-super-admin-seed',
  roles: ['super_admin'] as string[]
}

export const DEMO_SOCIETY_ID = 'syncra-windsor-castle'
/** Primary key in `public.societies` for the Windsor Castle demo seed (schema.sql). */
export const DEMO_SOCIETY_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

/** Maps legacy slug/local ids to PostgreSQL UUIDs from `public.societies`. */
export const LEGACY_SOCIETY_ID_ALIASES: Record<string, string> = {
  [DEMO_SOCIETY_ID]: DEMO_SOCIETY_UUID,
  'syncra-windsor-castle': DEMO_SOCIETY_UUID
}
export const DEMO_AUTH_KEY = 'syncra-demo-auth'

export type DemoLoginConfig = {
  password: string
  roles: string[]
  role: string
  tier: 'tier1' | 'tier2' | 'tier3'
  flatNumber?: string | null
  label: string
}

/** Pre-seeded demo accounts for local development and sales demos. */
export const DEMO_LOGINS: Record<string, DemoLoginConfig> = {
  'president@syncrademo.com': {
    password: 'DemoAdmin@2026',
    roles: ['rwa_owner'],
    role: 'rwa_owner',
    tier: 'tier2',
    label: 'Society President (RWA Owner)'
  },
  'secretary@syncrademo.com': {
    password: 'DemoSec@2026',
    roles: ['rwa_accountant'],
    role: 'rwa_accountant',
    tier: 'tier2',
    label: 'Society Secretary (RWA Finance)'
  },
  'accountant@syncrademo.com': {
    password: 'DemoBook@2026',
    roles: ['rwa_accountant'],
    role: 'rwa_accountant',
    tier: 'tier2',
    label: 'Society Accountant'
  },
  'resident@syncrademo.com': {
    password: 'DemoHome@2026',
    roles: ['resident'],
    role: 'resident',
    tier: 'tier2',
    flatNumber: '402',
    label: 'Resident (Flat 402)'
  }
}

export const DEMO_CREDENTIALS = [
  { email: DEV_SUPER_ADMIN.email, password: DEV_SUPER_ADMIN.password, label: 'Global Super Admin' },
  ...Object.entries(DEMO_LOGINS).map(([email, config]) => ({
    email,
    password: config.password,
    label: config.label
  }))
]

export function isSuperAdminEmail(email: string) {
  return email.toLowerCase() === DEV_SUPER_ADMIN.email
}

export function isDemoSocietyId(societyId: string | null | undefined) {
  return societyId === DEMO_SOCIETY_ID || societyId?.startsWith('society-') === true
}

export function isDemoAuthActive() {
  if (typeof window === 'undefined') return false
  return Boolean(localStorage.getItem(DEMO_AUTH_KEY))
}

export function isDemoEmail(email: string | null | undefined) {
  if (!email) return false
  return Boolean(DEMO_LOGINS[email.toLowerCase()])
}

export function getPostLoginPath(roles: string[], societyId: string | null, role?: string) {
  if (roles.includes('super_admin') || role === 'super_admin') return '/super-admin'
  if (!societyId && (roles.includes('rwa_owner') || role === 'rwa_owner')) return '/onboarding'
  if (
    roles.includes('rwa_owner') ||
    roles.includes('rwa_accountant') ||
    role === 'rwa_owner' ||
    role === 'rwa_accountant'
  ) {
    return '/admin/dashboard'
  }
  return '/resident'
}

export function resolvePostLoginPath(
  email: string,
  roles: string[],
  societyId: string | null,
  role?: string
) {
  if (isSuperAdminEmail(email) || roles.includes('super_admin')) return '/super-admin'
  return getPostLoginPath(roles, societyId, role)
}

export function seedDemoBillingStatus(societyId: string, societyName = 'Syncra Windsor Castle') {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    `syncra-billing-${societyId}`,
    JSON.stringify({
      societyId,
      societyName,
      activationStatus: 'active_subscription',
      totalFlats: 120,
      monthlyRatePerFlat: 99,
      monthlyTotalInr: 11880,
      activationFeeInr: 2499,
      activeUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      razorpayKeyId: null,
      paymentsConfigured: false
    })
  )
}
