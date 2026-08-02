import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isNativeShell, NATIVE_LOGIN_PATH, startNativeShellLifecycle } from '../../lib/capacitorShell'

type NativeShellBootstrapProps = {
  children: React.ReactNode
}

/**
 * Native Android shell bootstrap:
 * - Skip public marketing homepage and land on login.
 * - Silent OTA live updates on launch/resume (build-stamp compare → soft reload).
 * - Auth tokens in localStorage persist across OTA reloads.
 */
export default function NativeShellBootstrap({ children }: NativeShellBootstrapProps) {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isNativeShell()) return
    if (location.pathname !== '/') return
    navigate(NATIVE_LOGIN_PATH, { replace: true })
  }, [location.pathname, navigate])

  useEffect(() => startNativeShellLifecycle(), [])

  return <>{children}</>
}
