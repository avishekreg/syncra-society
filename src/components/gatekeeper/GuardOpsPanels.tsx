import React, { useEffect, useState } from 'react'
import {
  checkKidExitApproval,
  grantKidExitOverride,
  markKidExitUsed,
  type KidExitCheckResult
} from '../../api/kidSafetyService'
import {
  getOverstayThresholdMinutes,
  scanOverstayVisitors,
  setOverstayThresholdMinutes
} from '../../api/overstayService'
import { listActiveSosAlerts, resolveSosAlert, startSosPolling } from '../../api/sosService'
import type { EmergencySosAlert, OverstayVisitorAlert } from '../../types/db'
import { useAuth } from '../../providers/AuthProvider'
import { ui } from '../../lib/ui'

type Props = {
  societyId: string
}

/** Kid safety + overstay + SOS flash overlays for the guard desk. */
export default function GuardOpsPanels({ societyId }: Props) {
  const { user } = useAuth()
  const [flatNumber, setFlatNumber] = useState('')
  const [kidName, setKidName] = useState('')
  const [kidResult, setKidResult] = useState<KidExitCheckResult | null>(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [overstays, setOverstays] = useState<OverstayVisitorAlert[]>([])
  const [sosAlerts, setSosAlerts] = useState<EmergencySosAlert[]>([])
  const [threshold, setThreshold] = useState(getOverstayThresholdMinutes())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const stopSos = startSosPolling(societyId, setSosAlerts)
    const tickOverstay = () => {
      void scanOverstayVisitors(societyId, threshold).then(setOverstays).catch(() => setOverstays([]))
    }
    tickOverstay()
    const timer = window.setInterval(tickOverstay, 20_000)
    return () => {
      stopSos()
      window.clearInterval(timer)
    }
  }, [societyId, threshold])

  async function handleKidCheck(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const result = await checkKidExitApproval({
        societyId,
        flatNumber,
        kidName: kidName || undefined,
        notifyParents: true
      })
      setKidResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kid check failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleGuardOverride() {
    if (!kidResult?.gateFrozen) return
    if (!overrideReason.trim()) {
      setError('Guard override requires an explicit reason (human-in-the-loop).')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await grantKidExitOverride({
        societyId,
        flatNumber,
        kidName: kidName || undefined,
        overrideBy: 'GUARD',
        reason: overrideReason,
        userId: user?.id
      })
      setKidResult(null)
      setOverrideReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Override failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {sosAlerts[0] ? (
        <div className="animate-pulse rounded-2xl border-4 border-rose-600 bg-rose-600 p-5 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">SOS SCREEN FLASH</p>
          <h3 className="mt-2 text-2xl font-bold">
            {sosAlerts[0].alert_type} · Flat {sosAlerts[0].flat_number}
          </h3>
          <p className="mt-2 text-sm text-rose-50">
            Triggered {new Date(sosAlerts[0].created_at).toLocaleTimeString()}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {sosAlerts[0].contact_phone ? (
              <a
                href={`tel:${sosAlerts[0].contact_phone}`}
                className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-rose-700"
              >
                Call flat contact
              </a>
            ) : null}
            <button
              type="button"
              className="inline-flex rounded-xl border border-white/40 px-4 py-2.5 text-sm font-semibold"
              onClick={() =>
                void resolveSosAlert(sosAlerts[0].id, user?.id || 'guard').then(() =>
                  setSosAlerts((prev) => prev.filter((a) => a.id !== sosAlerts[0].id))
                )
              }
            >
              Acknowledge / resolve
            </button>
          </div>
        </div>
      ) : null}

      <section className={ui.card}>
        <h3 className={ui.heading}>Kid safety check</h3>
        <p className={`mt-2 text-sm ${ui.body}`}>
          Missing approval freezes gate clearance, pushes a loud parent alert, and requires parent or guard override.
        </p>
        <form onSubmit={handleKidCheck} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className={ui.input}
            placeholder="Flat number"
            value={flatNumber}
            onChange={(e) => setFlatNumber(e.target.value)}
            required
          />
          <input
            className={ui.input}
            placeholder="Child name (optional)"
            value={kidName}
            onChange={(e) => setKidName(e.target.value)}
          />
          <button type="submit" className={ui.btnPrimary} disabled={busy}>
            {busy ? 'Checking…' : 'Check exit approval'}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      {kidResult ? (
        <div className={ui.overlay}>
          <div className={ui.modal}>
            <h3 className={`text-xl font-semibold ${kidResult.gateFrozen ? 'text-rose-700' : 'text-emerald-700'}`}>
              {kidResult.gateFrozen ? 'GATE FROZEN — Kid Safety Hold' : 'Exit pre-approved'}
            </h3>
            <p className={`mt-3 ${ui.body}`}>{kidResult.message}</p>
            {kidResult.parentNotified ? (
              <p className="mt-2 text-sm font-semibold text-rose-700">
                Loud parent push dispatched. Clearance remains frozen until override.
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              {kidResult.approval ? (
                <button
                  type="button"
                  className={ui.btnPrimary}
                  onClick={() =>
                    void markKidExitUsed(kidResult.approval!.id).then(() => setKidResult(null))
                  }
                >
                  Log exit & close
                </button>
              ) : (
                <div className="w-full space-y-3">
                  <label className={ui.label}>Guard override reason (required)</label>
                  <textarea
                    className={`${ui.input} min-h-[72px]`}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g. Parent confirmed verbally on recorded call · ID verified"
                    required
                  />
                  <button
                    type="button"
                    className={ui.btnDanger}
                    disabled={busy || !overrideReason.trim()}
                    onClick={() => void handleGuardOverride()}
                  >
                    Record guard override & release freeze
                  </button>
                </div>
              )}
              {!kidResult.gateFrozen ? (
                <button type="button" className={ui.btnGhost} onClick={() => setKidResult(null)}>
                  Dismiss
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <section className={ui.card}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className={ui.heading}>Overstay alerts</h3>
            <p className={`mt-1 text-sm ${ui.body}`}>
              Vendors / visitors still inside after {threshold} minutes (approved, not exited). Autonomous scan pushes
              admin alerts; release remains a human guard action.
            </p>
          </div>
          <div className="space-y-1">
            <label className={ui.label}>Threshold (mins)</label>
            <input
              className={ui.input}
              type="number"
              min={15}
              max={240}
              value={threshold}
              onChange={(e) => {
                const value = Number(e.target.value) || 45
                setThreshold(value)
                setOverstayThresholdMinutes(value)
              }}
            />
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {overstays.length === 0 ? <li className={ui.body}>No overstays right now.</li> : null}
          {overstays.map((item) => (
            <li
              key={item.visitorLogId}
              className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-3 text-sm text-rose-900"
            >
              <span className="font-semibold">{item.visitorName}</span> · Flat {item.flatNumber} ·{' '}
              {item.purpose} · inside {item.minutesInside}m
              <span className="ml-2 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">
                OVERSTAYED +{item.overstayMinutes}m
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
