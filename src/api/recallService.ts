import type { RecallMotion } from '../types/db'
import { restGet, restPost, supabaseRestUrl, getSupabaseRestHeaders } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { ensureSocietyFlatId } from './flatRegistry'

let localMode = false
let localMotions: RecallMotion[] = []
const localBallots = new Set<string>()

function rid() {
  return `recall-${Math.random().toString(36).slice(2, 10)}`
}

async function callRpc<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(supabaseRestUrl(`rpc/${fn}`), {
    method: 'POST',
    headers: getSupabaseRestHeaders(),
    body: JSON.stringify(body)
  })
  const text = await res.text()
  if (!res.ok) {
    let message = res.statusText || `RPC ${fn} failed`
    try {
      const parsed = JSON.parse(text) as { message?: string }
      message = parsed.message ?? message
    } catch {
      if (text) message = text
    }
    throw new Error(message)
  }
  return text ? (JSON.parse(text) as T) : (null as T)
}

export async function listRecallMotions(societyId: string): Promise<RecallMotion[]> {
  if (localMode) return localMotions.filter((m) => m.society_id === societyId)
  try {
    return await restGet<RecallMotion[]>(
      `recall_motions?society_id=eq.${societyId}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listRecallMotions(societyId)
  }
}

export async function createRecallMotion(input: {
  societyId: string
  targetOfficialRole: string
  reason: string
  votesRequiredCount: number
  createdByUserId?: string
}): Promise<RecallMotion> {
  const payload = {
    society_id: input.societyId,
    target_official_role: input.targetOfficialRole.trim(),
    reason: input.reason.trim(),
    votes_required_count: Math.max(3, input.votesRequiredCount),
    current_votes_count: 0,
    status: 'ACTIVE' as const,
    created_by_user_id: input.createdByUserId ?? null
  }

  if (localMode) {
    const row: RecallMotion = { id: rid(), created_at: new Date().toISOString(), ...payload }
    localMotions.unshift(row)
    return row
  }
  try {
    return await restPost<RecallMotion>('recall_motions', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return createRecallMotion(input)
  }
}

/** Cryptographic 1-flat-1-vote counter — stores hash only, not voter identity on the motion. */
export async function castRecallBallot(input: {
  motionId: string
  societyId: string
  flatNumber: string
  ballotSalt?: string
}): Promise<RecallMotion> {
  const flatId = await ensureSocietyFlatId(input.societyId, input.flatNumber)
  const salt = input.ballotSalt || `${Date.now()}-${Math.random().toString(36).slice(2)}`

  if (localMode) {
    const key = `${input.motionId}:${flatId}`
    if (localBallots.has(key)) throw new Error('This flat has already cast a ballot on this motion')
    const motion = localMotions.find((m) => m.id === input.motionId)
    if (!motion || motion.status !== 'ACTIVE') throw new Error('Motion is not active')
    localBallots.add(key)
    motion.current_votes_count += 1
    if (motion.current_votes_count >= motion.votes_required_count) motion.status = 'PASSED'
    return motion
  }

  try {
    const result = await callRpc<RecallMotion | RecallMotion[]>('cast_recall_ballot', {
      p_motion_id: input.motionId,
      p_flat_id: flatId,
      p_ballot_salt: salt
    })
    return Array.isArray(result) ? result[0] : result
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return castRecallBallot(input)
  }
}
