import { Outlet, useLocation } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'

const ADMIN_PAGE_TITLES: Record<string, string | null> = {
  '/admin/dashboard': 'Analytics Overview',
  '/admin/notices': 'Notices Management',
  '/admin/helpdesk': 'Complaints Dashboard',
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
      <Outlet />
    </DashboardLayout>
  )
}
