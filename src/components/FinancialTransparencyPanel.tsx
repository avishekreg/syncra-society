import React from 'react'
import { useAuth } from '../providers/AuthProvider'
import { ui } from '../lib/ui'

import type { ShowcaseData } from '../providers/AuthProvider'

type Props = {
  embedded?: boolean
  data?: ShowcaseData | null
}

export default function FinancialTransparencyPanel({ embedded = false, data }: Props) {
  const { showcaseData } = useAuth()
  const source = data ?? showcaseData

  if (!source) {
    if (!embedded) return null
    return (
      <section className={ui.cardFill}>
        <p className={ui.body}>Treasury metrics will appear once ledger data is imported.</p>
      </section>
    )
  }

  const credits = source.ledgerEntries.filter((entry) => entry.type === 'credit')
  const debits = source.ledgerEntries.filter((entry) => entry.type === 'debit')
  const totalCollections = credits.reduce((sum, entry) => sum + entry.amount, 0)
  const totalExpenses = debits.reduce((sum, entry) => sum + entry.amount, 0)
  const netBalance = totalCollections - totalExpenses
  const recentExpenses = debits.slice(0, 3)

  const shell = embedded ? ui.cardFill : ui.card

  return (
    <section className={shell}>
      <header className={`${ui.cardHeader} flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between`}>
        <div>
          <p className={ui.eyebrow}>Society treasury</p>
          <h2 className={`mt-1 ${ui.heading}`}>Cashflow transparency</h2>
          <p className={`mt-1 ${ui.body}`}>
            Live finance metrics for residents and accountants.
          </p>
        </div>
        <span className="shrink-0 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Live demo
        </span>
      </header>

      <div className={`${ui.grid3} items-stretch`}>
        {[
          ['Total Collections', totalCollections, 'Resident remittances this cycle.'],
          ['Expenditures', totalExpenses, 'Society payouts and vendor disbursements.'],
          ['Net Balance', netBalance, 'Collections minus expenses.']
        ].map(([label, amount, hint]) => (
          <div key={label as string} className={ui.statTile}>
            <p className="text-xs text-slate-500">{label}</p>
            <p className={ui.statValue}>₹{(amount as number).toLocaleString('en-IN')}</p>
            <p className="mt-auto pt-2 text-xs leading-snug text-emerald-600">{hint}</p>
          </div>
        ))}
      </div>

      <div className={`mt-5 ${ui.innerItem}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Recent expense payouts</p>
          <span className={ui.badge}>Ledger detail</span>
        </div>
        <div className="space-y-2">
          {recentExpenses.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white min-h-11 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-syncra-primary">{entry.description}</p>
                <p className="text-xs text-slate-500">{entry.date}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-emerald-600">
                ₹{entry.amount.toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
