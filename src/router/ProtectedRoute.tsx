import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import supabase from '../api/supabaseSdk'
import { canAccessPortal } from '../lib/emailVerification'
import { isSuperAdminEmail } from '../config/devSeed'
import { hasSuperAdminSession } from '../lib/authSession'
import { ui } from '../lib/ui'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth()
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    if (initializing || !user) {
      setVerified(null)
      return
    }

    if (user.id.startsWith('demo-') || isSuperAdminEmail(user.email) || hasSuperAdminSession()) {
      setVerified(true)
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user
      if (!sessionUser) {
        setVerified(true)
        return
      }
      setVerified(canAccessPortal(sessionUser))
    })
  }, [user?.id, user?.email, initializing])

  if (initializing) {
    return <div className={ui.loading}>Restoring your Syncra session…</div>
  }

  if (!user) return <Navigate to="/auth" replace />

  if (verified === false) {
    return <Navigate to={`/auth/verify-email?email=${encodeURIComponent(user.email)}`} replace />
  }

  return <>{children}</>
}
