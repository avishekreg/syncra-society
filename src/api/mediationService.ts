import type { CommunityDispute, DisputeIssueType } from '../types/db'
import { restGet, restPost, supabaseRestUrl, getSupabaseRestHeaders } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { ensureSocietyFlatId } from './flatRegistry'
import { fetchSocietyRulesGuidebook } from './rulesGuidebook'
import { exportGuidebookAsKnowledgeText, searchGuidebookKnowledge } from '../lib/guidebookKnowledge'

let localMode = false
let localDisputes: CommunityDispute[] = []

function rid() {
  return `dispute-${Math.random().toString(36).slice(2, 10)}`
}

const ISSUE_QUERY: Record<DisputeIssueType, string> = {
  PARKING: 'parking vehicle bay allotted visitor slot',
  SEEPAGE: 'seepage plumbing leak waterproofing upper floor',
  PETS: 'pets leash waste common area animals',
  NOISE: 'noise quiet hours disturbance music'
}

const FALLBACK_BYLAW: Record<DisputeIssueType, { summary: string; fine: number }> = {
  PARKING: {
    summary:
      'Bylaw baseline — vehicles must occupy allotted bays. Suggested resolution: re-park within 2 hours; repeat offense attracts visitor-slot fee.',
    fine: 500
  },
  SEEPAGE: {
    summary:
      'Bylaw baseline — upper-floor owners must remediate plumbing leaks within 72 hours. Suggested joint inspection + waterproofing cost split if shared stack.',
    fine: 0
  },
  PETS: {
    summary:
      'Bylaw baseline — pets must be leashed in common areas; waste must be cleared immediately. Suggested apology + cleaning recovery if soiling proven.',
    fine: 300
  },
  NOISE: {
    summary:
      'Bylaw baseline — quiet hours 10:30 PM–6:30 AM. Suggested written undertaking; escalation to RWA if three verified complaints in 30 days.',
    fine: 750
  }
}

function fineFromIssue(issueType: DisputeIssueType, guidebookHit?: string) {
  if (guidebookHit) {
    const match = guidebookHit.match(/(?:₹|rs\.?\s*)(\d[\d,]*)/i)
    if (match) return Number(match[1].replace(/,/g, ''))
  }
  return FALLBACK_BYLAW[issueType].fine
}

/** AI-style settlement draft grounded in society rules guidebook (falls back to baseline). */
export async function draftMediationFromBylaws(
  societyId: string,
  issueType: DisputeIssueType,
  description: string
) {
  const guidebook = await fetchSocietyRulesGuidebook(societyId)
  const hits = searchGuidebookKnowledge(guidebook, `${ISSUE_QUERY[issueType]} ${description}`, 3)
  const corpus = exportGuidebookAsKnowledgeText(guidebook)

  if (hits.length) {
    const cited = hits
      .slice(0, 2)
      .map((hit) => `${hit.section}: ${hit.excerpt}`)
      .join(' | ')
    return {
      summary: `mAI Nyaya draft (guidebook-grounded). Issue: ${issueType}. Cited rules — ${cited}. Resident context: “${description.trim().slice(0, 160)}”. Both flats must digitally sign to finalize; payment of any fine remains a human RWA finance gate.`,
      suggestedFine: fineFromIssue(issueType, cited),
      grounded: true as const,
      citations: hits
    }
  }

  if (corpus.trim()) {
    const fallback = FALLBACK_BYLAW[issueType]
    return {
      summary: `mAI Nyaya draft using society guidebook context + baseline ${issueType} rules. ${fallback.summary} Context: “${description.trim().slice(0, 160)}”. Dual resident signatures required to settle.`,
      suggestedFine: fallback.fine,
      grounded: true as const,
      citations: []
    }
  }

  const base = FALLBACK_BYLAW[issueType]
  return {
    summary: `${base.summary} Context noted: “${description.trim().slice(0, 160)}”. Dual signatures required.`,
    suggestedFine: base.fine,
    grounded: false as const,
    citations: []
  }
}

/** @deprecated Prefer draftMediationFromBylaws for society-specific rules. */
export function draftMediation(issueType: DisputeIssueType, description: string) {
  const base = FALLBACK_BYLAW[issueType]
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
  const mediation = await draftMediationFromBylaws(input.societyId, input.issueType, input.description)

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

/**
 * Dual-signature settlement — signerFlatNumber MUST match plaintiff/respondent flat.
 * Final SETTLED status only when both parties have signed (RPC-enforced when available).
 */
export async function signDisputeSettlement(
  disputeId: string,
  role: 'plaintiff' | 'respondent',
  signerFlatNumber: string
): Promise<CommunityDispute> {
  if (!signerFlatNumber.trim()) throw new Error('Signer flat number is required')

  if (localMode) {
    const row = localDisputes.find((d) => d.id === disputeId)
    if (!row) throw new Error('Dispute not found')
    const expected =
      role === 'plaintiff' ? row.plaintiff_flat_number : row.respondent_flat_number
    if (expected.trim().toLowerCase() !== signerFlatNumber.trim().toLowerCase()) {
      throw new Error(`Only Flat ${expected} may sign as ${role}`)
    }
    const now = new Date().toISOString()
    if (role === 'plaintiff') row.plaintiff_signed_at = now
    else row.respondent_signed_at = now
    if (row.plaintiff_signed_at && row.respondent_signed_at) row.status = 'SETTLED'
    return row
  }

  try {
    return await callRpc<CommunityDispute>('sign_dispute_settlement', {
      p_dispute_id: disputeId,
      p_role: role,
      p_signer_flat_number: signerFlatNumber.trim()
    })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return signDisputeSettlement(disputeId, role, signerFlatNumber)
  }
}
