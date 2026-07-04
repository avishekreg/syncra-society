import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import supabase from '../api/supabaseSdk'
import { canAccessPortal } from '../lib/emailVerification'
import { isSuperAdminEmail } from '../config/devSeed'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) {
      setVerified(null)
      return
    }

    if (user.id.startsWith('demo-') || isSuperAdminEmail(user.email)) {
      setVerified(true)
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user
      if (!sessionUser) {
        setVerified(false)
        return
      }
      setVerified(canAccessPortal(sessionUser))
    })
  }, [user?.id, user?.email])

  if (!user) return <Navigate to="/auth" replace />

  if (verified === false) {
    return <Navigate to={`/auth/verify-email?email=${encodeURIComponent(user.email)}`} replace />
  }

  return <>{children}</>
}
