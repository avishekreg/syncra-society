import React from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import DashboardRouteLayout from '../layouts/DashboardRouteLayout'
import ResidentRouteLayout from '../layouts/ResidentRouteLayout'
import ResidentDashboard from '../pages/resident/Dashboard'
import ResidentHelpdesk from '../pages/resident/Helpdesk'
import ResidentVisitorLogs from '../components/ResidentVisitorLogs'
import ResidentSetup from '../pages/resident/Setup'
import ResidentActivityPage from '../pages/resident/Activity'
import ResidentSurveysPage from '../pages/resident/Surveys'
import ResidentGalleryPage from '../pages/resident/Gallery'
import ResidentElectionsPage from '../pages/resident/Elections'
import ResidentElectionResultsPage from '../pages/resident/ElectionResults'
import ResidentRewardsPage from '../pages/resident/RewardsRecognition'
import ResidentRulesGuidebookPage from '../pages/resident/RulesGuidebookPage'
import ResidentGatekeeperPage from '../pages/resident/GatekeeperPage'
import ResidentMyFlatPage from '../pages/resident/MyFlatPage'
import ResidentCarpoolPage from '../pages/resident/CarpoolPage'
import ResidentAmenitiesPage from '../pages/resident/AmenitiesPage'
import ResidentKidSafetyPage from '../pages/resident/KidSafetyPage'
import ResidentSosPage from '../pages/resident/SosPage'
import ResidentIntelligencePage from '../pages/resident/IntelligencePage'
import ResidentFindAssetPage from '../pages/resident/FindAssetPage'
import ResidentPairedAssetsPage from '../pages/resident/PairedAssetsPage'
import ResidentParkingMarketplacePage from '../pages/resident/ParkingMarketplacePage'
import ResidentGreenSocietyPage from '../pages/resident/GreenSocietyPage'
import ResidentMaiSpacePage from '../pages/resident/MaiSpacePage'
import ResidentRentOutPage from '../pages/resident/RentOutPage'
import ResidentRentalsMarketplacePage from '../pages/resident/RentalsMarketplacePage'
import NoticesList from '../components/NoticesList'
import FeatureGuard from '../components/features/FeatureGuard'
import SmartParkingPage from '../pages/modules/SmartParkingPage'
import VendorSlaPage from '../pages/modules/VendorSlaPage'
import AiRwaAuditPage from '../pages/modules/AiRwaAuditPage'
import ResidentMarketplacePage from '../pages/modules/ResidentMarketplacePage'
import { useAuth } from '../providers/AuthProvider'
import { ui } from '../lib/ui'

function VisitorLogsPage() {
  const { currentSocietyId, user } = useAuth()
  return <ResidentVisitorLogs societyId={currentSocietyId} flatNumber={user?.flatNumber} />
}

function NoticesPage() {
  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Notice board</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Society announcements</h2>
      </section>
      <section className={ui.card}>
        <NoticesList />
      </section>
    </div>
  )
}

export default function ResidentRouter() {
  return (
    <Routes>
      <Route path="setup" element={<DashboardRouteLayout title="Complete Registration" />}>
        <Route index element={<ResidentSetup />} />
      </Route>
      <Route element={<ResidentRouteLayout />}>
        <Route index element={<ResidentDashboard />} />
        <Route path="helpdesk" element={<ResidentHelpdesk />} />
        <Route path="visitor-logs" element={<VisitorLogsPage />} />
        <Route path="gatekeeper" element={<ResidentGatekeeperPage />} />
        <Route path="my-flat" element={<ResidentMyFlatPage />} />
        <Route path="my-flat/rent-out" element={<ResidentRentOutPage />} />
        <Route path="rentals-marketplace" element={<ResidentRentalsMarketplacePage />} />
        <Route path="carpool" element={<ResidentCarpoolPage />} />
        <Route path="amenities" element={<ResidentAmenitiesPage />} />
        <Route path="kid-safety" element={<ResidentKidSafetyPage />} />
        <Route path="sos" element={<ResidentSosPage />} />
        <Route path="intelligence" element={<ResidentIntelligencePage />} />
        <Route path="find-asset" element={<ResidentFindAssetPage />} />
        <Route path="paired-assets" element={<ResidentPairedAssetsPage />} />
        <Route
          path="parking-marketplace"
          element={
            <FeatureGuard module="smart_parking">
              <ResidentParkingMarketplacePage />
            </FeatureGuard>
          }
        />
        <Route path="green-society" element={<ResidentGreenSocietyPage />} />
        <Route path="mai-space" element={<ResidentMaiSpacePage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="rules-guidebook" element={<ResidentRulesGuidebookPage />} />
        <Route path="activity" element={<ResidentActivityPage />} />
        <Route path="surveys" element={<ResidentSurveysPage />} />
        <Route path="gallery" element={<ResidentGalleryPage />} />
        <Route
          path="elections"
          element={
            <FeatureGuard module="election_module">
              <ResidentElectionsPage />
            </FeatureGuard>
          }
        />
        <Route
          path="elections/:electionId/results"
          element={
            <FeatureGuard module="election_module">
              <ResidentElectionResultsPage />
            </FeatureGuard>
          }
        />
        <Route
          path="smart-parking"
          element={
            <FeatureGuard module="smart_parking">
              <SmartParkingPage />
            </FeatureGuard>
          }
        />
        <Route
          path="vendor-sla"
          element={
            <FeatureGuard module="vendor_sla">
              <VendorSlaPage />
            </FeatureGuard>
          }
        />
        <Route
          path="society-health"
          element={
            <FeatureGuard module="ai_rwa_audit">
              <AiRwaAuditPage />
            </FeatureGuard>
          }
        />
        <Route
          path="marketplace"
          element={
            <FeatureGuard module="resident_marketplace">
              <ResidentMarketplacePage />
            </FeatureGuard>
          }
        />
        <Route path="rewards" element={<ResidentRewardsPage />} />
        <Route path="*" element={<Navigate to="/resident" replace />} />
      </Route>
    </Routes>
  )
}
