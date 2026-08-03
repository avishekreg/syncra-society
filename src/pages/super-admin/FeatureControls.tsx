import React, { useEffect, useMemo, useState } from 'react'
import {
  listFeatureToggles,
  setFeatureToggle,
  subscribeFeatureToggles,
  summarizeSocietyLicenses,
  type FeatureToggleRow
} from '../../api/featureToggles'
import { listSocieties } from '../../api/societies'
import Switch from '../../components/ui/Switch'
import {
  FEATURE_MODULE_CATALOG,
  getFeatureModuleMeta,
  type FeatureModuleName
} from '../../lib/featureModules'
import type { Society } from '../../types/db'
import { ui } from '../../lib/ui'

export default function SuperAdminFeatureControlsPage() {
  const [societies, setSocieties] = useState<Society[]>([])
  const [societyId, setSocietyId] = useState('')
  const [toggles, setToggles] = useState<FeatureToggleRow[]>([])
  const [loadingSocieties, setLoadingSocieties] = useState(true)
  const [loadingMatrix, setLoadingMatrix] = useState(false)
  const [savingModule, setSavingModule] = useState<FeatureModuleName | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const rows = await listSocieties({ includeSeedFallback: true })
        if (!active) return
        setSocieties(rows)
        // Do not auto-select — Super Admin must choose a society first.
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load societies')
      } finally {
        if (active) setLoadingSocieties(false)
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
    setLoadingMatrix(true)
    setError(null)

    void listFeatureToggles(societyId)
      .then((rows) => {
        if (!active) return
        setToggles(rows.filter((row) => row.societyId === societyId))
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load feature toggles')
      })
      .finally(() => {
        if (active) setLoadingMatrix(false)
      })

    const unsubscribe = subscribeFeatureToggles(societyId, (rows) => {
      if (active) setToggles(rows.filter((row) => row.societyId === societyId))
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [societyId])

  const summary = useMemo(() => summarizeSocietyLicenses(toggles), [toggles])
  const selectedSociety = societies.find((society) => society.id === societyId) ?? null

  async function handleToggle(moduleName: FeatureModuleName, next: boolean) {
    if (!societyId) return
    setSavingModule(moduleName)
    setError(null)
    try {
      const updated = await setFeatureToggle(societyId, moduleName, next)
      if (updated.societyId !== societyId) {
        throw new Error('Update rejected: society mismatch')
      }
      setToggles((prev) => {
        const others = prev.filter(
          (row) => !(row.societyId === societyId && row.moduleName === moduleName)
        )
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
        <p className={ui.eyebrow}>Per-society licensing</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Feature controls</h2>
        <p className={`mt-2 max-w-3xl ${ui.body}`}>
          Select a society first. Toggles read and write only that society&apos;s{' '}
          <code className="text-xs">feature_toggles</code> rows — never a global matrix.
        </p>
      </section>

      <section className={ui.card}>
        <div className="w-full max-w-md space-y-2">
          <label className={ui.label} htmlFor="feature-society">
            Society <span className="text-syncra-action-alt">*</span>
          </label>
          <select
            id="feature-society"
            className={ui.input}
            value={societyId}
            disabled={loadingSocieties || societies.length === 0}
            onChange={(event) => setSocietyId(event.target.value)}
          >
            <option value="">Select a society to manage…</option>
            {societies.map((society) => (
              <option key={society.id} value={society.id}>
                {society.name}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="mt-4 text-sm text-syncra-action-alt">{error}</p> : null}

        {!societyId ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-syncra-surface-alt px-4 py-10 text-center">
            <p className="text-sm font-semibold text-syncra-primary">No society selected</p>
            <p className={`mx-auto mt-2 max-w-md ${ui.body}`}>
              Choose a society from the dropdown to load its active add-on matrix.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {selectedSociety?.name ?? 'Society'} · {summary.enabledCount}/
                {FEATURE_MODULE_CATALOG.length} active
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                Purchased: {summary.purchased.length
                  ? summary.purchased.map((key) => getFeatureModuleMeta(key).label).join(', ')
                  : 'none'}
              </span>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                Super Admin: {summary.superAdmin.length
                  ? summary.superAdmin.map((key) => getFeatureModuleMeta(key).label).join(', ')
                  : 'none'}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Base plan: {summary.base.length
                  ? summary.base.map((key) => getFeatureModuleMeta(key).label).join(', ')
                  : 'none'}
              </span>
            </div>

            {loadingMatrix ? (
              <p className={`mt-6 ${ui.body}`}>Loading feature matrix for this society…</p>
            ) : (
              <div className="mt-6 grid gap-3">
                {FEATURE_MODULE_CATALOG.map((module) => {
                  const row = toggles.find(
                    (item) => item.societyId === societyId && item.moduleName === module.key
                  )
                  const checked = Boolean(row?.isEnabled)
                  const busy = savingModule === module.key
                  return (
                    <div
                      key={module.key}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-syncra-surface-alt/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-syncra-primary">{module.label}</p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              module.tier === 'premium'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {module.tier}
                          </span>
                          {row?.source ? (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              {row.source.replace('_', ' ')}
                            </span>
                          ) : null}
                        </div>
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
                          aria-label={`Toggle ${module.label} for selected society`}
                          onCheckedChange={(value) => void handleToggle(module.key, value)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
