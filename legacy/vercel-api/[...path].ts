import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleAutomationRoute } from './_lib/handlers/automation'
import { handlePaymentsRoute } from './_lib/handlers/payments'
import { handlePlatformRoute } from './_lib/handlers/platform'
import { json, routePath, setCors } from './_lib/http'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  const fullPath = routePath(req)
  const subPath = fullPath.replace(/^\/api\//, '')

  if (subPath.startsWith('payments/')) {
    const paymentSub = subPath.slice('payments/'.length)
    if (paymentSub.startsWith('status/')) {
      req.query.societyId = paymentSub.slice('status/'.length)
      const handled = await handlePaymentsRoute(req, res, 'status')
      if (handled !== false) return
    }
    const handled = await handlePaymentsRoute(req, res, paymentSub)
    if (handled !== false) return
  }

  if (subPath.startsWith('automation/')) {
    const handled = await handleAutomationRoute(req, res, subPath.slice('automation/'.length))
    if (handled !== false) return
  }

  if (subPath.startsWith('platform/')) {
    const handled = await handlePlatformRoute(req, res, subPath.slice('platform/'.length))
    if (handled !== false) return
  }

  if (req.method === 'GET' && subPath === 'health') {
    return json(res, 200, { ok: true, service: 'syncra-society-api' })
  }

  return json(res, 404, { error: 'Not found', path: fullPath })
}
