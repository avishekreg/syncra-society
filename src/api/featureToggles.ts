import supabase from './supabaseSdk'
import { shouldUseLocalFallback } from './apiErrors'
import {
  FEATURE_MODULE_CATALOG,
  FEATURE_MODULE_KEYS,
  isFeatureModuleName,
  normalizeLicensedModule,
  type FeatureModuleName,
  type FeatureToggleSource
} from '../lib/featureModules'

export type FeatureToggleRow = {
  id: string
  societyId: string
  moduleName: FeatureModuleName
  isEnabled: boolean
  source: FeatureToggleSource
  updatedAt: string
}

const LOCAL_KEY = 'mai_feature_toggles_v2'

type LocalEntry = { isEnabled: boolean; source: FeatureToggleSource }
type LocalStore = Record<string, Partial<Record<FeatureModuleName, LocalEntry>>>

function assertSocietyId(societyId: string | null | undefined): asserts societyId is string {
  if (!societyId || !String(societyId).trim()) {
    throw new Error('society_id is required for feature toggle operations')
  }
}

function readLocal(): LocalStore {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as LocalStore
  } catch {
    return {}
  }
}

function writeLocal(store: LocalStore) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(store))
}

function defaultRows(societyId: string): FeatureToggleRow[] {
  const now = new Date().toISOString()
  return FEATURE_MODULE_CATALOG.map((module) => ({
    id: `${societyId}:${module.key}`,
    societyId,
    moduleName: module.key,
    isEnabled: module.defaultEnabled,
    source: 'base' as const,
    updatedAt: now
  }))
}

function normalizeRow(row: Record<string, unknown>, fallbackSocietyId?: string): FeatureToggleRow | null {
  const moduleName = String(row.module_name ?? row.moduleName ?? '')
  if (!isFeatureModuleName(moduleName)) return null
  const societyId = String(row.society_id ?? row.societyId ?? fallbackSocietyId ?? '')
  if (!societyId) return null
  const sourceRaw = String(row.source ?? 'base')
  const source: FeatureToggleSource =
    sourceRaw === 'purchased' || sourceRaw === 'super_admin' ? sourceRaw : 'base'
  return {
    id: String(row.id ?? `${societyId}:${moduleName}`),
    societyId,
    moduleName,
    isEnabled: Boolean(row.is_enabled ?? row.isEnabled),
    source,
    updatedAt: String(row.updated_at ?? row.updatedAt ?? new Date().toISOString())
  }
}

function mergeWithDefaults(societyId: string, rows: FeatureToggleRow[]): FeatureToggleRow[] {
  const byModule = new Map(rows.filter((r) => r.societyId === societyId).map((row) => [row.moduleName, row]))
  return FEATURE_MODULE_KEYS.map((moduleName) => {
    const existing = byModule.get(moduleName)
    if (existing) return existing
    const meta = FEATURE_MODULE_CATALOG.find((m) => m.key === moduleName)!
    return {
      id: `${societyId}:${moduleName}`,
      societyId,
      moduleName,
      isEnabled: meta.defaultEnabled,
      source: 'base' as const,
      updatedAt: new Date().toISOString()
    }
  })
}

function listLocal(societyId: string): FeatureToggleRow[] {
  const store = readLocal()
  const society = store[societyId] ?? {}
  return FEATURE_MODULE_CATALOG.map((module) => {
    const entry = society[module.key]
    return {
      id: `${societyId}:${module.key}`,
      societyId,
      moduleName: module.key,
      isEnabled: entry ? Boolean(entry.isEnabled) : module.defaultEnabled,
      source: entry?.source ?? 'base',
      updatedAt: new Date().toISOString()
    }
  })
}

function setLocal(
  societyId: string,
  moduleName: FeatureModuleName,
  isEnabled: boolean,
  source: FeatureToggleSource
): FeatureToggleRow {
  const store = readLocal()
  store[societyId] = {
    ...(store[societyId] ?? {}),
    [moduleName]: { isEnabled, source }
  }
  writeLocal(store)
  return {
    id: `${societyId}:${moduleName}`,
    societyId,
    moduleName,
    isEnabled,
    source,
    updatedAt: new Date().toISOString()
  }
}

/** Fetch toggles for exactly one society — never merges other societies. */
export async function listFeatureToggles(societyId: string): Promise<FeatureToggleRow[]> {
  assertSocietyId(societyId)

  try {
    const { data, error } = await supabase
      .from('feature_toggles')
      .select('id,society_id,module_name,is_enabled,source,updated_at')
      .eq('society_id', societyId)

    if (error) throw error

    const normalized = (data ?? [])
      .map((row) => normalizeRow(row as Record<string, unknown>, societyId))
      .filter((row): row is FeatureToggleRow => row !== null && row.societyId === societyId)

    if (normalized.length === 0) {
      const seeded = defaultRows(societyId)
      await Promise.all(
        seeded.map((row) =>
          supabase.from('feature_toggles').upsert(
            {
              society_id: societyId,
              module_name: row.moduleName,
              is_enabled: row.isEnabled,
              source: row.source
            },
            { onConflict: 'society_id,module_name' }
          )
        )
      )
      return seeded
    }

    return mergeWithDefaults(societyId, normalized)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    return listLocal(societyId)
  }
}

export async function setFeatureToggle(
  societyId: string,
  moduleName: FeatureModuleName,
  isEnabled: boolean
): Promise<FeatureToggleRow> {
  assertSocietyId(societyId)

  try {
    const { data, error } = await supabase.rpc('set_feature_toggle', {
      p_society_id: societyId,
      p_module_name: moduleName,
      p_is_enabled: isEnabled
    })

    if (error) throw error

    const row = Array.isArray(data) ? data[0] : data
    const normalized = normalizeRow((row ?? {}) as Record<string, unknown>, societyId)
    if (normalized && normalized.societyId === societyId) {
      setLocal(societyId, moduleName, isEnabled, 'super_admin')
      return { ...normalized, source: 'super_admin' }
    }

    const { data: upserted, error: upsertError } = await supabase
      .from('feature_toggles')
      .upsert(
        {
          society_id: societyId,
          module_name: moduleName,
          is_enabled: isEnabled,
          source: 'super_admin',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'society_id,module_name' }
      )
      .select('id,society_id,module_name,is_enabled,source,updated_at')
      .eq('society_id', societyId)
      .single()

    if (upsertError) throw upsertError
    const fromUpsert = normalizeRow((upserted ?? {}) as Record<string, unknown>, societyId)
    if (!fromUpsert || fromUpsert.societyId !== societyId) {
      throw new Error('Failed to update feature toggle for society')
    }
    setLocal(societyId, moduleName, isEnabled, 'super_admin')
    return fromUpsert
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    return setLocal(societyId, moduleName, isEnabled, 'super_admin')
  }
}

/**
 * Checkout / subscription purchase → enable modules for this society only.
 */
export async function activateSocietyAddons(
  societyId: string,
  modules: Array<FeatureModuleName | string>
): Promise<FeatureToggleRow[]> {
  assertSocietyId(societyId)

  const normalized = modules
    .map((item) => normalizeLicensedModule(item))
    .filter((item): item is FeatureModuleName => item !== null)

  if (normalized.length === 0) {
    return listFeatureToggles(societyId)
  }

  try {
    const { data, error } = await supabase.rpc('activate_society_addons', {
      p_society_id: societyId,
      p_modules: normalized
    })

    if (error) throw error

    const rows = (Array.isArray(data) ? data : data ? [data] : [])
      .map((row) => normalizeRow(row as Record<string, unknown>, societyId))
      .filter((row): row is FeatureToggleRow => row !== null && row.societyId === societyId)

    for (const moduleName of normalized) {
      setLocal(societyId, moduleName, true, 'purchased')
    }

    return rows.length ? mergeWithDefaults(societyId, rows) : listFeatureToggles(societyId)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    for (const moduleName of normalized) {
      setLocal(societyId, moduleName, true, 'purchased')
    }
    return listLocal(societyId)
  }
}

export function subscribeFeatureToggles(
  societyId: string,
  onChange: (rows: FeatureToggleRow[]) => void
): () => void {
  if (!societyId) return () => undefined

  const channel = supabase
    .channel(`feature-toggles-${societyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'feature_toggles',
        filter: `society_id=eq.${societyId}`
      },
      () => {
        void listFeatureToggles(societyId).then(onChange).catch(() => undefined)
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function summarizeSocietyLicenses(rows: FeatureToggleRow[]) {
  const enabled = rows.filter((row) => row.isEnabled)
  return {
    enabledCount: enabled.length,
    purchased: enabled.filter((row) => row.source === 'purchased').map((row) => row.moduleName),
    superAdmin: enabled.filter((row) => row.source === 'super_admin').map((row) => row.moduleName),
    base: enabled.filter((row) => row.source === 'base').map((row) => row.moduleName)
  }
}
