import { Outlet, useLocation } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'

const ADMIN_PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Analytics Overview',
  '/admin/notices': 'Notices Management',
  '/admin/helpdesk': 'Complaints Dashboard',
  '/admin/configuration': 'Society Configuration'
}

function resolveAdminTitle(pathname: string) {
  return ADMIN_PAGE_TITLES[pathname] ?? 'President Console'
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
