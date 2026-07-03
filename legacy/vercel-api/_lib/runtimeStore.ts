import { config } from './config'

const memoryCache = new Map<string, unknown>()

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: config.supabaseServiceRoleKey,
    Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    Prefer: 'return=representation'
  }
}

function restUrl(path: string) {
  return `${config.supabaseUrl}/rest/v1/${path}`
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  const parsed = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(parsed?.message ?? parsed?.error ?? res.statusText)
  return parsed as T
}

export async function getRuntimeStore<T>(key: string): Promise<T | null> {
  if (!config.supabaseConfigured()) return (memoryCache.get(key) as T) ?? null
  try {
    const res = await fetch(restUrl(`app_runtime_store?key=eq.${encodeURIComponent(key)}&limit=1`), {
      headers: adminHeaders()
    })
    const rows = await handleResponse<Array<{ payload: T }>>(res)
    return rows?.[0]?.payload ?? null
  } catch {
    return (memoryCache.get(key) as T) ?? null
  }
}

export async function setRuntimeStore<T>(key: string, payload: T): Promise<T> {
  if (!config.supabaseConfigured()) {
    memoryCache.set(key, payload)
    return payload
  }
  try {
    const res = await fetch(restUrl('app_runtime_store?on_conflict=key'), {
      method: 'POST',
      headers: { ...adminHeaders(), Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ key, payload, updated_at: new Date().toISOString() })
    })
    const rows = await handleResponse<Array<{ payload: T }>>(res)
    return rows?.[0]?.payload ?? payload
  } catch {
    memoryCache.set(key, payload)
    return payload
  }
}
