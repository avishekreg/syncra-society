import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isNativeShell, NATIVE_LOGIN_PATH, startNativeShellLifecycle } from '../../lib/capacitorShell'

type NativeShellBootstrapProps = {
  children: React.ReactNode
}

/**
 * Native Android shell bootstrap:
 * - Skip public marketing homepage and land on login.
 * - Keep OTA refresh hooks active while the webview is foregrounded.
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
