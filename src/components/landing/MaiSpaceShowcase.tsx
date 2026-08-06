import React from 'react'
import { ui } from '../../lib/ui'

const ITEMS = [
  {
    icon: '📐',
    title: 'Smart TV & Sound Sizing',
    description: 'Enter viewing distance for recommended display inches and speaker tips — no room cameras.'
  },
  {
    icon: '🛋️',
    title: 'Furniture Layout Intelligence',
    description: 'Walkway-aware sofa & decor sizing from room dimensions you type in.'
  },
  {
    icon: '🎨',
    title: 'Verified Interior Lead Matching',
    description: 'Instant connection with top RWA-approved interior decorators.'
  }
] as const

export default function MaiSpaceShowcase() {
  return (
    <section className="space-y-10" id="mai-space">
      <div className="mx-auto max-w-3xl space-y-4 text-center whitespace-normal break-words">
        <p className={ui.eyebrow}>Home setup intelligence</p>
        <h3 className="mx-auto max-w-3xl text-balance text-2xl font-semibold leading-snug text-syncra-primary whitespace-normal break-words sm:text-3xl md:text-4xl md:leading-tight">
          mAI Space: Spatial &amp; Interior AI Engine
        </h3>
        <p className={`mx-auto max-w-2xl text-pretty whitespace-normal break-words ${ui.body}`}>
          Guide residents on TV sizing, room acoustics, furniture fit, and verified interior vendor matching —
          before a single wrong purchase. Tape measure + phone is enough.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {ITEMS.map((item) => (
          <article
            key={item.title}
            className="flex h-full flex-col rounded-2xl border border-slate-200 border-t-4 border-t-syncra-blue bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
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
