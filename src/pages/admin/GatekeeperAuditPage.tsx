import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { listActiveStaffForSociety, listStaffEntryLogs } from '../../api/staffPassService'
import { listActiveDeliveryPreApprovals } from '../../api/deliveryApprovalService'
import type { DeliveryPreApproval, RegularStaff, StaffEntryLog } from '../../types/db'
import { ui } from '../../lib/ui'

export default function AdminGatekeeperPage() {
  const { currentSocietyId } = useAuth()
  const [staff, setStaff] = useState<RegularStaff[]>([])
  const [logs, setLogs] = useState<StaffEntryLog[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryPreApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentSocietyId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [staffRows, logRows, deliveryRows] = await Promise.all([
          listActiveStaffForSociety(currentSocietyId),
          listStaffEntryLogs(currentSocietyId, 40),
          listActiveDeliveryPreApprovals(currentSocietyId)
        ])
        if (cancelled) return
        setStaff(staffRows)
        setLogs(logRows)
        setDeliveries(deliveryRows)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load gatekeeper audit')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [currentSocietyId])

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Gatekeeper ops</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Staff roster & delivery clearances</h2>
        <p className={`mt-2 ${ui.body}`}>
          Society-wide view of active recurring staff passes, recent gate scans, and live delivery pre-approvals.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/admin/tenants" className={ui.btnSecondary}>
            Tenant verification queue
          </Link>
          <Link to="/rwa/gatekeeper" className={ui.btnGhost}>
            Guard provisioning
          </Link>
        </div>
      </section>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {loading ? <p className={ui.body}>Loading audit trail…</p> : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={ui.card}>
          <h3 className={ui.heading}>Active staff roster</h3>
          <ul className="mt-4 space-y-3">
            {staff.length === 0 ? <li className={ui.body}>No active staff passes.</li> : null}
            {staff.map((row) => (
              <li key={row.id} className="rounded-xl border border-slate-200 px-3 py-3">
                <p className="font-semibold text-syncra-primary">
                  {row.name} · Flat {row.flat_number}
                </p>
                <p className={`text-sm ${ui.body}`}>
                  {row.role} · {row.allowed_time_start.slice(0, 5)}–{row.allowed_time_end.slice(0, 5)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className={ui.card}>
          <h3 className={ui.heading}>Live delivery pre-approvals</h3>
          <ul className="mt-4 space-y-3">
            {deliveries.length === 0 ? <li className={ui.body}>No active delivery clearances.</li> : null}
            {deliveries.map((row) => (
              <li key={row.id} className="rounded-xl border border-slate-200 px-3 py-3">
                <p className="font-semibold text-syncra-primary">
                  {row.service_provider} → Flat {row.flat_number}
                </p>
                <p className={`text-sm ${ui.body}`}>
                  Valid until {new Date(row.expected_window_end).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Staff entry audit trail</h3>
        <div className={`${ui.tableWrap} mt-4`}>
          <table className={ui.table}>
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Staff ID</th>
                <th className="px-3 py-2">Outside window</th>
                <th className="px-3 py-2">Override</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-sm text-slate-500">
                    No staff scans logged yet.
                  </td>
                </tr>
              ) : null}
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 text-sm">
                  <td className="px-3 py-2">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 font-mono text-xs">{log.staff_id.slice(0, 8)}</td>
                  <td className="px-3 py-2">{log.outside_window ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2">{log.override_used ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2">{log.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
