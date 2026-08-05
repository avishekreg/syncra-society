import type { RegularStaff, StaffEntryLog } from '../types/db'
import { restGet, restPatch, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { ensureSocietyFlatId } from './flatRegistry'

const STAFF_ROLES = ['Cook', 'Maid', 'Driver', 'Car Cleaner', 'Maintenance', 'Other'] as const

export type StaffRole = (typeof STAFF_ROLES)[number]

export { STAFF_ROLES }

export type StaffPassValidation = {
  staff: RegularStaff
  withinWindow: boolean
  alert?: string
}

let localMode = false
let localStaff: RegularStaff[] = []
let localEntryLogs: StaffEntryLog[] = []

function randomToken() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/** Secure recurring QR payload: STAFF-<society>-<flat>-<hash> */
export function generateStaffQrPassCode(societyId: string, flatId: string, salt = randomToken()) {
  const society = societyId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'soc'
  const flat = flatId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'flat'
  let hash = 0
  const seed = `${societyId}|${flatId}|${salt}|${Date.now()}`
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33 + seed.charCodeAt(i)) >>> 0
  }
  return `STAFF-${society}-${flat}-${hash.toString(16).padStart(8, '0')}${salt.slice(0, 4)}`
}

function parseTimeToMinutes(value: string) {
  const [h = '0', m = '0'] = value.slice(0, 8).split(':')
  return Number(h) * 60 + Number(m)
}

/** Returns whether now is inside [start, end]. Cross-midnight windows supported. */
export function isWithinAllowedWindow(start: string, end: string, now = new Date()) {
  const current = now.getHours() * 60 + now.getMinutes()
  const startMin = parseTimeToMinutes(start)
  const endMin = parseTimeToMinutes(end)
  if (startMin === endMin) return true
  if (startMin < endMin) return current >= startMin && current <= endMin
  return current >= startMin || current <= endMin
}

export async function listStaffForFlat(societyId: string, flatNumber: string): Promise<RegularStaff[]> {
  if (localMode) {
    return localStaff.filter(
      (row) => row.society_id === societyId && row.flat_number.toLowerCase() === flatNumber.toLowerCase()
    )
  }
  try {
    return await restGet<RegularStaff[]>(
      `regular_staff?society_id=eq.${societyId}&flat_number=eq.${encodeURIComponent(flatNumber)}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listStaffForFlat(societyId, flatNumber)
  }
}

export async function listActiveStaffForSociety(societyId: string): Promise<RegularStaff[]> {
  if (localMode) {
    return localStaff.filter((row) => row.society_id === societyId && row.is_active)
  }
  try {
    return await restGet<RegularStaff[]>(
      `regular_staff?society_id=eq.${societyId}&is_active=eq.true&order=flat_number.asc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listActiveStaffForSociety(societyId)
  }
}

export async function createRegularStaff(input: {
  societyId: string
  flatNumber: string
  name: string
  role: string
  phone?: string
  allowedTimeStart: string
  allowedTimeEnd: string
  createdByUserId?: string
}): Promise<RegularStaff> {
  const flatId = await ensureSocietyFlatId(input.societyId, input.flatNumber)
  const qr = generateStaffQrPassCode(input.societyId, flatId)
  const payload = {
    society_id: input.societyId,
    flat_id: flatId,
    flat_number: input.flatNumber.trim(),
    name: input.name.trim(),
    role: input.role.trim(),
    phone: input.phone?.trim() || null,
    qr_pass_code: qr,
    allowed_time_start: input.allowedTimeStart,
    allowed_time_end: input.allowedTimeEnd,
    is_active: true,
    created_by_user_id: input.createdByUserId ?? null
  }

  if (localMode) {
    const row: RegularStaff = {
      id: `local-staff-${randomToken()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...payload,
      phone: payload.phone,
      created_by_user_id: payload.created_by_user_id
    }
    localStaff.unshift(row)
    return row
  }

  try {
    return await restPost<RegularStaff>('regular_staff', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return createRegularStaff(input)
  }
}

export async function setStaffActive(staffId: string, isActive: boolean): Promise<RegularStaff> {
  if (localMode) {
    const row = localStaff.find((item) => item.id === staffId)
    if (!row) throw new Error('Staff pass not found')
    row.is_active = isActive
    row.updated_at = new Date().toISOString()
    return row
  }
  try {
    return await restPatch<RegularStaff>(`regular_staff?id=eq.${staffId}`, {
      is_active: isActive,
      updated_at: new Date().toISOString()
    })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return setStaffActive(staffId, isActive)
  }
}

export async function findStaffByQrCode(societyId: string, qrPassCode: string): Promise<RegularStaff | null> {
  const code = qrPassCode.trim()
  if (!code) return null
  if (localMode) {
    return localStaff.find((row) => row.society_id === societyId && row.qr_pass_code === code) ?? null
  }
  try {
    const rows = await restGet<RegularStaff[]>(
      `regular_staff?society_id=eq.${societyId}&qr_pass_code=eq.${encodeURIComponent(code)}&limit=1`
    )
    return rows[0] ?? null
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return findStaffByQrCode(societyId, code)
  }
}

/**
 * Validate staff QR for guard scan.
 * Outside window → alert for manual override (does not hard-block).
 */
export async function validateStaffPass(
  societyId: string,
  qrPassCode: string
): Promise<StaffPassValidation> {
  const staff = await findStaffByQrCode(societyId, qrPassCode)
  if (!staff) throw new Error('Staff pass not recognized')
  if (!staff.is_active) throw new Error('Staff pass is inactive')

  const withinWindow = isWithinAllowedWindow(staff.allowed_time_start, staff.allowed_time_end)
  return {
    staff,
    withinWindow,
    alert: withinWindow
      ? undefined
      : `Outside allowed shift (${staff.allowed_time_start.slice(0, 5)}–${staff.allowed_time_end.slice(0, 5)}). Manual override required.`
  }
}

export async function logStaffEntry(input: {
  societyId: string
  staffId: string
  scannedByUserId?: string
  outsideWindow: boolean
  overrideUsed: boolean
  notes?: string
}): Promise<StaffEntryLog> {
  const payload = {
    society_id: input.societyId,
    staff_id: input.staffId,
    scanned_by_user_id: input.scannedByUserId ?? null,
    outside_window: input.outsideWindow,
    override_used: input.overrideUsed,
    notes: input.notes ?? null
  }

  if (localMode) {
    const row: StaffEntryLog = {
      id: `local-staff-log-${randomToken()}`,
      created_at: new Date().toISOString(),
      ...payload
    }
    localEntryLogs.unshift(row)
    return row
  }

  try {
    return await restPost<StaffEntryLog>('staff_entry_logs', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return logStaffEntry(input)
  }
}

export async function listStaffEntryLogs(societyId: string, limit = 50): Promise<StaffEntryLog[]> {
  if (localMode) {
    return localEntryLogs.filter((row) => row.society_id === societyId).slice(0, limit)
  }
  try {
    return await restGet<StaffEntryLog[]>(
      `staff_entry_logs?society_id=eq.${societyId}&order=created_at.desc&limit=${limit}`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listStaffEntryLogs(societyId, limit)
  }
}
