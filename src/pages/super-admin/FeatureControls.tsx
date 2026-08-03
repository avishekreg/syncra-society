import React, { useEffect, useMemo, useState } from 'react'
import {
  listFeatureToggles,
  setFeatureToggle,
  subscribeFeatureToggles,
  type FeatureToggleRow
} from '../../api/featureToggles'
import { listSocieties } from '../../api/societies'
import Switch from '../../components/ui/Switch'
import { FEATURE_MODULE_CATALOG, type FeatureModuleName } from '../../lib/featureModules'
import type { Society } from '../../types/db'
import { ui } from '../../lib/ui'

export default function SuperAdminFeatureControlsPage() {
  const [societies, setSocieties] = useState<Society[]>([])
  const [societyId, setSocietyId] = useState('')
  const [toggles, setToggles] = useState<FeatureToggleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingModule, setSavingModule] = useState<FeatureModuleName | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const rows = await listSocieties({ includeSeedFallback: true })
        if (!active) return
        setSocieties(rows)
        if (rows[0]?.id) setSocietyId(rows[0].id)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load societies')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!societyId) {
      setToggles([])
      return
    }

    let active = true
    void listFeatureToggles(societyId)
      .then((rows) => {
        if (active) setToggles(rows)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load feature toggles')
      })

    const unsubscribe = subscribeFeatureToggles(societyId, (rows) => {
      if (active) setToggles(rows)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [societyId])

  const enabledCount = useMemo(() => toggles.filter((row) => row.isEnabled).length, [toggles])

  async function handleToggle(moduleName: FeatureModuleName, next: boolean) {
    if (!societyId) return
    setSavingModule(moduleName)
    setError(null)
    try {
      const updated = await setFeatureToggle(societyId, moduleName, next)
      setToggles((prev) => {
        const others = prev.filter((row) => row.moduleName !== moduleName)
        return [...others, updated].sort((a, b) => a.moduleName.localeCompare(b.moduleName))
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update module')
    } finally {
      setSavingModule(null)
    }
  }

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>Subscription control</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Feature controls</h2>
        <p className={`mt-2 max-w-3xl ${ui.body}`}>
          Enable or disable premium modules per society. Changes sync instantly to resident and RWA
          clients over Supabase Realtime — no page reload required.
        </p>
      </section>

      <section className={ui.card}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full max-w-md space-y-2">
            <label className={ui.label} htmlFor="feature-society">
              Society
            </label>
            <select
              id="feature-society"
              className={ui.input}
              value={societyId}
              disabled={loading || societies.length === 0}
              onChange={(event) => setSocietyId(event.target.value)}
            >
              {societies.length === 0 ? <option value="">No societies found</option> : null}
              {societies.map((society) => (
                <option key={society.id} value={society.id}>
                  {society.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-slate-500">
            {enabledCount}/{FEATURE_MODULE_CATALOG.length} modules enabled
          </p>
        </div>

        {error ? <p className="mt-4 text-sm text-syncra-action-alt">{error}</p> : null}

        <div className="mt-6 grid gap-3">
          {FEATURE_MODULE_CATALOG.map((module) => {
            const row = toggles.find((item) => item.moduleName === module.key)
            const checked = Boolean(row?.isEnabled)
            const busy = savingModule === module.key
            return (
              <div
                key={module.key}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-syncra-surface-alt/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-syncra-primary">{module.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{module.description}</p>
                  <p className="mt-1 font-mono text-[11px] text-slate-400">{module.key}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {checked ? 'Enabled' : 'Disabled'}
                  </span>
                  <Switch
                    checked={checked}
                    disabled={!societyId || busy}
                    aria-label={`Toggle ${module.label}`}
                    onCheckedChange={(value) => void handleToggle(module.key, value)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
