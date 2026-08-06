import React from 'react'
import { ui } from '../../lib/ui'

const CARDS = [
  {
    icon: '🔧',
    title: 'Resident appliance ledger',
    body: 'RO filters (90d), Split ACs (180d), chimneys & geysers — push/WhatsApp reminders before service or AMC expiry.'
  },
  {
    icon: '🛗',
    title: 'Lift & Fire NOC radar',
    body: 'ARD tests, wire-rope cycles, hydrant pressure, cylinder refill — red flags for the President before legal risk.'
  },
  {
    icon: '⚙️',
    title: 'DG set lifecycle',
    body: 'Running-hours tracker, mobil oil change alerts, and battery health logs — zero sensors to install.'
  },
  {
    icon: '👷',
    title: 'Verified technician referrals',
    body: '1-click booking queues local AMC partners — resident savings plus platform referral monetization.'
  }
] as const

export default function MaiMaintainShowcase() {
  return (
    <section className="space-y-10" id="mai-maintain">
      <div className="mx-auto max-w-3xl space-y-4 text-center whitespace-normal break-words">
        <p className={ui.eyebrow}>Flagship · Zero hardware</p>
        <h3 className="mx-auto max-w-3xl text-balance text-2xl font-semibold leading-snug text-syncra-primary sm:text-3xl md:text-4xl">
          mAI Maintain — Infrastructure Safety & Appliance Radar
        </h3>
        <p className={`mx-auto max-w-2xl text-pretty ${ui.body}`}>
          Dual benefit for boards: cut RWA statutory legal risk on lifts and fire NOCs, while residents save on AMC
          chaos — and societies earn via verified technician referrals.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {CARDS.map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-slate-200 border-t-4 border-t-syncra-blue bg-white/90 p-6 shadow-sm"
          >
            <span className="text-3xl" aria-hidden>
              {card.icon}
            </span>
            <h4 className="mt-4 text-lg font-semibold text-syncra-primary">{card.title}</h4>
            <p className={`mt-2 text-sm leading-relaxed ${ui.body}`}>{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
