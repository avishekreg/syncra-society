import React, { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../providers/AuthProvider'
import { isGlobalSuperAdmin } from '../../../lib/roles'
import { canAccessResidentPortal } from '../../../lib/workspaceAccess'
import StaffViewSwitcher, { type StaffViewMode } from '../../../components/staff/StaffViewSwitcher'
import FinanceLedgerPage from '../../finance/LedgerPage'
import ResidentDashboard from '../../resident/Dashboard'
import PendingVerificationsPanel from '../../../components/finance/PendingVerificationsPanel'
import PendingExpenseApprovalsPanel from '../../../components/finance/PendingExpenseApprovalsPanel'
import { ui } from '../../../lib/ui'

const VIEW_KEY = 'syncra-staff-view-mode'

function readStoredView(): StaffViewMode {
  if (typeof window === 'undefined') return 'staff'
  return localStorage.getItem(VIEW_KEY) === 'resident' ? 'resident' : 'staff'
}

export default function AccountantDashboard() {
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
        <p className={ui.eyebrow}>Accountant / Treasurer workspace</p>
        <h1 className={`mt-2 ${ui.headingLg}`}>Treasury control & personal flat access</h1>
        <p className={`mt-2 max-w-2xl ${ui.body}`}>
          Reconcile offline payments, approve incidental expenses, and switch to My Flat View to monitor your own unit
          profile and pending dues.
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
        <div className="space-y-6">
          <PendingVerificationsPanel />
          <PendingExpenseApprovalsPanel />
          <FinanceLedgerPage />
        </div>
      )}
    </div>
  )
}
