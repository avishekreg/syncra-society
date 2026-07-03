import React from 'react'
import { useAuth } from '../providers/AuthProvider'
import GatekeeperPanel from './GatekeeperPanel'
import { ui } from '../lib/ui'

type Props = {
  totalPaid: number
  outstanding: number
  paymentStatus: 'paid' | 'due' | 'defaulter' | 'unknown'
  flatNumber?: string | null
}

const statusStyles = {
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  due: 'border-amber-200 bg-amber-50 text-amber-700',
  defaulter: 'border-red-200 bg-red-50 text-red-600',
  unknown: 'border-slate-200 bg-slate-100 text-slate-600'
}

export default function ResidentAccountsOverview({ totalPaid, outstanding, paymentStatus, flatNumber }: Props) {
  return (
    <section className={ui.card}>
      <header className={ui.cardHeader}>
        <p className={ui.eyebrow}>Accounts overview</p>
        <h2 className={`mt-1 ${ui.heading}`}>
          {flatNumber ? `Flat ${flatNumber} — financial summary` : 'Your financial summary'}
        </h2>
      </header>
      <div className={`${ui.grid3} items-stretch`}>
        <div className={ui.statTile}>
          <p className="text-xs text-slate-500">Total paid</p>
          <p className={ui.statValue}>₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>
        <div className={ui.statTile}>
          <p className="text-xs text-slate-500">Outstanding balance</p>
          <p className={ui.statValue}>₹{outstanding.toLocaleString('en-IN')}</p>
        </div>
        <div className={ui.statTile}>
          <p className="text-xs text-slate-500">Payment status</p>
          <span
            className={`mt-3 inline-flex w-fit rounded-full border px-3 py-1 text-sm font-semibold capitalize ${statusStyles[paymentStatus]}`}
          >
            {paymentStatus === 'unknown' ? 'Not mapped' : paymentStatus}
          </span>
        </div>
      </div>
    </section>
  )
}

export function ResidentGateApprovals() {
  return (
    <section className={ui.card}>
      <header className={ui.cardHeader}>
        <p className={ui.eyebrow}>Live gate approvals</p>
        <h2 className={`mt-1 ${ui.heading}`}>Pending visitor requests</h2>
        <p className={`mt-1 ${ui.body}`}>Approve or deny visitors waiting at your gate.</p>
      </header>
      <GatekeeperPanel />
    </section>
  )
}
