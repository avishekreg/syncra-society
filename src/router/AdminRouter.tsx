import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminRouteLayout from '../layouts/AdminRouteLayout'
import AdminDashboard from '../pages/admin/Dashboard'
import AdminNotices from '../pages/admin/Notices'
import AdminHelpdeskDashboard from '../pages/admin/HelpdeskDashboard'
import SocietyConfiguration from '../pages/admin/SocietyConfiguration'
import TierGuard from './TierGuard'
import RoleGuard from './RoleGuard'

export default function AdminRouter() {
  return (
    <Routes>
      <Route element={<AdminRouteLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <RoleGuard allow={['president']}>
              <TierGuard requiredTier="tier2">
                <AdminDashboard />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="notices"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <TierGuard requiredTier="tier2">
                <AdminNotices />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="helpdesk"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <TierGuard requiredTier="tier2">
                <AdminHelpdeskDashboard />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route path="configuration" element={
            <RoleGuard allow={['president']}>
              <TierGuard requiredTier="tier2">
                <SocietyConfiguration />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route path="society-configuration" element={<Navigate to="/admin/configuration" replace />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
