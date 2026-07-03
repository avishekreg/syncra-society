import type { N8nWebhookPayload } from '@/types/database'
import { getN8nWebhookUrl } from '@/lib/config/system-config'

export async function dispatchN8nEvent(payload: N8nWebhookPayload) {
  const webhookUrl = await getN8nWebhookUrl()
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`n8n webhook failed (${res.status}): ${text || res.statusText}`)
  }

  return { ok: true as const }
}

export async function dispatchN8nBroadcast(phones: string[], payload: Omit<N8nWebhookPayload, 'phone_number'>) {
  const unique = [...new Set(phones.filter(Boolean))]
  if (unique.length === 0) {
    await dispatchN8nEvent({ ...payload, phone_number: '' })
    return
  }
  await Promise.all(unique.map((phone_number) => dispatchN8nEvent({ ...payload, phone_number })))
}

export function formatNoticeMessage(title: string, content: string, societyName?: string) {
  const header = societyName ? `[${societyName}] ` : ''
  return `${header}New Notice: ${title}\n\n${content}`
}

export function formatVisitorMessage(
  visitorName: string,
  purpose: string,
  flatNumber: string,
  ownerName: string
) {
  return `Visitor Alert for Flat ${flatNumber} (${ownerName}): ${visitorName} arrived for ${purpose}.`
}

export function formatPaymentMessage(
  amount: number,
  status: 'paid' | 'pending',
  flatNumber: string,
  ownerName: string,
  dueDate: string
) {
  const label = status === 'paid' ? 'Payment received' : 'Payment due'
  return `${label} for Flat ${flatNumber} (${ownerName}): ₹${amount.toLocaleString('en-IN')} — due ${dueDate}.`
}
