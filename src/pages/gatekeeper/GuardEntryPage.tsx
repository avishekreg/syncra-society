import React, { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  logStaffEntry,
  validateStaffPass,
  type StaffPassValidation
} from '../../api/staffPassService'
import {
  GUARD_QUICK_CLEAR_PROVIDERS,
  completeDeliveryPreApproval,
  filterDeliveriesByProvider,
  listActiveDeliveryPreApprovals
} from '../../api/deliveryApprovalService'
import type { DeliveryPreApproval, DeliveryServiceProvider } from '../../types/db'
import { useAuth } from '../../providers/AuthProvider'
import GuardOpsPanels from '../../components/gatekeeper/GuardOpsPanels'
import { ui } from '../../lib/ui'

type GatekeeperOutletContext = {
  societyId: string | null
  societyName: string
}

type GuardClearFilter = DeliveryServiceProvider | 'Postal / Local Courier' | 'All'

export default function GuardEntryPage() {
  const { societyId, societyName } = useOutletContext<GatekeeperOutletContext>()
  const { user } = useAuth()
  const [qrInput, setQrInput] = useState('')
  const [validation, setValidation] = useState<StaffPassValidation | null>(null)
  const [deliveries, setDeliveries] = useState<DeliveryPreApproval[]>([])
  const [clearFilter, setClearFilter] = useState<GuardClearFilter>('All')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function refreshDeliveries() {
    if (!societyId) return
    try {
      setDeliveries(await listActiveDeliveryPreApprovals(societyId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load pre-approvals')
    }
  }

  useEffect(() => {
    void refreshDeliveries()
    const timer = window.setInterval(() => void refreshDeliveries(), 30_000)
    return () => window.clearInterval(timer)
  }, [societyId])

  const visibleDeliveries = useMemo(() => {
    if (clearFilter === 'All') return deliveries
    return filterDeliveriesByProvider(deliveries, clearFilter)
  }, [clearFilter, deliveries])

  async function handleScan(event: React.FormEvent) {
    event.preventDefault()
    if (!societyId) return
    setBusy(true)
    setError(null)
    setMessage(null)
    setValidation(null)
    try {
      const result = await validateStaffPass(societyId, qrInput)
      setValidation(result)
      if (result.withinWindow) {
        await logStaffEntry({
          societyId,
          staffId: result.staff.id,
          scannedByUserId: user?.id,
          outsideWindow: false,
          overrideUsed: false,
          notes: 'Fast-track staff entry'
        })
        setMessage(`Entry logged for ${result.staff.name} (Flat ${result.staff.flat_number}) — resident not rung.`)
        setQrInput('')
        setValidation(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleOverride() {
    if (!societyId || !validation) return
    setBusy(true)
    setError(null)
    try {
      await logStaffEntry({
        societyId,
        staffId: validation.staff.id,
        scannedByUserId: user?.id,
        outsideWindow: true,
        overrideUsed: true,
        notes: validation.alert
      })
      setMessage(`Manual override logged for ${validation.staff.name}.`)
      setValidation(null)
      setQrInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Override failed')
    } finally {
      setBusy(false)
    }
  }

  async function clearDelivery(id: string, label?: string) {
    setBusy(true)
    try {
      await completeDeliveryPreApproval(id)
      setMessage(label ? `${label} cleared.` : 'Delivery cleared.')
      await refreshDeliveries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete delivery')
    } finally {
      setBusy(false)
    }
  }

  async function clearFirstMatching(provider: GuardClearFilter) {
    const matches =
      provider === 'All' ? deliveries : filterDeliveriesByProvider(deliveries, provider)
    if (matches.length === 0) {
      setError(`No active ${provider === 'All' ? 'delivery' : provider} pre-approvals.`)
      return
    }
    await clearDelivery(matches[0].id, `${matches[0].service_provider} → Flat ${matches[0].flat_number}`)
  }

  if (!societyId) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Society context required for guard entry desk.</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <GuardOpsPanels societyId={societyId} />

      <section className={ui.card}>
        <p className={ui.eyebrow}>Guard entry desk</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>{societyName || 'Society'} — Quick scan</h2>
        <p className={`mt-2 ${ui.body}`}>
          Scan recurring staff QR passes for silent entry. Outside-window scans prompt override without hard block.
        </p>

        <form onSubmit={handleScan} className="mt-6 space-y-3">
          <label className={ui.label} htmlFor="qr-scan">
            Staff QR / pass code
          </label>
          <input
            id="qr-scan"
            className={ui.input}
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="STAFF-…"
            autoComplete="off"
          />
          <button type="submit" className={ui.btnPrimary} disabled={busy || !qrInput.trim()}>
            {busy ? 'Checking…' : 'Validate & log entry'}
          </button>
        </form>

        {validation?.alert ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">{validation.alert}</p>
            <p className={`mt-1 text-sm ${ui.body}`}>
              {validation.staff.name} · Flat {validation.staff.flat_number} · {validation.staff.role}
            </p>
            <button type="button" className={`mt-3 ${ui.btnSecondary}`} disabled={busy} onClick={() => void handleOverride()}>
              Manual override — allow entry
            </button>
          </div>
        ) : null}

        {message ? <p className="mt-4 text-sm font-medium text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Universal delivery quick-clear</h3>
        <p className={`mt-2 ${ui.body}`}>
          1-tap clearance for branded logistics and Postal / Local Courier — food, e-commerce, and India Post.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setClearFilter('All')
              setError(null)
            }}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              clearFilter === 'All' ? 'bg-syncra-blue text-white' : 'border border-slate-200 text-slate-600'
            }`}
          >
            All
          </button>
          {GUARD_QUICK_CLEAR_PROVIDERS.map((provider) => (
            <button
              key={provider}
              type="button"
              disabled={busy}
              onClick={() => {
                setClearFilter(provider)
                setError(null)
                void clearFirstMatching(provider)
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                clearFilter === provider
                  ? 'bg-syncra-blue text-white'
                  : 'border border-slate-200 text-slate-700 hover:border-syncra-accent/40 hover:bg-syncra-accent/5'
              }`}
            >
              {provider === 'Generic Courier / Parcel' ? 'Local Courier' : provider === 'India Post / Speed Post' ? 'India Post' : provider}
            </button>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setClearFilter('Postal / Local Courier')
              setError(null)
              void clearFirstMatching('Postal / Local Courier')
            }}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              clearFilter === 'Postal / Local Courier'
                ? 'bg-syncra-action text-white'
                : 'border border-syncra-action/30 bg-syncra-action/10 text-syncra-primary hover:bg-syncra-action/15'
            }`}
          >
            Postal / Local Courier
          </button>
        </div>

        <ul className="mt-4 space-y-3">
          {visibleDeliveries.length === 0 ? (
            <li className={ui.body}>No active pre-approvals for this filter.</li>
          ) : null}
          {visibleDeliveries.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-3"
            >
              <div>
                <p className="font-semibold text-syncra-primary">
                  {row.service_provider} → Flat {row.flat_number}
                </p>
                <p className={`text-sm ${ui.body}`}>
                  Until {new Date(row.expected_window_end).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                className={ui.btnSecondary}
                disabled={busy}
                onClick={() => void clearDelivery(row.id, `${row.service_provider} → Flat ${row.flat_number}`)}
              >
                Clear entry
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
