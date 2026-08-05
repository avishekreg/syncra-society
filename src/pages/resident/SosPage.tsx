import React, { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { triggerSosAlert } from '../../api/sosService'
import type { SosAlertType } from '../../types/db'
import { ui } from '../../lib/ui'

const TYPES: Array<{ id: SosAlertType; label: string; hint: string }> = [
  { id: 'MEDICAL', label: 'Medical emergency', hint: 'Senior / medical response mesh' },
  { id: 'SECURITY', label: 'Security threat', hint: 'Guards + RWA dispatch' },
  { id: 'FIRE', label: 'Fire / smoke', hint: 'Priority society alert' }
]

export default function ResidentSosPage() {
  const { currentSocietyId, user } = useAuth()
  const [confirmType, setConfirmType] = useState<SosAlertType | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function fire(type: SosAlertType) {
    if (!currentSocietyId || !user?.flatNumber || !user.id) {
      setError('Flat mapping required for SOS.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const alert = await triggerSosAlert({
        societyId: currentSocietyId,
        flatNumber: user.flatNumber,
        userId: user.id,
        alertType: type,
        contactPhone: user.phone || undefined
      })
      setMessage(`${type} SOS dispatched for Flat ${alert.flat_number}. Guards & RWA notified.`)
      setConfirmType(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SOS dispatch failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>maiEmergency</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>SOS & senior medical response</h2>
        <p className={`mt-2 ${ui.body}`}>
          One-tap emergency dispatch to gate guards, RWA admins, and nearby volunteer residents with your flat
          location.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {TYPES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setConfirmType(item.id)}
            className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-left transition hover:bg-rose-100"
          >
            <p className="text-lg font-semibold text-rose-800">{item.label}</p>
            <p className="mt-2 text-sm text-rose-700/80">{item.hint}</p>
          </button>
        ))}
      </div>

      {confirmType ? (
        <div className={ui.overlay}>
          <div className={ui.modal}>
            <h3 className={ui.heading}>Confirm {confirmType} SOS?</h3>
            <p className={`mt-2 ${ui.body}`}>
              This triggers a loud alert to guards and society responders for Flat {user?.flatNumber}.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className={ui.btnDanger} disabled={busy} onClick={() => void fire(confirmType)}>
                {busy ? 'Dispatching…' : 'Send SOS now'}
              </button>
              <button type="button" className={ui.btnGhost} onClick={() => setConfirmType(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  )
}
