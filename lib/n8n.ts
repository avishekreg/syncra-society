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
