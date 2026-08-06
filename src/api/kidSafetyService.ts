import type { KidExitApproval } from '../types/db'
import { restGet, restPatch, restPost, supabaseRestUrl, getSupabaseRestHeaders } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { ensureSocietyFlatId } from './flatRegistry'
import { dispatchPushNotification } from '../lib/pushNotifications'

let localMode = false
let localApprovals: KidExitApproval[] = []
let localOverrides: KidExitOverride[] = []

export type KidExitOverride = {
  id: string
  society_id: string
  flat_number: string
  kid_name?: string | null
  override_by: 'PARENT' | 'GUARD'
  override_user_id?: string | null
  reason: string
  created_at: string
}

function rid(prefix = 'kid') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

async function expireStale(societyId: string) {
  const now = new Date().toISOString()
  if (localMode) {
    localApprovals = localApprovals.map((row) =>
      row.society_id === societyId && row.status === 'APPROVED' && row.valid_until < now
        ? { ...row, status: 'EXPIRED' as const }
        : row
    )
    return
  }
  try {
    await fetch(supabaseRestUrl('rpc/expire_kid_exit_approvals'), {
      method: 'POST',
      headers: getSupabaseRestHeaders(),
      body: '{}'
    })
  } catch {
    try {
      await restPatch(`kid_exit_approvals?society_id=eq.${societyId}&status=eq.APPROVED&valid_until=lt.${now}`, {
        status: 'EXPIRED'
      })
    } catch {
      // best effort
    }
  }
}

export async function createKidExitApproval(input: {
  societyId: string
  flatNumber: string
  kidName: string
  accompaniedBy: string
  validUntil: string
  createdByUserId?: string
}): Promise<KidExitApproval> {
  if (!input.kidName.trim()) throw new Error('Kid name is required')
  if (!input.accompaniedBy.trim()) throw new Error('Accompanied-by name is required')
  if (!input.validUntil) throw new Error('Valid-until time is required')

  const flatId = await ensureSocietyFlatId(input.societyId, input.flatNumber)
  const payload = {
    society_id: input.societyId,
    flat_id: flatId,
    flat_number: input.flatNumber.trim(),
    kid_name: input.kidName.trim(),
    accompanied_by: input.accompaniedBy.trim(),
    valid_until: input.validUntil,
    status: 'APPROVED' as const,
    created_by_user_id: input.createdByUserId ?? null
  }

  if (localMode) {
    const row: KidExitApproval = { id: rid(), created_at: new Date().toISOString(), ...payload }
    localApprovals.unshift(row)
    return row
  }
  try {
    return await restPost<KidExitApproval>('kid_exit_approvals', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return createKidExitApproval(input)
  }
}

export async function listKidExitApprovalsForFlat(
  societyId: string,
  flatNumber: string
): Promise<KidExitApproval[]> {
  await expireStale(societyId)
  if (localMode) {
    return localApprovals.filter(
      (r) => r.society_id === societyId && r.flat_number.toLowerCase() === flatNumber.toLowerCase()
    )
  }
  try {
    return await restGet<KidExitApproval[]>(
      `kid_exit_approvals?society_id=eq.${societyId}&flat_number=eq.${encodeURIComponent(flatNumber)}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listKidExitApprovalsForFlat(societyId, flatNumber)
  }
}

export type KidExitCheckResult = {
  allowed: boolean
  approval: KidExitApproval | null
  alertParents: boolean
  /** Gate clearance frozen until parent/guard human override. */
  gateFrozen: boolean
  parentNotified: boolean
  message: string
}

/**
 * Guard checkout for a minor.
 * Missing approval → loud parent push + freeze clearance until human override.
 */
export async function checkKidExitApproval(input: {
  societyId: string
  flatNumber: string
  kidName?: string
  notifyParents?: boolean
}): Promise<KidExitCheckResult> {
  await expireStale(input.societyId)
  const now = Date.now()

  let rows: KidExitApproval[] = []
  if (localMode) {
    rows = localApprovals.filter(
      (r) =>
        r.society_id === input.societyId &&
        r.flat_number.toLowerCase() === input.flatNumber.toLowerCase() &&
        r.status === 'APPROVED' &&
        new Date(r.valid_until).getTime() >= now
    )
  } else {
    try {
      rows = await restGet<KidExitApproval[]>(
        `kid_exit_approvals?society_id=eq.${input.societyId}&flat_number=eq.${encodeURIComponent(input.flatNumber)}&status=eq.APPROVED&valid_until=gte.${new Date().toISOString()}&order=valid_until.asc`
      )
    } catch (err) {
      if (!shouldUseLocalFallback(err)) throw err
      localMode = true
      return checkKidExitApproval(input)
    }
  }

  const match = input.kidName
    ? rows.find((r) => r.kid_name.toLowerCase() === input.kidName!.trim().toLowerCase()) ?? rows[0]
    : rows[0]

  if (!match) {
    let parentNotified = false
    if (input.notifyParents !== false) {
      try {
        await dispatchPushNotification({
          societyId: input.societyId,
          type: 'system.alert',
          title: 'Kid Safety — unapproved exit attempt',
          body: `Gate freeze: Flat ${input.flatNumber}${input.kidName ? ` · ${input.kidName}` : ''} has no active exit pre-approval. Parent or guard override required.`,
          url: '/resident/kid-safety',
          audience: 'flat',
          flatId: input.flatNumber,
          metadata: { silent: false, priority: 'high', kind: 'kid_exit_block' }
        })
        parentNotified = true
      } catch {
        parentNotified = false
      }
    }

    return {
      allowed: false,
      approval: null,
      alertParents: true,
      gateFrozen: true,
      parentNotified,
      message: `No active kid exit approval for Flat ${input.flatNumber}. Gate clearance frozen until parent or guard override.`
    }
  }

  return {
    allowed: true,
    approval: match,
    alertParents: false,
    gateFrozen: false,
    parentNotified: false,
    message: `Pre-approved: ${match.kid_name} with ${match.accompanied_by} until ${new Date(match.valid_until).toLocaleTimeString()}.`
  }
}

export async function markKidExitUsed(approvalId: string): Promise<KidExitApproval> {
  if (localMode) {
    const row = localApprovals.find((r) => r.id === approvalId)
    if (!row) throw new Error('Approval not found')
    row.status = 'USED'
    return row
  }
  try {
    return await restPatch<KidExitApproval>(`kid_exit_approvals?id=eq.${approvalId}`, { status: 'USED' })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return markKidExitUsed(approvalId)
  }
}

/** Human-in-the-loop override — required before unapproved child exit can proceed. */
export async function grantKidExitOverride(input: {
  societyId: string
  flatNumber: string
  kidName?: string
  overrideBy: 'PARENT' | 'GUARD'
  reason: string
  userId?: string
}): Promise<KidExitOverride> {
  if (!input.reason.trim()) throw new Error('Override reason is required')

  const payload = {
    society_id: input.societyId,
    flat_number: input.flatNumber.trim(),
    kid_name: input.kidName?.trim() || null,
    override_by: input.overrideBy,
    override_user_id: input.userId || null,
    reason: input.reason.trim()
  }

  if (localMode) {
    const row: KidExitOverride = { id: rid('ovr'), created_at: new Date().toISOString(), ...payload }
    localOverrides.unshift(row)
    return row
  }
  try {
    return await restPost<KidExitOverride>('kid_exit_overrides', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return grantKidExitOverride(input)
  }
}

export async function autonomousExpireKidExits(societyId: string) {
  await expireStale(societyId)
}
