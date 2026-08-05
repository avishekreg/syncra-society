import React, { useState } from 'react'
import {
  COURIER_POSTAL_WINDOW_HOURS,
  QUICK_DELIVERY_PROVIDERS,
  createExpectedCourierPostalSlot,
  defaultWindowHoursForProvider,
  quickPreApproveDelivery
} from '../../api/deliveryApprovalService'
import type { DeliveryServiceProvider } from '../../types/db'

type Props = {
  societyId: string
  flatNumber: string
  userId?: string
}

export default function DeliveryQuickApproveFab({ societyId, flatNumber, userId }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(text: string) {
    setToast(text)
    window.setTimeout(() => setToast(null), 4000)
  }

  async function approve(provider: DeliveryServiceProvider) {
    setBusy(true)
    try {
      const hours = defaultWindowHoursForProvider(provider)
      const row = await quickPreApproveDelivery({
        societyId,
        flatNumber,
        serviceProvider: provider,
        createdByUserId: userId,
        windowHours: hours
      })
      showToast(`${provider} cleared ${hours}h · until ${new Date(row.expected_window_end).toLocaleTimeString()}`)
      setOpen(false)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Pre-approve failed')
    } finally {
      setBusy(false)
    }
  }

  async function openCourierPostalSlot() {
    setBusy(true)
    try {
      const row = await createExpectedCourierPostalSlot({
        societyId,
        flatNumber,
        createdByUserId: userId
      })
      showToast(
        `Courier/Postal ${COURIER_POSTAL_WINDOW_HOURS}h slot · until ${new Date(row.expected_window_end).toLocaleTimeString()}`
      )
      setOpen(false)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Courier slot failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {toast ? (
        <div className="fixed bottom-24 right-4 z-40 max-w-xs rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-800 shadow-card sm:right-6">
          {toast}
        </div>
      ) : null}

      {open ? (
        <div className="fixed bottom-24 right-4 z-40 max-h-[70vh] w-[min(100vw-2rem,20rem)] space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-card sm:right-6">
          <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Universal delivery clear
          </p>
          {QUICK_DELIVERY_PROVIDERS.map((provider) => {
            const hours = defaultWindowHoursForProvider(provider)
            return (
              <button
                key={provider}
                type="button"
                disabled={busy}
                onClick={() => void approve(provider)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm font-semibold text-syncra-primary transition hover:border-syncra-accent/40 hover:bg-syncra-accent/5"
              >
                <span>{provider}</span>
                <span className="text-xs font-medium text-slate-500">{hours} hrs</span>
              </button>
            )
          })}
          <button
            type="button"
            disabled={busy}
            onClick={() => void openCourierPostalSlot()}
            className="flex w-full items-center justify-between rounded-xl border border-syncra-accent/30 bg-syncra-accent/5 px-3 py-2.5 text-left text-sm font-semibold text-syncra-blue transition hover:bg-syncra-accent/10"
          >
            <span>Expected Courier / Postal</span>
            <span className="text-xs font-medium text-slate-500">{COURIER_POSTAL_WINDOW_HOURS} hrs</span>
          </button>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Quick delivery pre-approve"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-syncra-action text-2xl text-white shadow-lg transition hover:bg-[#e67e00] sm:right-6"
      >
        {open ? '×' : '📦'}
      </button>
    </>
  )
}
