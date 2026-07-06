import React from 'react'
import { Navigate } from 'react-router-dom'
import ComplaintsDashboard from '../../components/helpdesk/ComplaintsDashboard'
import { useAuth } from '../../providers/AuthProvider'
import { usePlatformConfig } from '../../providers/PlatformConfigProvider'
import { useResolvedSocietyUuid } from '../../hooks/useResolvedSocietyUuid'
import { isGlobalSuperAdmin } from '../../lib/roles'
import { ui } from '../../lib/ui'

export default function AdminHelpdeskDashboard() {
  const { user, currentSocietyId } = useAuth()
  const { isModuleEnabled } = usePlatformConfig()
  const { uuid, loading: resolvingUuid } = useResolvedSocietyUuid()

  if (!user) {
    return <div className={ui.loading}>Loading Syncra Workspace Safely...</div>
  }

  if (isGlobalSuperAdmin(user)) {
    return <Navigate to="/super-admin" replace />
  }

  if (!isModuleEnabled('helpdesk', currentSocietyId)) {
    return (
      <div className={ui.card}>
        <p className={ui.eyebrow}>Smart Helpdesk</p>
        <h2 className={`mt-3 ${ui.heading}`}>Module unavailable</h2>
        <p className={`mt-3 ${ui.body}`}>
          Enable Smart Helpdesk for this society in platform settings to view the live complaints dashboard.
        </p>
      </div>
    )
  }

  if (resolvingUuid) {
    return (
      <div className={ui.card} aria-busy="true">
        <p className={ui.body}>Resolving society context…</p>
      </div>
    )
  }

  if (!uuid) {
    return (
      <div className={ui.card}>
        <p className={ui.body}>
          Unable to resolve a PostgreSQL society UUID for realtime filtering. Complete society onboarding or check
          Society Configuration.
        </p>
      </div>
    )
  }

  return <ComplaintsDashboard societyId={uuid} alternateSocietyIds={currentSocietyId ? [currentSocietyId] : []} />
}
