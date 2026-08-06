import React from 'react'
import { ui } from '../../lib/ui'

const ITEMS = [
  {
    icon: '🔧',
    title: 'mAI Maintain',
    description:
      'Appliance service radar for residents plus Lift / DG / Fire NOC statutory tracker for the RWA — zero hardware.'
  },
  {
    icon: '📊',
    title: 'mAI Auditor',
    description: 'Invoice & utility MoM variance flags from the society expense ledger — before human payment approval.'
  },
  {
    icon: '🅿️',
    title: 'Smart Parking Monetization',
    description: 'Hourly visitor bay rent and monthly neighbor leases with UPI owner credits — no sensors.'
  },
  {
    icon: '🗳️',
    title: 'Impeachment Elections',
    description: 'Cryptographic 1-Flat-1-Vote recall motions to keep RWA committees accountable.'
  }
] as const

export default function AutonomousIntelligenceShowcase() {
  return (
    <section className="space-y-10" id="autonomous-intelligence">
      <div className="mx-auto max-w-3xl space-y-4 text-center whitespace-normal break-words">
        <p className={ui.eyebrow}>Flagship differentiators</p>
        <h3 className="mx-auto max-w-3xl text-balance text-2xl font-semibold leading-snug text-syncra-primary whitespace-normal break-words sm:text-3xl md:text-4xl md:leading-tight">
          Autonomous Society Intelligence
          <span className="mt-2 block text-lg font-medium text-slate-600 sm:text-xl">
            Competitive Edge vs Legacy Platforms
          </span>
        </h3>
        <p className={`mx-auto max-w-2xl text-pretty whitespace-normal break-words ${ui.body}`}>
          Infrastructure NOC radar, predictive finance flags, parking earnings, and cryptographic recall votes — all
          phone-first, with no gadgets to buy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {ITEMS.map((item) => (
          <article
            key={item.title}
            className="flex h-full flex-col rounded-2xl border border-slate-200 border-t-4 border-t-syncra-action bg-white/85 p-6 shadow-sm backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <span className="text-3xl" aria-hidden="true">
              {item.icon}
            </span>
            <h4 className="mt-4 text-lg font-semibold text-syncra-primary">{item.title}</h4>
            <p className={`mt-3 flex-1 text-sm leading-relaxed ${ui.body}`}>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
