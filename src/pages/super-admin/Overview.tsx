import { Navigate } from 'react-router-dom'

/** Super Admin home redirects to the primary societies workspace. */
export default function SuperAdminOverview() {
  return <Navigate to="/super-admin/societies" replace />
}
