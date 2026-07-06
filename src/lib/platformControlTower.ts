import type { Society } from '../types/db'
import { listSocieties } from '../api/societies'
import { restGet } from '../api/supabaseClient'
import { shouldUseLocalFallback } from '../api/apiErrors'
import type { BillingStatus } from '../lib/pricing'
import { resolveMonthlyRatePerFlat } from '../lib/pricing'
import { listRegisteredSocieties, ensureSocietyJoinCode } from '../lib/societyRegistry'

export type PlatformRegistrationRow = {
  id: string
  registeredAt: string
  societyName: string
  tier: string
  status: string
}

export type PlatformFinancialSummary = {
  totalMrrInr: number
  activeSubscriptions: number
  pendingInvoices: number
  trialSocieties: number
  billingRows: Array<{
    societyId: string
    societyName: string
    status: string
    mrrInr: number
    flag: 'ok' | 'pending' | 'trial'
  }>
}

export type PlatformControlTowerData = {
  societies: Society[]
  totalFlats: number
  recentRegistrations: PlatformRegistrationRow[]
  visitorLogs24h: number
  financial: PlatformFinancialSummary
}

const PRODUCTION_ORIGIN = 'https://syncra-society.vercel.app'

export function buildSocietyRegistrationUrl(societyId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : PRODUCTION_ORIGIN
  return `${origin}/register?society_id=${encodeURIComponent(societyId)}`
}

function readLocalBilling(societyId: string): BillingStatus | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`syncra-billing-${societyId}`)
    if (!raw) return null
    return JSON.parse(raw) as BillingStatus
  } catch {
    return null
  }
}

function formatTierLabel(society: Society): string {
  const tier = (society.pricing_slab_id ?? society.subscription_status ?? 'tier2').toLowerCase()
  if (tier === 'tier1' || tier === 'basic') return 'Tier 1'
  if (tier === 'tier3' || tier === 'enterprise') return 'Tier 3'
  if (tier === 'trial') return 'Trial'
  return 'Tier 2'
}

function formatStatusLabel(society: Society, billing: BillingStatus | null): string {
  if (billing?.activationStatus === 'active_subscription') return 'Active subscription'
  if (billing?.activationStatus === 'activation_paid') return 'Activation paid'
  if (billing?.activationStatus === 'pending') return 'Pending activation'
  if (society.subscription_status === 'active') return 'Active'
  if (society.subscription_status === 'trial') return 'Trial'
  if (society.subscription_status === 'cancelled') return 'Cancelled'
  return 'Onboarded'
}

function mergeSocietyRows(remote: Society[]): Society[] {
  const byId = new Map<string, Society>()
  for (const row of remote) byId.set(row.id, row)

  for (const local of listRegisteredSocieties()) {
    if (!byId.has(local.id)) {
      byId.set(local.id, {
        id: local.id,
        name: local.name,
        address: local.city,
        pricing_slab_id: 'tier2',
        total_flats: 0,
        subscription_status: 'trial'
      })
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
    return bTime - aTime
  })
}

function buildFinancialSummary(societies: Society[]): PlatformFinancialSummary {
  let totalMrrInr = 0
  let activeSubscriptions = 0
  let pendingInvoices = 0
  let trialSocieties = 0
  const billingRows: PlatformFinancialSummary['billingRows'] = []

  for (const society of societies) {
    const billing = readLocalBilling(society.id)
    const flats = billing?.totalFlats ?? society.total_flats ?? 0
    const rate = billing?.monthlyRatePerFlat ?? resolveMonthlyRatePerFlat(society.pricing_slab_id)
    const mrr = billing?.monthlyTotalInr ?? flats * rate
    const status = formatStatusLabel(society, billing)

    let flag: 'ok' | 'pending' | 'trial' = 'ok'
    if (billing?.activationStatus === 'pending' || status.toLowerCase().includes('pending')) {
      flag = 'pending'
      pendingInvoices += 1
    } else if (society.subscription_status === 'trial' || status === 'Trial') {
      flag = 'trial'
      trialSocieties += 1
    } else if (billing?.activationStatus === 'active_subscription' || society.subscription_status === 'active') {
      activeSubscriptions += 1
      totalMrrInr += mrr
    }

    billingRows.push({
      societyId: society.id,
      societyName: society.name,
      status,
      mrrInr: mrr,
      flag
    })
  }

  return {
    totalMrrInr,
    activeSubscriptions,
    pendingInvoices,
    trialSocieties,
    billingRows: billingRows.sort((a, b) => b.mrrInr - a.mrrInr)
  }
}

async function countVisitorLogsLast24Hours(societyIds: string[]): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  try {
    const rows = await restGet<Array<{ id: string; society_id?: string; created_at?: string }>>(
      `visitor_logs?created_at=gte.${encodeURIComponent(since)}&select=id,society_id,created_at`
    )
    if (Array.isArray(rows)) return rows.length
  } catch (err) {
    if (!shouldUseLocalFallback(err)) {
      // fall through to per-society count
    }
  }

  let total = 0
  for (const societyId of societyIds.slice(0, 20)) {
    try {
      const rows = await restGet<Array<{ id: string }>>(
        `visitor_logs?society_id=eq.${encodeURIComponent(societyId)}&created_at=gte.${encodeURIComponent(since)}&select=id`
      )
      total += Array.isArray(rows) ? rows.length : 0
    } catch {
      continue
    }
  }
  return total
}

export async function loadPlatformControlTowerData(): Promise<PlatformControlTowerData> {
  const remote = await listSocieties()
  const societies = mergeSocietyRows(remote)
  const totalFlats = societies.reduce((sum, row) => sum + (Number(row.total_flats) || 0), 0)

  for (const society of societies) {
    ensureSocietyJoinCode(society.id, society.name)
  }

  const recentRegistrations: PlatformRegistrationRow[] = societies.slice(0, 12).map((society) => {
    const billing = readLocalBilling(society.id)
    return {
      id: society.id,
      registeredAt: society.created_at ?? new Date().toISOString(),
      societyName: society.name,
      tier: formatTierLabel(society),
      status: formatStatusLabel(society, billing)
    }
  })

  const visitorLogs24h = await countVisitorLogsLast24Hours(societies.map((s) => s.id))
  const financial = buildFinancialSummary(societies)

  return {
    societies,
    totalFlats,
    recentRegistrations,
    visitorLogs24h,
    financial
  }
}

export function formatInr(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

export function formatPlatformTimestamp(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '—'
  }
}
