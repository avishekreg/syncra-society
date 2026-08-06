import React, { useState } from 'react'
import { ui } from '../../lib/ui'

const MODULES = [
  {
    id: 'whatsapp',
    icon: '💬',
    title: 'WhatsApp AI Bot Automation',
    blurb: '24/7 resident instant query resolution & society guidebook lookup.',
    detail: 'Residents message the society bot for dues, notices, and bylaws — without waking the secretary.'
  },
  {
    id: 'parking',
    icon: '🅿️',
    title: 'Smart Parking Marketplace',
    blurb: 'Hourly visitor rent while you are at work, or monthly slot leases to neighbors via UPI.',
    detail: 'Owners list vacant bays in software; renters pay UPI and credits land in the owner wallet. Auto-vacate reminder 30 minutes before return — no sensors.'
  },
  {
    id: 'audit',
    icon: '📊',
    title: 'AI RWA Audit Engine',
    blurb: 'Real-time 0–100 Society Health Index across collections, SLA, and finance.',
    detail: 'Weighted scoring of collection %, utility promptness, and complaint resolution — audit-ready monthly.'
  },
  {
    id: 'vendor',
    icon: '🧹',
    title: 'Vendor SLA Tracking',
    blurb: 'Resident daily service quality scoring & automated monthly performance audits.',
    detail: 'Housekeeping and security ratings roll into a compliance percentage your committee can act on.'
  },
  {
    id: 'market',
    icon: '🛍️',
    title: 'Hyperlocal Resident Marketplace',
    blurb: 'Peer-to-peer trusted community buy/sell portal.',
    detail: 'Furniture, services, and society exchange — gated to verified residents of your community.'
  },
  {
    id: 'elections',
    icon: '🗳️',
    title: 'Secret Digital Elections',
    blurb:
      '1-Flat-1-Vote tamper-proof digital voting with absolute ballot secrecy & instant published bulletins.',
    detail:
      'Encrypted anonymous ballots, live turnout without candidate leaks, and scheduled result reveal when voting closes.'
  },
  {
    id: 'commute',
    icon: '🚗',
    title: 'maiCommute (In-Society Carpool)',
    blurb: 'Zero-commission peer-to-peer ride sharing with verified neighbors.',
    detail: 'Publish seats to tech parks and schools — request and accept within your society graph only.'
  },
  {
    id: 'kid',
    icon: '🧒',
    title: 'Kid Safety Gate Alert',
    blurb: 'Automated gate checks and parent alerts for unaccompanied minor exits.',
    detail: 'Parents pre-approve exits with time windows; guards get a loud alert when approval is missing.'
  },
  {
    id: 'sos',
    icon: '🚨',
    title: 'maiEmergency SOS',
    blurb: '1-tap medical & security emergency dispatch to guards & community volunteers.',
    detail: 'High-contrast SOS flash with flat location and one-tap call for responders — no panic buttons to install.'
  },
  {
    id: 'amenities',
    icon: '🏊',
    title: 'Clubhouse & Amenity Booking',
    blurb: 'Instant slot reservations & payment collection for society facilities.',
    detail: 'Calendar slot picker with real-time double-booking protection for clubhouse, pool, and courts.'
  },
  {
    id: 'energy',
    icon: '⚡',
    title: 'maiEnergy P2P Trading',
    blurb: 'Peer-to-peer energy credit transfers between verified flats.',
    detail: 'Surplus solar or prepaid credits can be offered to neighbors — settled as ledger credits inside the society.'
  },
  {
    id: 'guardian',
    icon: '🛡️',
    title: 'mAI Guardian Watch',
    blurb: 'Family check-in windows and manual vehicle flag alerts for the guard desk.',
    detail:
      'Parents set expected return windows in the app; guards log plate flags by hand. No GPS tags, beacons, or cameras required.'
  },
  {
    id: 'botanist',
    icon: '🌿',
    title: 'mAI Botanist',
    blurb: 'AI plant health diagnostics, QR-based tree tagging, and adoption drives.',
    detail: 'Residents scan society trees for carbon metrics and care plans — RWA dispatches weather-aware gardening tasks.'
  },
  {
    id: 'compost',
    icon: '🍃',
    title: 'Zero-Waste Compost Distribution',
    blurb: 'Auto-tracking organic waste composting to resident garden delivery.',
    detail: 'Publish compost batches from society waste and fulfill flat doorstep orders in kilograms.'
  },
  {
    id: 'plant-swap',
    icon: '🪴',
    title: 'Plant & Seed Swap',
    blurb: 'Hyperlocal community green exchange for cuttings, pots, and seeds.',
    detail: 'Neighbors list spare cuttings and saplings; claim within your verified society graph only.'
  },
  {
    id: 'tv-sizing',
    icon: '📐',
    title: 'Smart TV & Sound Sizing',
    blurb: 'Enter viewing distance for recommended display inches and speaker tips.',
    detail: 'Simple distance ÷ 1.6 formula snaps to retail sizes like 43", 55", and 65" — tape measure or phone ruler, no room cameras.'
  },
  {
    id: 'furniture-fit',
    icon: '🛋️',
    title: 'Furniture Layout Intelligence',
    blurb: 'Walkway-aware sofa & decor sizing before buying.',
    detail: 'L-shaped vs 3-seater guidance with clearance rules for living rooms, bedrooms, and balconies.'
  },
  {
    id: 'interior-leads',
    icon: '🎨',
    title: 'Verified Interior Lead Matching',
    blurb: 'Instant connection with top RWA-approved interior decorators.',
    detail: '1-tap consultation requests route to verified woodcraft, electronics, and lighting partners.'
  },
  {
    id: 'mailist-rent',
    icon: '🔑',
    title: 'maiList Rental Syndication',
    blurb: '1-click rent listings pushed to major property portals and zero-brokerage networks.',
    detail: 'Owners publish once; maiList formats portal payloads and broadcasts to society renter networks.'
  },
  {
    id: 'mailist-resale',
    icon: '🏠',
    title: 'maiList Verified Resale',
    blurb: 'Resale listings with RWA Resale Certificate, ₹/sqft, NOC, and zero brokerage.',
    detail: 'Attract high-intent buyers with dues clearance and society security score badges.'
  },
  {
    id: 'mailist-emi',
    icon: '📊',
    title: 'Buyer EMI & Direct Contact',
    blurb: 'Marketplace EMI estimates and owner contact without brokerage.',
    detail: 'Internal residents and verified buyers filter Verified Society Resale and inquire in one tap.'
  }
] as const

type EnterpriseModulesSectionProps = {
  onOpenAuditDemo?: () => void
}

export default function EnterpriseModulesSection({ onOpenAuditDemo }: EnterpriseModulesSectionProps) {
  const [activeId, setActiveId] = useState<(typeof MODULES)[number]['id'] | null>(null)

  return (
    <section className="space-y-10" id="enterprise-modules">
      <div className="mx-auto max-w-2xl space-y-4 text-center whitespace-normal break-words">
        <p className={ui.eyebrow}>Zero-hardware enterprise</p>
        <h3 className="mx-auto max-w-2xl text-balance text-2xl font-semibold leading-snug text-syncra-primary whitespace-normal break-words sm:text-3xl md:text-4xl md:leading-tight">
          Enterprise Zero-Hardware Modules
        </h3>
        <p className={`mx-auto max-w-2xl text-pretty whitespace-normal break-words ${ui.body}`}>
          Premium society intelligence without sensors, kiosks, or hardware vendors — activate per society as
          licensed add-ons.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {MODULES.map((module) => {
          const open = activeId === module.id
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => setActiveId(open ? null : module.id)}
              className={`group flex min-h-[280px] w-full flex-col rounded-2xl border bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-card ${
                open ? 'border-syncra-accent/50 ring-1 ring-syncra-accent/20' : 'border-slate-200'
              }`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-syncra-accent/10 text-2xl transition group-hover:scale-105">
                {module.icon}
              </span>
              <h4 className="mt-5 text-lg font-semibold leading-snug text-syncra-primary">{module.title}</h4>
              <p className={`mt-3 flex-1 text-sm leading-relaxed ${ui.body}`}>{module.blurb}</p>
              <div
                className={`grid transition-all duration-300 ${
                  open ? 'mt-4 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600">
                    {module.detail}
                  </p>
                  {module.id === 'audit' && onOpenAuditDemo ? (
                    <span
                      role="link"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenAuditDemo()
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          event.stopPropagation()
                          onOpenAuditDemo()
                        }
                      }}
                      className="mt-3 inline-flex text-sm font-semibold text-syncra-blue underline-offset-2 hover:underline"
                    >
                      Experience AI Audit →
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
