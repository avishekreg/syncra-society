import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardRouteLayout from '../layouts/DashboardRouteLayout'
import RwaDashboard from '../pages/rwa/Dashboard'
import RwaSettings from '../pages/rwa/Settings'
import GatekeeperGuard from '../pages/gatekeeper/GatekeeperGuard'
import NoticesPage from '../pages/rwa/NoticesPage'
import SurveysManager from '../pages/rwa/SurveysManager'
import GalleryManager from '../pages/rwa/GalleryManager'
import ElectionsManager from '../pages/rwa/ElectionsManager'
import RwaActivityLog from '../pages/rwa/ActivityLog'
import WhatsAppAutomation from '../pages/rwa/WhatsAppAutomation'
import RewardsGovernance from '../pages/rwa/RewardsGovernance'
import TierGuard from './TierGuard'

export default function RwaRouter() {
  return (
    <Routes>
      <Route element={<DashboardRouteLayout title="RWA Administration" />}>
        <Route index element={<TierGuard requiredTier="tier2"><RwaDashboard /></TierGuard>} />
        <Route path="settings" element={<TierGuard requiredTier="tier2"><RwaSettings /></TierGuard>} />
        <Route path="gatekeeper" element={<GatekeeperGuard />} />
        <Route path="notices" element={<TierGuard requiredTier="tier2"><NoticesPage /></TierGuard>} />
        <Route path="surveys" element={<TierGuard requiredTier="tier2"><SurveysManager /></TierGuard>} />
        <Route path="gallery" element={<TierGuard requiredTier="tier2"><GalleryManager /></TierGuard>} />
        <Route path="elections" element={<TierGuard requiredTier="tier2"><ElectionsManager /></TierGuard>} />
        <Route path="activity" element={<TierGuard requiredTier="tier2"><RwaActivityLog /></TierGuard>} />
        <Route path="whatsapp" element={<TierGuard requiredTier="tier2"><WhatsAppAutomation /></TierGuard>} />
        <Route path="rewards" element={<TierGuard requiredTier="tier2"><RewardsGovernance /></TierGuard>} />
        <Route path="*" element={<Navigate to="/rwa" replace />} />
      </Route>
    </Routes>
  )
}
