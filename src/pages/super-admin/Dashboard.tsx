import React, { useEffect, useMemo, useState } from 'react'
import CopyInviteLinkButton from '../../components/super-admin/CopyInviteLinkButton'
import {
  buildSocietyRegistrationUrl,
  formatInr,
  formatPlatformTimestamp,
  loadPlatformControlTowerData,
  type PlatformControlTowerData
} from '../../lib/platformControlTower'
import { isSocietyUuid } from '../../lib/resolveSocietyContext'
import { ui } from '../../lib/ui'

const statusPill: Record<'ok' | 'pending' | 'trial', string> = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  trial: 'border-sky-200 bg-sky-50 text-sky-700'
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<PlatformControlTowerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSocietyId, setSelectedSocietyId] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)

    void loadPlatformControlTowerData()
      .then((payload) => {
        if (!active) return
        setData(payload)
        setSelectedSocietyId((current) => current || payload.societies[0]?.id || '')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [refreshToken])

  const inviteUrl = useMemo(() => {
    if (!selectedSocietyId || !isSocietyUuid(selectedSocietyId)) return ''
    return buildSocietyRegistrationUrl(selectedSocietyId)
  }, [selectedSocietyId])

  const selectedSociety = data?.societies.find((s) => s.id === selectedSocietyId)

  return (
    <div className={ui.sectionGap}>
      <section className={ui.grid3}>
        <article className={ui.cardFill}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registered societies</p>
          <p className={ui.statValue}>{loading ? '—' : data?.societies.length ?? 0}</p>
        </article>
        <article className={ui.cardFill}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total units onboarded</p>
          <p className={ui.statValue}>{loading ? '—' : (data?.totalFlats ?? 0).toLocaleString('en-IN')}</p>
        </article>
        <article className={ui.cardFill}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gatekeeper events (24h)</p>
          <p className={ui.statValue}>{loading ? '—' : data?.visitorLogs24h ?? 0}</p>
        </article>
      </section>

      <section className={ui.card}>
        <header className={`${ui.cardHeader} flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between`}>
          <div>
            <p className={ui.eyebrow}>Onboarding ops</p>
            <h2 className={`mt-1 ${ui.heading}`}>Society invite & resident onboarding control</h2>
          </div>
          <button type="button" className={ui.btnGhost} onClick={() => setRefreshToken((n) => n + 1)}>
            Refresh data
          </button>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="block space-y-2">
            <span className={ui.label}>Onboarded society</span>
            <select
              value={selectedSocietyId}
              onChange={(event) => setSelectedSocietyId(event.target.value)}
              className={ui.input}
              disabled={loading || !data?.societies.length}
            >
              {!data?.societies.length ? (
                <option value="">No societies available</option>
              ) : (
                data.societies.map((society) => (
                  <option key={society.id} value={society.id}>
                    {society.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <CopyInviteLinkButton url={inviteUrl} disabled={!inviteUrl} />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <span className={ui.label}>Unique registration link</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              value={inviteUrl || 'Select a society with a valid UUID to generate a link'}
              className={`min-w-0 flex-1 ${ui.input} font-mono text-xs sm:text-sm`}
            />
            <CopyInviteLinkButton url={inviteUrl} disabled={!inviteUrl} />
          </div>
          {selectedSociety && inviteUrl ? (
            <p className="text-xs text-slate-500">
              Share with residents or RWA teams — opens sign-up pre-scoped to{' '}
              <strong className="text-syncra-primary">{selectedSociety.name}</strong>.
            </p>
          ) : null}
        </div>
      </section>

      <section className={ui.card}>
        <header className={ui.cardHeader}>
          <p className={ui.eyebrow}>Platform ledger</p>
          <h2 className={`mt-1 ${ui.heading}`}>Recent society registrations & gatekeeper throughput</h2>
        </header>

        {loading ? (
          <p className={ui.body} aria-busy="true">
            Loading platform ledger…
          </p>
        ) : !data?.recentRegistrations.length ? (
          <p className={ui.body}>No society registrations recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-semibold">Timestamp</th>
                  <th className="px-3 py-3 font-semibold">Society</th>
                  <th className="px-3 py-3 font-semibold">Plan tier</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRegistrations.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 text-slate-600">{formatPlatformTimestamp(row.registeredAt)}</td>
                    <td className="px-3 py-3 font-medium text-syncra-primary">{row.societyName}</td>
                    <td className="px-3 py-3 text-slate-700">{row.tier}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={`mt-6 ${ui.innerItem} flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gatekeeper alert throughput</p>
            <p className="mt-1 text-sm text-slate-700">
              <strong className="text-syncra-primary">{loading ? '—' : data?.visitorLogs24h ?? 0}</strong> visitor log
              events processed platform-wide in the last 24 hours.
            </p>
          </div>
          <span className="rounded-full border border-syncra-accent/30 bg-cyan-50 px-3 py-1 text-xs font-semibold text-syncra-blue">
            Live Supabase aggregate
          </span>
        </div>
      </section>

      <section className={ui.card}>
        <header className={ui.cardHeader}>
          <p className={ui.eyebrow}>Commercial health</p>
          <h2 className={`mt-1 ${ui.heading}`}>Revenue & subscription monitoring</h2>
        </header>

        <div className={ui.grid3}>
          <article className={ui.statTile}>
            <p className="text-xs text-slate-500">Monthly recurring revenue</p>
            <p className={ui.statValue}>{loading ? '—' : formatInr(data?.financial.totalMrrInr ?? 0)}</p>
          </article>
          <article className={ui.statTile}>
            <p className="text-xs text-slate-500">Active subscriptions</p>
            <p className={ui.statValue}>{loading ? '—' : data?.financial.activeSubscriptions ?? 0}</p>
          </article>
          <article className={ui.statTile}>
            <p className="text-xs text-slate-500">Pending invoice flags</p>
            <p className={ui.statValue}>{loading ? '—' : data?.financial.pendingInvoices ?? 0}</p>
          </article>
        </div>

        {!loading && (data?.financial.trialSocieties ?? 0) > 0 ? (
          <p className="mt-4 text-sm text-amber-800">
            {data?.financial.trialSocieties} societ{data?.financial.trialSocieties === 1 ? 'y' : 'ies'} on trial —
            review activation in Society Onboarding.
          </p>
        ) : null}

        {!loading && data?.financial.billingRows.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-semibold">Society</th>
                  <th className="px-3 py-3 font-semibold">Subscription</th>
                  <th className="px-3 py-3 font-semibold">Est. MRR</th>
                  <th className="px-3 py-3 font-semibold">Flag</th>
                </tr>
              </thead>
              <tbody>
                {data.financial.billingRows.slice(0, 10).map((row) => (
                  <tr key={row.societyId} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 font-medium text-syncra-primary">{row.societyName}</td>
                    <td className="px-3 py-3 text-slate-600">{row.status}</td>
                    <td className="px-3 py-3 font-semibold tabular-nums text-slate-800">{formatInr(row.mrrInr)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPill[row.flag]}`}
                      >
                        {row.flag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  )
}
