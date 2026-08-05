import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminRouteLayout from '../layouts/AdminRouteLayout'
import AdminDashboard from '../pages/admin/Dashboard'
import AdminNotices from '../pages/admin/Notices'
import AdminHelpdeskRoute from './AdminHelpdeskRoute'
import RulesGuidebookPage from '../pages/admin/RulesGuidebookPage'
import SocietyConfiguration from '../pages/admin/SocietyConfiguration'
import AdminTenantsPage from '../pages/admin/TenantsPage'
import AdminGatekeeperPage from '../pages/admin/GatekeeperAuditPage'
import AdminAmenitiesPage from '../pages/admin/AmenitiesPage'
import AdminEmergencyLogsPage from '../pages/admin/EmergencyLogsPage'
import AdminAuditPage from '../pages/admin/AuditPage'
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
                <AdminHelpdeskRoute />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="guidebook"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <TierGuard requiredTier="tier2">
                <RulesGuidebookPage />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="tenants"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <TierGuard requiredTier="tier2">
                <AdminTenantsPage />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="gatekeeper"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <TierGuard requiredTier="tier2">
                <AdminGatekeeperPage />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="amenities"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <TierGuard requiredTier="tier2">
                <AdminAmenitiesPage />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="emergency-logs"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <TierGuard requiredTier="tier2">
                <AdminEmergencyLogsPage />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="audit"
          element={
            <RoleGuard allow={['president', 'secretary', 'accountant']}>
              <TierGuard requiredTier="tier2">
                <AdminAuditPage />
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
