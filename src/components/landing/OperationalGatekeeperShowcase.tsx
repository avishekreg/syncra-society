import React from 'react'
import { ui } from '../../lib/ui'

const OPS_CAPABILITIES = [
  {
    icon: '📇',
    title: 'Recurring Staff Passes',
    description:
      'Zero-friction QR entry for maids, drivers, and daily help with customizable time-window restriction locks.'
  },
  {
    icon: '🛵',
    title: 'Smart Delivery Pre-Approval',
    description:
      'One-tap clearance for food apps, e-commerce logistics, India Post, and any local courier — so guards never interrupt residents unnecessarily.'
  },
  {
    icon: '📜',
    title: 'Digital Tenant Onboarding & Police Verification',
    description:
      'Owner agreement upload, RWA digital sign-off, and automatic tenant notification routing.'
  }
] as const

export default function OperationalGatekeeperShowcase() {
  return (
    <section className="space-y-10" id="gatekeeper-ops">
      <div className="mx-auto max-w-2xl space-y-4 text-center whitespace-normal break-words">
        <p className={ui.eyebrow}>Included with mAI Gatekeeper</p>
        <h3 className="mx-auto max-w-2xl text-balance text-2xl font-semibold leading-snug text-syncra-primary whitespace-normal break-words sm:text-3xl md:text-4xl md:leading-tight">
          Enterprise operations without hardware.
        </h3>
        <p className={`mx-auto max-w-2xl text-pretty whitespace-normal break-words ${ui.body}`}>
          Staff fast-track passes, delivery intent pre-clearance, and digital tenant lease workflows ship with the
          core gatekeeper stack — no sensor vendors required.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {OPS_CAPABILITIES.map((item) => (
          <article
            key={item.title}
            className="flex h-full flex-col rounded-2xl border border-slate-200 border-t-4 border-t-syncra-accent bg-white/80 p-6 shadow-sm backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <span className="text-3xl" aria-hidden="true">
              {item.icon}
            </span>
            <h4 className="mt-4 text-lg font-semibold leading-snug text-syncra-primary">{item.title}</h4>
            <p className={`mt-3 flex-1 text-sm leading-relaxed ${ui.body}`}>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
