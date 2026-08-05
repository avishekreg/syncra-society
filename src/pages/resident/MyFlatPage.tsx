import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import TenantManagementPanel from '../../components/gatekeeper/TenantManagementPanel'
import { ui } from '../../lib/ui'

export default function ResidentMyFlatPage() {
  const { currentSocietyId, user } = useAuth()
  const societyId = currentSocietyId
  const flatNumber = user?.flatNumber
  const ownerId = user?.id

  if (!societyId || !flatNumber || !ownerId) {
    return (
      <section className={ui.card}>
        <p className={ui.eyebrow}>My flat</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Flat profile unavailable</h2>
        <p className={`mt-2 ${ui.body}`}>Sign in with a mapped flat to manage tenants and lease approvals.</p>
        <Link to="/resident/setup" className={`mt-4 inline-flex ${ui.btnPrimary}`}>
          Complete setup
        </Link>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>My flat</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Flat {flatNumber}</h2>
        <p className={`mt-2 ${ui.body}`}>
          Owner tools for digital lease onboarding, police-ready tenant records, and notification routing.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/resident/gatekeeper" className={ui.btnSecondary}>
            Staff & delivery gatekeeper
          </Link>
          <Link to="/resident/visitor-logs" className={ui.btnGhost}>
            Visitor logs
          </Link>
        </div>
      </section>

      <TenantManagementPanel societyId={societyId} flatNumber={flatNumber} ownerId={ownerId} />
    </div>
  )
}
