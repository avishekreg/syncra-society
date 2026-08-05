import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { triggerSosAlert } from '../api/sosService'
import type { SosAlertType } from '../types/db'
import { ui } from '../lib/ui'

/** Compact 1-tap SOS widget for the resident home dashboard. */
export default function EmergencySosWidget() {
  const { currentSocietyId, user } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function send(type: SosAlertType) {
    if (!currentSocietyId || !user?.flatNumber || !user.id) return
    setBusy(true)
    try {
      await triggerSosAlert({
        societyId: currentSocietyId,
        flatNumber: user.flatNumber,
        userId: user.id,
        alertType: type,
        contactPhone: user.phone || undefined
      })
      setStatus(`${type} SOS sent`)
      setOpen(false)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'SOS failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-600">maiEmergency</p>
          <h3 className="mt-2 text-xl font-semibold text-syncra-primary">SOS Emergency</h3>
          <p className={`mt-2 max-w-md text-sm ${ui.body}`}>
            Instant medical, security, or fire dispatch to guards and community responders.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
        >
          1-tap SOS
        </button>
      </div>
      <Link to="/resident/sos" className="mt-3 inline-flex text-sm font-semibold text-rose-700 underline-offset-2 hover:underline">
        Open full SOS console →
      </Link>
      {status ? <p className="mt-2 text-sm font-medium text-rose-800">{status}</p> : null}

      {open ? (
        <div className={ui.overlay}>
          <div className={ui.modal}>
            <h3 className={ui.heading}>Choose SOS type</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {(['MEDICAL', 'SECURITY', 'FIRE'] as SosAlertType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={busy}
                  onClick={() => void send(type)}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-800"
                >
                  {type}
                </button>
              ))}
            </div>
            <button type="button" className={`mt-4 ${ui.btnGhost}`} onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
