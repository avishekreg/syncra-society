import { restGet } from '../api/supabaseClient'
import { shouldUseLocalFallback } from '../api/apiErrors'
import { listSocieties } from '../api/societies'
import type { UserAndFlat } from '../types/db'
import {
  ensureSocietyJoinCode,
  listRegisteredSocieties,
  resolveSocietyByJoinCode,
  type RegisteredSociety
} from './societyRegistry'

export type SocietyLayoutHints = {
  blocks: string[]
  wings: string[]
  sampleFlats: string[]
}

export type JoinCodeValidationResult = {
  valid: boolean
  society: RegisteredSociety | null
  layout: SocietyLayoutHints
  message: string
}

const EMPTY_LAYOUT: SocietyLayoutHints = { blocks: [], wings: [], sampleFlats: [] }

function extractLayoutFromFlats(flats: UserAndFlat[]): SocietyLayoutHints {
  const blocks = new Set<string>()
  const wings = new Set<string>()
  const sampleFlats: string[] = []

  for (const flat of flats) {
    const flatNumber = flat.flat_number?.trim() ?? ''
    if (!flatNumber) continue
    if (sampleFlats.length < 6) sampleFlats.push(flatNumber)

    const dashParts = flatNumber.split('-').map((part) => part.trim()).filter(Boolean)
    if (dashParts.length >= 2) {
      blocks.add(dashParts[0])
      if (dashParts.length >= 3) wings.add(dashParts[1])
    } else if (/^[A-Za-z]+/.test(flatNumber)) {
      const blockMatch = flatNumber.match(/^([A-Za-z]+)/)
      if (blockMatch?.[1]) blocks.add(blockMatch[1].toUpperCase())
    }
  }

  return {
    blocks: [...blocks].sort(),
    wings: [...wings].sort(),
    sampleFlats
  }
}

async function loadSocietyLayout(societyId: string): Promise<SocietyLayoutHints> {
  try {
    const rows = await restGet<UserAndFlat[]>(
      `user_and_flats?society_id=eq.${encodeURIComponent(societyId)}&select=flat_number&limit=120`
    )
    if (Array.isArray(rows) && rows.length > 0) {
      return extractLayoutFromFlats(rows)
    }
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
  }
  return EMPTY_LAYOUT
}

async function resolveRegisteredSocietyById(societyId: string): Promise<RegisteredSociety | null> {
  const local = listRegisteredSocieties().find((s) => s.id === societyId)
  if (local) return local

  try {
    const remote = await listSocieties({ includeSeedFallback: false })
    const match = remote.find((s) => s.id === societyId)
    if (!match) return null
    return {
      id: match.id,
      name: match.name,
      city: match.address?.split(',').pop()?.trim() ?? 'India',
      joinCode: ensureSocietyJoinCode(match.id, match.name)
    }
  } catch {
    return null
  }
}

/** Resolve invite URL params (`society_id`, `join_code`) into a society + join code pair. */
export async function resolveInviteContext(input: {
  societyId?: string | null
  joinCode?: string | null
}): Promise<{ society: RegisteredSociety | null; joinCode: string; source: 'society_id' | 'join_code' | null }> {
  const societyId = input.societyId?.trim() ?? ''
  const joinCodeParam = input.joinCode?.trim().toUpperCase() ?? ''

  if (societyId) {
    const society = await resolveRegisteredSocietyById(societyId)
    if (society) {
      return { society, joinCode: society.joinCode, source: 'society_id' }
    }
    const fallbackCode = ensureSocietyJoinCode(societyId, 'Society')
    return {
      society: {
        id: societyId,
        name: 'Your Society',
        city: 'India',
        joinCode: fallbackCode
      },
      joinCode: fallbackCode,
      source: 'society_id'
    }
  }

  if (joinCodeParam) {
    const validation = await validateJoinCode(joinCodeParam)
    if (validation.valid && validation.society) {
      return { society: validation.society, joinCode: validation.society.joinCode, source: 'join_code' }
    }
  }

  return { society: null, joinCode: joinCodeParam, source: null }
}

/** Validate a join code against registry + Supabase society mapping. */
export async function validateJoinCode(rawCode: string): Promise<JoinCodeValidationResult> {
  const code = rawCode.trim().toUpperCase()
  if (!code) {
    return { valid: false, society: null, layout: EMPTY_LAYOUT, message: 'Enter your society joining code.' }
  }

  let society = resolveSocietyByJoinCode(code)

  if (!society) {
    try {
      const remote = await listSocieties({ includeSeedFallback: true })
      for (const item of remote) {
        const generated = ensureSocietyJoinCode(item.id, item.name)
        if (generated.toUpperCase() === code) {
          society = {
            id: item.id,
            name: item.name,
            city: item.address?.split(',').pop()?.trim() ?? 'India',
            joinCode: generated
          }
          break
        }
      }
    } catch {
      // fall through to invalid result
    }
  }

  if (!society) {
    return {
      valid: false,
      society: null,
      layout: EMPTY_LAYOUT,
      message: 'Join code not recognized. Check the code from your society invite and try again.'
    }
  }

  const layout = await loadSocietyLayout(society.id)
  const layoutHint =
    layout.blocks.length > 0
      ? ` Blocks: ${layout.blocks.join(', ')}.`
      : layout.sampleFlats.length > 0
        ? ` Example flats: ${layout.sampleFlats.slice(0, 3).join(', ')}.`
        : ''

  return {
    valid: true,
    society,
    layout,
    message: `Verified: ${society.name}${society.city ? ` · ${society.city}` : ''}.${layoutHint}`,
    }
}
