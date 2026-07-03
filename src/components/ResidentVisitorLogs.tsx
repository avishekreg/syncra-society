import React, { useEffect, useState } from 'react'
import { listVisitorLogsForFlat } from '../api/visitorLogs'
import type { VisitorLog } from '../types/db'
import { ui } from '../lib/ui'

const statusBadge: Record<string, string> = {
  pending_approval: 'border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  denied: 'border-red-200 bg-red-50 text-red-600',
  exited: 'border-slate-200 bg-slate-100 text-slate-600'
}

type Props = {
  societyId: string | null
  flatNumber: string | null | undefined
}

export default function ResidentVisitorLogs({ societyId, flatNumber }: Props) {
  const [logs, setLogs] = useState<VisitorLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!societyId || !flatNumber) {
        setLogs([])
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await listVisitorLogsForFlat(societyId, flatNumber)
        setLogs(data ?? [])
      } catch (err: any) {
        setError(err.message || 'Failed to load visitor logs')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [societyId, flatNumber])

  if (!flatNumber) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Your flat is not mapped yet. Contact your RWA admin to enable visitor logs.</p>
      </section>
    )
  }

  return (
    <section className={ui.card}>
      <header className={ui.cardHeader}>
        <p className={ui.eyebrow}>Gate history</p>
        <h2 className={`mt-1 ${ui.heading}`}>Visitor logs for Flat {flatNumber}</h2>
        <p className={`mt-1 ${ui.body}`}>Read-only record of everyone who visited your flat.</p>
      </header>

      {loading && <p className={ui.body}>Loading visitor logs…</p>}
      {error && <p className="text-sm text-syncra-action-alt">{error}</p>}

      {!loading && logs.length === 0 && !error && (
        <p className={ui.body}>No visitor entries recorded for your flat yet.</p>
      )}

      <ul className="space-y-3">
        {logs.map((log) => (
          <li key={log.id} className={ui.innerItem}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-syncra-primary">{log.visitor_name}</p>
                <p className={ui.body}>{log.purpose}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {log.target_building} · Flat {log.target_flat_number}
                  {log.vehicle_number ? ` · ${log.vehicle_number}` : ''}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Requested: {new Date(log.requested_at).toLocaleString()}
                </p>
                {log.actioned_at && (
                  <p className="text-xs text-slate-500">
                    Actioned: {new Date(log.actioned_at).toLocaleString()}
                  </p>
                )}
                {log.exited_at && (
                  <p className="text-xs text-slate-500">Exited: {new Date(log.exited_at).toLocaleString()}</p>
                )}
              </div>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${statusBadge[log.status] ?? statusBadge.exited}`}
              >
                {log.status.replace(/_/g, ' ')}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
