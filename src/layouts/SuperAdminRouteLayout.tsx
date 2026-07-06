import { Outlet, useLocation } from 'react-router-dom'
import SuperAdminLayout from './SuperAdminLayout'
import { resolveSuperAdminTitle } from '../lib/superAdminNav'

/** Super Admin shell — isolated sidebar, single page title, nested outlet. */
export default function SuperAdminRouteLayout() {
  const location = useLocation()
  const title = resolveSuperAdminTitle(location.pathname)

  return (
    <SuperAdminLayout title={title}>
      <Outlet />
    </SuperAdminLayout>
  )
}
