import React from 'react'
import { ui } from '../../lib/ui'

type CoreCapability = {
  title: string
  description: string
  icon: React.ReactNode
}

const ICON_CLASS = 'h-6 w-6'

const coreCapabilities: CoreCapability[] = [
  {
    title: 'Billing & Ledgers',
    description: 'Per-flat dues, receipts, and audit-ready transaction history.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={ICON_CLASS} aria-hidden="true">
        <path
          d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M8 9h8M8 12.5h8M8 16h5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    )
  },
  {
    title: 'Notices & Guidebook',
    description: 'Broadcast announcements and host your society rulebook digitally.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={ICON_CLASS} aria-hidden="true">
        <path
          d="M6.5 4.5h8.2L18 7.8V19.5a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path d="M14.5 4.5V8H18" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        <path d="M8.5 12h7M8.5 15.5h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    )
  },
  {
    title: 'mAI Gatekeeper',
    description:
      'Visitor entry plus recurring staff QR passes, delivery pre-clearance, and exit trace — zero hardware locks.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={ICON_CLASS} aria-hidden="true">
        <path
          d="M7 11V8.5a5 5 0 0 1 10 0V11"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="12" cy="15.5" r="1.25" fill="currentColor" />
      </svg>
    )
  },
  {
    title: 'Smart Helpdesk & Complaints',
    description: 'SLA-tracked ticket routing & resolution for every resident issue.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={ICON_CLASS} aria-hidden="true">
        <path
          d="M4.5 12a7.5 7.5 0 0 1 13.7-4.2L20 6v5h-5l1.6-1.6A5.5 5.5 0 1 0 17.5 14"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 14.5h.01M12 14.5h.01M15 14.5h.01"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }
]

export default function CoreBasePlanSection() {
  return (
    <section className="space-y-12" id="features">
      <div className="mx-auto max-w-2xl space-y-4 text-center whitespace-normal break-words">
        <p className={ui.eyebrow}>Core base plan</p>
        <h3 className="mx-auto max-w-2xl text-balance text-2xl font-semibold leading-snug tracking-tight text-syncra-primary whitespace-normal break-words sm:text-3xl md:text-4xl md:leading-tight">
          Essential RWA Operations — Standard Out of the Box.
        </h3>
        <p className={`mx-auto max-w-2xl text-pretty whitespace-normal break-words ${ui.body}`}>
          Billing, notices, gatekeeper, and helpdesk ship with every society — no sensors, no hardware,
          no premium unlock required.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {coreCapabilities.map((feature) => (
          <article
            key={feature.title}
            className="group flex h-full flex-col rounded-2xl border border-slate-200 border-t-4 border-t-syncra-blue bg-white/80 p-6 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-md hover:ring-2 hover:ring-syncra-accent/25"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-syncra-accent/10 text-syncra-blue transition group-hover:scale-105 group-hover:bg-syncra-accent/15">
              {feature.icon}
            </span>
            <h4 className="mt-5 text-base font-semibold leading-snug text-syncra-primary">{feature.title}</h4>
            <p className={`mt-3 flex-1 text-sm leading-relaxed ${ui.body}`}>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
