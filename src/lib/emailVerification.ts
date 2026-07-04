import type { User as SupabaseUser } from '@supabase/supabase-js'
import { isSuperAdminEmail, isDemoEmail } from '../config/devSeed'
import { dispatchEmailVerification } from './n8nClient'

export const PENDING_SIGNUP_KEY = 'syncra-pending-signup'
const VERIFICATION_STORE_KEY = 'syncra-email-verifications'
const CODE_TTL_MS = 30 * 60 * 1000

export type PendingSignup = {
  email: string
  fullName: string
  accountType: 'society_admin' | 'resident'
  societyJoinCode?: string
  flatNumber?: string
  building?: string
}

type VerificationRecord = {
  email: string
  code: string
  expiresAt: string
  verifiedAt?: string | null
  userId?: string | null
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function loadVerificationStore(): Record<string, VerificationRecord> {
  try {
    const raw = localStorage.getItem(VERIFICATION_STORE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, VerificationRecord>) : {}
  } catch {
    return {}
  }
}

function saveVerificationStore(store: Record<string, VerificationRecord>) {
  localStorage.setItem(VERIFICATION_STORE_KEY, JSON.stringify(store))
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function isEmailVerificationRequired(email: string | null | undefined) {
  if (!email) return true
  return !isSuperAdminEmail(email)
}

export function isSupabaseEmailVerified(user: Pick<SupabaseUser, 'email_confirmed_at'> | null | undefined) {
  if (!user) return false
  return Boolean(user.email_confirmed_at)
}

export function isAppEmailVerified(email: string | null | undefined) {
  if (!email) return false
  const key = normalizeEmail(email)
  const record = loadVerificationStore()[key]
  return Boolean(record?.verifiedAt)
}

export function isEmailVerified(user: Pick<SupabaseUser, 'email' | 'email_confirmed_at'> | null | undefined) {
  if (!user?.email) return false
  if (isSuperAdminEmail(user.email) || isDemoEmail(user.email)) return true
  return isSupabaseEmailVerified(user) && isAppEmailVerified(user.email)
}

export function canAccessPortal(user: { email?: string | null; email_confirmed_at?: string | null } | null) {
  if (!user?.email) return false
  if (isSuperAdminEmail(user.email)) return true
  if (isDemoEmail(user.email)) return true
  return isEmailVerified(user as SupabaseUser)
}

export async function issueEmailVerification(input: {
  email: string
  fullName?: string
  userId?: string | null
}) {
  const email = normalizeEmail(input.email)
  const code = generateVerificationCode()
  const verifyUrl = `${window.location.origin}/auth/verify-email?email=${encodeURIComponent(email)}`
  const store = loadVerificationStore()

  store[email] = {
    email,
    code,
    expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    verifiedAt: null,
    userId: input.userId ?? null
  }
  saveVerificationStore(store)

  await dispatchEmailVerification({
    email,
    fullName: input.fullName,
    code,
    verifyUrl
  })

  return { code, verifyUrl }
}

export function verifyAppEmailCode(email: string, token: string) {
  const key = normalizeEmail(email)
  const store = loadVerificationStore()
  const record = store[key]
  if (!record) {
    throw new Error('No verification request found for this email. Sign up again or resend the code.')
  }
  if (record.verifiedAt) return true
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    throw new Error('Verification code expired. Request a new one.')
  }
  if (record.code !== token.trim()) {
    throw new Error('Invalid verification code.')
  }

  store[key] = { ...record, verifiedAt: new Date().toISOString() }
  saveVerificationStore(store)
  return true
}

export function markAppEmailVerified(email: string) {
  const key = normalizeEmail(email)
  const store = loadVerificationStore()
  const record = store[key] ?? {
    email: key,
    code: '',
    expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString()
  }
  store[key] = { ...record, verifiedAt: new Date().toISOString() }
  saveVerificationStore(store)
}

export function savePendingSignup(payload: PendingSignup) {
  sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(payload))
}

export function loadPendingSignup(): PendingSignup | null {
  try {
    const raw = sessionStorage.getItem(PENDING_SIGNUP_KEY)
    return raw ? (JSON.parse(raw) as PendingSignup) : null
  } catch {
    return null
  }
}

export function clearPendingSignup() {
  sessionStorage.removeItem(PENDING_SIGNUP_KEY)
}

export function verificationRedirectUrl() {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}/auth/verify-email`
}
