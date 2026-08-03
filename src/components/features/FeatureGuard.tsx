import React from 'react'
import { Link } from 'react-router-dom'
import { useFeatureFlag } from '../../providers/FeatureFlagsProvider'
import { FEATURE_MODULE_CATALOG, type FeatureModuleName } from '../../lib/featureModules'
import { ui } from '../../lib/ui'

type FeatureGuardProps = {
  module: FeatureModuleName
  children: React.ReactNode
  /** Optional custom blocked UI */
  fallback?: React.ReactNode
}

export function FeatureUnavailableCard({ module }: { module: FeatureModuleName }) {
  const meta = FEATURE_MODULE_CATALOG.find((item) => item.key === module)

  return (
    <section className={`${ui.card} mx-auto max-w-xl text-center`}>
      <p className={ui.eyebrow}>Subscription module</p>
      <h2 className={`mt-2 ${ui.headingLg}`}>Feature not enabled</h2>
      <p className={`mt-3 ${ui.body}`}>
        {meta?.label ?? module} is not active for your society. Contact your Super Admin to enable this
        module on your subscription.
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

/** Route/UI gate — renders children only when the module toggle is enabled. */
export default function FeatureGuard({ module, children, fallback }: FeatureGuardProps) {
  const enabled = useFeatureFlag(module)

  if (enabled) return <>{children}</>
  return <>{fallback ?? <FeatureUnavailableCard module={module} />}</>
}
