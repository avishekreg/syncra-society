import React, { useEffect, useMemo, useState } from 'react'
import {
  COURIER_POSTAL_WINDOW_HOURS,
  DELIVERY_CATEGORY_LABELS,
  DELIVERY_PROVIDER_OPTIONS,
  FOOD_QUICK_WINDOW_HOURS,
  QUICK_DELIVERY_PROVIDERS,
  createExpectedCourierPostalSlot,
  defaultWindowHoursForProvider,
  interceptDeliveryNotification,
  listDeliveryPreApprovalsForFlat,
  providersByCategory,
  quickPreApproveDelivery,
  type DeliveryProviderCategory
} from '../../api/deliveryApprovalService'
import type { DeliveryPreApproval, DeliveryServiceProvider } from '../../types/db'
import { ui } from '../../lib/ui'
import { isDeliveryListenerAvailable, DeliveryListener } from '../../plugins/deliveryListener'
import {
  DELIVERY_AUTO_PREAPPROVED_EVENT,
  getDeliverySmsConsent,
  setDeliverySmsConsentLocal
} from '../../services/backgroundDeliveryInterceptor'
import SMSConsentModal from '../delivery/SMSConsentModal'

type Props = {
  societyId: string
  flatNumber: string
  userId?: string
  compact?: boolean
}

const CATEGORY_ORDER: DeliveryProviderCategory[] = [
  'food_grocery',
  'ecommerce_logistics',
  'postal_govt',
  'generic'
]

export default function DeliveryPreApprovePanel({ societyId, flatNumber, userId, compact }: Props) {
  const [rows, setRows] = useState<DeliveryPreApproval[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualProvider, setManualProvider] = useState<DeliveryServiceProvider>('Generic Courier / Parcel')
  const [alertPaste, setAlertPaste] = useState('')
  const [consentOpen, setConsentOpen] = useState(false)
  const [smsConsent, setSmsConsent] = useState(getDeliverySmsConsent)
  const autoListenAvailable = isDeliveryListenerAvailable()

  const catalog = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        label: DELIVERY_CATEGORY_LABELS[category],
        providers: providersByCategory(category)
      })),
    []
  )

  async function refresh() {
    try {
      const list = await listDeliveryPreApprovalsForFlat(societyId, flatNumber)
      setRows(list.slice(0, compact ? 3 : 20))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load delivery pre-approvals')
    }
  }

  useEffect(() => {
    void refresh()
  }, [societyId, flatNumber])

  useEffect(() => {
    const onAuto = () => {
      setMessage('Automatic delivery SMS pre-approval saved for your flat.')
      void refresh()
    }
    window.addEventListener(DELIVERY_AUTO_PREAPPROVED_EVENT, onAuto)
    return () => window.removeEventListener(DELIVERY_AUTO_PREAPPROVED_EVENT, onAuto)
  }, [societyId, flatNumber])

  async function handleQuickApprove(provider: DeliveryServiceProvider) {
    setBusy(provider)
    setError(null)
    setMessage(null)
    try {
      const hours = defaultWindowHoursForProvider(provider)
      const row = await quickPreApproveDelivery({
        societyId,
        flatNumber,
        serviceProvider: provider,
        createdByUserId: userId,
        windowHours: hours
      })
      setMessage(`${provider} pre-approved for ${hours}h (until ${new Date(row.expected_window_end).toLocaleString()})`)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to pre-approve delivery')
    } finally {
      setBusy(null)
    }
  }

  async function handleCourierPostalSlot() {
    setBusy('courier-postal')
    setError(null)
    setMessage(null)
    try {
      const row = await createExpectedCourierPostalSlot({
        societyId,
        flatNumber,
        serviceProvider: manualProvider,
        createdByUserId: userId
      })
      setMessage(
        `Expected ${manualProvider} slot open for ${COURIER_POSTAL_WINDOW_HOURS}h until ${new Date(row.expected_window_end).toLocaleString()}`
      )
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create courier/postal slot')
    } finally {
      setBusy(null)
    }
  }

  async function handleParseAlert() {
    setBusy('parse')
    setError(null)
    setMessage(null)
    try {
      const { match, preApproval } = await interceptDeliveryNotification({
        societyId,
        flatNumber,
        notificationText: alertPaste,
        createdByUserId: userId,
        autoCreate: true
      })
      if (!match || !preApproval) {
        setError('No delivery intent found. Try phrases like “out for delivery”, “courier”, or a brand name.')
        return
      }
      setMessage(
        `Detected ${match.provider} (${match.matchedTrigger}) — pre-approved ${match.suggestedWindowHours}h`
      )
      setAlertPaste('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to parse notification')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-6'}>
      {!compact ? (
        <div>
          <p className={ui.eyebrow}>Universal delivery clearance</p>
          <h3 className={`mt-2 ${ui.heading}`}>Pre-approve any courier or postal delivery</h3>
          <p className={`mt-2 ${ui.body}`}>
            Food apps default to {FOOD_QUICK_WINDOW_HOURS}h. Courier, logistics, and postal slots can run up to{' '}
            {COURIER_POSTAL_WINDOW_HOURS}h — including SMS / WhatsApp “out for delivery” alerts.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {QUICK_DELIVERY_PROVIDERS.map((provider) => (
          <button
            key={provider}
            type="button"
            disabled={busy === provider}
            onClick={() => void handleQuickApprove(provider)}
            className={ui.btnSecondary}
          >
            {busy === provider ? 'Saving…' : provider}
          </button>
        ))}
      </div>

      {!compact ? (
        <>
          <div className="rounded-2xl border border-slate-200 bg-syncra-surface-alt/70 p-4">
            <p className="text-sm font-semibold text-syncra-primary">
              Expected Courier / Postal Delivery ({COURIER_POSTAL_WINDOW_HOURS}h)
            </p>
            <p className={`mt-1 text-sm ${ui.body}`}>
              Manually open a half-day clearance for India Post, registered parcels, or any local courier.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <select
                className={ui.input}
                value={manualProvider}
                onChange={(e) => setManualProvider(e.target.value as DeliveryServiceProvider)}
              >
                {DELIVERY_PROVIDER_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {DELIVERY_CATEGORY_LABELS[option.category]} — {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={ui.btnPrimary}
                disabled={busy === 'courier-postal'}
                onClick={() => void handleCourierPostalSlot()}
              >
                {busy === 'courier-postal' ? 'Creating…' : `Open ${COURIER_POSTAL_WINDOW_HOURS}h slot`}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-syncra-primary">Paste SMS / WhatsApp / app alert</p>
                <p className={`mt-1 text-sm ${ui.body}`}>
                  Universal parser looks for brand names plus triggers like “out for delivery”, “arriving today”,
                  “courier”, “speed post”, “delivery agent”, and “shipment”.
                  {autoListenAvailable && smsConsent !== 'granted'
                    ? ' Manual paste stays available if automatic SMS listening is off.'
                    : null}
                </p>
              </div>
              {autoListenAvailable ? (
                <button
                  type="button"
                  className={ui.btnGhost}
                  onClick={() => {
                    if (smsConsent === 'granted') {
                      setDeliverySmsConsentLocal('denied')
                      setSmsConsent('denied')
                      void DeliveryListener.setConsent({ consent: 'denied' }).catch(() => undefined)
                      void DeliveryListener.stopListening().catch(() => undefined)
                      setMessage('Automatic SMS listening turned off. Use 1-tap or paste below.')
                    } else {
                      setConsentOpen(true)
                    }
                  }}
                >
                  {smsConsent === 'granted' ? 'Disable auto listen' : 'Enable auto SMS listen'}
                </button>
              ) : null}
            </div>
            {autoListenAvailable && smsConsent === 'granted' ? (
              <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Automatic gate pre-approval is on — delivery SMS / courier alerts are filtered on-device.
              </p>
            ) : null}
            <textarea
              className={`${ui.input} mt-3 min-h-[88px]`}
              value={alertPaste}
              onChange={(e) => setAlertPaste(e.target.value)}
              placeholder="e.g. Your Delhivery shipment is out for delivery and arriving today."
            />
            <button
              type="button"
              className={`mt-3 ${ui.btnSecondary}`}
              disabled={busy === 'parse' || !alertPaste.trim()}
              onClick={() => void handleParseAlert()}
            >
              {busy === 'parse' ? 'Parsing…' : 'Detect & pre-approve'}
            </button>
          </div>

          <SMSConsentModal
            open={consentOpen}
            onClose={() => setConsentOpen(false)}
            onGranted={() => {
              setSmsConsent('granted')
              setMessage('Automatic delivery listening enabled for this device.')
            }}
            onDenied={() => {
              setSmsConsent('denied')
              setMessage('Continuing with manual 1-tap / paste pre-approval.')
            }}
          />

          <div className="space-y-4">
            {catalog.map((group) => (
              <div key={group.category}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.providers.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => void handleQuickApprove(provider.id)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-syncra-accent/40 hover:bg-syncra-accent/5"
                    >
                      {provider.shortLabel}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <span className="font-medium text-syncra-primary">
              {row.service_provider} · Flat {row.flat_number}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                row.status === 'PRE_APPROVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : row.status === 'EXPIRED'
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-sky-100 text-sky-800'
              }`}
            >
              {row.status.replace('_', ' ')} · until {new Date(row.expected_window_end).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
