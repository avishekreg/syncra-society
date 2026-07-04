import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardRouteLayout from '../layouts/DashboardRouteLayout'
import AdminDashboard from '../pages/admin/Dashboard'
import AdminNotices from '../pages/admin/Notices'
import SocietyConfiguration from '../pages/admin/SocietyConfiguration'
import TierGuard from './TierGuard'

export default function AdminRouter() {
  return (
    <Routes>
      <Route element={<DashboardRouteLayout title="President Console" />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<TierGuard requiredTier="tier2"><AdminDashboard /></TierGuard>} />
        <Route path="notices" element={<TierGuard requiredTier="tier2"><AdminNotices /></TierGuard>} />
        <Route path="configuration" element={<TierGuard requiredTier="tier2"><SocietyConfiguration /></TierGuard>} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
