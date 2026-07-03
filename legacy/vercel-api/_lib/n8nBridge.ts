import { config } from './config'
import { getRuntimeStore, setRuntimeStore } from './runtimeStore'

export type SocietyAutomationSettings = {
  societyId: string
  societyName: string
  whatsappNumber?: string | null
  enabled: boolean
  notifyNotice: boolean
  notifyVisitor: boolean
  notifyPaymentReminder: boolean
  notifySurvey: boolean
  notifyElection: boolean
  notifyHelpdesk: boolean
  updatedAt?: string
}

export type ResidentWhatsAppContact = {
  flatNumber: string
  phone: string
  name?: string
  optedIn: boolean
}

export type SocietyEventPayload = {
  eventId: string
  type: string
  societyId: string
  societyName?: string
  flatNumber?: string | null
  summary: string
  occurredAt: string
  metadata?: Record<string, unknown>
  recipients?: string[]
  whatsappFrom?: string | null
}

const settingsKey = (societyId: string) => `automation:settings:${societyId}`
const contactsKey = (societyId: string) => `automation:contacts:${societyId}`

export async function loadAutomationSettings(societyId: string): Promise<SocietyAutomationSettings> {
  const defaults: SocietyAutomationSettings = {
    societyId,
    societyName: 'Society',
    whatsappNumber: null,
    enabled: true,
    notifyNotice: true,
    notifyVisitor: true,
    notifyPaymentReminder: true,
    notifySurvey: true,
    notifyElection: true,
    notifyHelpdesk: true
  }
  const stored = await getRuntimeStore<SocietyAutomationSettings>(settingsKey(societyId))
  return stored ? { ...defaults, ...stored } : defaults
}

export async function saveAutomationSettings(settings: SocietyAutomationSettings) {
  const payload = { ...settings, updatedAt: new Date().toISOString() }
  await setRuntimeStore(settingsKey(settings.societyId), payload)
  return payload
}

export async function loadWhatsAppContacts(societyId: string): Promise<ResidentWhatsAppContact[]> {
  return (await getRuntimeStore<ResidentWhatsAppContact[]>(contactsKey(societyId))) ?? []
}

export async function saveWhatsAppContacts(societyId: string, contacts: ResidentWhatsAppContact[]) {
  await setRuntimeStore(contactsKey(societyId), contacts)
}

export async function resolveRecipients(societyId: string, flatNumber?: string | null) {
  const contacts = await loadWhatsAppContacts(societyId)
  const optedIn = contacts.filter((c) => c.optedIn && c.phone)
  if (flatNumber) {
    const match = optedIn.find((c) => c.flatNumber === flatNumber)
    return match ? [match.phone] : optedIn.map((c) => c.phone)
  }
  return optedIn.map((c) => c.phone)
}

export async function forwardEventToN8n(event: SocietyEventPayload) {
  if (!config.n8nConfigured()) {
    return { forwarded: false, reason: 'N8N_WEBHOOK_URL / VITE_N8N_WEBHOOK_URL not configured' }
  }

  const settings = await loadAutomationSettings(event.societyId)
  if (!settings.enabled) return { forwarded: false, reason: 'Automation disabled for society' }
  if (!isEventTypeEnabled(settings, event.type)) {
    return { forwarded: false, reason: `Event type ${event.type} disabled in settings` }
  }

  const body = {
    ...event,
    recipients: event.recipients?.length ? event.recipients : await resolveRecipients(event.societyId, event.flatNumber),
    whatsappFrom: settings.whatsappNumber ?? null,
    societyName: event.societyName ?? settings.societyName
  }

  try {
    const res = await fetch(config.n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return { forwarded: res.ok, status: res.status, reason: res.ok ? 'delivered' : await res.text() }
  } catch (err: any) {
    return { forwarded: false, reason: err.message ?? 'n8n unreachable' }
  }
}

function isEventTypeEnabled(settings: SocietyAutomationSettings, type: string) {
  if (type.startsWith('notice')) return settings.notifyNotice
  if (type.startsWith('visitor')) return settings.notifyVisitor
  if (type.startsWith('payment')) return settings.notifyPaymentReminder
  if (type.startsWith('survey')) return settings.notifySurvey
  if (type.startsWith('election')) return settings.notifyElection
  if (type.startsWith('helpdesk')) return settings.notifyHelpdesk
  return true
}

export async function pingN8n() {
  if (!config.n8nConfigured()) return { ok: false, message: 'N8N_WEBHOOK_URL / VITE_N8N_WEBHOOK_URL not set' }
  const res = await forwardEventToN8n({
    eventId: `ping-${Date.now()}`,
    type: 'system.ping',
    societyId: 'system',
    summary: 'Syncra automation connectivity test',
    occurredAt: new Date().toISOString(),
    metadata: { source: 'syncra-society' }
  })
  return { ok: res.forwarded, message: res.reason ?? 'ok' }
}
