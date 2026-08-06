import React from 'react'
import { Link } from 'react-router-dom'
import { useFeatureFlags } from '../../providers/FeatureFlagsProvider'
import {
  FEATURE_MODULE_CATALOG,
  type FeatureModuleName
} from '../../lib/featureModules'
import { isPublicFacingModule } from '../../config/moduleRegistry'
import { ui } from '../../lib/ui'

const DASHBOARD_MODULES: FeatureModuleName[] = [
  'mai_maintain',
  'smart_parking',
  'mai_auditor',
  'ai_rwa_audit',
  'whatsapp_automation'
]

type SocietyFeatureCardsProps = {
  audience: 'resident' | 'rwa'
  /** Show locked cards for disabled premium modules */
  showLocked?: boolean
}

function resolveHref(module: FeatureModuleName, audience: 'resident' | 'rwa') {
  const meta = FEATURE_MODULE_CATALOG.find((item) => item.key === module)!
  if (audience === 'resident') {
    return meta.routeHints.find((path) => path.startsWith('/resident')) ?? meta.routeHints[0]
  }
  return (
    meta.routeHints.find((path) => path.startsWith('/rwa') || path.startsWith('/admin')) ??
    meta.routeHints[0]
  )
}

export default function SocietyFeatureCards({
  audience,
  showLocked = true
}: SocietyFeatureCardsProps) {
  const { societyId, isEnabled, loading } = useFeatureFlags()

  if (!societyId) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Select or join a society to view licensed modules.</p>
      </section>
    )
  }

  const cards = DASHBOARD_MODULES.filter((key) => isPublicFacingModule(key))
    .map((key) => {
      const meta = FEATURE_MODULE_CATALOG.find((item) => item.key === key)!
      const enabled = isEnabled(key)
      return { meta, enabled, href: resolveHref(key, audience) }
    })
    .filter((card) => card.enabled || showLocked)

  if (loading && cards.every((card) => !card.enabled)) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Loading society licenses…</p>
      </section>
    )
  }

  return (
    <section className={ui.card}>
      <header className="mb-4">
        <p className={ui.eyebrow}>Society add-ons</p>
        <h2 className={`mt-1 ${ui.heading}`}>Licensed modules</h2>
        <p className={`mt-1 text-xs text-slate-500`}>Bound to society {societyId.slice(0, 8)}…</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ meta, enabled, href }) =>
          enabled ? (
            <Link
              key={meta.key}
              to={href}
              className={`${ui.innerItem} block transition hover:border-syncra-accent/40`}
            >
              <p className="text-sm font-semibold text-syncra-primary">
                {meta.dashboardCta ?? meta.label}
              </p>
              <p className="mt-1 text-xs text-slate-600">{meta.description}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Active
              </p>
            </Link>
          ) : (
            <div
              key={meta.key}
              className={`${ui.innerItem} border-dashed opacity-80`}
            >
              <p className="text-sm font-semibold text-slate-700">
                {meta.dashboardCta ?? meta.label}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Add-on available — contact admin to unlock for this society.
              </p>
              <Link
                to={audience === 'rwa' ? '/admin/configuration' : '/resident'}
                className="mt-3 inline-flex text-xs font-semibold text-syncra-blue hover:underline"
              >
                View plan options
              </Link>
            </div>
          )
        )}
      </div>
    </section>
  )
}
