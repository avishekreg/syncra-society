import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { leadMonetizationSummary, listVendorLeads, updateVendorLeadStatus } from '../../api/maiSpaceService'
import type { InteriorVendorLead, InteriorVendorLeadStatus } from '../../types/db'
import { ui } from '../../lib/ui'

const STATUSES: InteriorVendorLeadStatus[] = ['LEAD_GENERATED', 'CONNECTED', 'CLOSED']

export default function AdminInteriorPartnersPage() {
  const { currentSocietyId } = useAuth()
  const [leads, setLeads] = useState<InteriorVendorLead[]>([])
  const [error, setError] = useState<string | null>(null)

  const summary = useMemo(() => leadMonetizationSummary(leads), [leads])

  async function refresh() {
    if (!currentSocietyId) return
    setLeads(await listVendorLeads(currentSocietyId))
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [currentSocietyId])

  if (!currentSocietyId) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Select a society to track interior partner leads.</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Commercial panel</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Interior partner leads</h2>
        <p className={`mt-2 ${ui.body}`}>
          Monetization pipeline for decorators, woodcraft, electronics, and lighting vendors referred via mAI Space.
        </p>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <article className={ui.card}>
          <p className={ui.eyebrow}>Total leads</p>
          <p className="mt-2 text-2xl font-semibold text-syncra-primary">{summary.total}</p>
        </article>
        <article className={ui.card}>
          <p className={ui.eyebrow}>Generated</p>
          <p className="mt-2 text-2xl font-semibold text-syncra-primary">{summary.generated}</p>
        </article>
        <article className={ui.card}>
          <p className={ui.eyebrow}>Connected</p>
          <p className="mt-2 text-2xl font-semibold text-syncra-primary">{summary.connected}</p>
        </article>
        <article className={ui.card}>
          <p className={ui.eyebrow}>Closed</p>
          <p className="mt-2 text-2xl font-semibold text-syncra-primary">{summary.closed}</p>
        </article>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>By category</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(summary.byCategory).map(([category, count]) => (
            <span key={category} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {category}: {count}
            </span>
          ))}
          {Object.keys(summary.byCategory).length === 0 ? (
            <p className={`text-sm ${ui.body}`}>No category mix yet — residents generate leads from mAI Space.</p>
          ) : null}
        </div>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Lead board</h3>
        <div className="mt-4 space-y-3">
          {leads.map((lead) => (
            <article key={lead.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-syncra-primary">{lead.vendor_name}</p>
                  <p className={`mt-1 text-sm ${ui.body}`}>
                    Flat {lead.flat_number} · {lead.vendor_category} · {lead.budget_range}
                  </p>
                  {lead.notes ? <p className={`mt-2 text-sm ${ui.body}`}>{lead.notes}</p> : null}
                  <p className="mt-1 text-xs text-slate-500">{new Date(lead.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className={ui.input}
                    value={lead.status}
                    onChange={(e) =>
                      void updateVendorLeadStatus(lead.id, e.target.value as InteriorVendorLeadStatus)
                        .then(() => refresh())
                        .catch((err) => setError(err instanceof Error ? err.message : 'Update failed'))
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </article>
          ))}
          {leads.length === 0 ? (
            <p className={`text-sm ${ui.body}`}>No interior leads yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
