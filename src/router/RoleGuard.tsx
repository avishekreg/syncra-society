import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import {
  defaultPathForRole,
  resolveWorkspaceRole,
  type WorkspaceRole
} from '../lib/workspaceAccess'
import { ui } from '../lib/ui'

type RoleGuardProps = {
  allow: WorkspaceRole[]
  children: React.ReactNode
  fallback?: string
}

export default function RoleGuard({ allow, children, fallback }: RoleGuardProps) {
  const { user, initializing } = useAuth()

  if (initializing || !user) {
    return <div className={ui.loading}>Verifying workspace permissions…</div>
  }

  const role = resolveWorkspaceRole(user)
  if (!allow.includes(role)) {
    return <Navigate to={fallback ?? defaultPathForRole(role)} replace />
  }

  return <>{children}</>
}
