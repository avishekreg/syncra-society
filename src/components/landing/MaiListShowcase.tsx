import React from 'react'
import { ui } from '../../lib/ui'

const ITEMS = [
  {
    icon: '🏘️',
    title: '1-Click Dual Engine',
    description: 'Publish flats for rent or resale once — syndicate to MagicBricks, 99acres, Housing.com, and NoBroker.'
  },
  {
    icon: '📜',
    title: 'Verified RWA Resale Certificate',
    description: 'Badge dues clearance, society security score, and NOC status to attract high-intent buyers.'
  },
  {
    icon: '🤝',
    title: 'Zero Brokerage Marketplace',
    description: 'Internal investors and verified buyers contact owners directly with EMI estimates built in.'
  }
] as const

export default function MaiListShowcase() {
  return (
    <section className="space-y-10" id="mai-list">
      <div className="mx-auto max-w-3xl space-y-4 text-center whitespace-normal break-words">
        <p className={ui.eyebrow}>Property syndication</p>
        <h3 className="mx-auto max-w-3xl text-balance text-2xl font-semibold leading-snug text-syncra-primary whitespace-normal break-words sm:text-3xl md:text-4xl md:leading-tight">
          maiList: 1-Click Dual-Engine for Flat Rental &amp; Resale Syndication across Top Real Estate Portals
        </h3>
        <p className={`mx-auto max-w-2xl text-pretty whitespace-normal break-words ${ui.body}`}>
          Owners list once. maiList formats rent and resale payloads, attaches RWA trust signals, and broadcasts to
          society investor networks — zero brokerage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {ITEMS.map((item) => (
          <article
            key={item.title}
            className="flex h-full flex-col rounded-2xl border border-slate-200 border-t-4 border-t-syncra-action bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
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
