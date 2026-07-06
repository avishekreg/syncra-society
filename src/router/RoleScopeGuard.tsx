import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { resolvePostLoginPath } from '../config/devSeed'
import { isGlobalSuperAdmin } from '../lib/roles'
import { defaultPathForRole, resolveWorkspaceRole } from '../lib/workspaceAccess'
import { SUPER_ADMIN_HOME } from '../lib/superAdminNav'

type RoleScope = 'platform' | 'society' | 'resident'

/**
 * Enforces institutional role separation:
 * - platform: global super admin only (handled by SuperAdminGuard)
 * - society: staff roles; blocks residents and super admins
 * - resident: residents and presidents; blocks staff-only roles and super admins
 */
export default function RoleScopeGuard({
  scope,
  children
}: {
  scope: RoleScope
  children: React.ReactNode
}) {
  const { user, currentSocietyId } = useAuth()

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  const workspaceRole = resolveWorkspaceRole(user)
  const superAdmin = isGlobalSuperAdmin(user)
  const role = user.user_metadata?.role ?? user.role
  const homePath = resolvePostLoginPath(
    user.email ?? '',
    user.roles ?? [],
    currentSocietyId,
    role
  )

  if (superAdmin && scope !== 'platform') {
    return <Navigate to={SUPER_ADMIN_HOME} replace />
  }

  if (scope === 'platform') {
    if (!superAdmin) {
      return <Navigate to={homePath} replace />
    }
    return children
  }

  if (scope === 'society') {
    if (workspaceRole === 'resident' || workspaceRole === 'gatekeeper') {
      return <Navigate to={defaultPathForRole(workspaceRole)} replace />
    }
    return children
  }

  if (scope === 'resident') {
    if (workspaceRole === 'secretary' || workspaceRole === 'accountant') {
      return <Navigate to={defaultPathForRole(workspaceRole)} replace />
    }
    return children
  }

  return children
}
