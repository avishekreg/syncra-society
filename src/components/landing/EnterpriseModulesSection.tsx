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
  }
] as const

type EnterpriseModulesSectionProps = {
  onOpenAuditDemo?: () => void
}

export default function EnterpriseModulesSection({ onOpenAuditDemo }: EnterpriseModulesSectionProps) {
  const [activeId, setActiveId] = useState<(typeof MODULES)[number]['id'] | null>(null)

  return (
    <section className="space-y-10" id="enterprise-modules">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <p className={ui.eyebrow}>Zero-hardware enterprise</p>
        <h3 className="text-2xl font-semibold leading-tight text-syncra-primary sm:text-3xl md:text-4xl">
          Enterprise Zero-Hardware Modules
        </h3>
        <p className={`text-base leading-relaxed ${ui.body}`}>
          Premium society intelligence without sensors, kiosks, or hardware vendors — activate per society as
          licensed add-ons.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((module) => {
          const open = activeId === module.id
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => setActiveId(open ? null : module.id)}
              className={`group flex h-full flex-col rounded-2xl border bg-white p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-card sm:p-6 ${
                open ? 'border-syncra-accent/50 ring-1 ring-syncra-accent/20' : 'border-slate-200'
              }`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-syncra-accent/10 text-2xl transition group-hover:scale-105">
                {module.icon}
              </span>
              <h4 className="mt-5 text-lg font-semibold text-syncra-primary">{module.title}</h4>
              <p className={`mt-3 text-sm leading-relaxed ${ui.body}`}>{module.blurb}</p>
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
