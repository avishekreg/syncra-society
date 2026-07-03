import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { resolvePostLoginPath } from '../config/devSeed'
import { isGlobalSuperAdmin } from '../lib/roles'

type RoleScope = 'platform' | 'society' | 'resident'

/**
 * Enforces institutional role separation:
 * - platform: global super admin only
 * - society / resident: society-scoped users; super admins are redirected to /super-admin
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

  if (superAdmin) {
    return <Navigate to="/super-admin" replace />
  }

  return children
}
