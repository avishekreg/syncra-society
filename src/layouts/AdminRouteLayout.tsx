import { Outlet, useLocation } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import AutonomousJobsBootstrap from '../components/mobile/AutonomousJobsBootstrap'

const ADMIN_PAGE_TITLES: Record<string, string | null> = {
  '/admin/dashboard': 'Analytics Overview',
  '/admin/notices': 'Notices Management',
  '/admin/guidebook': 'Rules & Regulations',
  '/admin/helpdesk': 'Complaints Dashboard',
  '/admin/tenants': 'Tenant Verification',
  '/admin/gatekeeper': 'Gatekeeper Audit',
  '/admin/amenities': 'Amenity Management',
  '/admin/emergency-logs': 'Emergency SOS Logs',
  '/admin/audit': 'mAI Auditor',
  '/admin/landscape': 'Landscape & Botanist',
  '/admin/interior-partners': 'Interior Partners',
  '/admin/maintain': 'mAI Maintain Radar',
  '/admin/configuration': null,
  '/admin/society-configuration': null
}

function resolveAdminTitle(pathname: string) {
  const title = ADMIN_PAGE_TITLES[pathname]
  if (title === null) return undefined
  return title ?? 'President Console'
}

export default function AdminRouteLayout() {
  const location = useLocation()
  const title = resolveAdminTitle(location.pathname)

  return (
    <DashboardLayout title={title}>
      <AutonomousJobsBootstrap />
      <Outlet />
    </DashboardLayout>
  )
}
