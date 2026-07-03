import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handlePaymentsWebhook } from '../_lib/handlers/payments'
import { setCors } from '../_lib/http'

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  return handlePaymentsWebhook(req, res)
}
