import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SuperAdminRouteLayout from '../layouts/SuperAdminRouteLayout'
import SuperAdminDashboard from '../pages/super-admin/Dashboard'
import SuperAdminSocieties from '../pages/super-admin/Societies'
import SuperAdminAccessManagement from '../pages/super-admin/AccessManagement'
import SuperAdminAuditLogs from '../pages/super-admin/AuditLogs'
import SuperAdminMasterConfig from '../pages/super-admin/MasterConfig'
import { SUPER_ADMIN_HOME } from '../lib/superAdminNav'

export default function SuperAdminRouter() {
  return (
    <Routes>
      <Route element={<SuperAdminRouteLayout />}>
        <Route index element={<Navigate to={SUPER_ADMIN_HOME} replace />} />
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="societies" element={<SuperAdminSocieties />} />
        <Route path="access" element={<SuperAdminAccessManagement />} />
        <Route path="audit-logs" element={<SuperAdminAuditLogs />} />
        <Route path="settings" element={<SuperAdminMasterConfig />} />
        <Route path="master-config" element={<Navigate to="/super-admin/settings" replace />} />
        <Route path="pricing" element={<Navigate to="/super-admin/settings" replace />} />
        <Route path="payments" element={<Navigate to="/super-admin/settings" replace />} />
        <Route path="subscriptions" element={<Navigate to="/super-admin/settings" replace />} />
        <Route path="*" element={<Navigate to={SUPER_ADMIN_HOME} replace />} />
      </Route>
    </Routes>
  )
}
