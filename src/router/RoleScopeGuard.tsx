import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { resolvePostLoginPath } from '../config/devSeed'
import { isGlobalSuperAdmin } from '../lib/roles'
import { defaultPathForRole, resolveWorkspaceRole } from '../lib/workspaceAccess'

type RoleScope = 'platform' | 'society' | 'resident'

/**
 * Enforces institutional role separation:
 * - platform: global super admin only
 * - society: staff roles (president, secretary, accountant); blocks residents
 * - resident: residents, presidents, and super admins
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

  if (scope === 'platform') {
    if (!superAdmin) {
      return <Navigate to={homePath} replace />
    }
    return children
  }

  if (scope === 'society') {
    if (superAdmin) {
      return <Navigate to="/super-admin" replace />
    }
    if (workspaceRole === 'resident') {
      return <Navigate to="/resident" replace />
    }
    return children
  }

  if (scope === 'resident') {
    if (superAdmin) {
      return children
    }
    if (workspaceRole === 'secretary' || workspaceRole === 'accountant') {
      return <Navigate to={defaultPathForRole(workspaceRole)} replace />
    }
    return children
  }

  return children
}
