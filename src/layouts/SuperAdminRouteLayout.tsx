import { Outlet, useLocation } from 'react-router-dom'
import SuperAdminLayout from './SuperAdminLayout'
import { resolveSuperAdminTitle, SUPER_ADMIN_HOME } from '../lib/superAdminNav'

/** Super Admin shell — isolated sidebar, single page title, nested outlet. */
export default function SuperAdminRouteLayout() {
  const location = useLocation()
  const isCommandCenter = location.pathname === SUPER_ADMIN_HOME
  const title = isCommandCenter ? undefined : resolveSuperAdminTitle(location.pathname)

  return (
    <SuperAdminLayout title={title}>
      <Outlet />
    </SuperAdminLayout>
  )
}
