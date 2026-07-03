import type { VercelRequest, VercelResponse } from '@vercel/node'
import { config } from '../config'
import {
  forwardEventToN8n,
  loadAutomationSettings,
  loadWhatsAppContacts,
  pingN8n,
  saveAutomationSettings,
  saveWhatsAppContacts,
  type ResidentWhatsAppContact,
  type SocietyAutomationSettings,
  type SocietyEventPayload
} from '../n8nBridge'
import { getRuntimeStore, setRuntimeStore } from '../runtimeStore'
import { json, readJsonBody } from '../http'

const INBOUND_LOG_KEY = 'automation:inbound-log'

async function appendInboundLog(entry: Record<string, unknown>) {
  const existing = (await getRuntimeStore<Array<Record<string, unknown>>>(INBOUND_LOG_KEY)) ?? []
  const next = [...existing.slice(-99), entry]
  await setRuntimeStore(INBOUND_LOG_KEY, next)
}

function verifySecret(req: VercelRequest, res: VercelResponse) {
  const header = req.headers['x-syncra-automation-secret']
  if (header !== config.automationSecret) {
    json(res, 401, { error: 'Invalid automation secret' })
    return false
  }
  return true
}

export async function handleAutomationRoute(req: VercelRequest, res: VercelResponse, subPath: string) {
  if (subPath === 'events' && req.method === 'POST') {
    try {
      const event = readJsonBody<SocietyEventPayload>(req)
      if (!event?.societyId || !event?.type || !event?.summary) {
        return json(res, 400, { error: 'societyId, type, and summary are required' })
      }
      const payload: SocietyEventPayload = {
        eventId: event.eventId ?? `evt-${Date.now()}`,
        type: event.type,
        societyId: event.societyId,
        societyName: event.societyName,
        flatNumber: event.flatNumber ?? null,
        summary: event.summary,
        occurredAt: event.occurredAt ?? new Date().toISOString(),
        metadata: event.metadata ?? {},
        recipients: event.recipients
      }
      const result = await forwardEventToN8n(payload)
      return json(res, 200, { success: true, ...result })
    } catch (err: any) {
      return json(res, 500, { error: err.message ?? 'Failed to relay event' })
    }
  }

  if (subPath === 'status' && req.method === 'GET') {
    const ping = config.n8nConfigured() ? await pingN8n() : { ok: false, message: 'N8N_WEBHOOK_URL not set' }
    return json(res, 200, {
      n8nConfigured: config.n8nConfigured(),
      n8nWebhookUrl: config.n8nWebhookUrl ? config.n8nWebhookUrl.replace(/\/webhook.*/, '/webhook/...') : null,
      n8nReachable: ping.ok,
      message: ping.message
    })
  }

  if (subPath.startsWith('settings/') && req.method === 'GET') {
    const societyId = subPath.slice('settings/'.length)
    return json(res, 200, await loadAutomationSettings(societyId))
  }

  if (subPath.startsWith('settings/') && req.method === 'PUT') {
    const societyId = subPath.slice('settings/'.length)
    const body = readJsonBody<Partial<SocietyAutomationSettings>>(req)
    const saved = await saveAutomationSettings({
      ...(await loadAutomationSettings(societyId)),
      ...body,
      societyId
    })
    return json(res, 200, saved)
  }

  if (subPath.startsWith('contacts/') && req.method === 'GET') {
    const societyId = subPath.slice('contacts/'.length)
    return json(res, 200, await loadWhatsAppContacts(societyId))
  }

  if (subPath.startsWith('contacts/') && req.method === 'PUT') {
    const societyId = subPath.slice('contacts/'.length)
    const contacts = readJsonBody<ResidentWhatsAppContact[]>(req)
    if (!Array.isArray(contacts)) return json(res, 400, { error: 'contacts array required' })
    await saveWhatsAppContacts(societyId, contacts)
    return json(res, 200, contacts)
  }

  if (subPath === 'inbound' && req.method === 'POST') {
    if (!verifySecret(req, res)) return

    const body = readJsonBody<{
      societyId: string
      flatNumber?: string
      phone?: string
      messageType: 'ticket' | 'payment_receipt' | 'text'
      subject?: string
      description?: string
      amount?: number
      reference?: string
    }>(req)

    if (!body.societyId || !body.messageType) {
      return json(res, 400, { error: 'societyId and messageType required' })
    }

    const record = { receivedAt: new Date().toISOString(), ...body }
    await appendInboundLog(record)

    if (body.messageType === 'ticket') {
      return json(res, 200, {
        success: true,
        action: 'ticket_created',
        ticketId: `wa-ticket-${Date.now()}`,
        subject: body.subject ?? 'WhatsApp helpdesk ticket',
        flatNumber: body.flatNumber,
        message: 'Ticket queued for syncra-society helpdesk'
      })
    }

    if (body.messageType === 'payment_receipt') {
      return json(res, 200, {
        success: true,
        action: 'receipt_logged',
        receiptId: `wa-receipt-${Date.now()}`,
        flatNumber: body.flatNumber,
        amount: body.amount,
        message: 'Payment receipt recorded for admin review'
      })
    }

    return json(res, 200, { success: true, action: 'logged', record })
  }

  if (subPath === 'test' && req.method === 'POST') {
    const { societyId, societyName } = readJsonBody<{ societyId?: string; societyName?: string }>(req)
    const result = await forwardEventToN8n({
      eventId: `test-${Date.now()}`,
      type: 'system.test',
      societyId: societyId ?? 'demo',
      societyName: societyName ?? 'Test Society',
      summary: 'Test notification from Syncra Society admin panel',
      occurredAt: new Date().toISOString(),
      metadata: { test: true }
    })
    return json(res, 200, result)
  }

  return false
}
