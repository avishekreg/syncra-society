import React, { useCallback, useEffect, useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import type { Society } from '../../../types/db'
import {
  formatSecurityTimestamp,
  loadPlatformSecurityTelemetry,
  runPlatformSecurityAudit,
  type PlatformSecurityTelemetry,
  type SecurityIndicatorStatus,
  type SecurityLogSeverity
} from '../../../lib/platformSecurityTelemetry'
import { cc } from './commandCenterStyles'

type Props = {
  societies: Society[]
}

const indicatorStatusPill: Record<SecurityIndicatorStatus, string> = {
  healthy: cc.pillOk,
  watch: cc.pillWatch,
  critical: cc.pillCritical
}

const severityPill: Record<SecurityLogSeverity, string> = {
  Low: cc.pillOk,
  Medium: cc.pillWatch,
  Critical: cc.pillCritical
}

const statusPill: Record<string, string> = {
  Monitoring: cc.pillWatch,
  Mitigated: cc.pillOk,
  Closed: cc.pillInfo,
  Investigating: cc.pillWatch,
  Verified: cc.pillOk,
  'Scheduled patch': cc.pillInfo
}

function indicatorStatusLabel(status: SecurityIndicatorStatus) {
  if (status === 'healthy') return 'Healthy'
  if (status === 'watch') return 'Watch'
  return 'Critical'
}

export default function SecurityThreatTelemetry({ societies }: Props) {
  const [telemetry, setTelemetry] = useState<PlatformSecurityTelemetry | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [auditRunning, setAuditRunning] = useState(false)

  const refreshTelemetry = useCallback(async () => {
    const payload = await loadPlatformSecurityTelemetry(societies)
    setTelemetry(payload)
    setInitialLoading(false)
  }, [societies])

  useEffect(() => {
    setInitialLoading(true)
    void refreshTelemetry()
  }, [refreshTelemetry])

  async function handleRunAudit() {
    setAuditRunning(true)
    try {
      const payload = await runPlatformSecurityAudit(societies)
      setTelemetry(payload)
    } finally {
      setAuditRunning(false)
    }
  }

  const busy = initialLoading || auditRunning

  return (
    <section id="security" className={cc.card}>
      <header className={`${cc.cardHeader} flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between`}>
        <div className="flex items-start gap-3">
          <div className={cc.aiIconWrap}>
            <ShieldCheck className="h-5 w-5 text-syncra-blue" aria-hidden="true" />
          </div>
          <div>
            <p className={cc.eyebrowPrimary}>Defensive telemetry</p>
            <h2 className={`mt-1 ${cc.headingSm}`}>Platform security & threat telemetry</h2>
            <p className={`mt-2 max-w-2xl ${cc.body}`}>
              Centralized visibility into authentication anomalies, dependency alerts, webhook integrity, and
              compliance posture across all onboarded societies.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleRunAudit()}
          disabled={busy}
          className={`inline-flex shrink-0 items-center gap-2 ${cc.btnPrimary} disabled:opacity-70`}
        >
          {auditRunning ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Run Security Audit
        </button>
      </header>

      {auditRunning ? (
        <div className={`mb-6 ${cc.innerItem} flex items-center gap-3 text-sm text-slate-700`} aria-live="polite">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-syncra-blue" aria-hidden="true" />
          Analyzing platform logs and dependencies…
        </div>
      ) : null}

      {initialLoading && !telemetry ? (
        <p className={cc.body} aria-busy="true">
          Loading security telemetry…
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(telemetry?.indicators ?? []).map((indicator) => (
              <article key={indicator.id} className={cc.statTile}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{indicator.title}</p>
                  <span className={indicatorStatusPill[indicator.status]}>{indicatorStatusLabel(indicator.status)}</span>
                </div>
                <p className={cc.statValue}>{indicator.value}</p>
                <p className="mt-2 text-sm leading-snug text-slate-600">{indicator.detail}</p>
              </article>
            ))}
          </div>

          {telemetry?.lastAuditAt ? (
            <p className="mt-4 text-xs text-slate-500">
              Last audit snapshot: {formatSecurityTimestamp(telemetry.lastAuditAt)}
            </p>
          ) : null}

          <div className="mt-8">
            <h3 className="text-base font-semibold text-syncra-primary">Recent security logs</h3>
            <p className="mt-1 text-sm text-slate-600">
              Platform-wide defensive events from auth, webhook, and compliance monitors.
            </p>

            {!telemetry?.recentLogs.length ? (
              <p className={`mt-4 ${cc.body}`}>No security events recorded in the current window.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className={cc.table}>
                  <thead>
                    <tr className={cc.tableHead}>
                      <th className="px-3 py-3 font-semibold">Timestamp</th>
                      <th className="px-3 py-3 font-semibold">Affected scope</th>
                      <th className="px-3 py-3 font-semibold">Event type</th>
                      <th className="px-3 py-3 font-semibold">Severity</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telemetry.recentLogs.map((row) => (
                      <tr key={row.id} className={cc.tableRow}>
                        <td className="px-3 py-3 text-slate-600">{formatSecurityTimestamp(row.timestamp)}</td>
                        <td className="px-3 py-3 font-medium text-syncra-primary">{row.scope}</td>
                        <td className="px-3 py-3 text-slate-700">{row.eventType}</td>
                        <td className="px-3 py-3">
                          <span className={severityPill[row.severity]}>{row.severity}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={statusPill[row.status] ?? cc.pillInfo}>{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
