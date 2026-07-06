import { restGet } from '../api/supabaseClient'
import type { UserAndFlat } from '../types/db'
import { DEMO_USERNAME_ALIASES } from '../config/devSeed'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isEmailIdentifier(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

export async function resolveLoginIdentifier(identifier: string): Promise<{
  email: string
  username: string | null
  profile: UserAndFlat | null
}> {
  const trimmed = identifier.trim()
  if (!trimmed) {
    throw new Error('Enter your email or username.')
  }

  if (isEmailIdentifier(trimmed)) {
    return { email: trimmed.toLowerCase(), username: null, profile: null }
  }

  const username = trimmed.toLowerCase()
  const demoEmail = DEMO_USERNAME_ALIASES[username]
  if (demoEmail) {
    return { email: demoEmail.toLowerCase(), username, profile: null }
  }

  try {
    const rows = await restGet<UserAndFlat[]>(
      `user_and_flats?username=eq.${encodeURIComponent(username)}&select=*&limit=1`
    )
    const profile = rows?.[0] ?? null
    if (profile?.email) {
      return { email: profile.email.trim().toLowerCase(), username, profile }
    }
  } catch {
    // Fall through to synthetic internal email for username-only dev accounts.
  }

  return { email: `${username}@gatekeeper.syncra.local`, username, profile: null }
}
