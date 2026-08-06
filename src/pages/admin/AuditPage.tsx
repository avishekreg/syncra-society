import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  getAuditorDashboard,
  recordSocietyExpense,
  runAiAuditorScan
} from '../../api/aiAuditorService'
import type { AiAuditCategory, AiAuditLog } from '../../types/db'
import { formatInr } from '../../lib/platformPricing'
import { ui } from '../../lib/ui'

type PreviewRow = {
  category: AiAuditCategory
  label: string
  amount: number
  priorAverage: number
  variancePercentage: number
  anomaly: string
  recommendation: string
  healthScore: number
  isLeakageFlag: boolean
}

export default function AdminAuditPage() {
  const { currentSocietyId, user } = useAuth()
  const [logs, setLogs] = useState<AiAuditLog[]>([])
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [health, setHealth] = useState(100)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [expenseForm, setExpenseForm] = useState({
    category: 'VENDOR_INVOICE' as AiAuditCategory,
    label: '',
    amount: ''
  })

  async function refresh() {
    if (!currentSocietyId) return
    const dash = await getAuditorDashboard(currentSocietyId)
    setLogs(dash.logs)
    setPreview(dash.preview)
    setHealth(dash.health)
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
          Autonomous MoM variance detection on the society expense ledger. Flags ≥20% auto-post to this dashboard —
          vendor payments remain a human dual-signatory gate.
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
              setMessage(null)
              void runAiAuditorScan(currentSocietyId)
                .then((created) => {
                  setMessage(
                    created.length
                      ? `Logged ${created.length} autonomous leakage flag(s).`
                      : 'No new ≥20% variances to flag.'
                  )
                  return refresh()
                })
                .catch((err) => setError(err instanceof Error ? err.message : 'Scan failed'))
                .finally(() => setBusy(false))
            }}
          >
            {busy ? 'Scanning…' : 'Run AI auditor scan'}
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Record invoice / utility bill</h3>
        <p className={`mt-1 text-sm ${ui.body}`}>
          Deep wire into `society_expense_ledger` — autonomous sweeps compare current vs prior month.
        </p>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!currentSocietyId) return
            void recordSocietyExpense({
              societyId: currentSocietyId,
              category: expenseForm.category,
              label: expenseForm.label,
              amount: Number(expenseForm.amount),
              createdByUserId: user?.id
            })
              .then(() => {
                setExpenseForm({ category: 'VENDOR_INVOICE', label: '', amount: '' })
                setMessage('Expense recorded to ledger.')
                return refresh()
              })
              .catch((err) => setError(err instanceof Error ? err.message : 'Save failed'))
          }}
        >
          <select
            className={ui.input}
            value={expenseForm.category}
            onChange={(e) =>
              setExpenseForm((f) => ({ ...f, category: e.target.value as AiAuditCategory }))
            }
          >
            {(['WATER', 'ELECTRICITY', 'VENDOR_INVOICE', 'REPAIR'] as AiAuditCategory[]).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            className={ui.input}
            placeholder="Label"
            value={expenseForm.label}
            onChange={(e) => setExpenseForm((f) => ({ ...f, label: e.target.value }))}
            required
          />
          <input
            className={ui.input}
            type="number"
            min={0}
            step="0.01"
            placeholder="Amount ₹"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
            required
          />
          <button type="submit" className={ui.btnSecondary}>
            Save to ledger
          </button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {preview.map((row) => (
          <article
            key={`${row.category}-${row.label}`}
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
        <ul className="mt-4 space-y-2">
          {logs.length === 0 ? <li className={ui.body}>No audit flags yet.</li> : null}
          {logs.map((log) => (
            <li key={log.id} className="rounded-xl border border-slate-200 px-3 py-3 text-sm">
              <span className="font-semibold text-syncra-primary">{log.category}</span> · {log.detected_anomaly} ·{' '}
              {log.variance_percentage}%
              <p className="mt-1 text-slate-600">{log.ai_recommendation}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
