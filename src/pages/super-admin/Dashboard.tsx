import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CopyInviteLinkButton from '../../components/super-admin/CopyInviteLinkButton'
import AiExecutiveSummary from '../../components/super-admin/command-center/AiExecutiveSummary'
import PlatformTopologyMap from '../../components/super-admin/command-center/PlatformTopologyMap'
import SecurityThreatTelemetry from '../../components/super-admin/command-center/SecurityThreatTelemetry'
import SyncraCommandBar from '../../components/super-admin/command-center/SyncraCommandBar'
import { cc } from '../../components/super-admin/command-center/commandCenterStyles'
import { fetchAutomationStatus } from '../../lib/societyEvents'
import { generateExecutiveSummary, type ExecutiveSummaryResult } from '../../lib/platformExecutiveAi'
import {
  buildSocietyRegistrationUrl,
  formatInr,
  formatPlatformTimestamp,
  loadPlatformControlTowerData,
  type PlatformControlTowerData
} from '../../lib/platformControlTower'
import { parseSyncraCommand, type CommandBarAction } from '../../lib/syncraCommandBar'
import { isSocietyUuid } from '../../lib/resolveSocietyContext'
import { ui } from '../../lib/ui'

const billingPill: Record<'ok' | 'pending' | 'trial', string> = {
  ok: cc.pillOk,
  pending: cc.pillWatch,
  trial: cc.pillTrial
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<PlatformControlTowerData | null>(null)
  const [executive, setExecutive] = useState<ExecutiveSummaryResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(true)
  const [selectedSocietyId, setSelectedSocietyId] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)
  const [commandBusy, setCommandBusy] = useState(false)
  const [lastAction, setLastAction] = useState<CommandBarAction | null>(null)

  const onboardingRef = useRef<HTMLElement>(null)
  const ledgerRef = useRef<HTMLElement>(null)
  const revenueRef = useRef<HTMLElement>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setAiLoading(true)
    const payload = await loadPlatformControlTowerData()
    setData(payload)
    setSelectedSocietyId((current) => current || payload.societies[0]?.id || '')
    setLoading(false)

    void generateExecutiveSummary(payload)
      .then(setExecutive)
      .finally(() => setAiLoading(false))
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData, refreshToken])

  const inviteUrl = useMemo(() => {
    if (!selectedSocietyId || !isSocietyUuid(selectedSocietyId)) return ''
    return buildSocietyRegistrationUrl(selectedSocietyId)
  }, [selectedSocietyId])

  const selectedSociety = data?.societies.find((s) => s.id === selectedSocietyId)

  function scrollToSection(target: 'topology' | 'onboarding' | 'ledger' | 'revenue') {
    const map = {
      topology: document.getElementById('topology'),
      onboarding: onboardingRef.current,
      ledger: ledgerRef.current,
      revenue: revenueRef.current
    }
    map[target]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleCommand(raw: string) {
    if (!data) return
    setCommandBusy(true)

    const action = parseSyncraCommand(raw, data.societies)
    let resolved: CommandBarAction = action

    try {
      if (action.type === 'refresh') {
        setRefreshToken((n) => n + 1)
      } else if (action.type === 'navigate') {
        navigate(action.path)
      } else if (action.type === 'scroll') {
        scrollToSection(action.target)
      } else if (action.type === 'generate_link') {
        setSelectedSocietyId(action.societyId)
        scrollToSection('onboarding')
      } else if (action.type === 'webhook_status') {
        const status = await fetchAutomationStatus()
        if (!status) {
          resolved = {
            type: 'webhook_status',
            message: 'Automation status API unavailable — verify n8n env vars in System Settings.',
            configured: false,
            reachable: false
          }
        } else {
          resolved = {
            type: 'webhook_status',
            message: status.n8nReachable
              ? 'Global n8n webhook is configured and reachable.'
              : status.n8nConfigured
                ? `n8n configured but unreachable: ${status.message}`
                : `n8n not configured: ${status.message}`,
            configured: status.n8nConfigured,
            reachable: status.n8nReachable
          }
        }
      }
    } finally {
      setLastAction(resolved)
      setCommandBusy(false)
    }
  }

  return (
    <div className={ui.sectionGap}>
      <header>
        <p className={ui.eyebrow}>Platform console</p>
        <h1 className={`mt-1 ${ui.headingLg}`}>Global control tower</h1>
        <p className={`mt-2 max-w-3xl ${ui.body}`}>
          Real-time platform-wide telemetry, natural-language ops, and live gatekeeper topology for Super Admin
          decisions.
        </p>
      </header>

      <SyncraCommandBar onSubmit={(query) => void handleCommand(query)} lastAction={lastAction} busy={commandBusy} />

      <AiExecutiveSummary summary={executive} loading={aiLoading || loading} />

      <PlatformTopologyMap
        societies={data?.societies ?? []}
        visitorLogs24h={data?.visitorLogs24h ?? 0}
        loading={loading}
      />

      <SecurityThreatTelemetry societies={data?.societies ?? []} />

      <section ref={onboardingRef} id="onboarding" className={cc.card}>
        <header className={`${cc.cardHeader} flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between`}>
          <div>
            <p className={cc.eyebrow}>Onboarding ops</p>
            <h2 className={`mt-1 ${cc.headingSm}`}>Society invite & resident onboarding control</h2>
          </div>
          <button type="button" className={cc.btnGhost} onClick={() => setRefreshToken((n) => n + 1)}>
            Refresh data
          </button>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="block space-y-2">
            <span className={cc.label}>Onboarded society</span>
            <select
              value={selectedSocietyId}
              onChange={(event) => setSelectedSocietyId(event.target.value)}
              className={cc.select}
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
          <CopyInviteLinkButton url={inviteUrl} disabled={!inviteUrl} />
        </div>

        <div className="mt-4 space-y-2">
          <span className={cc.label}>Unique registration link</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              value={inviteUrl || 'Select a society with a valid UUID to generate a link'}
              className={`min-w-0 flex-1 ${cc.input} font-mono text-xs sm:text-sm`}
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

      <section ref={ledgerRef} id="ledger" className={cc.card}>
        <header className={cc.cardHeader}>
          <p className={cc.eyebrow}>Platform ledger</p>
          <h2 className={`mt-1 ${cc.headingSm}`}>Recent society registrations & gatekeeper throughput</h2>
        </header>

        {loading ? (
          <p className={cc.body} aria-busy="true">
            Loading platform ledger…
          </p>
        ) : !data?.recentRegistrations.length ? (
          <p className={cc.body}>No society registrations recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className={cc.table}>
              <thead>
                <tr className={cc.tableHead}>
                  <th className="px-3 py-3 font-semibold">Timestamp</th>
                  <th className="px-3 py-3 font-semibold">Society</th>
                  <th className="px-3 py-3 font-semibold">Plan tier</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRegistrations.map((row) => (
                  <tr key={row.id} className={cc.tableRow}>
                    <td className="px-3 py-3 text-slate-600">{formatPlatformTimestamp(row.registeredAt)}</td>
                    <td className="px-3 py-3 font-medium text-syncra-primary">{row.societyName}</td>
                    <td className="px-3 py-3 text-slate-700">{row.tier}</td>
                    <td className="px-3 py-3">
                      <span className={cc.pillInfo}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={`mt-6 ${cc.innerItem} flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gatekeeper alert throughput</p>
            <p className="mt-1 text-sm text-slate-700">
              <strong className="text-syncra-primary">{loading ? '—' : data?.visitorLogs24h ?? 0}</strong> visitor log
              events processed platform-wide in the last 24 hours.
            </p>
          </div>
          <span className={cc.pillInfo}>Live Supabase aggregate</span>
        </div>
      </section>

      <section ref={revenueRef} id="revenue" className={cc.card}>
        <header className={cc.cardHeader}>
          <p className={cc.eyebrow}>Commercial health</p>
          <h2 className={`mt-1 ${cc.headingSm}`}>Revenue & subscription monitoring</h2>
        </header>

        <div className={ui.grid3}>
          <article className={cc.statTile}>
            <p className="text-xs text-slate-500">Monthly recurring revenue</p>
            <p className={cc.statValue}>{loading ? '—' : formatInr(data?.financial.totalMrrInr ?? 0)}</p>
          </article>
          <article className={cc.statTile}>
            <p className="text-xs text-slate-500">Active subscriptions</p>
            <p className={cc.statValue}>{loading ? '—' : data?.financial.activeSubscriptions ?? 0}</p>
          </article>
          <article className={cc.statTile}>
            <p className="text-xs text-slate-500">Pending invoice flags</p>
            <p className={cc.statValue}>{loading ? '—' : data?.financial.pendingInvoices ?? 0}</p>
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
            <table className={cc.table}>
              <thead>
                <tr className={cc.tableHead}>
                  <th className="px-3 py-3 font-semibold">Society</th>
                  <th className="px-3 py-3 font-semibold">Subscription</th>
                  <th className="px-3 py-3 font-semibold">Est. MRR</th>
                  <th className="px-3 py-3 font-semibold">Flag</th>
                </tr>
              </thead>
              <tbody>
                {data.financial.billingRows.slice(0, 10).map((row) => (
                  <tr key={row.societyId} className={cc.tableRow}>
                    <td className="px-3 py-3 font-medium text-syncra-primary">{row.societyName}</td>
                    <td className="px-3 py-3 text-slate-600">{row.status}</td>
                    <td className="px-3 py-3 font-semibold tabular-nums text-slate-800">{formatInr(row.mrrInr)}</td>
                    <td className="px-3 py-3">
                      <span className={`capitalize ${billingPill[row.flag]}`}>{row.flag}</span>
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
