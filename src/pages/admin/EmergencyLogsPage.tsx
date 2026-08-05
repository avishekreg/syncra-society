import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { listSosAlertHistory, resolveSosAlert } from '../../api/sosService'
import type { EmergencySosAlert } from '../../types/db'
import { ui } from '../../lib/ui'

export default function AdminEmergencyLogsPage() {
  const { currentSocietyId, user } = useAuth()
  const [rows, setRows] = useState<EmergencySosAlert[]>([])
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!currentSocietyId) return
    setRows(await listSosAlertHistory(currentSocietyId))
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [currentSocietyId])

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Emergency response</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>SOS alert logs</h2>
        <p className={`mt-2 ${ui.body}`}>Medical, security, and fire dispatch history with resolution tracking.</p>
      </section>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="space-y-3">
        {rows.length === 0 ? (
          <section className={ui.card}>
            <p className={ui.body}>No SOS alerts recorded yet.</p>
          </section>
        ) : null}
        {rows.map((row) => (
          <article
            key={row.id}
            className={`rounded-2xl border p-4 sm:p-5 ${
              row.status === 'ACTIVE' ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Flat {row.flat_number} · {new Date(row.created_at).toLocaleString()}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-syncra-primary">{row.alert_type}</h3>
                {row.contact_phone ? (
                  <a href={`tel:${row.contact_phone}`} className="mt-2 inline-flex text-sm font-semibold text-syncra-blue">
                    Call {row.contact_phone}
                  </a>
                ) : null}
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold">{row.status}</span>
            </div>
            {row.status === 'ACTIVE' ? (
              <button
                type="button"
                className={`mt-4 ${ui.btnSecondary}`}
                onClick={() =>
                  void resolveSosAlert(row.id, user?.id || 'admin').then(refresh)
                }
              >
                Mark resolved
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}
