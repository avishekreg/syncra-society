/**
 * Background delivery interceptor — wires Android SMS / notification captures
 * into interceptDeliveryNotification({ autoCreate: true }) without user paste.
 */

import { App } from '@capacitor/app'
import { interceptDeliveryNotification } from '../api/deliveryApprovalService'
import { isNativeShell } from '../lib/capacitorShell'
import { dispatchPushNotification } from '../lib/pushNotifications'
import {
  DeliveryListener,
  isDeliveryListenerAvailable,
  type DeliveryDetectedEvent
} from '../plugins/deliveryListener'

const CONSENT_KEY = 'mai-delivery-sms-consent'
const PROCESSED_KEY = 'mai-delivery-processed-ids'
const AUTO_EVENT = 'mai:delivery-auto-preapproved'
export const DELIVERY_CONSENT_CHANGED_EVENT = 'mai:delivery-sms-consent'

export type DeliveryInterceptorContext = {
  societyId: string
  flatNumber: string
  userId?: string
}

type ProcessedMap = Record<string, number>

let activeContext: DeliveryInterceptorContext | null = null
let started = false
let processing = false
const teardown: Array<() => void> = []
const recentBodies = new Map<string, number>()

export function getDeliverySmsConsent(): 'unknown' | 'granted' | 'denied' {
  try {
    const value = localStorage.getItem(CONSENT_KEY)
    if (value === 'granted' || value === 'denied') return value
  } catch {
    // ignore
  }
  return 'unknown'
}

export function setDeliverySmsConsentLocal(value: 'granted' | 'denied') {
  try {
    localStorage.setItem(CONSENT_KEY, value)
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DELIVERY_CONSENT_CHANGED_EVENT, { detail: { consent: value } }))
  }
}

function loadProcessed(): ProcessedMap {
  try {
    const raw = localStorage.getItem(PROCESSED_KEY)
    return raw ? (JSON.parse(raw) as ProcessedMap) : {}
  } catch {
    return {}
  }
}

function rememberProcessed(id: string) {
  const map = loadProcessed()
  const now = Date.now()
  map[id] = now
  for (const [key, ts] of Object.entries(map)) {
    if (now - ts > 1000 * 60 * 60 * 24) delete map[key]
  }
  try {
    localStorage.setItem(PROCESSED_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

function wasProcessed(id: string) {
  return Boolean(loadProcessed()[id])
}

function bodyDedupeKey(body: string) {
  return body.trim().toLowerCase().slice(0, 240)
}

function isDuplicateBody(body: string) {
  const key = bodyDedupeKey(body)
  const prev = recentBodies.get(key)
  const now = Date.now()
  if (prev && now - prev < 90_000) return true
  recentBodies.set(key, now)
  return false
}

async function notifyResident(societyId: string, provider: string, hours: number, flatNumber: string) {
  const title = `${provider} delivery detected`
  const body = `Gate entry pre-approved for ${hours} hours.`

  try {
    if (isDeliveryListenerAvailable()) {
      await DeliveryListener.showPreApprovalNotice({ provider, hours })
    }
  } catch {
    // Native notice is best-effort.
  }

  await dispatchPushNotification({
    societyId,
    type: 'delivery.pre_approved',
    title,
    body: `${provider} delivery detected. ${body}`,
    url: '/resident/gatekeeper',
    audience: 'flat',
    flatId: flatNumber,
    metadata: { silent: true, provider, hours }
  })
}

async function handleDetectedEvent(event: DeliveryDetectedEvent) {
  if (!activeContext) return
  if (!event?.body?.trim()) return
  if (event.id && wasProcessed(event.id)) return
  if (isDuplicateBody(event.body)) {
    if (event.id) rememberProcessed(event.id)
    return
  }

  try {
    const { match, preApproval } = await interceptDeliveryNotification({
      societyId: activeContext.societyId,
      flatNumber: activeContext.flatNumber,
      notificationText: event.body,
      createdByUserId: activeContext.userId,
      autoCreate: true,
      windowHours: 2
    })

    if (event.id) rememberProcessed(event.id)
    if (!match || !preApproval) return

    const hours = match.suggestedWindowHours
    await notifyResident(activeContext.societyId, match.provider, hours, activeContext.flatNumber)

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(AUTO_EVENT, {
          detail: { match, preApproval, event }
        })
      )
    }
  } catch (err) {
    console.warn('[delivery-interceptor] auto pre-approve failed', err)
  }
}

async function drainAndProcess() {
  if (!isDeliveryListenerAvailable() || !activeContext || processing) return
  processing = true
  try {
    const { events } = await DeliveryListener.drainPending()
    for (const event of events ?? []) {
      await handleDetectedEvent(event)
    }
  } catch (err) {
    console.warn('[delivery-interceptor] drain failed', err)
  } finally {
    processing = false
  }
}

/**
 * Bind resident flat context and start listening when consent is already granted.
 * Safe to call repeatedly; non-Android platforms no-op.
 */
export async function startBackgroundDeliveryInterceptor(
  context: DeliveryInterceptorContext
): Promise<() => void> {
  activeContext = context

  if (!isNativeShell() || !isDeliveryListenerAvailable()) {
    return () => {
      if (activeContext === context) activeContext = null
    }
  }

  if (getDeliverySmsConsent() !== 'granted') {
    return () => {
      if (activeContext === context) activeContext = null
    }
  }

  if (started) {
    void drainAndProcess()
    return () => {
      if (activeContext === context) activeContext = null
    }
  }

  started = true

  try {
    await DeliveryListener.setConsent({ consent: 'granted' })
    await DeliveryListener.startListening()
  } catch (err) {
    console.warn('[delivery-interceptor] startListening failed', err)
  }

  const listenerPromise = DeliveryListener.addListener('deliveryDetected', (event) => {
    void handleDetectedEvent(event)
  })

  listenerPromise
    .then((handle) => {
      teardown.push(() => {
        void handle.remove()
      })
    })
    .catch(() => undefined)

  const appStatePromise = App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) void drainAndProcess()
  })
  appStatePromise
    .then((handle) => {
      teardown.push(() => {
        void handle.remove()
      })
    })
    .catch(() => undefined)

  void drainAndProcess()

  return () => {
    if (activeContext === context) activeContext = null
  }
}

export function stopBackgroundDeliveryInterceptor() {
  activeContext = null
  while (teardown.length) {
    const dispose = teardown.pop()
    try {
      dispose?.()
    } catch {
      // ignore
    }
  }
  started = false
  if (isDeliveryListenerAvailable()) {
    void DeliveryListener.stopListening().catch(() => undefined)
  }
}

export const DELIVERY_AUTO_PREAPPROVED_EVENT = AUTO_EVENT
