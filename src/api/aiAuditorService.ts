import type { AiAuditCategory, AiAuditLog } from '../types/db'
import { restGet, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'

let localMode = false
let localLogs: AiAuditLog[] = []

function rid() {
  return `audit-${Math.random().toString(36).slice(2, 10)}`
}

type InvoiceSample = {
  category: AiAuditCategory
  label: string
  amount: number
  priorAverage: number
}

const SAMPLE_INVOICES: InvoiceSample[] = [
  { category: 'WATER', label: 'Municipal water bill', amount: 18400, priorAverage: 11200 },
  { category: 'ELECTRICITY', label: 'Common-area electricity', amount: 42600, priorAverage: 39100 },
  { category: 'VENDOR_INVOICE', label: 'Housekeeping vendor', amount: 98000, priorAverage: 72000 },
  { category: 'REPAIR', label: 'Lift AMC emergency repair', amount: 45000, priorAverage: 18000 }
]

function variancePct(amount: number, prior: number) {
  if (prior <= 0) return 100
  return Math.round(((amount - prior) / prior) * 1000) / 10
}

function recommend(category: AiAuditCategory, variance: number) {
  if (variance < 12) return 'Within expected band — continue monthly trend monitoring.'
  if (category === 'WATER') return 'Investigate tank overflow sensors, common-area tap leaks, and tanker surcharge spikes.'
  if (category === 'ELECTRICITY') return 'Audit clubhouse HVAC runtime and corridor lighting schedules for off-peak waste.'
  if (category === 'VENDOR_INVOICE') return 'Request itemized SLA proof before approving — variance suggests scope creep or duplicate billing.'
  return 'Hold payment pending dual-signatory review and photographic completion evidence.'
}

function healthFromVariance(variance: number) {
  return Math.max(0, Math.min(100, Math.round(100 - Math.abs(variance) * 1.4)))
}

/** Analyze invoice-like expense samples and emit Financial Health Flags (0–100). */
export function analyzeExpenseAnomalies(samples: InvoiceSample[] = SAMPLE_INVOICES) {
  return samples.map((sample) => {
    const variance = variancePct(sample.amount, sample.priorAverage)
    return {
      category: sample.category,
      label: sample.label,
      amount: sample.amount,
      priorAverage: sample.priorAverage,
      variancePercentage: variance,
      anomaly: variance >= 15 ? `${sample.label} is ${variance}% above trailing baseline` : `${sample.label} within tolerance`,
      recommendation: recommend(sample.category, variance),
      healthScore: healthFromVariance(variance),
      isLeakageFlag: variance >= 20
    }
  })
}

export function societyFinancialHealthScore(samples: InvoiceSample[] = SAMPLE_INVOICES) {
  const rows = analyzeExpenseAnomalies(samples)
  if (!rows.length) return 100
  return Math.round(rows.reduce((sum, row) => sum + row.healthScore, 0) / rows.length)
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

export async function runAiAuditorScan(societyId: string): Promise<AiAuditLog[]> {
  const findings = analyzeExpenseAnomalies().filter((row) => row.isLeakageFlag)
  const created: AiAuditLog[] = []

  for (const finding of findings) {
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

  return created
}
