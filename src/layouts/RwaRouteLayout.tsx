import { Outlet, useLocation } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'

const RWA_PAGE_TITLES: Record<string, string> = {
  '/rwa/workspace': 'Society Operations',
  '/rwa/workspace/cashflow': 'Cashflow Forecast & Revenue Matrix',
  '/rwa/workspace/complaints': 'Helpdesk & Incident Stream',
  '/rwa/workspace/flats': 'Flat Owner Showcase & Bulk Upload',
  '/rwa/settings': 'RWA Settings',
  '/rwa/gatekeeper': 'Guard Console',
  '/rwa/notices': 'Notices',
  '/rwa/surveys': 'Surveys Management',
  '/rwa/gallery': 'Gallery Management',
  '/rwa/elections': 'Elections Management',
  '/rwa/activity': 'Activity Log',
  '/rwa/whatsapp': 'WhatsApp Automation',
  '/rwa/rewards': 'Rewards & Governance'
}

function resolveRwaTitle(pathname: string) {
  if (RWA_PAGE_TITLES[pathname]) return RWA_PAGE_TITLES[pathname]
  if (pathname.startsWith('/rwa/workspace/')) return 'Society Operations'
  return 'RWA Administration'
}

export default function RwaRouteLayout() {
  const location = useLocation()
  const title = resolveRwaTitle(location.pathname)

  return (
    <DashboardLayout title={title}>
      <Outlet />
    </DashboardLayout>
  )
}
