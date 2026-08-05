import type { GuardianMotionAlert, GuardianSubjectType } from '../types/db'
import { restGet, restPatch, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { ensureSocietyFlatId } from './flatRegistry'

let localMode = false
let localAlerts: GuardianMotionAlert[] = []

function rid() {
  return `guard-${Math.random().toString(36).slice(2, 10)}`
}

export async function listActiveGuardianAlerts(societyId: string): Promise<GuardianMotionAlert[]> {
  if (localMode) {
    return localAlerts.filter((a) => a.society_id === societyId && a.status === 'ACTIVE')
  }
  try {
    return await restGet<GuardianMotionAlert[]>(
      `guardian_motion_alerts?society_id=eq.${societyId}&status=eq.ACTIVE&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listActiveGuardianAlerts(societyId)
  }
}

export async function raiseGuardianAlert(input: {
  societyId: string
  flatNumber?: string
  subjectType: GuardianSubjectType
  subjectLabel: string
  eventType: GuardianMotionAlert['event_type']
  locationLabel?: string
  ownerProximity?: boolean
}): Promise<GuardianMotionAlert> {
  const flatId = input.flatNumber
    ? await ensureSocietyFlatId(input.societyId, input.flatNumber)
    : null

  const payload = {
    society_id: input.societyId,
    flat_id: flatId,
    flat_number: input.flatNumber?.trim() || null,
    subject_type: input.subjectType,
    subject_label: input.subjectLabel.trim(),
    event_type: input.eventType,
    location_label: input.locationLabel || null,
    owner_proximity: Boolean(input.ownerProximity),
    status: 'ACTIVE' as const
  }

  if (localMode) {
    const row: GuardianMotionAlert = { id: rid(), created_at: new Date().toISOString(), ...payload }
    localAlerts.unshift(row)
    return row
  }
  try {
    return await restPost<GuardianMotionAlert>('guardian_motion_alerts', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return raiseGuardianAlert(input)
  }
}

/** Guard desk: unauthorized vehicle exit without owner proximity. */
export async function flagUnauthorizedVehicleMotion(input: {
  societyId: string
  flatNumber: string
  vehicleLabel: string
  ownerProximity: boolean
}): Promise<GuardianMotionAlert | null> {
  if (input.ownerProximity) return null
  return raiseGuardianAlert({
    societyId: input.societyId,
    flatNumber: input.flatNumber,
    subjectType: 'VEHICLE',
    subjectLabel: input.vehicleLabel,
    eventType: 'UNAUTHORIZED_MOTION',
    locationLabel: 'Exit gate',
    ownerProximity: false
  })
}

export async function acknowledgeGuardianAlert(alertId: string): Promise<GuardianMotionAlert> {
  if (localMode) {
    const row = localAlerts.find((a) => a.id === alertId)
    if (!row) throw new Error('Alert not found')
    row.status = 'ACKNOWLEDGED'
    return row
  }
  try {
    return await restPatch<GuardianMotionAlert>(`guardian_motion_alerts?id=eq.${alertId}`, {
      status: 'ACKNOWLEDGED'
    })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return acknowledgeGuardianAlert(alertId)
  }
}
