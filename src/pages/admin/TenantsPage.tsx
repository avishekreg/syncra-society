import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  approveTenantRequest,
  listTenantRequestsForSociety,
  rejectTenantRequest,
  tenantStatusBadgeClass,
  tenantStatusLabel
} from '../../api/tenantApprovalService'
import type { TenantRequest } from '../../types/db'
import { ui } from '../../lib/ui'

export default function AdminTenantsPage() {
  const { currentSocietyId } = useAuth()
  const [rows, setRows] = useState<TenantRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function refresh() {
    if (!currentSocietyId) return
    setLoading(true)
    setError(null)
    try {
      setRows(await listTenantRequestsForSociety(currentSocietyId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load tenant queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [currentSocietyId])

  async function handleApprove(id: string) {
    setBusyId(id)
    try {
      await approveTenantRequest(id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(id: string) {
    const reason = window.prompt('Rejection reason (optional)') ?? undefined
    setBusyId(id)
    try {
      await rejectTenantRequest(id, reason)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejection failed')
    } finally {
      setBusyId(null)
    }
  }

  const pending = rows.filter((row) => row.status === 'PENDING_APPROVAL')

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Tenant verification</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Digital lease approval queue</h2>
        <p className={`mt-2 ${ui.body}`}>
          Review owner-uploaded rental agreements, verify tenant contacts, and approve to shift ops alerts to the
          tenant while owners retain financial audit trails.
        </p>
      </section>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      {loading ? <p className={ui.body}>Loading queue…</p> : null}

      {!loading && pending.length === 0 ? (
        <section className={ui.card}>
          <p className={ui.body}>No pending tenant requests. Approved / rejected history appears below.</p>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((row) => (
          <article key={row.id} className={ui.card}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Flat {row.flat_number}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-syncra-primary">{row.tenant_name}</h3>
                <p className={`mt-1 text-sm ${ui.body}`}>
                  {row.tenant_phone}
                  {row.tenant_email ? ` · ${row.tenant_email}` : ''}
                </p>
                <p className={`mt-1 text-sm ${ui.body}`}>
                  {row.occupants_count} occupants · {row.lease_start_date} → {row.lease_end_date}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tenantStatusBadgeClass(row.status)}`}>
                {tenantStatusLabel(row.status)}
              </span>
            </div>

            {row.agreement_doc_url ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <iframe title={`Lease ${row.tenant_name}`} src={row.agreement_doc_url} className="h-56 w-full" />
                <a
                  href={row.agreement_doc_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block px-3 py-2 text-sm font-semibold text-syncra-blue"
                >
                  Open PDF
                </a>
              </div>
            ) : (
              <p className="mt-4 text-sm text-amber-700">No agreement PDF attached.</p>
            )}

            {row.status === 'PENDING_APPROVAL' ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={ui.btnPrimary}
                  disabled={busyId === row.id}
                  onClick={() => void handleApprove(row.id)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className={ui.btnDanger}
                  disabled={busyId === row.id}
                  onClick={() => void handleReject(row.id)}
                >
                  Reject
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}
