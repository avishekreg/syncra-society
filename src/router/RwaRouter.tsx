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
import SecretaryDashboard from '../pages/rwa/workspace/SecretaryDashboard'
import AccountantDashboard from '../pages/rwa/workspace/AccountantDashboard'
import TierGuard from './TierGuard'
import RoleGuard from './RoleGuard'
import WorkspaceIndexRedirect from './WorkspaceIndexRedirect'
import FeatureGuard from '../components/features/FeatureGuard'
import SmartParkingPage from '../pages/modules/SmartParkingPage'
import VendorSlaPage from '../pages/modules/VendorSlaPage'
import AiRwaAuditPage from '../pages/modules/AiRwaAuditPage'

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
          path="workspace/secretary"
          element={
            <RoleGuard allow={['secretary']}>
              <TierGuard requiredTier="tier2">
                <SecretaryDashboard />
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="workspace/accountant"
          element={
            <RoleGuard allow={['accountant']}>
              <TierGuard requiredTier="tier2">
                <AccountantDashboard />
              </TierGuard>
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
                <FeatureGuard module="election_module">
                  <ElectionsManager />
                </FeatureGuard>
              </TierGuard>
            </RoleGuard>
          }
        />
        <Route
          path="smart-parking"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <FeatureGuard module="smart_parking">
                <SmartParkingPage />
              </FeatureGuard>
            </RoleGuard>
          }
        />
        <Route
          path="vendor-sla"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <FeatureGuard module="vendor_sla">
                <VendorSlaPage />
              </FeatureGuard>
            </RoleGuard>
          }
        />
        <Route
          path="ai-rwa-audit"
          element={
            <RoleGuard allow={['president', 'secretary']}>
              <FeatureGuard module="ai_rwa_audit">
                <AiRwaAuditPage />
              </FeatureGuard>
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
