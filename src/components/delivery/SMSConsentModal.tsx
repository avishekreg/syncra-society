import React, { useEffect, useState } from 'react'
import { ui } from '../../lib/ui'
import {
  DeliveryListener,
  isDeliveryListenerAvailable,
  type DeliveryListenerStatus
} from '../../plugins/deliveryListener'
import {
  getDeliverySmsConsent,
  setDeliverySmsConsentLocal
} from '../../services/backgroundDeliveryInterceptor'

type Props = {
  open: boolean
  onClose: () => void
  onGranted: () => void
  onDenied: () => void
}

/**
 * High-trust consent for Android SMS + notification listener based auto gate pre-approval.
 * Denial falls back to the existing 1-tap / paste flow — never blocks gatekeeper.
 */
export default function SMSConsentModal({ open, onClose, onGranted, onDenied }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<DeliveryListenerStatus | null>(null)
  const available = isDeliveryListenerAvailable()

  useEffect(() => {
    if (!open || !available) return
    void DeliveryListener.getStatus()
      .then(setStatus)
      .catch(() => setStatus(null))
  }, [open, available])

  if (!open) return null

  async function enableAutomatic() {
    setBusy(true)
    setError(null)
    try {
      if (!available) {
        setDeliverySmsConsentLocal('denied')
        onDenied()
        onClose()
        return
      }

      const sms = await DeliveryListener.requestSmsPermissions()
      await DeliveryListener.requestPostNotifications().catch(() => undefined)

      if (sms.smsPermission !== 'granted') {
        setError('SMS permission is required for automatic pre-approval. You can keep using 1-tap / paste.')
        setDeliverySmsConsentLocal('denied')
        onDenied()
        setBusy(false)
        return
      }

      await DeliveryListener.setConsent({ consent: 'granted' })
      await DeliveryListener.startListening()
      setDeliverySmsConsentLocal('granted')

      const next = await DeliveryListener.getStatus()
      setStatus(next)

      if (!next.notificationListenerEnabled) {
        // App notifications (Swiggy/Zomato) need a one-time OS toggle — SMS still works.
        await DeliveryListener.openNotificationListenerSettings().catch(() => undefined)
      }

      onGranted()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to enable automatic listening')
      setDeliverySmsConsentLocal('denied')
      onDenied()
    } finally {
      setBusy(false)
    }
  }

  function useManual() {
    setDeliverySmsConsentLocal('denied')
    void DeliveryListener.setConsent({ consent: 'denied' }).catch(() => undefined)
    void DeliveryListener.stopListening().catch(() => undefined)
    onDenied()
    onClose()
  }

  return (
    <div className={ui.overlay} role="dialog" aria-modal="true" aria-labelledby="sms-consent-title">
      <div className={`${ui.modal} max-w-lg`}>
        <p className={ui.eyebrow}>Privacy-first automation</p>
        <h2 id="sms-consent-title" className={`mt-2 ${ui.headingLg}`}>
          Enable Automatic Gate Pre-Approval
        </h2>
        <p className={`mt-3 ${ui.body}`}>
          maiSociety processes delivery SMS locally on your device with strict end-to-end privacy.
          Matching vendor alerts can open a short gate clearance for your flat — without pasting text by
          hand.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-syncra-accent" />
            Only delivery-related SMS / courier notifications are read — everything else is ignored on-device.
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-syncra-accent" />
            Raw message text is not uploaded for marketing or training.
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-syncra-accent" />
            You can revoke access anytime and keep using 1-tap brand buttons or paste.
          </li>
        </ul>

        {status ? (
          <p className="mt-4 text-xs text-slate-500">
            SMS: {status.smsPermission}
            {' · '}
            App alerts: {status.notificationListenerEnabled ? 'enabled' : 'needs OS toggle'}
            {' · '}
            Consent: {getDeliverySmsConsent()}
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" className={ui.btnGhost} disabled={busy} onClick={useManual}>
            Use manual 1-tap / paste
          </button>
          <button type="button" className={ui.btnPrimary} disabled={busy} onClick={() => void enableAutomatic()}>
            {busy ? 'Enabling…' : 'Enable automatic pre-approval'}
          </button>
        </div>
      </div>
    </div>
  )
}
