import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { resolveWorkspaceRole } from '../lib/workspaceAccess'

export default function WorkspaceIndexRedirect() {
  const { user } = useAuth()
  const role = resolveWorkspaceRole(user)
  if (role === 'secretary') {
    return <Navigate to="/rwa/workspace/complaints" replace />
  }
  return <Navigate to="/rwa/workspace/cashflow" replace />
}
