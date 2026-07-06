import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { isGlobalSuperAdmin } from '../lib/roles'
import { resolvePostLoginPath } from '../config/devSeed'
import { SUPER_ADMIN_HOME } from '../lib/superAdminNav'
import { ui } from '../lib/ui'

/** Strict platform-scope guard — only global super admins may proceed. */
export default function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const { user, initializing, currentSocietyId } = useAuth()

  if (initializing) {
    return <div className={ui.loading}>Verifying platform administrator access…</div>
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (!isGlobalSuperAdmin(user)) {
    const role = user.user_metadata?.role ?? user.role
    const home = resolvePostLoginPath(user.email ?? '', user.roles ?? [], currentSocietyId, role)
    return <Navigate to={home} replace />
  }

  return <>{children}</>
}

/** Redirect super admins away from society/resident routes. */
export function redirectSuperAdminToPlatform(user: ReturnType<typeof useAuth>['user']) {
  if (user && isGlobalSuperAdmin(user)) {
    return <Navigate to={SUPER_ADMIN_HOME} replace />
  }
  return null
}
