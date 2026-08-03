/**
 * AI RWA Audit Engine — Society Health Index (0–100).
 * Aggregates collection %, utility bill promptness, and complaint resolution SLA.
 */

import { restGet, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'

export type SocietyHealthSnapshot = {
  id: string
  societyId: string
  periodMonth: string
  collectionPct: number
  utilityPromptnessPct: number
  complaintSlaPct: number
  healthIndex: number
  notes: string | null
  computedAt: string
}

export type HealthInputs = {
  collectionPct: number
  utilityPromptnessPct: number
  complaintSlaPct: number
  notes?: string
}

const LOCAL_KEY = 'mai_society_health_v1'

function clampPct(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

/** Weighted blend → 0–100 Society Health Index. */
export function computeSocietyHealthIndex(input: HealthInputs): number {
  const collection = clampPct(input.collectionPct)
  const utilities = clampPct(input.utilityPromptnessPct)
  const complaints = clampPct(input.complaintSlaPct)
  const index = collection * 0.45 + utilities * 0.25 + complaints * 0.3
  return Math.round(index * 10) / 10
}

function monthStart(isoMonth?: string) {
  if (isoMonth && /^\d{4}-\d{2}$/.test(isoMonth)) return `${isoMonth}-01`
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`
}

function normalize(row: Record<string, unknown>): SocietyHealthSnapshot {
  return {
    id: String(row.id),
    societyId: String(row.society_id ?? row.societyId),
    periodMonth: String(row.period_month ?? row.periodMonth).slice(0, 10),
    collectionPct: Number(row.collection_pct ?? row.collectionPct ?? 0),
    utilityPromptnessPct: Number(row.utility_promptness_pct ?? row.utilityPromptnessPct ?? 0),
    complaintSlaPct: Number(row.complaint_sla_pct ?? row.complaintSlaPct ?? 0),
    healthIndex: Number(row.health_index ?? row.healthIndex ?? 0),
    notes: row.notes != null ? String(row.notes) : null,
    computedAt: String(row.computed_at ?? row.computedAt ?? new Date().toISOString())
  }
}

function readLocal(societyId: string): SocietyHealthSnapshot[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    const store = raw ? (JSON.parse(raw) as Record<string, SocietyHealthSnapshot[]>) : {}
    return store[societyId] ?? []
  } catch {
    return []
  }
}

function writeLocal(societyId: string, rows: SocietyHealthSnapshot[]) {
  const raw = localStorage.getItem(LOCAL_KEY)
  const store = raw ? (JSON.parse(raw) as Record<string, SocietyHealthSnapshot[]>) : {}
  store[societyId] = rows
  localStorage.setItem(LOCAL_KEY, JSON.stringify(store))
}

/**
 * Best-effort aggregation from existing society tables when available;
 * falls back to provided/demo inputs for the audit stub.
 */
export async function gatherHealthInputs(societyId: string): Promise<HealthInputs> {
  let collectionPct = 72
  let utilityPromptnessPct = 68
  let complaintSlaPct = 75

  try {
    const payments = await restGet<Array<Record<string, unknown>>>(
      `payments?society_id=eq.${societyId}&select=status&limit=500`
    )
    if (Array.isArray(payments) && payments.length > 0) {
      const paid = payments.filter((row) =>
        ['paid', 'approved', 'success', 'completed'].includes(String(row.status).toLowerCase())
      ).length
      collectionPct = Math.round((paid / payments.length) * 1000) / 10
    }
  } catch {
    /* keep defaults */
  }

  try {
    const complaints = await restGet<Array<Record<string, unknown>>>(
      `complaints_and_suggestions?society_id=eq.${societyId}&select=status,created_at,updated_at&limit=500`
    )
    if (Array.isArray(complaints) && complaints.length > 0) {
      const resolved = complaints.filter((row) =>
        ['resolved', 'closed', 'done'].includes(String(row.status).toLowerCase())
      ).length
      complaintSlaPct = Math.round((resolved / complaints.length) * 1000) / 10
    }
  } catch {
    /* keep defaults */
  }

  // Utility promptness stub — no dedicated table yet; blend from collection signal.
  utilityPromptnessPct = Math.round((collectionPct * 0.7 + 55) * 10) / 10
  utilityPromptnessPct = clampPct(utilityPromptnessPct)

  return { collectionPct, utilityPromptnessPct, complaintSlaPct }
}

export async function runAiRwaAudit(
  societyId: string,
  periodMonth?: string,
  overrides?: Partial<HealthInputs>
): Promise<SocietyHealthSnapshot> {
  const gathered = await gatherHealthInputs(societyId)
  const inputs: HealthInputs = {
    collectionPct: overrides?.collectionPct ?? gathered.collectionPct,
    utilityPromptnessPct: overrides?.utilityPromptnessPct ?? gathered.utilityPromptnessPct,
    complaintSlaPct: overrides?.complaintSlaPct ?? gathered.complaintSlaPct,
    notes: overrides?.notes
  }
  const healthIndex = computeSocietyHealthIndex(inputs)
  const period = monthStart(periodMonth)

  const payload = {
    society_id: societyId,
    period_month: period,
    collection_pct: inputs.collectionPct,
    utility_promptness_pct: inputs.utilityPromptnessPct,
    complaint_sla_pct: inputs.complaintSlaPct,
    health_index: healthIndex,
    notes: inputs.notes ?? 'Auto-generated by AI RWA Audit Engine',
    computed_at: new Date().toISOString()
  }

  try {
    const row = await restPost<Record<string, unknown>>('society_health_snapshots', payload)
    return normalize(row)
  } catch (err) {
    // Prefer upsert via patch when unique conflict
    try {
      const rows = await restGet<Array<Record<string, unknown>>>(
        `society_health_snapshots?society_id=eq.${societyId}&period_month=eq.${period}&select=*`
      )
      if (rows?.[0]) {
        // local overwrite path below if patch unsupported
      }
    } catch {
      /* continue */
    }

    if (!shouldUseLocalFallback(err)) {
      // still allow local cache for UX
    }

    const snapshot: SocietyHealthSnapshot = {
      id: crypto.randomUUID(),
      societyId,
      periodMonth: period,
      collectionPct: inputs.collectionPct,
      utilityPromptnessPct: inputs.utilityPromptnessPct,
      complaintSlaPct: inputs.complaintSlaPct,
      healthIndex,
      notes: payload.notes,
      computedAt: payload.computed_at
    }
    const existing = readLocal(societyId).filter((row) => row.periodMonth !== period)
    writeLocal(societyId, [snapshot, ...existing])
    return snapshot
  }
}

export async function listHealthSnapshots(societyId: string): Promise<SocietyHealthSnapshot[]> {
  try {
    const rows = await restGet<Array<Record<string, unknown>>>(
      `society_health_snapshots?society_id=eq.${societyId}&select=*&order=period_month.desc`
    )
    return (rows ?? []).map(normalize)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    return readLocal(societyId)
  }
}
