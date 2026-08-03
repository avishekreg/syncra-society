import supabase from './supabaseSdk'
import { shouldUseLocalFallback } from './apiErrors'
import {
  FEATURE_MODULE_KEYS,
  isFeatureModuleName,
  type FeatureModuleName
} from '../lib/featureModules'

export type FeatureToggleRow = {
  id: string
  societyId: string
  moduleName: FeatureModuleName
  isEnabled: boolean
  updatedAt: string
}

const LOCAL_KEY = 'mai_feature_toggles_v1'

type LocalStore = Record<string, Partial<Record<FeatureModuleName, boolean>>>

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

function defaultMap(societyId: string, enabled = false): FeatureToggleRow[] {
  const now = new Date().toISOString()
  return FEATURE_MODULE_KEYS.map((moduleName) => ({
    id: `${societyId}:${moduleName}`,
    societyId,
    moduleName,
    isEnabled: enabled,
    updatedAt: now
  }))
}

function normalizeRow(row: Record<string, unknown>): FeatureToggleRow | null {
  const moduleName = String(row.module_name ?? row.moduleName ?? '')
  if (!isFeatureModuleName(moduleName)) return null
  return {
    id: String(row.id ?? `${row.society_id}:${moduleName}`),
    societyId: String(row.society_id ?? row.societyId ?? ''),
    moduleName,
    isEnabled: Boolean(row.is_enabled ?? row.isEnabled),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? new Date().toISOString())
  }
}

function mergeWithDefaults(societyId: string, rows: FeatureToggleRow[]): FeatureToggleRow[] {
  const byModule = new Map(rows.map((row) => [row.moduleName, row]))
  return FEATURE_MODULE_KEYS.map((moduleName) => {
    return (
      byModule.get(moduleName) ?? {
        id: `${societyId}:${moduleName}`,
        societyId,
        moduleName,
        isEnabled: false,
        updatedAt: new Date().toISOString()
      }
    )
  })
}

function listLocal(societyId: string): FeatureToggleRow[] {
  const store = readLocal()
  const society = store[societyId] ?? {}
  return FEATURE_MODULE_KEYS.map((moduleName) => ({
    id: `${societyId}:${moduleName}`,
    societyId,
    moduleName,
    isEnabled: Boolean(society[moduleName]),
    updatedAt: new Date().toISOString()
  }))
}

function setLocal(societyId: string, moduleName: FeatureModuleName, isEnabled: boolean): FeatureToggleRow {
  const store = readLocal()
  store[societyId] = { ...(store[societyId] ?? {}), [moduleName]: isEnabled }
  writeLocal(store)
  return {
    id: `${societyId}:${moduleName}`,
    societyId,
    moduleName,
    isEnabled,
    updatedAt: new Date().toISOString()
  }
}

export async function listFeatureToggles(societyId: string): Promise<FeatureToggleRow[]> {
  if (!societyId) return []

  try {
    const { data, error } = await supabase
      .from('feature_toggles')
      .select('id,society_id,module_name,is_enabled,updated_at')
      .eq('society_id', societyId)

    if (error) throw error
    const normalized = (data ?? [])
      .map((row) => normalizeRow(row as Record<string, unknown>))
      .filter((row): row is FeatureToggleRow => row !== null)

    if (normalized.length === 0) {
      // Ensure defaults exist for brand-new societies when trigger hasn't run yet.
      const seeded = defaultMap(societyId, false)
      await Promise.all(
        seeded.map((row) =>
          supabase.from('feature_toggles').upsert(
            {
              society_id: societyId,
              module_name: row.moduleName,
              is_enabled: false
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
  try {
    const { data, error } = await supabase.rpc('set_feature_toggle', {
      p_society_id: societyId,
      p_module_name: moduleName,
      p_is_enabled: isEnabled
    })

    if (error) throw error

    const row = Array.isArray(data) ? data[0] : data
    const normalized = normalizeRow((row ?? {}) as Record<string, unknown>)
    if (normalized) {
      setLocal(societyId, moduleName, isEnabled)
      return normalized
    }

    // Fallback upsert if RPC payload shape differs
    const { data: upserted, error: upsertError } = await supabase
      .from('feature_toggles')
      .upsert(
        {
          society_id: societyId,
          module_name: moduleName,
          is_enabled: isEnabled,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'society_id,module_name' }
      )
      .select('id,society_id,module_name,is_enabled,updated_at')
      .single()

    if (upsertError) throw upsertError
    const fromUpsert = normalizeRow((upserted ?? {}) as Record<string, unknown>)
    if (!fromUpsert) throw new Error('Failed to update feature toggle')
    setLocal(societyId, moduleName, isEnabled)
    return fromUpsert
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    return setLocal(societyId, moduleName, isEnabled)
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
