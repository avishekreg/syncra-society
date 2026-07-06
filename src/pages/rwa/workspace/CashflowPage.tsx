import React from 'react'
import OutstandingRevenueMatrix from '../../../components/OutstandingRevenueMatrix'
import { ui } from '../../../lib/ui'

export default function WorkspaceCashflowPage() {
  return (
    <div className={ui.sectionGap}>
      <section className={ui.grid2}>
        <article className={ui.cardFill}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>Syncra AI Predictive Engine</p>
            <h2 className={`mt-1 ${ui.headingLg}`}>Cashflow forecast</h2>
          </header>
          <div className={ui.cardBody}>
            <p className={ui.body}>
              Based on a 6-month behavioral analysis of society ledger records, Block B holds a 14.2% default
              risk for the upcoming cycle.
            </p>
            <div className="mt-4 rounded-xl border border-syncra-accent/30 bg-cyan-50 px-4 py-3 text-sm font-medium text-syncra-blue">
              Expected liquid collection: 88.4%
            </div>
          </div>
        </article>

        <article className={ui.cardFill}>
          <OutstandingRevenueMatrix
            baseOutstanding={122400}
            lateFee={3600}
            accumulatedInterest={980}
            splitClaims={12500}
          />
        </article>
      </section>
    </div>
  )
}
