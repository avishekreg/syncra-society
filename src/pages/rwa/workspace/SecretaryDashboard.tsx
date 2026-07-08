import React, { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../providers/AuthProvider'
import { isGlobalSuperAdmin } from '../../../lib/roles'
import { canAccessResidentPortal } from '../../../lib/workspaceAccess'
import StaffViewSwitcher, { type StaffViewMode } from '../../../components/staff/StaffViewSwitcher'
import AdminHelpdeskDashboard from '../../admin/HelpdeskDashboard'
import ResidentDashboard from '../../resident/Dashboard'
import { ui } from '../../../lib/ui'

const VIEW_KEY = 'syncra-staff-view-mode'

function readStoredView(): StaffViewMode {
  if (typeof window === 'undefined') return 'staff'
  return localStorage.getItem(VIEW_KEY) === 'resident' ? 'resident' : 'staff'
}

export default function SecretaryDashboard() {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<StaffViewMode>(readStoredView)
  const flatNumber = user?.flatNumber ?? null
  const hasResidentProfile = canAccessResidentPortal(user)

  const profileHint = useMemo(() => {
    if (!flatNumber) return 'Link your flat in Profile & Settings to unlock My Flat View.'
    return `Viewing as resident of Flat ${flatNumber}.`
  }, [flatNumber])

  function handleViewChange(mode: StaffViewMode) {
    setViewMode(mode)
    localStorage.setItem(VIEW_KEY, mode)
  }

  if (!user) {
    return <div className={ui.loading}>Loading Syncra Workspace Safely...</div>
  }

  if (isGlobalSuperAdmin(user)) {
    return <Navigate to="/super-admin/dashboard" replace />
  }

  return (
    <div className={ui.sectionGap}>
      <header>
        <p className={ui.eyebrow}>Secretary workspace</p>
        <h1 className={`mt-2 ${ui.headingLg}`}>Operations & resident access</h1>
        <p className={`mt-2 max-w-2xl ${ui.body}`}>
          Every staff member is a resident first. Switch to My Flat View to review your unit dues, notices, and
          personal metrics without leaving the secretary console.
        </p>
      </header>

      {hasResidentProfile ? (
        <StaffViewSwitcher
          mode={viewMode}
          onChange={handleViewChange}
          staffLabel="Staff View"
          residentLabel="My Flat View"
          flatNumber={flatNumber}
        />
      ) : (
        <p className={`${ui.innerItem} text-sm text-amber-700`}>{profileHint}</p>
      )}

      {viewMode === 'resident' && hasResidentProfile ? (
        <ResidentDashboard />
      ) : (
        <AdminHelpdeskDashboard />
      )}
    </div>
  )
}
