import React from 'react'
import ProtectedRoute from './ProtectedRoute'
import SuperAdminGuard from './SuperAdminGuard'
import SuperAdminRouter from './SuperAdminRouter'

/** Isolated platform shell — dedicated sidebar, strict guard, nested outlet routing. */
export default function SuperAdminRouteShell() {
  return (
    <ProtectedRoute>
      <SuperAdminGuard>
        <SuperAdminRouter />
      </SuperAdminGuard>
    </ProtectedRoute>
  )
}
