import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { ui } from '../lib/ui'

const tierOrder: Record<string, number> = {
  tier1: 1,
  tier2: 2,
  tier3: 3
}

type TierLevel = 'tier1' | 'tier2' | 'tier3'

export default function TierGuard({
  requiredTier,
  children
}: {
  requiredTier: TierLevel
  children: React.ReactElement
}) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (user.roles.includes('super_admin')) {
    return children
  }

  const currentRank = tierOrder[user.tier ?? 'tier1'] ?? 1
  const requiredRank = tierOrder[requiredTier]

  if (currentRank < requiredRank) {
    return (
      <div className={ui.page}>
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <div className={ui.card}>
            <p className={ui.eyebrow}>Access restricted</p>
            <h1 className="mt-4 text-2xl font-semibold text-syncra-primary sm:text-3xl md:text-4xl">Upgrade your society plan</h1>
            <p className={`mt-4 text-lg leading-relaxed ${ui.body}`}>
              This feature requires {requiredTier === 'tier2' ? 'Tier 2' : 'Tier 3'} access. Contact your society administrator or review pricing to upgrade your subscription.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/" className={ui.btnPrimary}>
                View plans
              </Link>
              <Link to="/resident" className={ui.btnSecondary}>
                Return to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return children
}
