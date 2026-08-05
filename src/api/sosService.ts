import type { EmergencySosAlert, SosAlertType } from '../types/db'
import { restGet, restPatch, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { ensureSocietyFlatId } from './flatRegistry'

let localMode = false
let localAlerts: EmergencySosAlert[] = []
const listeners = new Set<(alert: EmergencySosAlert) => void>()

function rid() {
  return `sos-${Math.random().toString(36).slice(2, 10)}`
}

export function subscribeSosAlerts(listener: (alert: EmergencySosAlert) => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function broadcast(alert: EmergencySosAlert) {
  listeners.forEach((listener) => {
    try {
      listener(alert)
    } catch {
      // ignore subscriber errors
    }
  })
  try {
    window.dispatchEvent(new CustomEvent('mai-sos-alert', { detail: alert }))
  } catch {
    // SSR / non-browser
  }
}

/** Loud SOS tone for guard / volunteer devices. */
export function playSosAlarm(durationMs = 2500) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = 880
    gain.gain.value = 0.18
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    const pulse = window.setInterval(() => {
      osc.frequency.value = osc.frequency.value === 880 ? 660 : 880
    }, 180)
    window.setTimeout(() => {
      window.clearInterval(pulse)
      osc.stop()
      void ctx.close()
    }, durationMs)
  } catch {
    // Audio may be blocked until user gesture
  }
}

export async function triggerSosAlert(input: {
  societyId: string
  flatNumber: string
  userId: string
  alertType: SosAlertType
  contactPhone?: string
  notes?: string
}): Promise<EmergencySosAlert> {
  const flatId = await ensureSocietyFlatId(input.societyId, input.flatNumber)
  const payload = {
    society_id: input.societyId,
    flat_id: flatId,
    flat_number: input.flatNumber.trim(),
    triggered_by_user_id: input.userId,
    alert_type: input.alertType,
    status: 'ACTIVE' as const,
    contact_phone: input.contactPhone?.trim() || null,
    notes: input.notes?.trim() || null
  }

  let row: EmergencySosAlert
  if (localMode) {
    row = {
      id: rid(),
      created_at: new Date().toISOString(),
      resolved_by: null,
      resolved_at: null,
      ...payload
    }
    localAlerts.unshift(row)
  } else {
    try {
      row = await restPost<EmergencySosAlert>('emergency_sos_alerts', payload)
    } catch (err) {
      if (!shouldUseLocalFallback(err)) throw err
      localMode = true
      return triggerSosAlert(input)
    }
  }

  broadcast(row)
  playSosAlarm()
  return row
}

export async function listActiveSosAlerts(societyId: string): Promise<EmergencySosAlert[]> {
  if (localMode) {
    return localAlerts.filter((a) => a.society_id === societyId && a.status === 'ACTIVE')
  }
  try {
    return await restGet<EmergencySosAlert[]>(
      `emergency_sos_alerts?society_id=eq.${societyId}&status=eq.ACTIVE&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listActiveSosAlerts(societyId)
  }
}

export async function listSosAlertHistory(societyId: string, limit = 50): Promise<EmergencySosAlert[]> {
  if (localMode) {
    return localAlerts.filter((a) => a.society_id === societyId).slice(0, limit)
  }
  try {
    return await restGet<EmergencySosAlert[]>(
      `emergency_sos_alerts?society_id=eq.${societyId}&order=created_at.desc&limit=${limit}`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listSosAlertHistory(societyId, limit)
  }
}

export async function resolveSosAlert(alertId: string, resolvedBy: string): Promise<EmergencySosAlert> {
  const patch = {
    status: 'RESOLVED' as const,
    resolved_by: resolvedBy,
    resolved_at: new Date().toISOString()
  }
  if (localMode) {
    const row = localAlerts.find((a) => a.id === alertId)
    if (!row) throw new Error('SOS alert not found')
    Object.assign(row, patch)
    return row
  }
  try {
    return await restPatch<EmergencySosAlert>(`emergency_sos_alerts?id=eq.${alertId}`, patch)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return resolveSosAlert(alertId, resolvedBy)
  }
}

export function startSosPolling(
  societyId: string,
  onAlert: (alerts: EmergencySosAlert[]) => void,
  intervalMs = 8_000
) {
  let known = new Set<string>()
  let cancelled = false

  async function tick() {
    if (cancelled) return
    try {
      const active = await listActiveSosAlerts(societyId)
      for (const alert of active) {
        if (!known.has(alert.id)) {
          known.add(alert.id)
          playSosAlarm()
          broadcast(alert)
        }
      }
      known = new Set(active.map((a) => a.id))
      if (!cancelled) onAlert(active)
    } catch {
      if (!cancelled) onAlert([])
    }
  }

  void tick()
  const timer = window.setInterval(() => void tick(), intervalMs)
  return () => {
    cancelled = true
    window.clearInterval(timer)
  }
}
