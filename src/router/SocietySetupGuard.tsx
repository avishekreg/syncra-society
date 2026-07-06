import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { isGlobalSuperAdmin } from '../lib/roles'

/** Redirect society admins without a linked society to mandatory onboarding. */
export default function SocietySetupGuard({ children }: { children: React.ReactNode }) {
  const { user, currentSocietyId } = useAuth()
  const location = useLocation()
  const role = user?.user_metadata?.role ?? user?.role ?? 'resident'
  const isSocietyAdmin = user?.roles?.includes('rwa_owner') || role === 'rwa_owner'
  const isResident = role === 'resident' || user?.roles?.includes('resident')
  const isSuperAdmin = isGlobalSuperAdmin(user)

  if (isSuperAdmin) {
    return <Navigate to="/super-admin/dashboard" replace />
  }

  if (isSocietyAdmin && !currentSocietyId) {
    return <Navigate to="/onboarding" replace />
  }

  if (isResident && !currentSocietyId && !location.pathname.startsWith('/resident/setup')) {
    return <Navigate to="/resident/setup" replace />
  }

  return children
}
