import React, { useEffect, useState } from 'react'
import {
  listTenantRequestsForOwner,
  submitTenantRequest,
  tenantStatusBadgeClass,
  tenantStatusLabel
} from '../../api/tenantApprovalService'
import type { TenantRequest } from '../../types/db'
import { ui } from '../../lib/ui'

type Props = {
  societyId: string
  flatNumber: string
  ownerId: string
}

export default function TenantManagementPanel({ societyId, flatNumber, ownerId }: Props) {
  const [rows, setRows] = useState<TenantRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tenantName, setTenantName] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const [occupants, setOccupants] = useState(2)
  const [leaseStart, setLeaseStart] = useState('')
  const [leaseEnd, setLeaseEnd] = useState('')
  const [agreementFile, setAgreementFile] = useState<File | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      setRows(await listTenantRequestsForOwner(societyId, ownerId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load tenant requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [societyId, ownerId])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await submitTenantRequest({
        societyId,
        flatNumber,
        ownerId,
        tenantName,
        tenantPhone,
        tenantEmail,
        occupantsCount: occupants,
        leaseStartDate: leaseStart,
        leaseEndDate: leaseEnd,
        agreementFile
      })
      setTenantName('')
      setTenantPhone('')
      setTenantEmail('')
      setAgreementFile(null)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit tenant request')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Owner view</p>
        <h3 className={`mt-2 ${ui.heading}`}>Digital tenant onboarding</h3>
        <p className={`mt-2 ${ui.body}`}>
          Upload the rental agreement PDF and submit tenant details for RWA digital sign-off. After approval,
          maintenance alerts and notices route to the tenant while you keep read-only financial audit access.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={ui.label} htmlFor="tenant-name">
              Tenant name
            </label>
            <input
              id="tenant-name"
              className={ui.input}
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className={ui.label} htmlFor="tenant-phone">
              Tenant phone
            </label>
            <input
              id="tenant-phone"
              className={ui.input}
              value={tenantPhone}
              onChange={(e) => setTenantPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className={ui.label} htmlFor="tenant-email">
              Tenant email
            </label>
            <input
              id="tenant-email"
              type="email"
              className={ui.input}
              value={tenantEmail}
              onChange={(e) => setTenantEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className={ui.label} htmlFor="occupants">
              Occupants
            </label>
            <input
              id="occupants"
              type="number"
              min={1}
              max={20}
              className={ui.input}
              value={occupants}
              onChange={(e) => setOccupants(Number(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-2">
            <label className={ui.label} htmlFor="lease-start">
              Lease start
            </label>
            <input
              id="lease-start"
              type="date"
              className={ui.input}
              value={leaseStart}
              onChange={(e) => setLeaseStart(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className={ui.label} htmlFor="lease-end">
              Lease end
            </label>
            <input
              id="lease-end"
              type="date"
              className={ui.input}
              value={leaseEnd}
              onChange={(e) => setLeaseEnd(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className={ui.label} htmlFor="agreement">
              Rental agreement (PDF)
            </label>
            <input
              id="agreement"
              type="file"
              accept="application/pdf,.pdf"
              className={ui.input}
              onChange={(e) => setAgreementFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className={ui.btnPrimary} disabled={saving}>
              {saving ? 'Submitting…' : 'Submit for RWA approval'}
            </button>
          </div>
        </form>
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-syncra-primary">Request status</h4>
        {loading ? <p className={ui.body}>Loading…</p> : null}
        {!loading && rows.length === 0 ? <p className={ui.body}>No tenant requests yet.</p> : null}
        {rows.map((row) => (
          <article key={row.id} className={ui.card}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h5 className="font-semibold text-syncra-primary">{row.tenant_name}</h5>
                <p className={`mt-1 text-sm ${ui.body}`}>
                  {row.tenant_phone}
                  {row.tenant_email ? ` · ${row.tenant_email}` : ''} · {row.occupants_count} occupants
                </p>
                <p className={`mt-1 text-sm ${ui.body}`}>
                  Lease {row.lease_start_date} → {row.lease_end_date}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tenantStatusBadgeClass(row.status)}`}>
                {tenantStatusLabel(row.status)}
              </span>
            </div>
            {row.agreement_doc_url ? (
              <a
                href={row.agreement_doc_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm font-semibold text-syncra-blue underline-offset-2 hover:underline"
              >
                View agreement PDF
              </a>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  )
}
