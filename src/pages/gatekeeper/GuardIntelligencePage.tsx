import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  acknowledgeGuardianAlert,
  flagUnauthorizedVehicleMotion,
  listActiveGuardianAlerts
} from '../../api/guardianMeshService'
import type { GuardianMotionAlert } from '../../types/db'
import { ui } from '../../lib/ui'

type Ctx = { societyId: string | null; societyName: string }

export default function GuardIntelligencePage() {
  const { societyId, societyName } = useOutletContext<Ctx>()
  const [alerts, setAlerts] = useState<GuardianMotionAlert[]>([])
  const [flatNumber, setFlatNumber] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [ownerNear, setOwnerNear] = useState(false)
  const [popup, setPopup] = useState<GuardianMotionAlert | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!societyId) return
    const rows = await listActiveGuardianAlerts(societyId)
    setAlerts(rows)
    const vehicleAlert = rows.find((r) => r.event_type === 'UNAUTHORIZED_MOTION')
    if (vehicleAlert) setPopup(vehicleAlert)
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
    const timer = window.setInterval(() => void refresh(), 12_000)
    return () => window.clearInterval(timer)
  }, [societyId])

  if (!societyId) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Society context required.</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Guard intelligence</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>{societyName} · mAI Guardian</h2>
        <p className={`mt-2 ${ui.body}`}>
          Manual vehicle exit checks for the guard desk. Flag a plate when the owner is not confirmed present — no GPS
          tags or cameras required.
        </p>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Vehicle exit check</h3>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            void flagUnauthorizedVehicleMotion({
              societyId,
              flatNumber,
              vehicleLabel: vehicle || `Vehicle Flat ${flatNumber}`,
              ownerProximity: ownerNear
            })
              .then((alert) => {
                if (alert) setPopup(alert)
                else setError(null)
                return refresh()
              })
              .catch((err) => setError(err instanceof Error ? err.message : 'Check failed'))
          }}
        >
          <input className={ui.input} placeholder="Flat number" value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} required />
          <input className={ui.input} placeholder="Vehicle / plate" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
            <input type="checkbox" checked={ownerNear} onChange={(e) => setOwnerNear(e.target.checked)} />
            Owner confirmed present (verbal / ID check)
          </label>
          <button type="submit" className={ui.btnPrimary}>
            Validate exit
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      {popup ? (
        <div className={ui.overlay}>
          <div className={`${ui.modal} border-4 border-rose-500`}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600">Unauthorized motion</p>
            <h3 className="mt-2 text-2xl font-semibold text-rose-800">
              {popup.subject_label}
              {popup.flat_number ? ` · Flat ${popup.flat_number}` : ''}
            </h3>
            <p className={`mt-3 ${ui.body}`}>
              Vehicle attempted exit without owner proximity. Hold at gate until resident confirms.
            </p>
            <button
              type="button"
              className={`mt-6 ${ui.btnDanger}`}
              onClick={() =>
                void acknowledgeGuardianAlert(popup.id).then(() => {
                  setPopup(null)
                  return refresh()
                })
              }
            >
              Acknowledge alert
            </button>
          </div>
        </div>
      ) : null}

      <section className={ui.card}>
        <h3 className={ui.heading}>Active guardian alerts</h3>
        <ul className="mt-4 space-y-2">
          {alerts.length === 0 ? <li className={ui.body}>Clear — no active alerts.</li> : null}
          {alerts.map((a) => (
            <li key={a.id} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-950">
              <strong>{a.event_type}</strong> · {a.subject_type} {a.subject_label}
              {a.flat_number ? ` · Flat ${a.flat_number}` : ''}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
