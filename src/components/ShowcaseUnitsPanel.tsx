import React from 'react'
import type { DemoUnit } from '../types/db'
import { ui } from '../lib/ui'

const statusStyles: Record<DemoUnit['balance_status'], string> = {
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  due: 'border-amber-200 bg-amber-50 text-amber-700',
  defaulter: 'border-red-200 bg-red-50 text-red-600'
}

export default function ShowcaseUnitsPanel({ units }: { units: DemoUnit[] }) {
  return (
    <section className={ui.card}>
      <header className={`${ui.cardHeader} flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between`}>
        <div>
          <p className={ui.eyebrow}>Flat owner showcase</p>
          <h2 className={`mt-2 ${ui.headingLg}`}>Syncra Windsor Castle Flats Overview</h2>
          <p className={`mt-2 ${ui.body}`}>
            Live flat owner balances, due status, and recent payment snapshots for the demo society.
          </p>
        </div>
        <span className={ui.badge}>Demo occupancy data</span>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {units.map((unit) => (
          <div key={unit.flat_number} className={ui.innerItem}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Unit</p>
                <p className="mt-2 text-2xl font-semibold text-syncra-primary">Flat {unit.flat_number}</p>
                <p className="mt-1 text-sm text-slate-600">{unit.owner_name}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{unit.owner_email}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusStyles[unit.balance_status]}`}>
                {unit.balance_status === 'paid' ? 'Paid' : unit.balance_status === 'due' ? 'Due' : 'Defaulter'}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-syncra-surface-alt p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Outstanding</p>
                <p className="mt-2 text-xl font-semibold text-syncra-primary">
                  ₹{unit.balance_due.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-syncra-surface-alt p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Last payment</p>
                <p className="mt-2 text-lg font-semibold text-syncra-primary">{unit.last_payment}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
