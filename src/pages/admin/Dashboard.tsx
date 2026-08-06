import React, { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { isGlobalSuperAdmin } from '../../lib/roles'
import { listComplaintsForSociety } from '../../api/complaints'
import { listVisitorLogs } from '../../api/visitorLogs'
import SocietyFeatureCards from '../../components/features/SocietyFeatureCards'
import { BrochureDownloadTrigger } from '../../components/brochure/BrochureDownloadModal'
import { useFeatureFlags } from '../../providers/FeatureFlagsProvider'
import { ensureDemoInfraIfEmpty, getInfraRadarSummary } from '../../services/maintainService'
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
  const { isEnabled } = useFeatureFlags()
  const [activeTickets, setActiveTickets] = useState(0)
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [maintainRed, setMaintainRed] = useState(0)
  const [maintainNoc, setMaintainNoc] = useState(0)
  const maintainOn = isEnabled('mai_maintain')

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

  useEffect(() => {
    if (!currentSocietyId || !maintainOn) {
      setMaintainRed(0)
      setMaintainNoc(0)
      return
    }
    void (async () => {
      try {
        await ensureDemoInfraIfEmpty(currentSocietyId)
        const summary = await getInfraRadarSummary(currentSocietyId)
        setMaintainRed(summary.redFlags)
        setMaintainNoc(summary.nocPressure)
      } catch {
        setMaintainRed(0)
        setMaintainNoc(0)
      }
    })()
  }, [currentSocietyId, maintainOn])

  if (!user) {
    return <div className={ui.loading}>Loading mAI Society…</div>
  }

  if (isGlobalSuperAdmin(user)) {
    return <Navigate to="/super-admin/dashboard" replace />
  }

  const totalResidents = showcaseData?.units?.length ?? 0

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={ui.eyebrow}>President console</p>
          <h1 className={`mt-2 ${ui.headingLg}`}>Society overview</h1>
          <p className={`mt-2 max-w-2xl ${ui.body}`}>
            High-level operational pulse — open notices, finance, and onboarding from the sidebar sub-menus.
          </p>
        </div>
        <BrochureDownloadTrigger className={ui.btnSecondary} defaultFormat="exec">
          Download brochure / exec deck
        </BrochureDownloadTrigger>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {maintainOn ? (
        <section className={ui.card}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={ui.eyebrow}>mAI Maintain · Infrastructure radar</p>
              <h2 className={`mt-1 ${ui.heading}`}>Statutory safety pressure</h2>
              <p className={`mt-1 ${ui.body}`}>
                {maintainRed} red safety flag{maintainRed === 1 ? '' : 's'} · {maintainNoc} NOC item
                {maintainNoc === 1 ? '' : 's'} due within 45 days (Lift / DG / Fire).
              </p>
            </div>
            <Link to="/admin/maintain" className={ui.btnPrimary}>
              Open Maintain Radar
            </Link>
          </div>
        </section>
      ) : null}

      <SocietyFeatureCards audience="rwa" showLocked />
    </div>
  )
}
