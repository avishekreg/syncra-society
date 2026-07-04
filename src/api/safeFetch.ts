const JSON_CONTENT = /application\/json|\+json|vnd\.pgrst/i

export function isJsonContentType(contentType: string | null) {
  return JSON_CONTENT.test(contentType ?? '')
}

export function isSuccessStatus(status: number) {
  return status === 200 || status === 201 || status === 204
}

/** Parse JSON only when status and content-type indicate a JSON API response. */
export async function readJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type')
  const text = await res.text()

  if (!isSuccessStatus(res.status)) {
    if (isJsonContentType(contentType) && text) {
      try {
        const parsed = JSON.parse(text) as { message?: string; error?: string }
        throw new Error(parsed.message ?? parsed.error ?? res.statusText)
      } catch (err) {
        if (err instanceof Error && err.message !== res.statusText) throw err
      }
    }
    throw new Error(res.status === 404 ? 'Resource not found' : res.statusText || `HTTP ${res.status}`)
  }

  if (res.status === 204 || !text) {
    return null as T
  }

  if (!isJsonContentType(contentType)) {
    throw new Error('Unexpected non-JSON response from API')
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('Invalid JSON response from API')
  }
}

/** Same-origin fetch helper for Next.js / Vercel API routes (returns null on failure). */
export async function fetchApiJson<T>(
  path: string,
  init?: RequestInit
): Promise<T | null> {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''

  try {
    const res = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers ?? {})
      }
    })
    return await readJsonResponse<T>(res)
  } catch {
    return null
  }
}
