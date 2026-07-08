import type { ActivityEntry } from './activityLog'
import { dispatchToN8n } from './n8nClient'
import {
  fetchSocietySubscription,
  fetchUsageCounter,
  incrementWhatsAppAlertCounter
} from '../api/subscriptions'
import { publishAdminAlert } from './adminAlerts'
import { shouldSimulateWhatsApp, TRIAL_WHATSAPP_SIMULATION_MESSAGE } from './saasBilling'

export type SocietyEventType =
  | 'visitor.pending'
  | 'visitor.approved'
  | 'payment.reminder'
  | 'payment.received'
  | 'survey.created'
  | 'survey.open'
  | 'election.open'
  | 'helpdesk.ticket'
  | 'helpdesk.resolved'
  | 'system.test'

export type DispatchSocietyEventInput = {
  type: SocietyEventType | string
  societyId: string
  societyName?: string
  flatNumber?: string | null
  summary: string
  metadata?: Record<string, unknown>
  recipients?: string[]
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

/** Relay non-notice portal activity to n8n. Notice broadcasts use src/api/notices.ts only. */
export async function dispatchSocietyEvent(input: DispatchSocietyEventInput) {
  if (input.type === 'notice.published' || input.type.startsWith('notice.')) {
    return null
  }

  const payload = {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: input.type,
    societyId: input.societyId,
    societyName: input.societyName ?? 'Society',
    flatNumber: input.flatNumber ?? null,
    summary: input.summary,
    occurredAt: new Date().toISOString(),
    metadata: input.metadata ?? {},
    recipients: input.recipients
  }

  const [subscription, usage] = await Promise.all([
    fetchSocietySubscription(input.societyId),
    fetchUsageCounter(input.societyId)
  ])

  if (shouldSimulateWhatsApp(subscription, usage)) {
    await incrementWhatsAppAlertCounter(input.societyId)
    publishAdminAlert(TRIAL_WHATSAPP_SIMULATION_MESSAGE)
    return { ok: true, simulated: true, message: TRIAL_WHATSAPP_SIMULATION_MESSAGE }
  }

  const direct = await dispatchToN8n(payload)
  if (direct.ok) return direct

  if (!API_BASE) return direct

  try {
    const res = await fetch(`${API_BASE}/api/automation/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) return await res.json()
  } catch {
    // keep direct n8n result
  }

  return direct
}

export function activityToEventType(entry: ActivityEntry): string {
  const map: Record<string, string> = {
    visitor_approved: 'visitor.approved',
    maintenance_paid: 'payment.received',
    payment_reminder: 'payment.reminder',
    survey_created: 'survey.created',
    survey_response: 'survey.open',
    election_created: 'election.open',
    vote_cast: 'election.open',
    ticket_opened: 'helpdesk.ticket',
    ticket_resolved: 'helpdesk.resolved'
  }
  return map[entry.action] ?? `${entry.category}.${entry.action}`
}

export async function dispatchFromActivity(entry: ActivityEntry, societyName?: string) {
  // Notice WhatsApp delivery is owned exclusively by createNotice() → src/api/notices.ts.
  if (entry.category === 'notice') {
    return null
  }

  return dispatchSocietyEvent({
    type: activityToEventType(entry),
    societyId: entry.societyId,
    societyName,
    flatNumber: entry.flatNumber,
    summary: entry.summary,
    metadata: entry.metadata
  })
}

export async function fetchAutomationStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/automation/status`)
    if (!res.ok) return null
    return res.json() as Promise<{
      n8nConfigured: boolean
      n8nReachable: boolean
      message: string
    }>
  } catch {
    return null
  }
}

export async function fetchAutomationSettings(societyId: string) {
  const res = await fetch(`${API_BASE}/api/automation/settings/${societyId}`)
  if (!res.ok) throw new Error('Unable to load automation settings')
  return res.json()
}

export async function saveAutomationSettings(societyId: string, settings: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/automation/settings/${societyId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  })
  if (!res.ok) throw new Error('Unable to save automation settings')
  return res.json()
}

export async function fetchWhatsAppContacts(societyId: string) {
  const res = await fetch(`${API_BASE}/api/automation/contacts/${societyId}`)
  if (!res.ok) return []
  return res.json() as Promise<Array<{ flatNumber: string; phone: string; name?: string; optedIn: boolean }>>
}

export async function saveWhatsAppContacts(
  societyId: string,
  contacts: Array<{ flatNumber: string; phone: string; name?: string; optedIn: boolean }>
) {
  const res = await fetch(`${API_BASE}/api/automation/contacts/${societyId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contacts)
  })
  if (!res.ok) throw new Error('Unable to save contacts')
  return res.json()
}

export async function sendAutomationTest(societyId: string, societyName: string) {
  const [subscription, usage] = await Promise.all([
    fetchSocietySubscription(societyId),
    fetchUsageCounter(societyId)
  ])

  if (shouldSimulateWhatsApp(subscription, usage)) {
    await incrementWhatsAppAlertCounter(societyId)
    publishAdminAlert(TRIAL_WHATSAPP_SIMULATION_MESSAGE)
    return {
      forwarded: false,
      simulated: true,
      message: TRIAL_WHATSAPP_SIMULATION_MESSAGE
    }
  }

  const res = await fetch(`${API_BASE}/api/automation/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ societyId, societyName })
  })
  return res.json()
}
