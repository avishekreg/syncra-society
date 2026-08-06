import React from 'react'
import { ui } from '../../lib/ui'

const ITEMS = [
  {
    icon: '🕵️',
    title: 'mAI Asset Finder',
    description:
      'Community Bluetooth mesh to locate lost phones, keys, and track unauthorized vehicle motion.'
  },
  {
    icon: '📊',
    title: 'mAI Auditor',
    description: 'AI predictive financial leakage detection & vendor invoice auditing.'
  },
  {
    icon: '⚖️',
    title: 'mAI Nyaya',
    description: 'Automated dispute resolution & community mediation based on society bylaws.'
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
          Predictive finance, peer energy credits, cryptographic recall votes, geofence guardianship, AI mediation,
          and a society-wide Bluetooth asset mesh — zero hardware lock-in.
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
