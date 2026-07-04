import { resolveClientN8nWebhookUrl } from './n8nConfig'

export { N8N_PRODUCTION_WEBHOOK_URL } from './n8nConfig'

export type N8nPortalEvent = {
  eventId: string
  type: string
  societyId: string
  societyName?: string
  flatNumber?: string | null
  summary: string
  occurredAt: string
  metadata?: Record<string, unknown>
  recipients?: string[]
  email?: string
  sender_whatsapp?: string
  receiver_whatsapp?: string
  message_body?: string
}

export async function dispatchToN8n(payload: N8nPortalEvent) {
  const webhookUrl = resolveClientN8nWebhookUrl()
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return { ok: res.ok, status: res.status, webhookUrl }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'n8n dispatch failed',
      webhookUrl
    }
  }
}

export async function dispatchNoticePublished(input: {
  societyId: string
  societyName?: string
  title: string
  body: string
  noticeId: string
  publishedAt: string
  sender_whatsapp: string
  receiver_whatsapp: string
  message_body: string
}) {
  return dispatchToN8n({
    eventId: `notice-${input.noticeId}-${input.receiver_whatsapp.replace(/\D/g, '')}`,
    type: 'notice.published',
    societyId: input.societyId,
    societyName: input.societyName ?? 'Society',
    flatNumber: null,
    summary: `New notice: ${input.title}`,
    occurredAt: input.publishedAt,
    sender_whatsapp: input.sender_whatsapp,
    receiver_whatsapp: input.receiver_whatsapp,
    message_body: input.message_body,
    metadata: {
      noticeId: input.noticeId,
      title: input.title,
      body: input.body,
      publishedAt: input.publishedAt,
      sender_whatsapp: input.sender_whatsapp,
      receiver_whatsapp: input.receiver_whatsapp,
      message_body: input.message_body
    }
  })
}

export async function dispatchEmailVerification(input: {
  email: string
  fullName?: string
  code: string
  verifyUrl: string
}) {
  return dispatchToN8n({
    eventId: `verify-${Date.now()}`,
    type: 'auth.email_verification',
    societyId: 'system',
    societyName: 'Syncra Society',
    flatNumber: null,
    email: input.email,
    summary: `Verify your Syncra Society account (${input.fullName ?? input.email})`,
    occurredAt: new Date().toISOString(),
    metadata: {
      email: input.email,
      fullName: input.fullName ?? '',
      code: input.code,
      verifyUrl: input.verifyUrl
    }
  })
}
