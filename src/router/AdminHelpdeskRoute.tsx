import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { resolveWorkspaceRole } from '../lib/workspaceAccess'
import AdminHelpdeskDashboard from '../pages/admin/HelpdeskDashboard'

/** Secretary lands on the unified workspace dashboard; president keeps inline helpdesk. */
export default function AdminHelpdeskRoute() {
  const { user } = useAuth()
  const role = resolveWorkspaceRole(user)
  if (role === 'secretary') {
    return <Navigate to="/rwa/workspace/secretary" replace />
  }
  return <AdminHelpdeskDashboard />
}
