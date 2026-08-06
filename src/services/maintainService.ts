/**
 * mAI Maintain — zero-hardware periodic maintenance & infrastructure radar.
 * Local-first with optional Supabase tables when migrated.
 */

import { restGet, restPatch, restPost } from '../api/supabaseClient'
import { shouldUseLocalFallback } from '../api/apiErrors'

export type ApplianceKind = 'RO_FILTER' | 'SPLIT_AC' | 'CHIMNEY' | 'GEYSER' | 'OTHER'

export type InfrastructureKind = 'LIFT' | 'DG_SET' | 'FIRE_SAFETY'

export type MaintainAppliance = {
  id: string
  society_id: string
  flat_number: string
  kind: ApplianceKind
  label: string
  brand?: string | null
  installed_on?: string | null
  last_serviced_on?: string | null
  next_service_due: string
  amc_expires_on?: string | null
  service_cycle_days: number
  notes?: string | null
  created_at: string
}

export type MaintainInfraAsset = {
  id: string
  society_id: string
  kind: InfrastructureKind
  label: string
  /** Lift ARD test / DG hours / fire hydrant test date */
  last_inspection_on?: string | null
  next_due_on: string
  noc_expires_on?: string | null
  running_hours?: number | null
  red_flag: boolean
  meta?: Record<string, unknown> | null
  created_at: string
}

export type TechnicianBooking = {
  id: string
  society_id: string
  flat_number: string
  appliance_id?: string | null
  category: ApplianceKind | InfrastructureKind | 'GENERAL'
  preferred_slot?: string | null
  status: 'requested' | 'matched' | 'completed' | 'cancelled'
  referral_note?: string | null
  created_at: string
}

const APPLIANCE_DEFAULTS: Record<ApplianceKind, { label: string; cycleDays: number }> = {
  RO_FILTER: { label: 'RO Water Filter', cycleDays: 90 },
  SPLIT_AC: { label: 'Split AC', cycleDays: 180 },
  CHIMNEY: { label: 'Kitchen Chimney', cycleDays: 120 },
  GEYSER: { label: 'Geyser / Water Heater', cycleDays: 180 },
  OTHER: { label: 'Other appliance', cycleDays: 180 }
}

const STORAGE = {
  appliances: 'mai_maintain_appliances_v1',
  infra: 'mai_maintain_infra_v1',
  bookings: 'mai_maintain_bookings_v1'
}

let localMode = false

function rid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function isoDaysFromNow(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysUntil(isoDate: string) {
  const due = new Date(`${isoDate}T00:00:00`).getTime()
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((due - now.getTime()) / 86400000)
}

function readLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function writeLocal<T>(key: string, rows: T[]) {
  localStorage.setItem(key, JSON.stringify(rows))
}

export function applianceDefaults(kind: ApplianceKind) {
  return APPLIANCE_DEFAULTS[kind]
}

export function urgencyLabel(dueIso: string): { label: string; tone: 'ok' | 'soon' | 'overdue' } {
  const n = daysUntil(dueIso)
  if (n < 0) return { label: `Overdue ${Math.abs(n)}d`, tone: 'overdue' }
  if (n <= 14) return { label: `Due in ${n}d`, tone: 'soon' }
  return { label: `Due in ${n}d`, tone: 'ok' }
}

export async function listAppliances(societyId: string, flatNumber?: string) {
  if (!localMode) {
    try {
      let path = `/rest/v1/maintain_appliances?society_id=eq.${encodeURIComponent(societyId)}&select=*&order=next_service_due.asc`
      if (flatNumber) path += `&flat_number=eq.${encodeURIComponent(flatNumber)}`
      const rows = await restGet<MaintainAppliance[]>(path)
      return rows ?? []
    } catch (err) {
      if (!shouldUseLocalFallback(err)) throw err
      localMode = true
    }
  }
  return readLocal<MaintainAppliance>(STORAGE.appliances).filter(
    (row) => row.society_id === societyId && (!flatNumber || row.flat_number === flatNumber)
  )
}

export async function upsertAppliance(input: {
  societyId: string
  flatNumber: string
  kind: ApplianceKind
  label?: string
  brand?: string
  lastServicedOn?: string
  amcExpiresOn?: string
  notes?: string
}) {
  const defaults = APPLIANCE_DEFAULTS[input.kind]
  const last = input.lastServicedOn || new Date().toISOString().slice(0, 10)
  const next = addDays(last, defaults.cycleDays)
  const row: MaintainAppliance = {
    id: rid('appl'),
    society_id: input.societyId,
    flat_number: input.flatNumber,
    kind: input.kind,
    label: input.label?.trim() || defaults.label,
    brand: input.brand ?? null,
    installed_on: last,
    last_serviced_on: last,
    next_service_due: next,
    amc_expires_on: input.amcExpiresOn ?? null,
    service_cycle_days: defaults.cycleDays,
    notes: input.notes ?? null,
    created_at: new Date().toISOString()
  }

  if (!localMode) {
    try {
      const inserted = await restPost<MaintainAppliance[]>('/rest/v1/maintain_appliances', row)
      return Array.isArray(inserted) ? inserted[0] : row
    } catch (err) {
      if (!shouldUseLocalFallback(err)) throw err
      localMode = true
    }
  }

  const all = readLocal<MaintainAppliance>(STORAGE.appliances)
  all.push(row)
  writeLocal(STORAGE.appliances, all)
  return row
}

export async function markApplianceServiced(id: string, societyId: string, servicedOn?: string) {
  const date = servicedOn || new Date().toISOString().slice(0, 10)
  const appliances = await listAppliances(societyId)
  const current = appliances.find((a) => a.id === id)
  if (!current) throw new Error('Appliance not found')
  const next = addDays(date, current.service_cycle_days)
  const patch = { last_serviced_on: date, next_service_due: next }

  if (!localMode) {
    try {
      await restPatch(`/rest/v1/maintain_appliances?id=eq.${encodeURIComponent(id)}`, patch)
      return { ...current, ...patch }
    } catch (err) {
      if (!shouldUseLocalFallback(err)) throw err
      localMode = true
    }
  }

  const all = readLocal<MaintainAppliance>(STORAGE.appliances).map((row) =>
    row.id === id ? { ...row, ...patch } : row
  )
  writeLocal(STORAGE.appliances, all)
  return all.find((r) => r.id === id)!
}

export async function listInfraAssets(societyId: string) {
  if (!localMode) {
    try {
      return (
        (await restGet<MaintainInfraAsset[]>(
          `/rest/v1/maintain_infra_assets?society_id=eq.${encodeURIComponent(societyId)}&select=*&order=next_due_on.asc`
        )) ?? []
      )
    } catch (err) {
      if (!shouldUseLocalFallback(err)) throw err
      localMode = true
    }
  }
  return readLocal<MaintainInfraAsset>(STORAGE.infra).filter((row) => row.society_id === societyId)
}

export async function upsertInfraAsset(input: {
  societyId: string
  kind: InfrastructureKind
  label: string
  lastInspectionOn?: string
  nextDueOn?: string
  nocExpiresOn?: string
  runningHours?: number
  redFlag?: boolean
  meta?: Record<string, unknown>
}) {
  const next =
    input.nextDueOn ||
    (input.kind === 'LIFT'
      ? isoDaysFromNow(90)
      : input.kind === 'DG_SET'
        ? isoDaysFromNow(60)
        : isoDaysFromNow(180))

  const row: MaintainInfraAsset = {
    id: rid('infra'),
    society_id: input.societyId,
    kind: input.kind,
    label: input.label.trim(),
    last_inspection_on: input.lastInspectionOn ?? null,
    next_due_on: next,
    noc_expires_on: input.nocExpiresOn ?? null,
    running_hours: input.runningHours ?? null,
    red_flag: Boolean(input.redFlag),
    meta: input.meta ?? null,
    created_at: new Date().toISOString()
  }

  if (!localMode) {
    try {
      const inserted = await restPost<MaintainInfraAsset[]>('/rest/v1/maintain_infra_assets', row)
      return Array.isArray(inserted) ? inserted[0] : row
    } catch (err) {
      if (!shouldUseLocalFallback(err)) throw err
      localMode = true
    }
  }

  const all = readLocal<MaintainInfraAsset>(STORAGE.infra)
  all.push(row)
  writeLocal(STORAGE.infra, all)
  return row
}

export async function requestTechnicianBooking(input: {
  societyId: string
  flatNumber: string
  applianceId?: string
  category: ApplianceKind | InfrastructureKind | 'GENERAL'
  preferredSlot?: string
}) {
  const row: TechnicianBooking = {
    id: rid('book'),
    society_id: input.societyId,
    flat_number: input.flatNumber,
    appliance_id: input.applianceId ?? null,
    category: input.category,
    preferred_slot: input.preferredSlot ?? null,
    status: 'requested',
    referral_note: 'Local verified technician referral queued for platform monetization match.',
    created_at: new Date().toISOString()
  }

  if (!localMode) {
    try {
      const inserted = await restPost<TechnicianBooking[]>('/rest/v1/maintain_technician_bookings', row)
      return Array.isArray(inserted) ? inserted[0] : row
    } catch (err) {
      if (!shouldUseLocalFallback(err)) throw err
      localMode = true
    }
  }

  const all = readLocal<TechnicianBooking>(STORAGE.bookings)
  all.push(row)
  writeLocal(STORAGE.bookings, all)
  return row
}

export async function listTechnicianBookings(societyId: string, flatNumber?: string) {
  if (!localMode) {
    try {
      let path = `/rest/v1/maintain_technician_bookings?society_id=eq.${encodeURIComponent(societyId)}&select=*&order=created_at.desc`
      if (flatNumber) path += `&flat_number=eq.${encodeURIComponent(flatNumber)}`
      return (await restGet<TechnicianBooking[]>(path)) ?? []
    } catch (err) {
      if (!shouldUseLocalFallback(err)) throw err
      localMode = true
    }
  }
  return readLocal<TechnicianBooking>(STORAGE.bookings).filter(
    (row) => row.society_id === societyId && (!flatNumber || row.flat_number === flatNumber)
  )
}

/** Dashboard widget summary for a flat. */
export async function getMaintainDashboardSummary(societyId: string, flatNumber: string) {
  const appliances = await listAppliances(societyId, flatNumber)
  const dueSoon = appliances.filter((a) => daysUntil(a.next_service_due) <= 14)
  const overdue = appliances.filter((a) => daysUntil(a.next_service_due) < 0)
  const amcExpiring = appliances.filter(
    (a) => a.amc_expires_on && daysUntil(a.amc_expires_on) <= 30
  )
  return {
    total: appliances.length,
    dueSoon: dueSoon.length,
    overdue: overdue.length,
    amcExpiring: amcExpiring.length,
    nextDue: appliances[0]?.next_service_due ?? null
  }
}

/** President / RWA radar: red flags + NOC pressure. */
export async function getInfraRadarSummary(societyId: string) {
  const assets = await listInfraAssets(societyId)
  const red = assets.filter((a) => a.red_flag || daysUntil(a.next_due_on) < 0)
  const nocSoon = assets.filter((a) => a.noc_expires_on && daysUntil(a.noc_expires_on) <= 45)
  return {
    total: assets.length,
    redFlags: red.length,
    nocPressure: nocSoon.length,
    assets
  }
}

/** Seed demo infra rows for empty societies (idempotent-ish). */
export async function ensureDemoInfraIfEmpty(societyId: string) {
  const existing = await listInfraAssets(societyId)
  if (existing.length) return existing
  await upsertInfraAsset({
    societyId,
    kind: 'LIFT',
    label: 'Tower A · Lift 1 (ARD + wire rope)',
    lastInspectionOn: isoDaysFromNow(-60),
    nextDueOn: isoDaysFromNow(30),
    nocExpiresOn: isoDaysFromNow(75),
    meta: { ard_test: 'pending', wire_rope: 'due' }
  })
  await upsertInfraAsset({
    societyId,
    kind: 'DG_SET',
    label: 'DG Set · 250 kVA',
    lastInspectionOn: isoDaysFromNow(-40),
    nextDueOn: isoDaysFromNow(20),
    runningHours: 1840,
    meta: { mobil_oil: 'due', battery: 'check' }
  })
  await upsertInfraAsset({
    societyId,
    kind: 'FIRE_SAFETY',
    label: 'Fire Safety · Hydrant + cylinders',
    lastInspectionOn: isoDaysFromNow(-90),
    nextDueOn: isoDaysFromNow(10),
    nocExpiresOn: isoDaysFromNow(25),
    redFlag: true,
    meta: { hydrant_pressure: 'retest', cylinder_refill: 'expiring' }
  })
  return listInfraAssets(societyId)
}
