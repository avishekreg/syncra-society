/**
 * AI-First autonomous job runner for maiSociety.
 * Routine sweeps run without human triggers; financial / legal actions stay HITL-gated.
 */

import { autonomousAuditorSweep } from '../api/aiAuditorService'
import { processBleSignalQueue } from '../api/assetFinderService'
import { autonomousBotanistDispatch } from '../api/botanistService'
import { autonomousExpireKidExits } from '../api/kidSafetyService'
import { scanOverstayVisitors, getOverstayThresholdMinutes } from '../api/overstayService'
import { restPost, supabaseRestUrl, getSupabaseRestHeaders } from '../api/supabaseClient'
import { dispatchPushNotification } from '../lib/pushNotifications'
import { shouldUseLocalFallback } from '../api/apiErrors'

const LAST_RUN_KEY = 'mai-autonomous-job-runs'

type JobName =
  | 'auditor_sweep'
  | 'kid_exit_expire'
  | 'overstay_scan'
  | 'botanist_weather'
  | 'ble_mesh_drain'
  | 'recall_expire'

type RunMap = Record<string, string>

function loadRuns(): RunMap {
  try {
    return JSON.parse(localStorage.getItem(LAST_RUN_KEY) || '{}') as RunMap
  } catch {
    return {}
  }
}

function markRun(societyId: string, job: JobName) {
  const map = loadRuns()
  map[`${societyId}:${job}`] = new Date().toISOString()
  try {
    localStorage.setItem(LAST_RUN_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

function hoursSince(societyId: string, job: JobName) {
  const raw = loadRuns()[`${societyId}:${job}`]
  if (!raw) return Number.POSITIVE_INFINITY
  return (Date.now() - new Date(raw).getTime()) / (1000 * 60 * 60)
}

async function logJob(societyId: string, jobName: JobName, status: 'OK' | 'SKIPPED' | 'ERROR', detail?: string) {
  try {
    await restPost('autonomous_job_runs', {
      society_id: societyId,
      job_name: jobName,
      status,
      detail: detail || null
    })
  } catch {
    // non-blocking
  }
}

async function expireRecalls() {
  try {
    await fetch(supabaseRestUrl('rpc/expire_stale_recall_motions'), {
      method: 'POST',
      headers: getSupabaseRestHeaders(),
      body: '{}'
    })
  } catch {
    // optional RPC
  }
}

/**
 * Run eligible autonomous jobs for a society.
 * Cadence: auditor 6h, botanist 12h, ble 2m (via interval), overstay 5m, kid expire 1h.
 */
export async function runAutonomousSocietyJobs(societyId: string, opts?: { force?: boolean }) {
  const force = Boolean(opts?.force)
  const results: Array<{ job: JobName; status: string; detail?: string }> = []

  if (force || hoursSince(societyId, 'auditor_sweep') >= 6) {
    try {
      const flags = await autonomousAuditorSweep(societyId)
      markRun(societyId, 'auditor_sweep')
      await logJob(societyId, 'auditor_sweep', 'OK', `${flags.length} flags`)
      results.push({ job: 'auditor_sweep', status: 'OK', detail: `${flags.length} flags` })
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'auditor failed'
      if (!shouldUseLocalFallback(err)) await logJob(societyId, 'auditor_sweep', 'ERROR', detail)
      results.push({ job: 'auditor_sweep', status: 'ERROR', detail })
    }
  }

  if (force || hoursSince(societyId, 'kid_exit_expire') >= 1) {
    try {
      await autonomousExpireKidExits(societyId)
      markRun(societyId, 'kid_exit_expire')
      await logJob(societyId, 'kid_exit_expire', 'OK')
      results.push({ job: 'kid_exit_expire', status: 'OK' })
    } catch (err) {
      results.push({
        job: 'kid_exit_expire',
        status: 'ERROR',
        detail: err instanceof Error ? err.message : 'expire failed'
      })
    }
  }

  if (force || hoursSince(societyId, 'overstay_scan') >= 0.08) {
    try {
      const alerts = await scanOverstayVisitors(societyId, getOverstayThresholdMinutes())
      if (alerts.length) {
        await dispatchPushNotification({
          societyId,
          type: 'system.alert',
          title: 'Vendor / visitor overstay',
          body: `${alerts.length} active overstay alert${alerts.length === 1 ? '' : 's'} — guard override required to clear.`,
          url: '/gatekeeper',
          audience: 'admins',
          metadata: { kind: 'overstay', count: alerts.length, silent: false }
        })
      }
      markRun(societyId, 'overstay_scan')
      await logJob(societyId, 'overstay_scan', 'OK', `${alerts.length} alerts`)
      results.push({ job: 'overstay_scan', status: 'OK', detail: `${alerts.length} alerts` })
    } catch (err) {
      results.push({
        job: 'overstay_scan',
        status: 'ERROR',
        detail: err instanceof Error ? err.message : 'overstay failed'
      })
    }
  }

  if (force || hoursSince(societyId, 'botanist_weather') >= 12) {
    try {
      const tasks = await autonomousBotanistDispatch({ societyId })
      markRun(societyId, 'botanist_weather')
      await logJob(societyId, 'botanist_weather', 'OK', `${tasks.length} tasks`)
      results.push({ job: 'botanist_weather', status: 'OK', detail: `${tasks.length} tasks` })
    } catch (err) {
      results.push({
        job: 'botanist_weather',
        status: 'ERROR',
        detail: err instanceof Error ? err.message : 'botanist failed'
      })
    }
  }

  if (force || hoursSince(societyId, 'ble_mesh_drain') >= 0.03) {
    try {
      const matched = await processBleSignalQueue(societyId)
      markRun(societyId, 'ble_mesh_drain')
      await logJob(societyId, 'ble_mesh_drain', 'OK', `${matched.length} matches`)
      results.push({ job: 'ble_mesh_drain', status: 'OK', detail: `${matched.length} matches` })
    } catch (err) {
      results.push({
        job: 'ble_mesh_drain',
        status: 'ERROR',
        detail: err instanceof Error ? err.message : 'ble drain failed'
      })
    }
  }

  if (force || hoursSince(societyId, 'recall_expire') >= 24) {
    try {
      await expireRecalls()
      markRun(societyId, 'recall_expire')
      await logJob(societyId, 'recall_expire', 'OK')
      results.push({ job: 'recall_expire', status: 'OK' })
    } catch (err) {
      results.push({
        job: 'recall_expire',
        status: 'ERROR',
        detail: err instanceof Error ? err.message : 'recall expire failed'
      })
    }
  }

  return results
}

/** Start interval runner while a society shell is mounted. */
export function startAutonomousJobRunner(societyId: string): () => void {
  if (!societyId) return () => undefined

  void runAutonomousSocietyJobs(societyId)

  const timer = window.setInterval(() => {
    void runAutonomousSocietyJobs(societyId)
  }, 60_000)

  return () => window.clearInterval(timer)
}
