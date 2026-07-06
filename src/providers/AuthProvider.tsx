import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import supabase from '../api/supabaseSdk'
import { restGet } from '../api/supabaseClient'
import type { Society, UserAndFlat } from '../types/db'
import { resolveResidentProfile, getLocalResidentProfile } from '../api/residentMapping'
import { resolveLoginIdentifier } from '../lib/usernameAuth'
import { rolesFromStaffRole } from '../lib/roles'
import { DEV_SUPER_ADMIN, DEMO_AUTH_KEY, DEMO_LOGINS, DEMO_SOCIETY_ID, isSuperAdminEmail, seedDemoBillingStatus } from '../config/devSeed'
import {
  canAccessPortal,
  isEmailVerificationRequired,
  isEmailVerified,
  isSupabaseEmailVerified,
  issueEmailVerification,
  loadPendingSignup,
  markAppEmailVerified,
  verifyAppEmailCode,
  verificationRedirectUrl
} from '../lib/emailVerification'
import {
  clearAuthPersistence,
  hasSuperAdminSession,
  isSupabaseSessionFresh,
  markSuperAdminSession,
  readAuthSnapshot,
  readPersistedSocietyId,
  readSupabaseSessionFromStorage,
  saveAuthSnapshot,
  type AuthSnapshot
} from '../lib/authSession'

type SubscriptionTier = 'tier1' | 'tier2' | 'tier3'

type User = {
  id: string
  email: string
  roles: string[]
  flatNumber?: string | null
  username?: string | null
  displayName?: string | null
  avatarUrl?: string | null
  phone?: string | null
  whatsappNumber?: string | null
  requiresPasswordChange?: boolean
  tier: SubscriptionTier
  role: string
  user_metadata?: {
    role: string
    tier: string
  }
  app_metadata?: {
    provider: string
  }
}

export type ShowcaseUserRole = 'rwa_owner' | 'rwa_secretary' | 'rwa_accountant' | 'resident'

export interface ShowcaseData {
  society: {
    id: string
    name: string
    subscription: string
    totalFlats: number
  }
  units: Array<{
    flat_number: string
    owner_name: string
    owner_email: string
    balance_status: 'paid' | 'due' | 'defaulter'
    balance_due: number
    last_payment: string
    payment_history: Array<{ date: string; amount: number; method: string }>
  }>
  defaulters: Array<{
    id: string
    society_id: string
    society_name: string
    building: string
    flat_number: string
    tenant_name: string
    amount_due: number
    overdue_days: number
    penalty: number
    status: 'unpaid' | 'paid'
    notes?: string | null
    created_at: string
  }>
  ledgerEntries: Array<{
    id: string
    society_id: string
    date: string
    type: 'credit' | 'debit'
    amount: number
    description?: string | null
    invoice_url?: string | null
  }>
}

const AuthContext = createContext<
  | {
      user: User | null
      initializing: boolean
      setUser: React.Dispatch<React.SetStateAction<User | null>>
      currentSocietyId: string | null
      setCurrentSocietyId: (s: string | null) => void
      showcaseData: ShowcaseData | null
      setShowcaseData: (data: ShowcaseData | null) => void
      signUp: (email: string, password: string, options?: { fullName?: string; role?: string }) => Promise<any>
      signIn: (identifier: string, password: string) => Promise<any>
      signOut: () => Promise<void>
      refreshSocietyProfile: () => Promise<void>
      societyName: string | null
      resendVerificationEmail: (email: string) => Promise<void>
      verifyEmailOtp: (email: string, token: string) => Promise<{ user: { id: string; email?: string | null; email_confirmed_at?: string | null } | null }>
    }
  | undefined
>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const snapshot = readAuthSnapshot()
    if (!snapshot) return null
    return {
      id: snapshot.id,
      email: snapshot.email,
      roles: snapshot.roles,
      tier: snapshot.tier,
      role: snapshot.role,
      flatNumber: snapshot.flatNumber ?? null,
      username: snapshot.username ?? null,
      displayName: snapshot.displayName ?? null,
      avatarUrl: snapshot.avatarUrl ?? null,
      phone: snapshot.phone ?? null,
      whatsappNumber: snapshot.whatsappNumber ?? null,
      requiresPasswordChange: snapshot.requiresPasswordChange ?? false,
      user_metadata: { role: snapshot.role, tier: snapshot.tier },
      app_metadata: { provider: snapshot.kind === 'supabase' ? 'email' : 'local' }
    }
  })
  const [initializing, setInitializing] = useState(true)
  const [currentSocietyId, setCurrentSocietyId] = useState<string | null>(() => readPersistedSocietyId())
  const [societyName, setSocietyName] = useState<string | null>(null)
  const [showcaseData, setShowcaseData] = useState<ShowcaseData | null>(null)

  const demoShowcaseData: ShowcaseData = {
    society: {
      id: DEMO_SOCIETY_ID,
      name: 'Syncra Windsor Castle',
      subscription: 'Tier 2',
      totalFlats: 120
    },
    units: [
      {
        flat_number: '101',
        owner_name: 'Naveen Kumar',
        owner_email: 'naveen.kumar@windsorcastle.com',
        balance_status: 'paid',
        balance_due: 0,
        last_payment: '02 Jul 2026',
        payment_history: [
          { date: '02 Jul 2026', amount: 3500, method: 'UPI transfer' }
        ]
      },
      {
        flat_number: '204',
        owner_name: 'Priya Menon',
        owner_email: 'priya.menon@windsorcastle.com',
        balance_status: 'due',
        balance_due: 4500,
        last_payment: '04 Jun 2026',
        payment_history: [
          { date: '04 Jun 2026', amount: 0, method: 'No recent payment' }
        ]
      },
      {
        flat_number: '402',
        owner_name: 'Raghav Sharma',
        owner_email: 'raghav.sharma@windsorcastle.com',
        balance_status: 'paid',
        balance_due: 0,
        last_payment: '28 Jun 2026',
        payment_history: [
          { date: '28 Jun 2026', amount: 4100, method: 'Cheque deposit' }
        ]
      },
      {
        flat_number: '501',
        owner_name: 'Aarti Joshi',
        owner_email: 'aarti.joshi@windsorcastle.com',
        balance_status: 'defaulter',
        balance_due: 8300,
        last_payment: '17 May 2026',
        payment_history: [
          { date: '17 May 2026', amount: 0, method: 'No payment received' }
        ]
      }
    ],
    defaulters: [
      {
        id: 'defaulter-204',
        society_id: DEMO_SOCIETY_ID,
        society_name: 'Syncra Windsor Castle',
        building: 'B',
        flat_number: '204',
        tenant_name: 'Priya Menon',
        amount_due: 4500,
        overdue_days: 60,
        penalty: 360,
        status: 'unpaid',
        notes: 'Late fee = ₹100 fixed + compound interest',
        created_at: new Date().toISOString()
      },
      {
        id: 'defaulter-501',
        society_id: DEMO_SOCIETY_ID,
        society_name: 'Syncra Windsor Castle',
        building: 'C',
        flat_number: '501',
        tenant_name: 'Aarti Joshi',
        amount_due: 8300,
        overdue_days: 45,
        penalty: 740,
        status: 'unpaid',
        notes: 'Defaulter since 45 days with fixed + compound interest',
        created_at: new Date().toISOString()
      }
    ],
    ledgerEntries: [
      {
        id: 'ledger-01',
        society_id: DEMO_SOCIETY_ID,
        date: '30 Jun 2026',
        type: 'credit',
        amount: 4100,
        description: 'Resident maintenance collection - Flat 402',
        invoice_url: null
      },
      {
        id: 'ledger-02',
        society_id: DEMO_SOCIETY_ID,
        date: '28 Jun 2026',
        type: 'credit',
        amount: 3500,
        description: 'Resident maintenance collection - Flat 101',
        invoice_url: null
      },
      {
        id: 'ledger-03',
        society_id: DEMO_SOCIETY_ID,
        date: '25 Jun 2026',
        type: 'debit',
        amount: 2800,
        description: 'Diesel for Generator',
        invoice_url: null
      },
      {
        id: 'ledger-04',
        society_id: DEMO_SOCIETY_ID,
        date: '24 Jun 2026',
        type: 'debit',
        amount: 5200,
        description: 'Security Staff Salary',
        invoice_url: null
      }
    ]
  }

  function buildUserFromSnapshot(snapshot: AuthSnapshot): User {
    return {
      id: snapshot.id,
      email: snapshot.email,
      roles: snapshot.roles,
      tier: snapshot.tier,
      role: snapshot.role,
      flatNumber: snapshot.flatNumber ?? null,
      username: snapshot.username ?? null,
      displayName: snapshot.displayName ?? null,
      avatarUrl: snapshot.avatarUrl ?? null,
      phone: snapshot.phone ?? null,
      whatsappNumber: snapshot.whatsappNumber ?? null,
      requiresPasswordChange: snapshot.requiresPasswordChange ?? false,
      user_metadata: { role: snapshot.role, tier: snapshot.tier },
      app_metadata: {
        provider: snapshot.kind === 'supabase' ? 'email' : snapshot.kind === 'demo' ? 'local' : 'local'
      }
    }
  }

  function isStaffRoleList(roles: string[]) {
    return roles.some((entry) =>
      ['rwa_owner', 'rwa_secretary', 'rwa_accountant', 'gatekeeper'].includes(entry)
    )
  }

  function applyProfileToUser(user: User, profile?: UserAndFlat | null): User {
    if (!profile) return user
    const staff = isStaffRoleList(user.roles)
    const profileRoles = rolesFromStaffRole(profile.role ?? undefined)
    return {
      ...user,
      flatNumber: profile.flat_number ?? user.flatNumber,
      username: profile.username ?? user.username,
      displayName: profile.name ?? user.displayName,
      phone: profile.phone ?? user.phone,
      whatsappNumber: profile.whatsapp_number ?? user.whatsappNumber,
      avatarUrl: profile.avatar_url ?? user.avatarUrl,
      requiresPasswordChange: profile.requires_password_change ?? user.requiresPasswordChange ?? false,
      role: staff ? user.role : profile.role ?? user.role,
      roles: staff ? user.roles : profileRoles.length ? profileRoles : user.roles,
      user_metadata: {
        role: staff ? user.user_metadata?.role ?? user.role : profile.role ?? user.role,
        tier: user.user_metadata?.tier ?? user.tier
      }
    }
  }

  async function loadSocietyName(societyId: string | null) {
    if (!societyId) {
      setSocietyName(null)
      return
    }
    if (societyId === DEMO_SOCIETY_ID) {
      setSocietyName(demoShowcaseData.society.name)
      return
    }
    try {
      const [society] = await restGet<Society[]>(`societies?id=eq.${societyId}&select=name&limit=1`)
      setSocietyName(society?.name ?? null)
    } catch {
      setSocietyName(null)
    }
  }

  function restoreAuthSnapshotSession() {
    const snapshot = readAuthSnapshot()
    if (!snapshot) return false

    const nextUser = buildUserFromSnapshot(snapshot)
    setUser(nextUser)

    if (snapshot.kind === 'super_admin') {
      markSuperAdminSession(true)
      setCurrentSocietyId(null)
      setShowcaseData(null)
      return true
    }

    if (snapshot.kind === 'demo') {
      setCurrentSocietyId(readPersistedSocietyId())
      setShowcaseData(demoShowcaseData)
      return true
    }

    setCurrentSocietyId(readPersistedSocietyId())
    return true
  }

  function restoreSupabaseSessionFromStorage() {
    const stored = readSupabaseSessionFromStorage()
    if (!isSupabaseSessionFresh(stored) || !stored?.user) return false

    const sessionUser = stored.user
    const isSuperAdmin = isSuperAdminEmail(sessionUser.email ?? '')
    const roles = isSuperAdmin ? DEV_SUPER_ADMIN.roles : []
    const metadataRole = sessionUser.user_metadata?.role
    const resolvedRoles =
      roles.length > 0
        ? roles
        : rolesFromStaffRole(metadataRole).length
          ? rolesFromStaffRole(metadataRole)
          : readAuthSnapshot()?.roles ?? []

    const nextUser = buildUser(
      {
        id: sessionUser.id,
        email: sessionUser.email,
        role: metadataRole,
        user_metadata: sessionUser.user_metadata,
        app_metadata: sessionUser.app_metadata
      },
      resolvedRoles
    )

    setUser(nextUser)
    markSuperAdminSession(isSuperAdmin)
    setCurrentSocietyId(readPersistedSocietyId())
    persistAuthSession(nextUser, readPersistedSocietyId(), isSuperAdmin ? 'super_admin' : 'supabase')
    return true
  }

  function persistAuthSession(nextUser: User | null, societyId?: string | null, kind?: AuthSnapshot['kind']) {
    if (!nextUser) {
      clearAuthPersistence()
      return
    }

    saveAuthSnapshot(
      {
        id: nextUser.id,
        email: nextUser.email,
        roles: nextUser.roles,
        tier: nextUser.tier,
        role: nextUser.role,
        flatNumber: nextUser.flatNumber,
        username: nextUser.username,
        displayName: nextUser.displayName,
        avatarUrl: nextUser.avatarUrl,
        phone: nextUser.phone,
        whatsappNumber: nextUser.whatsappNumber,
        requiresPasswordChange: nextUser.requiresPasswordChange,
        kind: kind ?? (nextUser.id.startsWith('demo-') ? 'demo' : 'supabase')
      },
      societyId
    )
  }

  function restoreSuperAdminSession() {
    if (!hasSuperAdminSession()) return false
    const nextUser = buildUser(
      { id: DEV_SUPER_ADMIN.id, email: DEV_SUPER_ADMIN.email },
      DEV_SUPER_ADMIN.roles,
      'tier3'
    )
    setUser(nextUser)
    setCurrentSocietyId(null)
    setShowcaseData(null)
    persistAuthSession(nextUser, null, 'super_admin')
    return true
  }

  function restoreDemoSession() {
    const storedDemo = localStorage.getItem(DEMO_AUTH_KEY)
    if (!storedDemo) return false

    try {
      const parsed = JSON.parse(storedDemo) as {
        email: string
        roles: string[]
        tier: SubscriptionTier
        currentSocietyId: string | null
        flatNumber?: string | null
      }
      const demoConfig = DEMO_LOGINS[parsed.email.toLowerCase()]
      const nextUser = buildUser(
        {
          id: `demo-${parsed.email}`,
          email: parsed.email,
          role: parsed.roles[0],
          user_metadata: { role: parsed.roles[0], tier: parsed.tier }
        },
        parsed.roles,
        parsed.tier,
        parsed.flatNumber ?? null
      )
      const enrichedUser = {
        ...nextUser,
        username: demoConfig?.username ?? null,
        requiresPasswordChange: demoConfig?.requiresPasswordChange ?? false
      }
      setUser(enrichedUser)
      setCurrentSocietyId(parsed.currentSocietyId)
      setShowcaseData(demoShowcaseData)
      setSocietyName(demoShowcaseData.society.name)
      persistAuthSession(enrichedUser, parsed.currentSocietyId, 'demo')
      if (parsed.currentSocietyId) {
        seedDemoBillingStatus(parsed.currentSocietyId, demoShowcaseData.society.name)
      }
      return true
    } catch {
      localStorage.removeItem(DEMO_AUTH_KEY)
      return false
    }
  }

  async function resolveSocietyId(userId: string, email?: string) {
    if (userId.startsWith('demo-') || localStorage.getItem(DEMO_AUTH_KEY)) {
      return
    }

    const userEmail = email ?? user?.email ?? ''

    try {
      const residentProfile = await resolveResidentProfile(userId, userEmail)
      if (residentProfile) {
        setCurrentSocietyId(residentProfile.societyId)
        setUser((prev) => {
          if (!prev) return prev
          if (isStaffRoleList(prev.roles)) {
            return { ...prev, flatNumber: residentProfile.flatNumber }
          }
          return {
            ...prev,
            flatNumber: residentProfile.flatNumber,
            role: 'resident',
            roles: ['resident'],
            user_metadata: { role: 'resident', tier: prev.user_metadata?.tier ?? 'tier1' }
          }
        })
        seedDemoActivities(residentProfile.societyId, residentProfile.flatNumber)
        await resolveSocietySubscriptionTier(residentProfile.societyId)
        await loadSocietyName(residentProfile.societyId)
        return
      }

      const rows = await restGet<UserAndFlat[]>(`user_and_flats?user_id=eq.${userId}&limit=1`)
      const profile = rows?.[0]
      setCurrentSocietyId(profile?.society_id ?? null)
      if (profile) {
        setUser((prev) => (prev ? applyProfileToUser(prev, profile) : prev))
        seedDemoActivities(profile.society_id, profile.flat_number)
        await resolveSocietySubscriptionTier(profile.society_id)
        await loadSocietyName(profile.society_id)
      } else {
        await loadSocietyName(null)
      }
    } catch {
      const local = getLocalResidentProfile(userId)
      if (local) {
        setCurrentSocietyId(local.societyId)
        setUser((prev) => (prev ? { ...prev, flatNumber: local.flatNumber, role: 'resident', roles: ['resident'] } : prev))
        seedDemoActivities(local.societyId, local.flatNumber)
        return
      }
      if (!localStorage.getItem(DEMO_AUTH_KEY)) {
        setCurrentSocietyId(null)
      }
    }
  }

  const refreshSocietyProfile = useCallback(async () => {
    if (user?.id) await resolveSocietyId(user.id, user.email)
  }, [user?.id])

  function mapSocietyToSubscriptionTier(society?: Society | null) {
    const slab = society?.pricing_slab_id?.toLowerCase() ?? ''
    if (slab.includes('tier3') || slab.includes('enterprise')) return 'tier3'
    if (slab.includes('tier2') || slab.includes('business') || slab.includes('growth')) return 'tier2'
    return 'tier1'
  }

  async function resolveSocietySubscriptionTier(societyId: string) {
    try {
      const [society] = await restGet<Society[]>(`societies?id=eq.${societyId}`)
      const tier = mapSocietyToSubscriptionTier(society)
      setUser((prev) => (prev ? { ...prev, tier } : prev))
    } catch {
      setUser((prev) => (prev ? { ...prev, tier: 'tier1' } : prev))
    }
  }

  function buildUser(
    sessionUser: {
      id: string
      email?: string | null
      role?: string
      user_metadata?: { role?: string; tier?: string }
      app_metadata?: { provider?: string }
    },
    roles: string[] = [],
    tier: SubscriptionTier = 'tier1',
    flatNumber?: string | null
  ): User {
    const metadataRole = sessionUser.user_metadata?.role ?? sessionUser.role ?? roles[0] ?? 'resident'
    const metadataTier = sessionUser.user_metadata?.tier ?? tier

    return {
      id: sessionUser.id,
      email: sessionUser.email ?? '',
      roles,
      tier,
      role: metadataRole,
      user_metadata: {
        role: metadataRole,
        tier: metadataTier
      },
      app_metadata: {
        provider: sessionUser.app_metadata?.provider ?? 'local'
      },
      flatNumber
    }
  }

  useEffect(() => {
    let active = true

    async function bootstrapAuth() {
      if (restoreDemoSession()) {
        if (active) setInitializing(false)
        return
      }
      if (restoreSuperAdminSession()) {
        if (active) setInitializing(false)
        return
      }
      if (restoreAuthSnapshotSession()) {
        // Keep initializing until Supabase confirms/refreshes the session in background.
      } else if (restoreSupabaseSessionFromStorage()) {
        // Instant hydration from sb-*-auth-token before async getSession().
      }

      const { data } = await supabase.auth.getSession()
      if (!active) return

      const session = data.session
      if (session?.user) {
        if (!canAccessPortal(session.user)) {
          setUser(null)
          setCurrentSocietyId(null)
          setShowcaseData(null)
          clearAuthPersistence()
        } else {
          localStorage.removeItem(DEMO_AUTH_KEY)
          markSuperAdminSession(isSuperAdminEmail(session.user.email ?? ''))
          const roles = isSuperAdminEmail(session.user.email ?? '') ? DEV_SUPER_ADMIN.roles : []
          const nextUser = buildUser(session.user, roles)
          setUser(nextUser)
          persistAuthSession(
            nextUser,
            readPersistedSocietyId(),
            isSuperAdminEmail(session.user.email ?? '') ? 'super_admin' : 'supabase'
          )
          await resolveSocietyId(session.user.id, session.user.email ?? undefined)
        }
      } else if (!hasSuperAdminSession() && !localStorage.getItem(DEMO_AUTH_KEY)) {
        if (!readAuthSnapshot() && !readSupabaseSessionFromStorage()) {
          setUser(null)
          setCurrentSocietyId(null)
          setShowcaseData(null)
        } else {
          restoreAuthSnapshotSession() || restoreSupabaseSessionFromStorage()
        }
      }

      if (active) setInitializing(false)
    }

    void bootstrapAuth()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (!canAccessPortal(session.user)) {
          void supabase.auth.signOut()
          setUser(null)
          setCurrentSocietyId(null)
          setShowcaseData(null)
          clearAuthPersistence()
          return
        }

        localStorage.removeItem(DEMO_AUTH_KEY)
        markSuperAdminSession(isSuperAdminEmail(session.user.email ?? ''))
        const roles = isSuperAdminEmail(session.user.email ?? '') ? DEV_SUPER_ADMIN.roles : []
        const nextUser = buildUser(session.user, roles)
        setUser(nextUser)
        persistAuthSession(
          nextUser,
          readPersistedSocietyId(),
          isSuperAdminEmail(session.user.email ?? '') ? 'super_admin' : 'supabase'
        )
        await resolveSocietyId(session.user.id, session.user.email ?? undefined)
        return
      }

      if (localStorage.getItem(DEMO_AUTH_KEY)) {
        restoreDemoSession()
        return
      }
      if (hasSuperAdminSession()) {
        restoreSuperAdminSession()
        return
      }

      if (restoreAuthSnapshotSession() || restoreSupabaseSessionFromStorage()) {
        return
      }

      if (!readAuthSnapshot()) {
        setUser(null)
        setCurrentSocietyId(null)
        setShowcaseData(null)
        clearAuthPersistence()
      }
    })

    return () => {
      active = false
      listener?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user || initializing) return
    if (user.id.startsWith('demo-')) return
    persistAuthSession(
      user,
      currentSocietyId,
      hasSuperAdminSession() ? 'super_admin' : 'supabase'
    )
  }, [user, currentSocietyId, initializing])

  async function signUp(
    email: string,
    password: string,
    options?: { fullName?: string; role?: string }
  ) {
    const normalizedEmail = email.trim().toLowerCase()
    const accountRole = options?.role ?? 'resident'
    const res = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: verificationRedirectUrl(),
        data: {
          full_name: options?.fullName ?? '',
          role: accountRole
        }
      }
    })
    if (res.error) throw res.error

    if (isEmailVerificationRequired(normalizedEmail)) {
      await issueEmailVerification({
        email: normalizedEmail,
        fullName: options?.fullName,
        userId: res.data.user?.id ?? null
      })
      await supabase.auth.signOut()
      setUser(null)
      setCurrentSocietyId(null)
      setShowcaseData(null)
      return res
    }

    if (res.data?.user) {
      const roles = accountRole === 'rwa_owner' ? ['rwa_owner'] : ['resident']
      setUser(buildUser(res.data.user, roles, 'tier1', null))
    }
    return res
  }

  async function resendVerificationEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase()
    if (!isEmailVerificationRequired(normalizedEmail)) {
      throw new Error('Email verification is not required for this account.')
    }

    const pending = loadPendingSignup()
    await issueEmailVerification({
      email: normalizedEmail,
      fullName: pending?.fullName,
      userId: null
    })

    try {
      await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: {
          emailRedirectTo: verificationRedirectUrl()
        }
      })
    } catch {
      // Supabase confirm-email may be disabled; app-level code still sent via n8n.
    }
  }

  async function verifyEmailOtp(email: string, token: string) {
    const normalizedEmail = email.trim().toLowerCase()
    let verifiedViaApp = false

    try {
      verifyAppEmailCode(normalizedEmail, token)
      verifiedViaApp = true
    } catch (appError) {
      const attempts = [
        () => supabase.auth.verifyOtp({ email: normalizedEmail, token, type: 'signup' }),
        () => supabase.auth.verifyOtp({ email: normalizedEmail, token, type: 'email' })
      ]

      let lastError = appError instanceof Error ? appError : new Error('Invalid verification code.')
      for (const attempt of attempts) {
        const { data, error } = await attempt()
        if (!error && data.user) {
          markAppEmailVerified(normalizedEmail)
          verifiedViaApp = true
          if (isSupabaseEmailVerified(data.user)) {
            const metaRole = data.user.user_metadata?.role as string | undefined
            const roles = rolesFromStaffRole(metaRole).length ? rolesFromStaffRole(metaRole) : ['resident']
            setUser(buildUser(data.user, roles, 'tier1', null))
            await resolveSocietyId(data.user.id, data.user.email ?? normalizedEmail)
            return { user: data.user }
          }
          break
        }
        lastError = error ?? lastError
      }

      if (!verifiedViaApp) {
        throw lastError
      }
    }

    markAppEmailVerified(normalizedEmail)

    const { data } = await supabase.auth.getSession()
    const sessionUser = data.session?.user
    if (sessionUser && sessionUser.email?.toLowerCase() === normalizedEmail && isEmailVerified(sessionUser)) {
      const metaRole = sessionUser.user_metadata?.role as string | undefined
      const roles = rolesFromStaffRole(metaRole).length ? rolesFromStaffRole(metaRole) : ['resident']
      setUser(buildUser(sessionUser, roles, 'tier1', null))
      await resolveSocietyId(sessionUser.id, sessionUser.email ?? normalizedEmail)
      return { user: sessionUser }
    }

    return {
      user: {
        id: sessionUser?.id ?? '',
        email: normalizedEmail,
        email_confirmed_at: new Date().toISOString()
      }
    }
  }

  async function signIn(identifier: string, password: string) {
    const { email: normalizedEmail, profile: resolvedProfile } = await resolveLoginIdentifier(identifier)
    const isSeedAdmin =
      normalizedEmail === DEV_SUPER_ADMIN.email && password === DEV_SUPER_ADMIN.password

    if (isSeedAdmin) {
      await supabase.auth.signOut()
      localStorage.removeItem(DEMO_AUTH_KEY)
      const fallbackUser = buildUser({ id: DEV_SUPER_ADMIN.id, email: DEV_SUPER_ADMIN.email }, DEV_SUPER_ADMIN.roles, 'tier3')
      setUser(fallbackUser)
      setCurrentSocietyId(null)
      setShowcaseData(null)
      markSuperAdminSession(true)
      persistAuthSession(fallbackUser, null, 'super_admin')
      return { data: { user: fallbackUser }, user: fallbackUser, societyId: null }
    }

    const demoLogin = DEMO_LOGINS[normalizedEmail]
    if (demoLogin && demoLogin.password === password) {
      await supabase.auth.signOut()

      const userId = `demo-${normalizedEmail}`
      const nextUser = buildUser(
        {
          id: userId,
          email: normalizedEmail,
          role: demoLogin.role,
          user_metadata: {
            role: demoLogin.role,
            tier: demoLogin.tier
          },
          app_metadata: {
            provider: 'local'
          }
        },
        demoLogin.roles,
        demoLogin.tier,
        demoLogin.flatNumber ?? null
      )
      const enrichedUser = {
        ...nextUser,
        username: demoLogin.username ?? null,
        requiresPasswordChange: demoLogin.requiresPasswordChange ?? false
      }
      const sessionPayload = {
        session: {
          user: {
            id: userId,
            email: normalizedEmail,
            role: demoLogin.role,
            user_metadata: {
              role: demoLogin.role,
              tier: demoLogin.tier
            },
            app_metadata: {
              provider: 'local'
            }
          }
        }
      }
      setUser(enrichedUser)
      setCurrentSocietyId(DEMO_SOCIETY_ID)
      setShowcaseData(demoShowcaseData)
      setSocietyName(demoShowcaseData.society.name)
      seedDemoBillingStatus(DEMO_SOCIETY_ID, demoShowcaseData.society.name)
      localStorage.setItem(
        DEMO_AUTH_KEY,
        JSON.stringify({
          email: normalizedEmail,
          roles: demoLogin.roles,
          tier: demoLogin.tier,
          currentSocietyId: DEMO_SOCIETY_ID,
          flatNumber: demoLogin.flatNumber ?? null
        })
      )
      markSuperAdminSession(false)
      persistAuthSession(enrichedUser, DEMO_SOCIETY_ID, 'demo')
      return {
        session: sessionPayload.session,
        data: { user: enrichedUser },
        user: enrichedUser,
        societyId: DEMO_SOCIETY_ID,
        requiresPasswordChange: enrichedUser.requiresPasswordChange
      }
    }

    try {
      const res = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      if (res.error) {
        if (res.error.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('Please verify your email before signing in. Check your inbox or enter your verification code.')
        }
        throw res.error
      }

      if (isEmailVerificationRequired(normalizedEmail) && !isEmailVerified(res.data.user)) {
        await supabase.auth.signOut()
        throw new Error('Please verify your email before signing in. Check your inbox or enter your verification code.')
      }

      const metadataRole = res.data.user?.user_metadata?.role as string | undefined
      const roles = rolesFromStaffRole(metadataRole)
      let nextUser = buildUser(res.data.user!, roles, 'tier1', null)
      if (resolvedProfile) {
        nextUser = applyProfileToUser(nextUser, resolvedProfile)
      }

      let societyId: string | null = resolvedProfile?.society_id ?? null
      try {
        const residentProfile = await resolveResidentProfile(res.data.user!.id, normalizedEmail)
        if (residentProfile) {
          societyId = residentProfile.societyId
          if (isStaffRoleList(nextUser.roles)) {
            nextUser = { ...nextUser, flatNumber: residentProfile.flatNumber }
          } else {
            nextUser = {
              ...nextUser,
              flatNumber: residentProfile.flatNumber,
              role: 'resident',
              roles: ['resident'],
              user_metadata: { role: 'resident', tier: nextUser.user_metadata?.tier ?? 'tier1' }
            }
          }
          seedDemoActivities(residentProfile.societyId, residentProfile.flatNumber)
          if (societyId) await resolveSocietySubscriptionTier(societyId)
        } else if (!resolvedProfile) {
          const rows = await restGet<UserAndFlat[]>(`user_and_flats?user_id=eq.${res.data.user!.id}&limit=1`)
          const profile = rows?.[0]
          societyId = profile?.society_id ?? null
          if (profile) {
            nextUser = applyProfileToUser(nextUser, profile)
            seedDemoActivities(profile.society_id, profile.flat_number)
            if (societyId) await resolveSocietySubscriptionTier(societyId)
          }
        } else {
          seedDemoActivities(resolvedProfile.society_id, resolvedProfile.flat_number)
          if (societyId) await resolveSocietySubscriptionTier(societyId)
        }
      } catch {
        const local = getLocalResidentProfile(res.data.user!.id)
        if (local) {
          societyId = local.societyId
          if (isStaffRoleList(nextUser.roles)) {
            nextUser = { ...nextUser, flatNumber: local.flatNumber }
          } else {
            nextUser = {
              ...nextUser,
              flatNumber: local.flatNumber,
              role: 'resident',
              roles: ['resident']
            }
          }
        }
      }

      setUser(nextUser)
      setCurrentSocietyId(societyId)
      await loadSocietyName(societyId)
      setShowcaseData(null)
      localStorage.removeItem(DEMO_AUTH_KEY)
      markSuperAdminSession(false)
      persistAuthSession(nextUser, societyId, 'supabase')
      return {
        ...res,
        user: nextUser,
        societyId,
        requiresPasswordChange: nextUser.requiresPasswordChange ?? false
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(`Authentication failed: ${message}`)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setCurrentSocietyId(null)
    setSocietyName(null)
    setShowcaseData(null)
    localStorage.removeItem(DEMO_AUTH_KEY)
    clearAuthPersistence()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        setUser,
        currentSocietyId,
        setCurrentSocietyId,
        showcaseData,
        setShowcaseData,
        societyName,
        signUp,
        signIn,
        signOut,
        refreshSocietyProfile,
        resendVerificationEmail,
        verifyEmailOtp
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
