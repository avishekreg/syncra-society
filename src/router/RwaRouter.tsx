import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import RwaRouteLayout from '../layouts/RwaRouteLayout'
import RwaDashboard from '../pages/rwa/Dashboard'
import RwaWorkspace from '../pages/rwa/Workspace'
import RwaSettings from '../pages/rwa/Settings'
import GatekeeperGuard from '../pages/gatekeeper/GatekeeperGuard'
import NoticesPage from '../pages/rwa/NoticesPage'
import SurveysManager from '../pages/rwa/SurveysManager'
import GalleryManager from '../pages/rwa/GalleryManager'
import ElectionsManager from '../pages/rwa/ElectionsManager'
import RwaActivityLog from '../pages/rwa/ActivityLog'
import WhatsAppAutomation from '../pages/rwa/WhatsAppAutomation'
import RewardsGovernance from '../pages/rwa/RewardsGovernance'
import WorkspaceCashflowPage from '../pages/rwa/workspace/CashflowPage'
import WorkspaceComplaintsPage from '../pages/rwa/workspace/ComplaintsPage'
import WorkspaceFlatsPage from '../pages/rwa/workspace/FlatsPage'
import TierGuard from './TierGuard'
import RoleGuard from './RoleGuard'
import WorkspaceIndexRedirect from './WorkspaceIndexRedirect'

export default function RwaRouter() {
  return (
    <Routes>
      <Route element={<RwaRouteLayout />}>
        <Route index element={<RwaDashboard />} />
        <Route
          path="workspace"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <WorkspaceIndexRedirect />
            </RoleGuard>
          }
        />
        <Route
          path="workspace/cashflow"
          element={
            <RoleGuard allow={['president']}>
              <TierGuard requiredTier="tier2">
                <WorkspaceCashflowPage />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="workspace/complaints"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <TierGuard requiredTier="tier2">
                <WorkspaceComplaintsPage />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="workspace/flats"
          element={
            <RoleGuard allow={['president']}>
              <TierGuard requiredTier="tier2">
                <WorkspaceFlatsPage />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="workspace/*"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <RwaWorkspace />
            </RoleGuard>
          }
        />
        <Route
          path="settings"
          element={
            <RoleGuard allow={['president']}>
              <TierGuard requiredTier="tier2">
                <RwaSettings />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="gatekeeper"
          element={
            <RoleGuard allow={['president']}>
              <GatekeeperGuard />
            </RoleGuard>
          }
        />
        <Route
          path="notices"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <NoticesPage />
            </RoleGuard>
          }
        />
        <Route
          path="surveys"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <TierGuard requiredTier="tier2">
                <SurveysManager />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="gallery"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <TierGuard requiredTier="tier2">
                <GalleryManager />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="elections"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <TierGuard requiredTier="tier2">
                <ElectionsManager />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="activity"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <TierGuard requiredTier="tier2">
                <RwaActivityLog />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="whatsapp"
          element={
            <RoleGuard allow={['president']}>
              <TierGuard requiredTier="tier2">
                <WhatsAppAutomation />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="rewards"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <TierGuard requiredTier="tier2">
                <RewardsGovernance />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
