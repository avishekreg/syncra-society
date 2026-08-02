import React, { useEffect, useState } from 'react'
import { listAllElectionAudits, type SuperAdminElectionAudit } from '../../api/elections'
import { ui } from '../../lib/ui'

export default function SuperAdminElectionAuditPage() {
  const [audits, setAudits] = useState<SuperAdminElectionAudit[]>([])

  useEffect(() => {
    setAudits(listAllElectionAudits())
  }, [])

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>System health</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Election integrity audit</h2>
        <p className={`mt-2 ${ui.body}`}>
          Super Admin can verify ballot counts, turnout integrity, and tie alerts. Cryptographic ballot anonymity is
          preserved — no flat-to-candidate mapping is available in this system.
        </p>
      </section>

      <section className={ui.card}>
        {audits.length === 0 ? (
          <p className={ui.body}>No election audits found in this browser session yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Society</th>
                  <th className="py-2 pr-3">Election</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Seals</th>
                  <th className="py-2 pr-3">Ballots</th>
                  <th className="py-2 pr-3">Integrity</th>
                  <th className="py-2 pr-3">Key destroyed</th>
                  <th className="py-2">Tie alerts</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((row) => (
                  <tr key={`${row.societyId}-${row.electionId}`} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-mono text-xs">{row.societyId.slice(0, 8)}…</td>
                    <td className="py-2 pr-3 font-medium text-syncra-primary">{row.title}</td>
                    <td className="py-2 pr-3 uppercase">{row.status}</td>
                    <td className="py-2 pr-3 tabular-nums">{row.sealsCount}</td>
                    <td className="py-2 pr-3 tabular-nums">{row.ballotsCount}</td>
                    <td className="py-2 pr-3">{row.integrityOk ? 'OK' : 'Mismatch'}</td>
                    <td className="py-2 pr-3">{row.privateKeyDestroyed ? 'Yes' : 'No'}</td>
                    <td className="py-2 text-xs text-amber-700">
                      {row.tieAlerts.length ? row.tieAlerts.join(', ') : '—'}
                    </td>
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
