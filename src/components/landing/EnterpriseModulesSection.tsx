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
    title: 'Smart Crowdsourced Parking',
    blurb: 'Dynamic visitor slot allocation using resident out-of-station status.',
    detail: 'Zero IoT sensors. When a flat marks out-of-station, their bay becomes a temporary visitor slot.'
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
    title: 'maiEmergency SOS Mesh',
    blurb: '1-tap medical & security emergency dispatch to guards & community volunteers.',
    detail: 'High-contrast SOS flash with flat location and one-tap call for responders.'
  },
  {
    id: 'amenities',
    icon: '🏊',
    title: 'Clubhouse & Amenity Booking',
    blurb: 'Instant slot reservations & payment collection for society facilities.',
    detail: 'Calendar slot picker with real-time double-booking protection for clubhouse, pool, and courts.'
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
