import React from 'react'
import { ui } from '../lib/ui'

type Props = {
  baseOutstanding: number
  lateFee: number
  accumulatedInterest: number
  splitClaims: number
}

function formatRupees(value: number) {
  return `₹${value.toLocaleString('en-IN')}`
}

export default function OutstandingRevenueMatrix({ baseOutstanding, lateFee, accumulatedInterest, splitClaims }: Props) {
  const grandTotal = baseOutstanding + lateFee + accumulatedInterest + splitClaims

  return (
    <div className="flex h-full flex-col">
      <header className={ui.cardHeader}>
        <p className={ui.eyebrow}>Outstanding Revenue Matrix</p>
        <h2 className={`mt-1 ${ui.heading}`}>Forensic dues breakdown</h2>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          ['Base Principal', baseOutstanding],
          ['Late Fee', lateFee],
          ['Interest', accumulatedInterest],
          ['Split Claims', splitClaims]
        ].map(([label, value]) => (
          <div key={label as string} className={ui.statTile}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className={ui.statValue}>{formatRupees(value as number)}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-syncra-action/30 bg-orange-50 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-syncra-action">Grand Total Dues</p>
        <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-syncra-primary">
          {formatRupees(grandTotal)}
        </p>
      </div>
    </div>
  )
}
