import React from 'react'
import { Routes, Route } from 'react-router-dom'
import DashboardRouteLayout from '../layouts/DashboardRouteLayout'
import ResidentDashboard from '../pages/resident/Dashboard'
import ResidentHelpdesk from '../pages/resident/Helpdesk'
import ResidentVisitorLogs from '../components/ResidentVisitorLogs'
import ResidentSetup from '../pages/resident/Setup'
import ResidentActivityPage from '../pages/resident/Activity'
import ResidentSurveysPage from '../pages/resident/Surveys'
import ResidentGalleryPage from '../pages/resident/Gallery'
import ResidentElectionsPage from '../pages/resident/Elections'
import ResidentRewardsPage from '../pages/resident/RewardsRecognition'
import NoticesList from '../components/NoticesList'
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
      <Route element={<DashboardRouteLayout title="Resident Dashboard" />}>
        <Route index element={<ResidentDashboard />} />
        <Route path="helpdesk" element={<ResidentHelpdesk />} />
        <Route path="visitor-logs" element={<VisitorLogsPage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="activity" element={<ResidentActivityPage />} />
        <Route path="surveys" element={<ResidentSurveysPage />} />
        <Route path="gallery" element={<ResidentGalleryPage />} />
        <Route path="elections" element={<ResidentElectionsPage />} />
        <Route path="rewards" element={<ResidentRewardsPage />} />
      </Route>
    </Routes>
  )
}
