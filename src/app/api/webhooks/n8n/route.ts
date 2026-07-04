export const dynamic = 'force-dynamic'

import { getN8nWebhookUrl } from '@/lib/config/system-config'
import { NextResponse } from 'next/server'

export async function GET() {
  const webhook = await getN8nWebhookUrl()
  return NextResponse.json({
    ok: true,
    webhook: webhook.replace(/\/webhook.*/, '/webhook/...'),
    routes: ['/api/visitors', '/api/payments', '/api/payments/webhook', '/api/webhooks/payments'],
    noticeDispatch: 'client-only via src/api/notices.ts'
  })
}
