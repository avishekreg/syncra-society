import React from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { useLedger } from '../../hooks/useLedger'
import LedgerManager from '../rwa/LedgerManager'
import { ui } from '../../lib/ui'

export default function FinanceLedgerPage() {
  const { currentSocietyId } = useAuth()
  const { entries } = useLedger(currentSocietyId)

  if (entries === null) {
    return <div className={ui.loading}>Loading financial ledger…</div>
  }

  return (
    <div className={ui.sectionGap}>
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <article className={`${ui.cardFill} xl:col-span-2`}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>Treasury operations</p>
            <h2 className={`mt-1 ${ui.heading}`}>Record transaction</h2>
          </header>
          <div className={ui.cardBody}>
            <LedgerManager embedded />
          </div>
        </article>

        <article className={`${ui.cardFill} xl:col-span-3`}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>Structured ledger</p>
            <h2 className={`mt-1 ${ui.heading}`}>All society transactions</h2>
          </header>
          <div className={`${ui.cardBody} space-y-3`}>
            {entries.length === 0 ? (
              <p className={ui.body}>No ledger entries recorded yet.</p>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className={ui.innerItem}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-syncra-primary">{entry.description}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{entry.date}</p>
                    </div>
                    <p
                      className={`text-sm font-semibold tabular-nums ${
                        entry.type === 'credit' ? 'text-emerald-600' : 'text-syncra-action-alt'
                      }`}
                    >
                      {entry.type === 'credit' ? '+' : '−'}₹{Number(entry.amount).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  )
}
