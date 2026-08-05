import { Outlet, useLocation } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import GatekeeperAlert from '../components/GatekeeperAlert'
import { useAuth } from '../providers/AuthProvider'
import { useResolvedSocietyUuid } from '../hooks/useResolvedSocietyUuid'

const RESIDENT_PAGE_TITLES: Record<string, string> = {
  '/resident': 'Resident Dashboard',
  '/resident/helpdesk': 'Smart Helpdesk',
  '/resident/visitor-logs': 'Visitor Logs',
  '/resident/gatekeeper': 'Staff & Delivery Gatekeeper',
  '/resident/my-flat': 'My Flat',
  '/resident/my-flat/rent-out': 'maiList Rent / Sell',
  '/resident/rentals-marketplace': 'Rentals Marketplace',
  '/resident/carpool': 'maiCommute Carpool',
  '/resident/amenities': 'Amenity Booking',
  '/resident/kid-safety': 'Kid Safety',
  '/resident/sos': 'Emergency SOS',
  '/resident/intelligence': 'Society Intelligence',
  '/resident/find-asset': 'mAI Find Asset',
  '/resident/green-society': 'Green Society',
  '/resident/mai-space': 'mAI Space',
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
