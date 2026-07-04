import { isJsonContentType, isSuccessStatus } from './safeFetch'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export function getSupabaseRestHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Prefer: 'return=representation'
  }
}

export function supabaseRestUrl(path: string) {
  const base = SUPABASE_URL.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '')
  const cleanPath = path.replace(/^\/+/, '')
  if (!base) return `/rest/v1/${cleanPath}`
  return `${base}/rest/v1/${cleanPath}`
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type')
  const text = await res.text()

  if (!isSuccessStatus(res.status)) {
    if (isJsonContentType(contentType) && text) {
      try {
        const parsed = JSON.parse(text) as { message?: string; error?: string; hint?: string }
        const detail = parsed.message ?? parsed.error ?? parsed.hint
        if (detail) throw new Error(detail)
      } catch (err) {
        if (err instanceof Error && err.message !== res.statusText) throw err
      }
    }
    throw new Error(
      res.status === 404
        ? 'Resource not found'
        : res.statusText || `Supabase request failed (${res.status})`
    )
  }

  if (res.status === 204 || !text) {
    return null as T
  }

  if (!isJsonContentType(contentType)) {
    throw new Error('Unexpected non-JSON response from Supabase')
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('Invalid JSON response from Supabase')
  }
}

export async function restGet<T = unknown>(path: string): Promise<T> {
  const url = supabaseRestUrl(path)
  const res = await fetch(url, { headers: getSupabaseRestHeaders() })
  return handleResponse<T>(res)
}

export async function restPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const url = supabaseRestUrl(path)
  const res = await fetch(url, {
    method: 'POST',
    headers: getSupabaseRestHeaders(),
    body: JSON.stringify(body)
  })
  const parsed = await handleResponse<T | T[]>(res)
  if (Array.isArray(parsed)) return parsed[0] as T
  return parsed as T
}

export async function restPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  const url = supabaseRestUrl(path)
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getSupabaseRestHeaders(),
    body: JSON.stringify(body)
  })
  const parsed = await handleResponse<T | T[]>(res)
  if (Array.isArray(parsed)) return parsed[0] as T
  return parsed as T
}

export async function restDelete<T = unknown>(path: string): Promise<T> {
  const url = supabaseRestUrl(path)
  const res = await fetch(url, { method: 'DELETE', headers: getSupabaseRestHeaders() })
  return handleResponse<T>(res)
}

export default {
  restGet,
  restPost,
  restPatch,
  restDelete,
  supabaseRestUrl,
  getSupabaseRestHeaders
}
