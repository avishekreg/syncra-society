import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { fetchBillingStatusWithFallback, readLocalBillingStatus } from '../api/payments'
import { isDemoAuthActive, isDemoSocietyId } from '../config/devSeed'
import { isGlobalSuperAdmin } from '../lib/roles'
import { onboardingPathForStatus, type ActivationStatus } from '../lib/pricing'
import { ui } from '../lib/ui'

/**
 * Gates RWA routes until activation fee + recurring subscription are complete.
 * Demo societies and demo auth sessions bypass this gate entirely.
 */
export default function SubscriptionActivationGuard({ children }: { children: React.ReactNode }) {
  const { user, currentSocietyId } = useAuth()
  const [status, setStatus] = useState<ActivationStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const demoBypass = isGlobalSuperAdmin(user) || isDemoAuthActive() || isDemoSocietyId(currentSocietyId)

  useEffect(() => {
    if (!currentSocietyId || demoBypass) {
      setLoading(false)
      return
    }

    void (async () => {
      try {
        const billing = await fetchBillingStatusWithFallback(currentSocietyId)
        setStatus(billing.activationStatus)
      } catch {
        const local = readLocalBillingStatus(currentSocietyId)
        setStatus(local?.activationStatus ?? 'pending')
      } finally {
        setLoading(false)
      }
    })()
  }, [currentSocietyId, demoBypass])

  if (demoBypass) {
    return <>{children}</>
  }

  if (!currentSocietyId) {
    return <Navigate to="/onboarding" replace />
  }

  if (loading) {
    return (
      <div className={`${ui.page} flex min-h-screen items-center justify-center p-8 text-slate-500`}>
        Verifying Syncra billing status…
      </div>
    )
  }

  if (status && status !== 'active_subscription') {
    return <Navigate to={onboardingPathForStatus(status)} replace />
  }

  return <>{children}</>
}
