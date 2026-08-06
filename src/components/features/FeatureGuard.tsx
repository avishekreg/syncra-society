import React from 'react'
import { Link } from 'react-router-dom'
import { useFeatureFlag } from '../../providers/FeatureFlagsProvider'
import { FEATURE_MODULE_CATALOG, type FeatureModuleName } from '../../lib/featureModules'
import { isDraftAdminOnlyModule } from '../../config/moduleRegistry'
import { isGlobalSuperAdmin } from '../../lib/roles'
import { useAuth } from '../../providers/AuthProvider'
import { ui } from '../../lib/ui'

type FeatureGuardProps = {
  module: FeatureModuleName
  children: React.ReactNode
  /** Optional custom blocked UI */
  fallback?: React.ReactNode
}

export function FeatureUnavailableCard({ module }: { module: FeatureModuleName }) {
  const meta = FEATURE_MODULE_CATALOG.find((item) => item.key === module)
  const draft = isDraftAdminOnlyModule(module)

  return (
    <section className={`${ui.card} mx-auto max-w-xl text-center`}>
      <p className={ui.eyebrow}>{draft ? 'Draft module' : 'Subscription module'}</p>
      <h2 className={`mt-2 ${ui.headingLg}`}>
        {draft ? 'Not available for societies yet' : 'Feature not enabled'}
      </h2>
      <p className={`mt-3 ${ui.body}`}>
        {draft
          ? `${meta?.label ?? module} is in Super Admin draft mode and is hidden from residents and RWA boards.`
          : `${meta?.label ?? module} is not active for your society. Contact your Super Admin to enable this module on your subscription.`}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to="/resident" className={ui.btnGhost}>
          Back to dashboard
        </Link>
        <a href="mailto:hello@syncrasystems.com" className={ui.btnPrimary}>
          Contact Super Admin
        </a>
        <Link to="/admin/configuration" className={ui.btnGhost}>
          Plan manager
        </Link>
      </div>
    </section>
  )
}

/**
 * Route/UI gate — blocks draft_admin_only modules for everyone except global Super Admin,
 * then requires the society feature toggle to be enabled.
 */
export default function FeatureGuard({ module, children, fallback }: FeatureGuardProps) {
  const { user } = useAuth()
  const enabled = useFeatureFlag(module)
  const draft = isDraftAdminOnlyModule(module)
  const superAdmin = isGlobalSuperAdmin(user)

  if (draft && !superAdmin) {
    return <>{fallback ?? <FeatureUnavailableCard module={module} />}</>
  }

  if (enabled) return <>{children}</>
  return <>{fallback ?? <FeatureUnavailableCard module={module} />}</>
}
