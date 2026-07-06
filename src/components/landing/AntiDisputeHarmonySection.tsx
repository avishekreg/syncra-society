import React from 'react'
import { ui } from '../../lib/ui'

export default function AntiDisputeHarmonySection() {
  return (
    <section
      aria-labelledby="anti-dispute-heading"
      className="rounded-3xl border border-gray-200 bg-white p-6 shadow-card sm:p-8 md:p-10"
    >
      <div className="mx-auto max-w-4xl space-y-5 text-center sm:text-left">
        <p className={ui.eyebrowPrimary}>Anti-Dispute Harmony</p>
        <h2
          id="anti-dispute-heading"
          className="text-2xl font-semibold leading-tight text-syncra-primary sm:text-3xl md:text-4xl"
        >
          Zero Blame. 100% Trust. Clean Society Governance.
        </h2>
        <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
          Financial management in traditional societies often leads to internal friction, lack of clarity, and
          unnecessary disputes among members. Syncra solves this forever with our{' '}
          <span className="font-semibold text-syncra-blue">No-Brainer Accounts</span> framework. By providing
          automated, real-time sync between bank statements, cashflows, and owner dashboards, we eliminate the room
          for manual errors or false accusations. No friction, no blame-games—just an unshakeable ecosystem of absolute
          financial transparency for every resident, accountant, and committee member.
        </p>
        <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
          {['Real-time bank sync', 'Audit-ready ledgers', 'Resident transparency'].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-gray-200 bg-syncra-surface-alt px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-syncra-blue shadow-sm"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
