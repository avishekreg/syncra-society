import type { VercelRequest, VercelResponse } from '@vercel/node'

export function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-syncra-automation-secret, x-razorpay-signature')
}

export function json(res: VercelResponse, status: number, body: unknown) {
  setCors(res)
  res.status(status).json(body)
}

export function methodNotAllowed(res: VercelResponse) {
  json(res, 405, { error: 'Method not allowed' })
}

export function readJsonBody<T>(req: VercelRequest): T {
  if (typeof req.body === 'string') return JSON.parse(req.body) as T
  return req.body as T
}

export async function readRawBody(req: VercelRequest): Promise<Buffer> {
  if (req.body && typeof req.body !== 'string' && !Buffer.isBuffer(req.body)) {
    return Buffer.from(JSON.stringify(req.body))
  }
  if (typeof req.body === 'string') return Buffer.from(req.body)
  if (Buffer.isBuffer(req.body)) return req.body

  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => resolve())
    req.on('error', reject)
  })
  return Buffer.concat(chunks)
}

export function routePath(req: VercelRequest): string {
  const segments = req.query.path
  if (Array.isArray(segments)) return `/api/${segments.join('/')}`
  if (typeof segments === 'string') return `/api/${segments}`
  return '/api'
}
