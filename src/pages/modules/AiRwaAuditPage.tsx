import React, { useEffect, useState } from 'react'
import {
  listHealthSnapshots,
  runAiRwaAudit,
  type SocietyHealthSnapshot
} from '../../api/aiRwaAudit'
import { useAuth } from '../../providers/AuthProvider'
import { ui } from '../../lib/ui'

export default function AiRwaAuditPage() {
  const { currentSocietyId } = useAuth()
  const societyId = currentSocietyId ?? ''
  const [snapshots, setSnapshots] = useState<SocietyHealthSnapshot[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    if (!societyId) return
    setSnapshots(await listHealthSnapshots(societyId))
  }

  useEffect(() => {
    void reload().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load audits'))
  }, [societyId])

  const latest = snapshots[0]

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>Governance intelligence</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>AI RWA Audit Engine</h2>
        <p className={`mt-2 ${ui.body}`}>
          Aggregates monthly collection rate, utility bill promptness, and complaint resolution SLA into a
          0–100 Society Health Index.
        </p>
      </section>

      <section className={ui.card}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Latest Health Index</p>
            <p className="mt-1 text-4xl font-semibold text-syncra-primary">{latest?.healthIndex ?? '—'}</p>
          </div>
          <button
            type="button"
            className={ui.btnPrimary}
            disabled={busy || !societyId}
            onClick={() => {
              setBusy(true)
              setError(null)
              void runAiRwaAudit(societyId)
                .then(reload)
                .catch((err) => setError(err instanceof Error ? err.message : 'Audit failed'))
                .finally(() => setBusy(false))
            }}
          >
            {busy ? 'Computing…' : 'Run monthly audit'}
          </button>
        </div>
        {latest ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className={ui.innerItem}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Collections</p>
              <p className="mt-1 text-lg font-semibold">{latest.collectionPct}%</p>
            </div>
            <div className={ui.innerItem}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Utility promptness</p>
              <p className="mt-1 text-lg font-semibold">{latest.utilityPromptnessPct}%</p>
            </div>
            <div className={ui.innerItem}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Complaint SLA</p>
              <p className="mt-1 text-lg font-semibold">{latest.complaintSlaPct}%</p>
            </div>
          </div>
        ) : null}
        {error ? <p className="mt-4 text-sm text-syncra-action-alt">{error}</p> : null}
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>History</h3>
        {snapshots.length === 0 ? (
          <p className={`mt-3 ${ui.body}`}>No audits yet. Run the engine to generate the first snapshot.</p>
        ) : (
          <div className={`mt-4 ${ui.tableWrap}`}>
            <table className={ui.table}>
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Month</th>
                  <th className="py-2 pr-3">Index</th>
                  <th className="py-2 pr-3">Collections</th>
                  <th className="py-2 pr-3">Utilities</th>
                  <th className="py-2">Complaints</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3">{row.periodMonth.slice(0, 7)}</td>
                    <td className="py-2 pr-3 font-semibold">{row.healthIndex}</td>
                    <td className="py-2 pr-3">{row.collectionPct}%</td>
                    <td className="py-2 pr-3">{row.utilityPromptnessPct}%</td>
                    <td className="py-2">{row.complaintSlaPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
