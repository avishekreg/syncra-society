import React, { useEffect, useState } from 'react'
import { listSocieties } from '../../api/societies'
import { listRegisteredSocieties } from '../../lib/societyRegistry'
import { ui } from '../../lib/ui'

type Metric = {
  label: string
  value: string
  hint: string
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: 'Registered societies', value: '—', hint: 'Active tenants on the platform' },
    { label: 'Total units onboarded', value: '—', hint: 'Aggregate flat count across societies' },
    { label: 'Platform tier mix', value: '—', hint: 'Tier 1 / 2 / 3 distribution' },
    { label: 'System health', value: 'Operational', hint: 'Core services & integrations' }
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    void (async () => {
      setLoading(true)
      try {
        const remote = await listSocieties()
        const local = listRegisteredSocieties()
        const rows = remote?.length
          ? remote
          : local.map((s) => ({
              id: s.id,
              name: s.name,
              total_flats: 0,
              pricing_slab_id: 'tier2'
            }))
        const totalFlats = rows.reduce((sum, row) => sum + (Number(row.total_flats) || 0), 0)
        const tiers = rows.reduce(
          (acc, row) => {
            const tier = (row.pricing_slab_id ?? 'tier2').toLowerCase()
            if (tier === 'tier1') acc.t1 += 1
            else if (tier === 'tier3') acc.t3 += 1
            else acc.t2 += 1
            return acc
          },
          { t1: 0, t2: 0, t3: 0 }
        )

        if (!active) return
        setMetrics([
          { label: 'Registered societies', value: String(rows.length), hint: 'Active tenants on the platform' },
          { label: 'Total units onboarded', value: totalFlats.toLocaleString('en-IN'), hint: 'Aggregate flat count across societies' },
          {
            label: 'Platform tier mix',
            value: `T1 ${tiers.t1} · T2 ${tiers.t2} · T3 ${tiers.t3}`,
            hint: 'Subscription tier distribution'
          },
          { label: 'System health', value: 'Operational', hint: 'Core services & integrations' }
        ])
      } catch {
        if (!active) return
        setMetrics((current) =>
          current.map((item) =>
            item.label === 'System health'
              ? { ...item, value: 'Degraded', hint: 'Some remote metrics unavailable — local registry active' }
              : item
          )
        )
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>Platform overview</p>
        <p className={`mt-2 max-w-2xl ${ui.body}`}>
          Cross-society metrics for onboarding velocity, fleet size, and subscription health — isolated from any single
          RWA workspace.
        </p>
      </section>

      {loading && (
        <div className={ui.card} aria-busy="true">
          <p className={ui.body}>Loading platform metrics…</p>
        </div>
      )}

      <section className={ui.grid3}>
        {metrics.map((metric) => (
          <article key={metric.label} className={ui.cardFill}>
            <p className="text-xs text-slate-500">{metric.label}</p>
            <p className={ui.statValue}>{metric.value}</p>
            <p className={`mt-auto pt-2 text-xs ${ui.body}`}>{metric.hint}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
