import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  analyzeExpenseAnomalies,
  listAiAuditLogs,
  runAiAuditorScan,
  societyFinancialHealthScore
} from '../../api/aiAuditorService'
import type { AiAuditLog } from '../../types/db'
import { formatInr } from '../../lib/platformPricing'
import { ui } from '../../lib/ui'

export default function AdminAuditPage() {
  const { currentSocietyId } = useAuth()
  const [logs, setLogs] = useState<AiAuditLog[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const preview = useMemo(() => analyzeExpenseAnomalies(), [])
  const health = societyFinancialHealthScore()

  async function refresh() {
    if (!currentSocietyId) return
    setLogs(await listAiAuditLogs(currentSocietyId))
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [currentSocietyId])

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>mAI Auditor</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Predictive financial leakage</h2>
        <p className={`mt-2 ${ui.body}`}>
          Invoice anomaly detection across water, electricity, vendor bills, and repairs — Financial Health Flag 0–100.
        </p>
        <div className="mt-6 flex flex-wrap items-end gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Society health</p>
            <p className="mt-1 text-4xl font-semibold text-syncra-primary">{health}</p>
          </div>
          <button
            type="button"
            className={ui.btnPrimary}
            disabled={busy || !currentSocietyId}
            onClick={() => {
              if (!currentSocietyId) return
              setBusy(true)
              void runAiAuditorScan(currentSocietyId)
                .then(refresh)
                .catch((err) => setError(err instanceof Error ? err.message : 'Scan failed'))
                .finally(() => setBusy(false))
            }}
          >
            {busy ? 'Scanning…' : 'Run AI auditor scan'}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {preview.map((row) => (
          <article
            key={row.label}
            className={`rounded-2xl border p-5 ${
              row.isLeakageFlag ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{row.category}</p>
            <h3 className="mt-1 font-semibold text-syncra-primary">{row.label}</h3>
            <p className="mt-2 text-sm">
              {formatInr(row.amount)} vs avg {formatInr(row.priorAverage)} · <strong>{row.variancePercentage}%</strong>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full ${row.healthScore >= 70 ? 'bg-emerald-500' : row.healthScore >= 45 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${row.healthScore}%` }}
              />
            </div>
            <p className={`mt-3 text-sm ${ui.body}`}>{row.recommendation}</p>
          </article>
        ))}
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Logged anomalies</h3>
        <ul className="mt-4 space-y-3">
          {logs.length === 0 ? <li className={ui.body}>No audit logs yet — run a scan.</li> : null}
          {logs.map((log) => (
            <li key={log.id} className="rounded-xl border border-slate-200 px-3 py-3 text-sm">
              <strong>{log.category}</strong> · {log.variance_percentage}% · score {log.health_score ?? '—'}
              <p className="mt-1 text-slate-600">{log.detected_anomaly}</p>
              <p className="mt-1 text-syncra-blue">{log.ai_recommendation}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
