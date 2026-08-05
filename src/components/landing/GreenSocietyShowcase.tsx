import React from 'react'
import { ui } from '../../lib/ui'

const ITEMS = [
  {
    icon: '🌿',
    title: 'mAI Botanist',
    description: 'AI plant health diagnostics, QR-based tree tagging, and resident adoption drives.'
  },
  {
    icon: '🍃',
    title: 'Zero-Waste Compost Distribution',
    description: 'Auto-tracking organic waste composting to resident garden doorstep delivery.'
  },
  {
    icon: '🪴',
    title: 'Plant & Seed Swap',
    description: 'Hyperlocal community green exchange for cuttings, pots, seeds, and saplings.'
  }
] as const

export default function GreenSocietyShowcase() {
  return (
    <section className="space-y-10" id="green-society">
      <div className="mx-auto max-w-3xl space-y-4 text-center whitespace-normal break-words">
        <p className={ui.eyebrow}>Sustainability add-ons</p>
        <h3 className="mx-auto max-w-3xl text-balance text-2xl font-semibold leading-snug text-syncra-primary whitespace-normal break-words sm:text-3xl md:text-4xl md:leading-tight">
          Green &amp; Sustainable Society Intelligence
        </h3>
        <p className={`mx-auto max-w-2xl text-pretty whitespace-normal break-words ${ui.body}`}>
          Digitize landscape management, composting, and botanical assets — without IoT sensors or nursery hardware lock-in.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {ITEMS.map((item) => (
          <article
            key={item.title}
            className="flex h-full flex-col rounded-2xl border border-emerald-100 border-t-4 border-t-emerald-600 bg-gradient-to-b from-emerald-50/80 to-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
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
