import type { User as SupabaseUser } from '@supabase/supabase-js'
import { isSuperAdminEmail, isDemoEmail } from '../config/devSeed'

export const PENDING_SIGNUP_KEY = 'syncra-pending-signup'

export type PendingSignup = {
  email: string
  fullName: string
  accountType: 'society_admin' | 'resident'
  societyJoinCode?: string
  flatNumber?: string
  building?: string
}

export function isEmailVerificationRequired(email: string | null | undefined) {
  if (!email) return true
  return !isSuperAdminEmail(email)
}

export function isEmailVerified(user: Pick<SupabaseUser, 'email_confirmed_at'> | null | undefined) {
  if (!user) return false
  return Boolean(user.email_confirmed_at)
}

export function canAccessPortal(user: { email?: string | null; email_confirmed_at?: string | null } | null) {
  if (!user?.email) return false
  if (isSuperAdminEmail(user.email)) return true
  if (isDemoEmail(user.email)) return true
  return isEmailVerified(user as SupabaseUser)
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
