import React from 'react'
import ComplaintsDashboard from '../../../components/helpdesk/ComplaintsDashboard'
import { useAuth } from '../../../providers/AuthProvider'
import { usePlatformConfig } from '../../../providers/PlatformConfigProvider'
import { useResolvedSocietyUuid } from '../../../hooks/useResolvedSocietyUuid'
import { ui } from '../../../lib/ui'

const MOCK_INCIDENTS = [
  {
    id: 'ticket-1',
    flat: '204',
    owner: 'Priya Menon',
    category: 'Electrical',
    issue: 'Power outage in common corridor',
    urgency: 'Critical',
    attachment: 'elevator-panel.jpg',
    status: 'Open',
    time: '2 min ago'
  },
  {
    id: 'ticket-2',
    flat: '501',
    owner: 'Aarti Joshi',
    category: 'Infrastructure',
    issue: 'Water pump noise has increased',
    urgency: 'High',
    attachment: 'pump-audio.png',
    status: 'In Review',
    time: '12 min ago'
  }
]

export default function WorkspaceComplaintsPage() {
  const { currentSocietyId } = useAuth()
  const { isModuleEnabled } = usePlatformConfig()
  const { uuid, loading: resolvingUuid } = useResolvedSocietyUuid()

  if (!isModuleEnabled('helpdesk', currentSocietyId)) {
    return (
      <div className={ui.card}>
        <p className={ui.eyebrow}>Smart Helpdesk</p>
        <h2 className={`mt-3 ${ui.heading}`}>Module unavailable</h2>
        <p className={`mt-3 ${ui.body}`}>Enable Smart Helpdesk for this society to view the incident stream.</p>
      </div>
    )
  }

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <header className={ui.cardHeader}>
          <p className={ui.eyebrow}>Incoming emergency tickets</p>
          <h2 className={`mt-1 ${ui.headingLg}`}>RWA incident stream</h2>
          <p className={`mt-2 ${ui.body}`}>Live triage queue for urgent resident complaints and gate incidents.</p>
        </header>
        <div className="space-y-3">
          {MOCK_INCIDENTS.map((ticket) => (
            <div key={ticket.id} className={ui.innerItem}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                    Flat {ticket.flat}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-syncra-primary">{ticket.issue}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {ticket.category} · {ticket.time}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                  {ticket.urgency}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-slate-600">
                <span>{ticket.owner}</span>
                <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">
                  {ticket.attachment}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500">
                  {ticket.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {resolvingUuid ? (
        <div className={ui.card} aria-busy="true">
          <p className={ui.body}>Resolving society context…</p>
        </div>
      ) : uuid ? (
        <section className={ui.card}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>Complaints dashboard</p>
            <h2 className={`mt-1 ${ui.heading}`}>Helpdesk & incident stream</h2>
          </header>
          <ComplaintsDashboard societyId={uuid} />
        </section>
      ) : null}
    </div>
  )
}
