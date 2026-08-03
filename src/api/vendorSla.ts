/**
 * Vendor SLA — daily resident feedback (1–5) → monthly compliance %.
 * Compliance treats ratings ≥ 4 as compliant days/entries.
 */

import { restGet, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'

export type VendorCategory = 'housekeeping' | 'security' | 'maintenance' | 'other'

export type VendorSlaLog = {
  id: string
  societyId: string
  category: VendorCategory
  rating: number
  comment: string | null
  flatNumber: string | null
  loggedOn: string
  createdAt: string
}

export type VendorSlaScore = {
  category: VendorCategory | 'all'
  periodMonth: string
  entries: number
  averageRating: number
  compliancePct: number
}

const LOCAL_KEY = 'mai_vendor_sla_logs_v1'

function readLocal(societyId: string): VendorSlaLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    const store = raw ? (JSON.parse(raw) as Record<string, VendorSlaLog[]>) : {}
    return store[societyId] ?? []
  } catch {
    return []
  }
}

function writeLocal(societyId: string, rows: VendorSlaLog[]) {
  const raw = localStorage.getItem(LOCAL_KEY)
  const store = raw ? (JSON.parse(raw) as Record<string, VendorSlaLog[]>) : {}
  store[societyId] = rows
  localStorage.setItem(LOCAL_KEY, JSON.stringify(store))
}

function normalize(row: Record<string, unknown>): VendorSlaLog {
  return {
    id: String(row.id),
    societyId: String(row.society_id ?? row.societyId),
    category: (row.category as VendorCategory) ?? 'other',
    rating: Number(row.rating),
    comment: row.comment != null ? String(row.comment) : null,
    flatNumber: row.flat_number != null ? String(row.flat_number) : null,
    loggedOn: String(row.logged_on ?? row.loggedOn ?? new Date().toISOString().slice(0, 10)),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString())
  }
}

export async function submitVendorFeedback(input: {
  societyId: string
  category: VendorCategory
  rating: number
  comment?: string
  flatNumber?: string | null
  submittedBy?: string | null
}): Promise<VendorSlaLog> {
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)))
  const payload = {
    society_id: input.societyId,
    category: input.category,
    rating,
    comment: input.comment?.trim() || null,
    flat_number: input.flatNumber ?? null,
    submitted_by: input.submittedBy ?? null,
    logged_on: new Date().toISOString().slice(0, 10)
  }

  try {
    const row = await restPost<Record<string, unknown>>('vendor_sla_logs', payload)
    return normalize(row)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    const entry: VendorSlaLog = {
      id: crypto.randomUUID(),
      societyId: input.societyId,
      category: input.category,
      rating,
      comment: payload.comment,
      flatNumber: payload.flat_number,
      loggedOn: payload.logged_on,
      createdAt: new Date().toISOString()
    }
    writeLocal(input.societyId, [entry, ...readLocal(input.societyId)])
    return entry
  }
}

export async function listVendorFeedback(
  societyId: string,
  options?: { month?: string }
): Promise<VendorSlaLog[]> {
  try {
    let path = `vendor_sla_logs?society_id=eq.${societyId}&select=*&order=logged_on.desc`
    if (options?.month) {
      const start = `${options.month}-01`
      const endDate = new Date(`${options.month}-01T00:00:00Z`)
      endDate.setUTCMonth(endDate.getUTCMonth() + 1)
      const end = endDate.toISOString().slice(0, 10)
      path += `&logged_on=gte.${start}&logged_on=lt.${end}`
    }
    const rows = await restGet<Array<Record<string, unknown>>>(path)
    return (rows ?? []).map(normalize)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    let rows = readLocal(societyId)
    if (options?.month) {
      rows = rows.filter((row) => row.loggedOn.startsWith(options.month!))
    }
    return rows
  }
}

/** Monthly SLA compliance: share of ratings ≥ 4. */
export function computeMonthlySlaScore(logs: VendorSlaLog[], month: string): VendorSlaScore[] {
  const inMonth = logs.filter((log) => log.loggedOn.startsWith(month))
  const categories: Array<VendorCategory | 'all'> = [
    'all',
    'housekeeping',
    'security',
    'maintenance',
    'other'
  ]

  return categories.map((category) => {
    const subset = category === 'all' ? inMonth : inMonth.filter((log) => log.category === category)
    const entries = subset.length
    const averageRating =
      entries === 0 ? 0 : subset.reduce((sum, log) => sum + log.rating, 0) / entries
    const compliant = subset.filter((log) => log.rating >= 4).length
    const compliancePct = entries === 0 ? 0 : Math.round((compliant / entries) * 1000) / 10
    return {
      category,
      periodMonth: month,
      entries,
      averageRating: Math.round(averageRating * 10) / 10,
      compliancePct
    }
  })
}
