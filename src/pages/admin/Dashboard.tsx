import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { isGlobalSuperAdmin } from '../../lib/roles'
import { listComplaintsForSociety } from '../../api/complaints'
import { listVisitorLogs } from '../../api/visitorLogs'
import { ui } from '../../lib/ui'

function StatCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <article className={ui.statTile}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={ui.statValue}>{value}</p>
      <p className={`mt-auto pt-3 text-xs ${ui.body}`}>{hint}</p>
    </article>
  )
}

export default function AdminDashboard() {
  const { user, showcaseData, currentSocietyId } = useAuth()
  const [activeTickets, setActiveTickets] = useState(0)
  const [pendingApprovals, setPendingApprovals] = useState(0)

  useEffect(() => {
    if (!currentSocietyId) return
    void (async () => {
      try {
        const [complaints, visitors] = await Promise.all([
          listComplaintsForSociety(currentSocietyId),
          listVisitorLogs(currentSocietyId)
        ])
        setActiveTickets(
          complaints.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_progress').length
        )
        setPendingApprovals(visitors.filter((log) => log.status === 'pending_approval').length)
      } catch {
        setActiveTickets(0)
        setPendingApprovals(0)
      }
    })()
  }, [currentSocietyId])

  if (!user) {
    return <div className={ui.loading}>Loading Syncra Workspace Safely...</div>
  }

  if (isGlobalSuperAdmin(user)) {
    return <Navigate to="/super-admin" replace />
  }

  const totalResidents = showcaseData?.units?.length ?? 0

  return (
    <div className="space-y-6">
      <header>
        <p className={ui.eyebrow}>President console</p>
        <h1 className={`mt-2 ${ui.headingLg}`}>Society overview</h1>
        <p className={`mt-2 max-w-2xl ${ui.body}`}>
          High-level operational pulse — open notices, finance, and onboarding from the sidebar sub-menus.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total residents"
          value={totalResidents}
          hint="Registered flats and owners in your society matrix."
        />
        <StatCard
          label="Active tickets"
          value={activeTickets}
          hint="Open helpdesk complaints awaiting RWA action."
        />
        <StatCard
          label="Pending approvals"
          value={pendingApprovals}
          hint="Visitor entry requests waiting for resident or guard approval."
        />
      </section>
    </div>
  )
}
