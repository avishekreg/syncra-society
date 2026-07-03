import { Outlet } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'

/** Persistent dashboard shell for nested router outlets — keeps Sidebar mounted across navigations. */
export default function DashboardRouteLayout({ title }: { title?: string }) {
  return (
    <DashboardLayout title={title}>
      <Outlet />
    </DashboardLayout>
  )
}
