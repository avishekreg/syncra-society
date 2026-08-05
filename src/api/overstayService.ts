import type { OverstayVisitorAlert, VisitorLog } from '../types/db'
import { listVisitorLogs } from './visitorLogs'

const DEFAULT_OVERSTAY_MINUTES = 45
const STORAGE_KEY = 'mai_overstay_threshold_mins'

export function getOverstayThresholdMinutes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const n = raw ? Number(raw) : DEFAULT_OVERSTAY_MINUTES
    return Number.isFinite(n) && n >= 15 ? n : DEFAULT_OVERSTAY_MINUTES
  } catch {
    return DEFAULT_OVERSTAY_MINUTES
  }
}

export function setOverstayThresholdMinutes(minutes: number) {
  localStorage.setItem(STORAGE_KEY, String(Math.max(15, Math.min(240, minutes))))
}

function enteredAt(log: VisitorLog) {
  return log.actioned_at || log.requested_at || log.created_at || new Date().toISOString()
}

/** Visitors still inside: approved and not exited. */
export function isVisitorStillInside(log: VisitorLog) {
  return log.status === 'approved' && !log.exited_at
}

/**
 * Background-style monitor: flag approved (inside) visitors past threshold without exit.
 */
export async function scanOverstayVisitors(
  societyId: string,
  thresholdMinutes = getOverstayThresholdMinutes()
): Promise<OverstayVisitorAlert[]> {
  const logs = await listVisitorLogs(societyId)
  const now = Date.now()
  const alerts: OverstayVisitorAlert[] = []

  for (const log of logs) {
    if (!isVisitorStillInside(log)) continue
    const entered = new Date(enteredAt(log)).getTime()
    if (!Number.isFinite(entered)) continue
    const minutesInside = Math.floor((now - entered) / 60_000)
    if (minutesInside < thresholdMinutes) continue
    alerts.push({
      visitorLogId: log.id,
      societyId,
      visitorName: log.visitor_name,
      purpose: log.purpose,
      flatNumber: log.target_flat_number,
      enteredAt: enteredAt(log),
      minutesInside,
      overstayMinutes: minutesInside - thresholdMinutes
    })
  }

  return alerts.sort((a, b) => b.minutesInside - a.minutesInside)
}

export function startOverstayMonitor(
  societyId: string,
  onUpdate: (alerts: OverstayVisitorAlert[]) => void,
  intervalMs = 30_000
) {
  let cancelled = false

  async function tick() {
    if (cancelled) return
    try {
      const alerts = await scanOverstayVisitors(societyId)
      if (!cancelled) onUpdate(alerts)
    } catch {
      if (!cancelled) onUpdate([])
    }
  }

  void tick()
  const timer = window.setInterval(() => void tick(), intervalMs)
  return () => {
    cancelled = true
    window.clearInterval(timer)
  }
}
