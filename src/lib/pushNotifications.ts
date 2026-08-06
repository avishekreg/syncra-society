/**
 * Centralized system-wide push / alert dispatcher for mAI Society.
 * Channels: Web Notification API → Service Worker → in-app banner/toast fallbacks.
 */

import { publishAdminAlert } from './adminAlerts'
import { isRemoteSocietyId } from '../api/societies'
import { restPost } from '../api/supabaseClient'
import { shouldUseLocalFallback } from '../api/apiErrors'

export const PUSH_BANNER_EVENT = 'mai:push-banner'
export const PUSH_SW_PATH = '/sw-push.js'

export type PushEventType =
  | 'maintenance.due'
  | 'payment.approved'
  | 'payment.receipt'
  | 'notice.published'
  | 'complaint.updated'
  | 'election.open'
  | 'election.closed'
  | 'election.published'
  | 'delivery.pre_approved'
  | 'system.alert'

export type PushAudience = 'society' | 'admins' | 'flat' | 'residents'

export type PushDispatchInput = {
  societyId: string
  type: PushEventType
  title: string
  body: string
  url?: string
  audience?: PushAudience
  flatId?: string
  metadata?: Record<string, unknown>
}

export type PushLogEntry = PushDispatchInput & {
  id: string
  channel: 'web_push' | 'service_worker' | 'in_app' | 'banner'
  status: 'dispatched' | 'fallback' | 'logged'
  createdAt: string
}

function pushLogKey(societyId: string) {
  return `mai-push-logs-${societyId}`
}

function loadLocalLogs(societyId: string): PushLogEntry[] {
  try {
    const raw = localStorage.getItem(pushLogKey(societyId))
    return raw ? (JSON.parse(raw) as PushLogEntry[]) : []
  } catch {
    return []
  }
}

function saveLocalLog(entry: PushLogEntry) {
  const logs = loadLocalLogs(entry.societyId)
  logs.unshift(entry)
  localStorage.setItem(pushLogKey(entry.societyId), JSON.stringify(logs.slice(0, 500)))
}

async function persistRemoteLog(entry: PushLogEntry) {
  if (!isRemoteSocietyId(entry.societyId)) return
  try {
    await restPost('push_notification_logs', {
      id: entry.id,
      society_id: entry.societyId,
      event_type: entry.type,
      title: entry.title,
      body: entry.body,
      target_url: entry.url ?? null,
      audience: entry.audience ?? 'society',
      flat_id: entry.flatId ?? null,
      channel: entry.channel,
      status: entry.status,
      metadata: entry.metadata ?? {},
      created_at: entry.createdAt
    })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) {
      console.warn('[push] remote log failed', err)
    }
  }
}

function emitBanner(title: string, body: string, url?: string) {
  if (typeof window === 'undefined') return
  const message = `${title}: ${body}`
  window.dispatchEvent(
    new CustomEvent(PUSH_BANNER_EVENT, {
      detail: { title, body, url, message }
    })
  )
  publishAdminAlert(message)
}

async function tryWebNotification(title: string, body: string, url?: string, silent = false) {
  if (typeof window === 'undefined' || !('Notification' in window)) return false

  let permission = Notification.permission
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission()
    } catch {
      return false
    }
  }
  if (permission !== 'granted') return false

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg?.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/logo.png',
          badge: '/favicon-32.png',
          data: { url: url || '/' },
          tag: `mai-${Date.now()}`,
          silent
        })
        return true
      }
    }

    const n = new Notification(title, {
      body,
      icon: '/logo.png',
      data: { url: url || '/' },
      silent
    })
    n.onclick = () => {
      window.focus()
      if (url) window.location.assign(url)
      n.close()
    }
    return true
  } catch {
    return false
  }
}

/** Register the lightweight push service worker (idempotent). */
export async function ensurePushServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register(PUSH_SW_PATH, { scope: '/' })
  } catch {
    return null
  }
}

/** Request browser notification permission (call from a user gesture when possible). */
export async function requestPushPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied' as NotificationPermission
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

export function listPushLogs(societyId: string) {
  return loadLocalLogs(societyId)
}

/**
 * Dispatch a system notification across available channels.
 * Never throws — always falls back to in-app banner/toast.
 */
export async function dispatchPushNotification(input: PushDispatchInput): Promise<PushLogEntry> {
  const createdAt = new Date().toISOString()
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `push-${Date.now()}`

  let channel: PushLogEntry['channel'] = 'banner'
  let status: PushLogEntry['status'] = 'fallback'

  const silent = Boolean(input.metadata?.silent)
  const webOk = await tryWebNotification(input.title, input.body, input.url, silent)
  if (webOk) {
    channel = 'web_push'
    status = 'dispatched'
  }

  emitBanner(input.title, input.body, input.url)

  const entry: PushLogEntry = {
    ...input,
    id,
    audience: input.audience ?? 'society',
    channel,
    status,
    createdAt
  }

  if (typeof window !== 'undefined') {
    saveLocalLog(entry)
  }
  void persistRemoteLog(entry)
  return entry
}

/* Convenience triggers --------------------------------------------------- */

export function notifyMaintenanceDue(societyId: string, flatHint?: string) {
  return dispatchPushNotification({
    societyId,
    type: 'maintenance.due',
    title: 'Maintenance due',
    body: flatHint
      ? `Maintenance payment is due for flat ${flatHint}.`
      : 'Maintenance payment is due. Please settle dues on time.',
    url: '/resident',
    audience: flatHint ? 'flat' : 'residents',
    flatId: flatHint
  })
}

export function notifyPaymentApproved(societyId: string, summary: string, flatId?: string) {
  return dispatchPushNotification({
    societyId,
    type: 'payment.approved',
    title: 'Payment approved',
    body: summary,
    url: '/resident',
    audience: flatId ? 'flat' : 'society',
    flatId
  })
}

export function notifyPaymentReceipt(societyId: string, summary: string, flatId?: string) {
  return dispatchPushNotification({
    societyId,
    type: 'payment.receipt',
    title: 'Payment receipt',
    body: summary,
    url: '/resident',
    audience: flatId ? 'flat' : 'society',
    flatId
  })
}

export function notifyNoticePublished(societyId: string, noticeTitle: string) {
  return dispatchPushNotification({
    societyId,
    type: 'notice.published',
    title: 'New notice',
    body: noticeTitle,
    url: '/resident/notices',
    audience: 'society'
  })
}

export function notifyComplaintUpdated(societyId: string, ticketSummary: string, flatId?: string) {
  return dispatchPushNotification({
    societyId,
    type: 'complaint.updated',
    title: 'Complaint update',
    body: ticketSummary,
    url: '/resident/helpdesk',
    audience: flatId ? 'flat' : 'society',
    flatId
  })
}

export function notifyElectionOpen(societyId: string, electionTitle: string, electionId: string) {
  return dispatchPushNotification({
    societyId,
    type: 'election.open',
    title: 'Voting is open',
    body: `${electionTitle} — cast your flat’s vote now.`,
    url: '/resident/elections',
    audience: 'residents',
    metadata: { electionId }
  })
}

export function notifyElectionPublished(societyId: string, electionTitle: string, electionId: string) {
  return dispatchPushNotification({
    societyId,
    type: 'election.published',
    title: 'Election results published',
    body: `${electionTitle} — view the official results bulletin.`,
    url: `/resident/elections/${electionId}/results`,
    audience: 'society',
    metadata: { electionId }
  })
}
