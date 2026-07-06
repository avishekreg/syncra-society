import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

const ALLOWED_WITHOUT_RESET = ['/auth/change-password', '/auth/login', '/auth/signin', '/auth/signup', '/auth/verify-email']

/** Blocks dashboard access until a temp-password user sets a new password. */
export default function PasswordChangeGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  if (!ready) return null

  if (user?.requiresPasswordChange && !ALLOWED_WITHOUT_RESET.some((path) => location.pathname.startsWith(path))) {
    return <Navigate to="/auth/change-password" replace state={{ from: location.pathname }} />
  }

  return children
}
