import type { CommunityDispute, DisputeIssueType } from '../types/db'
import { restGet, restPatch, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { ensureSocietyFlatId } from './flatRegistry'

let localMode = false
let localDisputes: CommunityDispute[] = []

function rid() {
  return `dispute-${Math.random().toString(36).slice(2, 10)}`
}

const BYLAW_MAP: Record<DisputeIssueType, { summary: string; fine: number }> = {
  PARKING: {
    summary:
      'Bylaw 4.2 — vehicles must occupy allotted bays. Suggested resolution: re-park within 2 hours; repeat offense attracts visitor-slot fee.',
    fine: 500
  },
  SEEPAGE: {
    summary:
      'Bylaw 7.1 — upper-floor owners must remediate plumbing leaks within 72 hours. Suggested joint inspection + waterproofing cost split if shared stack.',
    fine: 0
  },
  PETS: {
    summary:
      'Bylaw 9.3 — pets must be leashed in common areas; waste must be cleared immediately. Suggested apology + cleaning recovery if soiling proven.',
    fine: 300
  },
  NOISE: {
    summary:
      'Bylaw 5.4 — quiet hours 10:30 PM–6:30 AM. Suggested written undertaking; escalation to RWA if three verified complaints in 30 days.',
    fine: 750
  }
}

export function draftMediation(issueType: DisputeIssueType, description: string) {
  const base = BYLAW_MAP[issueType]
  return {
    summary: `${base.summary} Context noted: “${description.trim().slice(0, 160)}”.`,
    suggestedFine: base.fine
  }
}

export async function fileCommunityDispute(input: {
  societyId: string
  plaintiffFlatNumber: string
  respondentFlatNumber: string
  issueType: DisputeIssueType
  description: string
  createdByUserId?: string
}): Promise<CommunityDispute> {
  if (input.plaintiffFlatNumber.trim().toLowerCase() === input.respondentFlatNumber.trim().toLowerCase()) {
    throw new Error('Plaintiff and respondent flats must differ')
  }
  const plaintiffFlatId = await ensureSocietyFlatId(input.societyId, input.plaintiffFlatNumber)
  const respondentFlatId = await ensureSocietyFlatId(input.societyId, input.respondentFlatNumber)
  const mediation = draftMediation(input.issueType, input.description)

  const payload = {
    society_id: input.societyId,
    plaintiff_flat_id: plaintiffFlatId,
    plaintiff_flat_number: input.plaintiffFlatNumber.trim(),
    respondent_flat_id: respondentFlatId,
    respondent_flat_number: input.respondentFlatNumber.trim(),
    issue_type: input.issueType,
    description: input.description.trim(),
    ai_mediation_summary: mediation.summary,
    suggested_fine_amount: mediation.suggestedFine,
    status: 'PENDING_MEDIATION' as const,
    created_by_user_id: input.createdByUserId ?? null
  }

  if (localMode) {
    const row: CommunityDispute = {
      id: rid(),
      created_at: new Date().toISOString(),
      plaintiff_signed_at: null,
      respondent_signed_at: null,
      ...payload
    }
    localDisputes.unshift(row)
    return row
  }
  try {
    return await restPost<CommunityDispute>('community_disputes', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return fileCommunityDispute(input)
  }
}

export async function listCommunityDisputes(societyId: string): Promise<CommunityDispute[]> {
  if (localMode) return localDisputes.filter((d) => d.society_id === societyId)
  try {
    return await restGet<CommunityDispute[]>(
      `community_disputes?society_id=eq.${societyId}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listCommunityDisputes(societyId)
  }
}

export async function signDisputeSettlement(
  disputeId: string,
  role: 'plaintiff' | 'respondent'
): Promise<CommunityDispute> {
  const now = new Date().toISOString()
  if (localMode) {
    const row = localDisputes.find((d) => d.id === disputeId)
    if (!row) throw new Error('Dispute not found')
    if (role === 'plaintiff') row.plaintiff_signed_at = now
    else row.respondent_signed_at = now
    if (row.plaintiff_signed_at && row.respondent_signed_at) row.status = 'SETTLED'
    return row
  }

  try {
    const existing = await restGet<CommunityDispute[]>(`community_disputes?id=eq.${disputeId}&limit=1`)
    const row = existing[0]
    if (!row) throw new Error('Dispute not found')
    const patch: Record<string, unknown> = {}
    if (role === 'plaintiff') patch.plaintiff_signed_at = now
    else patch.respondent_signed_at = now
    const plaintiffSigned = role === 'plaintiff' ? now : row.plaintiff_signed_at
    const respondentSigned = role === 'respondent' ? now : row.respondent_signed_at
    if (plaintiffSigned && respondentSigned) patch.status = 'SETTLED'
    return await restPatch<CommunityDispute>(`community_disputes?id=eq.${disputeId}`, patch)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return signDisputeSettlement(disputeId, role)
  }
}
