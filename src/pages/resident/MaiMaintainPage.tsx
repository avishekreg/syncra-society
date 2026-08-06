import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  applianceDefaults,
  listAppliances,
  listTechnicianBookings,
  markApplianceServiced,
  requestTechnicianBooking,
  urgencyLabel,
  upsertAppliance,
  type ApplianceKind,
  type MaintainAppliance,
  type TechnicianBooking
} from '../../services/maintainService'
import { ui } from '../../lib/ui'

const KINDS: ApplianceKind[] = ['RO_FILTER', 'SPLIT_AC', 'CHIMNEY', 'GEYSER', 'OTHER']

export default function ResidentMaiMaintainPage() {
  const { currentSocietyId, user } = useAuth()
  const flat = user?.flatNumber || 'A-101'
  const [appliances, setAppliances] = useState<MaintainAppliance[]>([])
  const [bookings, setBookings] = useState<TechnicianBooking[]>([])
  const [kind, setKind] = useState<ApplianceKind>('RO_FILTER')
  const [brand, setBrand] = useState('')
  const [amc, setAmc] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!currentSocietyId) return
    const [apps, books] = await Promise.all([
      listAppliances(currentSocietyId, flat),
      listTechnicianBookings(currentSocietyId, flat)
    ])
    setAppliances(apps)
    setBookings(books)
  }, [currentSocietyId, flat])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function addAppliance(e: React.FormEvent) {
    e.preventDefault()
    if (!currentSocietyId) return
    setBusy(true)
    setMessage(null)
    try {
      await upsertAppliance({
        societyId: currentSocietyId,
        flatNumber: flat,
        kind,
        brand: brand || undefined,
        amcExpiresOn: amc || undefined
      })
      setBrand('')
      setAmc('')
      setMessage('Appliance added. Service reminders will fire before the due date.')
      await refresh()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to add appliance')
    } finally {
      setBusy(false)
    }
  }

  async function serviceNow(id: string) {
    if (!currentSocietyId) return
    setBusy(true)
    try {
      await markApplianceServiced(id, currentSocietyId)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function bookTech(appliance: MaintainAppliance) {
    if (!currentSocietyId) return
    setBusy(true)
    try {
      await requestTechnicianBooking({
        societyId: currentSocietyId,
        flatNumber: flat,
        applianceId: appliance.id,
        category: appliance.kind,
        preferredSlot: 'Weekend morning'
      })
      setMessage('Technician referral requested — local verified partner will be matched.')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>mAI Maintain · Flat {flat}</p>
        <h1 className={`mt-2 ${ui.headingLg}`}>Appliance ledger & service radar</h1>
        <p className={`mt-2 ${ui.body}`}>
          Zero-hardware reminders for RO filters, ACs, chimneys, and geysers — plus 1-click verified technician
          booking. Push & WhatsApp alerts fire before service due or AMC expiry.
        </p>
      </section>

      {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}

      <section className={ui.card}>
        <h2 className={ui.heading}>Register appliance</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(e) => void addAppliance(e)}>
          <label className="text-sm font-medium text-slate-700">
            Type
            <select className={`mt-1 ${ui.input}`} value={kind} onChange={(e) => setKind(e.target.value as ApplianceKind)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {applianceDefaults(k).label} · every {applianceDefaults(k).cycleDays}d
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Brand (optional)
            <input className={`mt-1 ${ui.input}`} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Kent / Daikin" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            AMC expires (optional)
            <input className={`mt-1 ${ui.input}`} type="date" value={amc} onChange={(e) => setAmc(e.target.value)} />
          </label>
          <div className="flex items-end">
            <button type="submit" className={ui.btnPrimary} disabled={busy}>
              Add to ledger
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {appliances.length === 0 ? (
          <div className={`${ui.card} md:col-span-2`}>
            <p className={ui.body}>No appliances yet. Add your RO filter or AC to start the service countdown.</p>
          </div>
        ) : (
          appliances.map((app) => {
            const urg = urgencyLabel(app.next_service_due)
            return (
              <article key={app.id} className={ui.card}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-syncra-primary">{app.label}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {app.brand || 'No brand'} · Cycle {app.service_cycle_days} days
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                      urg.tone === 'overdue'
                        ? 'bg-rose-100 text-rose-700'
                        : urg.tone === 'soon'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {urg.label}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Next service <strong>{app.next_service_due}</strong>
                  {app.amc_expires_on ? ` · AMC ${app.amc_expires_on}` : ''}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className={ui.btnSecondary} disabled={busy} onClick={() => void serviceNow(app.id)}>
                    Mark serviced
                  </button>
                  <button type="button" className={ui.btnPrimary} disabled={busy} onClick={() => void bookTech(app)}>
                    Book technician
                  </button>
                </div>
              </article>
            )
          })
        )}
      </section>

      <section className={ui.card}>
        <h2 className={ui.heading}>Technician bookings</h2>
        {bookings.length === 0 ? (
          <p className={`mt-2 ${ui.body}`}>No referrals yet. Book from an appliance card to monetize local AMC partners.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {bookings.map((b) => (
              <li key={b.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <strong className="capitalize">{b.status}</strong> · {b.category}
                {b.preferred_slot ? ` · ${b.preferred_slot}` : ''}
                <span className="mt-1 block text-xs text-slate-500">{b.referral_note}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
