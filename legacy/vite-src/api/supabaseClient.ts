const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export function getSupabaseRestHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`
  }
}

export function supabaseRestUrl(path: string) {
  const base = SUPABASE_URL.replace(/\/+$/,'')
  return `${base}/${path}`
}

async function handleResponse(res: Response) {
  const text = await res.text()
  try {
    const parsed = text ? JSON.parse(text) : null
    if (!res.ok) throw new Error(parsed?.message || res.statusText)
    return parsed
  } catch (err) {
    if (!res.ok) throw new Error(res.statusText)
    // parse error but ok response
    return text
  }
}

export async function restGet<T = any>(path: string): Promise<T> {
  const url = supabaseRestUrl(path)
  const res = await fetch(url, { headers: getSupabaseRestHeaders() })
  return handleResponse(res) as Promise<T>
}

export async function restPost<T = any>(path: string, body: any): Promise<T> {
  const url = supabaseRestUrl(path)
  const res = await fetch(url, { method: 'POST', headers: getSupabaseRestHeaders(), body: JSON.stringify(body) })
  return handleResponse(res) as Promise<T>
}

export async function restPatch<T = any>(path: string, body: any): Promise<T> {
  const url = supabaseRestUrl(path)
  const res = await fetch(url, { method: 'PATCH', headers: getSupabaseRestHeaders(), body: JSON.stringify(body) })
  return handleResponse(res) as Promise<T>
}

export async function restDelete<T = any>(path: string): Promise<T> {
  const url = supabaseRestUrl(path)
  const res = await fetch(url, { method: 'DELETE', headers: getSupabaseRestHeaders() })
  return handleResponse(res) as Promise<T>
}

export default {
  restGet,
  restPost,
  restPatch,
  restDelete,
  supabaseRestUrl,
  getSupabaseRestHeaders
}
