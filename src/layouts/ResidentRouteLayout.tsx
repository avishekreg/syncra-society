import { Outlet, useLocation } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import GatekeeperAlert from '../components/GatekeeperAlert'
import { useAuth } from '../providers/AuthProvider'
import { useResolvedSocietyUuid } from '../hooks/useResolvedSocietyUuid'

const RESIDENT_PAGE_TITLES: Record<string, string> = {
  '/resident': 'Resident Dashboard',
  '/resident/helpdesk': 'Smart Helpdesk',
  '/resident/visitor-logs': 'Visitor Logs',
  '/resident/notices': 'Notices',
  '/resident/activity': 'Activity',
  '/resident/surveys': 'Surveys',
  '/resident/gallery': 'Photo Gallery',
  '/resident/elections': 'Elections',
  '/resident/rewards': 'Rewards & Recognition'
}

function resolveResidentTitle(pathname: string) {
  return RESIDENT_PAGE_TITLES[pathname] ?? 'Resident Dashboard'
}

/** Persistent resident shell — sidebar, page title, and global gatekeeper alerts. */
export default function ResidentRouteLayout() {
  const location = useLocation()
  const { user } = useAuth()
  const { uuid: societyUuid } = useResolvedSocietyUuid()
  const flatNumber = user?.flatNumber
  const title = resolveResidentTitle(location.pathname)

  return (
    <DashboardLayout title={title}>
      {societyUuid && flatNumber ? (
        <GatekeeperAlert societyId={societyUuid} myFlatNo={flatNumber} />
      ) : null}
      <Outlet />
    </DashboardLayout>
  )
}
