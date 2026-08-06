import type { AiAuditCategory, AiAuditLog } from '../types/db'
import { restGet, restPost, supabaseRestUrl, getSupabaseRestHeaders } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { dispatchPushNotification } from '../lib/pushNotifications'

let localMode = false
let localLogs: AiAuditLog[] = []
let localExpenses: SocietyExpenseRow[] = []

function rid(prefix = 'audit') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export type SocietyExpenseRow = {
  id: string
  society_id: string
  category: AiAuditCategory
  label: string
  amount: number
  expense_month: string
  vendor_name?: string | null
  invoice_ref?: string | null
  source?: string
  created_at?: string
}

type InvoiceSample = {
  category: AiAuditCategory
  label: string
  amount: number
  priorAverage: number
}

/** Seed baseline only when ledger is empty — never the primary production path. */
const BOOTSTRAP_SEED: InvoiceSample[] = [
  { category: 'WATER', label: 'Municipal water bill', amount: 18400, priorAverage: 11200 },
  { category: 'ELECTRICITY', label: 'Common-area electricity', amount: 42600, priorAverage: 39100 },
  { category: 'VENDOR_INVOICE', label: 'Housekeeping vendor', amount: 98000, priorAverage: 72000 },
  { category: 'REPAIR', label: 'Lift AMC emergency repair', amount: 45000, priorAverage: 18000 }
]

function variancePct(amount: number, prior: number) {
  if (prior <= 0) return amount > 0 ? 100 : 0
  return Math.round(((amount - prior) / prior) * 1000) / 10
}

function recommend(category: AiAuditCategory, variance: number) {
  if (variance < 12) return 'Within expected band — continue monthly trend monitoring.'
  if (category === 'WATER') {
    return 'Investigate tank overflow sensors, common-area tap leaks, and tanker surcharge spikes. Hold payment pending dual-signatory finance review.'
  }
  if (category === 'ELECTRICITY') {
    return 'Audit clubhouse HVAC runtime and corridor lighting schedules. Escalate >20% variance to RWA Treasurer before disbursement.'
  }
  if (category === 'VENDOR_INVOICE') {
    return 'Request itemized SLA proof before approving — variance suggests scope creep or duplicate billing. Human payment gate required.'
  }
  return 'Hold payment pending dual-signatory review and photographic completion evidence.'
}

function healthFromVariance(variance: number) {
  return Math.max(0, Math.min(100, Math.round(100 - Math.abs(variance) * 1.4)))
}

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

/** Analyze invoice-like expense samples and emit Financial Health Flags (0–100). */
export function analyzeExpenseAnomalies(samples: InvoiceSample[]) {
  return samples.map((sample) => {
    const variance = variancePct(sample.amount, sample.priorAverage)
    return {
      category: sample.category,
      label: sample.label,
      amount: sample.amount,
      priorAverage: sample.priorAverage,
      variancePercentage: variance,
      anomaly:
        variance >= 15
          ? `${sample.label} is ${variance}% above trailing baseline`
          : `${sample.label} within tolerance`,
      recommendation: recommend(sample.category, variance),
      healthScore: healthFromVariance(variance),
      isLeakageFlag: variance >= 20
    }
  })
}

export function societyFinancialHealthScore(samples: InvoiceSample[]) {
  const rows = analyzeExpenseAnomalies(samples)
  if (!rows.length) return 100
  return Math.round(rows.reduce((sum, row) => sum + row.healthScore, 0) / rows.length)
}

export async function listSocietyExpenses(societyId: string): Promise<SocietyExpenseRow[]> {
  if (localMode) return localExpenses.filter((r) => r.society_id === societyId)
  try {
    return await restGet<SocietyExpenseRow[]>(
      `society_expense_ledger?society_id=eq.${societyId}&order=expense_month.desc&limit=200`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listSocietyExpenses(societyId)
  }
}

export async function recordSocietyExpense(input: {
  societyId: string
  category: AiAuditCategory
  label: string
  amount: number
  expenseMonth?: string
  vendorName?: string
  invoiceRef?: string
  createdByUserId?: string
  source?: 'MANUAL' | 'IMPORT' | 'AUTOMATION'
}): Promise<SocietyExpenseRow> {
  const payload = {
    society_id: input.societyId,
    category: input.category,
    label: input.label.trim(),
    amount: input.amount,
    expense_month: input.expenseMonth || monthKey(new Date()),
    vendor_name: input.vendorName || null,
    invoice_ref: input.invoiceRef || null,
    source: input.source || 'MANUAL',
    created_by_user_id: input.createdByUserId || null
  }

  if (localMode) {
    const row: SocietyExpenseRow = { id: rid('exp'), created_at: new Date().toISOString(), ...payload }
    localExpenses.unshift(row)
    return row
  }
  try {
    return await restPost<SocietyExpenseRow>('society_expense_ledger', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return recordSocietyExpense(input)
  }
}

/** Build MoM category baselines from the real expense ledger (or bootstrap seed if empty). */
export async function buildExpenseAnomalySamples(societyId: string): Promise<InvoiceSample[]> {
  const expenses = await listSocietyExpenses(societyId)
  if (!expenses.length) return BOOTSTRAP_SEED

  const byCatMonth = new Map<string, { amount: number; label: string; category: AiAuditCategory }>()
  for (const row of expenses) {
    const key = `${row.category}|${String(row.expense_month).slice(0, 7)}`
    const prev = byCatMonth.get(key)
    byCatMonth.set(key, {
      category: row.category,
      label: row.label,
      amount: (prev?.amount || 0) + Number(row.amount || 0)
    })
  }

  const now = new Date()
  const currentMonth = monthKey(now).slice(0, 7)
  const prior = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const priorMonth = monthKey(prior).slice(0, 7)

  const categories: AiAuditCategory[] = ['WATER', 'ELECTRICITY', 'VENDOR_INVOICE', 'REPAIR']
  const samples: InvoiceSample[] = []

  for (const category of categories) {
    const current = byCatMonth.get(`${category}|${currentMonth}`)
    const previous = byCatMonth.get(`${category}|${priorMonth}`)
    if (!current && !previous) continue
    const amount = current?.amount ?? 0
    const priorAverage = previous?.amount ?? amount * 0.85
    samples.push({
      category,
      label: current?.label || previous?.label || `${category} expense`,
      amount,
      priorAverage
    })
  }

  return samples.length ? samples : BOOTSTRAP_SEED
}

export async function listAiAuditLogs(societyId: string): Promise<AiAuditLog[]> {
  if (localMode) return localLogs.filter((r) => r.society_id === societyId)
  try {
    return await restGet<AiAuditLog[]>(
      `ai_audit_logs?society_id=eq.${societyId}&order=created_at.desc&limit=40`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listAiAuditLogs(societyId)
  }
}

async function alreadyFlaggedRecently(
  societyId: string,
  category: AiAuditCategory,
  anomaly: string
): Promise<boolean> {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
  const logs = await listAiAuditLogs(societyId)
  return logs.some(
    (log) =>
      log.category === category &&
      log.detected_anomaly === anomaly &&
      log.created_at >= since
  )
}

/**
 * Deep scan: compare MoM ledger totals; auto-flag ≥20% variances into ai_audit_logs
 * and push a non-payment alert to RWA admins (payment itself remains human-gated).
 */
export async function runAiAuditorScan(societyId: string): Promise<AiAuditLog[]> {
  const samples = await buildExpenseAnomalySamples(societyId)
  const findings = analyzeExpenseAnomalies(samples).filter((row) => row.isLeakageFlag)
  const created: AiAuditLog[] = []

  for (const finding of findings) {
    if (await alreadyFlaggedRecently(societyId, finding.category, finding.anomaly)) continue

    const payload = {
      society_id: societyId,
      category: finding.category,
      detected_anomaly: finding.anomaly,
      variance_percentage: finding.variancePercentage,
      ai_recommendation: finding.recommendation,
      health_score: finding.healthScore
    }

    if (localMode) {
      const row: AiAuditLog = { id: rid(), created_at: new Date().toISOString(), ...payload }
      localLogs.unshift(row)
      created.push(row)
      continue
    }

    try {
      created.push(await restPost<AiAuditLog>('ai_audit_logs', payload))
    } catch (err) {
      if (!shouldUseLocalFallback(err)) throw err
      localMode = true
      return runAiAuditorScan(societyId)
    }
  }

  if (created.length) {
    await dispatchPushNotification({
      societyId,
      type: 'system.alert',
      title: 'mAI Auditor leakage flags',
      body: `${created.length} invoice anomal${created.length === 1 ? 'y' : 'ies'} ≥20% — review before any vendor payment.`,
      url: '/admin/audit',
      audience: 'admins',
      metadata: { auto: true, count: created.length }
    })
  }

  return created
}

/** Autonomous entrypoint — idempotent daily scan for a society. */
export async function autonomousAuditorSweep(societyId: string) {
  return runAiAuditorScan(societyId)
}

export async function getAuditorDashboard(societyId: string) {
  const samples = await buildExpenseAnomalySamples(societyId)
  const preview = analyzeExpenseAnomalies(samples)
  const health = societyFinancialHealthScore(samples)
  const logs = await listAiAuditLogs(societyId)
  return { samples, preview, health, logs }
}

/** Best-effort RPC hook if deployed; falls back to client scan. */
export async function expireViaRpc(fn: string) {
  const res = await fetch(supabaseRestUrl(`rpc/${fn}`), {
    method: 'POST',
    headers: getSupabaseRestHeaders(),
    body: '{}'
  })
  if (!res.ok) throw new Error(`RPC ${fn} failed`)
  return res.json()
}
