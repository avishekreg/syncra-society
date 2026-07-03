import type { VercelRequest, VercelResponse } from '@vercel/node'
import { loadPlatformPricing, savePlatformPricing, type PlatformPricingConfig } from '../platformPricingStore'
import { json, readJsonBody } from '../http'

export async function handlePlatformRoute(req: VercelRequest, res: VercelResponse, subPath: string) {
  if (subPath === 'pricing' && req.method === 'GET') {
    return json(res, 200, await loadPlatformPricing())
  }

  if (subPath === 'pricing' && req.method === 'PUT') {
    try {
      const body = readJsonBody<PlatformPricingConfig>(req)
      if (!body || typeof body.activationFeeInr !== 'number' || !Array.isArray(body.tiers)) {
        return json(res, 400, { error: 'Invalid pricing payload' })
      }
      const saved = await savePlatformPricing(body)
      return json(res, 200, saved)
    } catch (err: any) {
      return json(res, 500, { error: err.message ?? 'Failed to save pricing' })
    }
  }

  return false
}
