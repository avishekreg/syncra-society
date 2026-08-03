import React from 'react'
import { ui } from '../../lib/ui'

/** Lightweight marketplace stub — gated by `resident_marketplace` feature toggle. */
export default function ResidentMarketplacePage() {
  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>Community exchange</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Resident Marketplace</h2>
        <p className={`mt-2 ${ui.body}`}>
          Peer-to-peer listings for furniture, services, and society community exchange. Listing CRUD and
          moderation hooks will plug into this module surface.
        </p>
      </section>
      <section className={ui.card}>
        <div className="rounded-xl border border-dashed border-slate-300 bg-syncra-surface-alt px-4 py-10 text-center">
          <p className="text-sm font-semibold text-syncra-primary">Marketplace board ready</p>
          <p className={`mx-auto mt-2 max-w-md ${ui.body}`}>
            Super Admin has enabled this module for your society. Posting and search APIs can be connected
            next without changing route guards.
          </p>
        </div>
      </section>
    </div>
  )
}
