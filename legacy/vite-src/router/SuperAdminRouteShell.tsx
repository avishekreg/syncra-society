import React from 'react'
import { Outlet } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import RoleScopeGuard from './RoleScopeGuard'
import DashboardRouteLayout from '../layouts/DashboardRouteLayout'

/** Layout shell for all /super-admin/* pages — sidebar persists via DashboardRouteLayout. */
export default function SuperAdminRouteShell() {
  return (
    <ProtectedRoute>
      <RoleScopeGuard scope="platform">
        <DashboardRouteLayout title="Syncra Super Admin" />
      </RoleScopeGuard>
    </ProtectedRoute>
  )
}
