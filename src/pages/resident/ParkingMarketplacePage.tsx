import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import {
  bookHourlySlot,
  bookMonthlyLease,
  confirmUpiPayment,
  createParkingListing,
  formatInr,
  getParkingWallet,
  listActiveMarketplaceListings,
  listParkingBookings,
  listParkingListings,
  processVacateReminders,
  setEarnFromMySlot
} from '../../api/parkingMonetizationService'
import type { ParkingMarketplaceBooking, ParkingMarketplaceListing, ParkingOwnerWallet } from '../../types/db'
import { ui } from '../../lib/ui'

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ResidentParkingMarketplacePage() {
  const { currentSocietyId, user } = useAuth()
  const [listings, setListings] = useState<ParkingMarketplaceListing[]>([])
  const [mine, setMine] = useState<ParkingMarketplaceListing[]>([])
  const [bookings, setBookings] = useState<ParkingMarketplaceBooking[]>([])
  const [wallet, setWallet] = useState<ParkingOwnerWallet | null>(null)
  const [vacateAlerts, setVacateAlerts] = useState<ParkingMarketplaceListing[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [earnOn, setEarnOn] = useState(false)
  const [hourlyRate, setHourlyRate] = useState('20')
  const [fromLocal, setFromLocal] = useState('09:00')
  const [toLocal, setToLocal] = useState('18:00')
  const [returnAt, setReturnAt] = useState(() => {
    const d = new Date()
    d.setHours(18, 0, 0, 0)
    return toLocalInputValue(d)
  })
  const [upiId, setUpiId] = useState('')

  const [monthlyRate, setMonthlyRate] = useState('2500')
  const [leaseNotes, setLeaseNotes] = useState('')

  const [bookHours, setBookHours] = useState('2')
  const [vehicle, setVehicle] = useState('')
  const [upiRef, setUpiRef] = useState<Record<string, string>>({})

  const societyId = currentSocietyId ?? ''
  const flat = user?.flatNumber ?? ''

  async function refresh() {
    if (!societyId || !user?.id) return
    const [active, myListings, allBookings, w, due] = await Promise.all([
      listActiveMarketplaceListings(societyId),
      listParkingListings(societyId, { ownerUserId: user.id, status: 'ALL' }),
      listParkingBookings(societyId),
      getParkingWallet(societyId, user.id),
      processVacateReminders(societyId)
    ])
    setListings(active)
    setMine(myListings)
    setBookings(allBookings)
    setWallet(w)
    setVacateAlerts(due)
    const hourlyActive = myListings.find((l) => l.mode === 'HOURLY' && l.status === 'ACTIVE' && l.earn_enabled)
    setEarnOn(Boolean(hourlyActive))
    if (hourlyActive?.hourly_rate_inr) setHourlyRate(String(hourlyActive.hourly_rate_inr))
    if (w?.upi_id) setUpiId(w.upi_id)
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [societyId, user?.id])

  const myEarningsBookings = useMemo(() => {
    const myIds = new Set(mine.map((l) => l.id))
    return bookings.filter((b) => myIds.has(b.listing_id) && (b.payment_status === 'CREDITED' || b.payment_status === 'PAID'))
  }, [mine, bookings])

  const lifetimeUi = wallet?.lifetime_earned_inr ?? myEarningsBookings.reduce((s, b) => s + Number(b.amount_inr), 0)
  const balanceUi = wallet?.balance_inr ?? lifetimeUi

  if (!societyId || !user?.id || !flat) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Link your flat to open the parking marketplace.</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Monetized parking</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Parking marketplace</h2>
        <p className={`mt-2 ${ui.body}`}>
          List vacant bays by the hour while you are at work, or lease unused slots monthly to neighbors — software
          listings and UPI credits only. No sensors or boom barriers required.
        </p>
        <Link to="/resident/smart-parking" className={`mt-3 inline-flex ${ui.btnGhost}`}>
          ← Classic Smart Parking map
        </Link>
      </section>

      {vacateAlerts.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Auto-vacate reminder</p>
          <p className="mt-1 text-sm text-amber-800">
            {vacateAlerts.map((l) => l.slot_code).join(', ')} — ask guests to clear the bay within 30 minutes of your
            return ({new Date(vacateAlerts[0].owner_return_at!).toLocaleString()}).
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className={ui.card}>
          <p className={ui.eyebrow}>Wallet balance</p>
          <p className={`mt-2 text-2xl font-semibold text-syncra-primary`}>{formatInr(balanceUi)}</p>
        </article>
        <article className={ui.card}>
          <p className={ui.eyebrow}>Lifetime earned</p>
          <p className={`mt-2 text-2xl font-semibold text-syncra-primary`}>{formatInr(lifetimeUi)}</p>
        </article>
        <article className={ui.card}>
          <p className={ui.eyebrow}>Active listings</p>
          <p className={`mt-2 text-2xl font-semibold text-syncra-primary`}>
            {mine.filter((l) => l.status === 'ACTIVE').length}
          </p>
        </article>
      </section>

      <section className={ui.card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className={ui.heading}>Earn from my slot</h3>
            <p className={`mt-1 text-sm ${ui.body}`}>Mode A — hourly visitor monetization while you are away.</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-syncra-primary">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={earnOn}
              onChange={(e) => {
                const enabled = e.target.checked
                setEarnOn(enabled)
                setError(null)
                void setEarnFromMySlot({
                  societyId,
                  ownerUserId: user.id,
                  ownerFlatNumber: flat,
                  enabled,
                  hourlyRateInr: Number(hourlyRate) || 20,
                  availableFromLocal: fromLocal,
                  availableToLocal: toLocal,
                  ownerReturnAt: new Date(returnAt).toISOString(),
                  upiId: upiId || undefined
                })
                  .then(() => {
                    setMessage(enabled ? 'Hourly listing live — guests can book via UPI.' : 'Earning paused.')
                    return refresh()
                  })
                  .catch((err) => {
                    setEarnOn(!enabled)
                    setError(err instanceof Error ? err.message : 'Update failed')
                  })
              }}
            />
            {earnOn ? 'Earning ON' : 'Earning OFF'}
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <label className={ui.label}>₹ / hour</label>
            <input className={ui.input} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Available from</label>
            <input className={ui.input} type="time" value={fromLocal} onChange={(e) => setFromLocal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Available until</label>
            <input className={ui.input} type="time" value={toLocal} onChange={(e) => setToLocal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Your return time (vacate −30 min)</label>
            <input
              className={ui.input}
              type="datetime-local"
              value={returnAt}
              onChange={(e) => setReturnAt(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className={ui.label}>UPI ID for credits</label>
            <input
              className={ui.input}
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="you@upi"
            />
          </div>
        </div>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Mode B — monthly slot lease</h3>
        <p className={`mt-1 text-sm ${ui.body}`}>List an unused bay for zero-brokerage monthly rental to neighbors.</p>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            void createParkingListing({
              societyId,
              ownerUserId: user.id,
              ownerFlatNumber: flat,
              mode: 'MONTHLY',
              monthlyRateInr: Number(monthlyRate) || 2500,
              notes: leaseNotes,
              upiId: upiId || undefined
            })
              .then(() => {
                setMessage('Monthly lease listing published.')
                setLeaseNotes('')
                return refresh()
              })
              .catch((err) => setError(err instanceof Error ? err.message : 'List failed'))
          }}
        >
          <div className="space-y-2">
            <label className={ui.label}>₹ / month</label>
            <input className={ui.input} value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Notes</label>
            <input
              className={ui.input}
              value={leaseNotes}
              onChange={(e) => setLeaseNotes(e.target.value)}
              placeholder="Covered bay · B2"
            />
          </div>
          <button type="submit" className={`sm:col-span-2 ${ui.btnSecondary}`}>
            Publish monthly lease
          </button>
        </form>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Book a visitor / neighbor slot</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="space-y-2">
            <label className={ui.label}>Hours (hourly bookings)</label>
            <input className={ui.input} value={bookHours} onChange={(e) => setBookHours(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Vehicle</label>
            <input
              className={ui.input}
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="MH-02-AB-1234"
            />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {listings.filter((l) => l.owner_user_id !== user.id).length === 0 ? (
            <p className={ui.body}>No open marketplace listings from other flats right now.</p>
          ) : (
            listings
              .filter((l) => l.owner_user_id !== user.id)
              .map((listing) => (
                <article key={listing.id} className={ui.innerItem}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-syncra-primary">
                        {listing.slot_code} · Flat {listing.owner_flat_number}
                      </p>
                      <p className={`mt-1 text-sm ${ui.body}`}>
                        {listing.mode === 'HOURLY'
                          ? `${formatInr(Number(listing.hourly_rate_inr))} / hr · ${listing.available_from_local}–${listing.available_to_local}`
                          : `${formatInr(Number(listing.monthly_rate_inr))} / month · zero brokerage`}
                      </p>
                      {listing.owner_return_at ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Owner returns {new Date(listing.owner_return_at).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className={ui.btnPrimary}
                      onClick={() => {
                        setError(null)
                        const start = new Date()
                        if (listing.mode === 'HOURLY') {
                          const end = new Date(start.getTime() + Math.max(1, Number(bookHours) || 2) * 3_600_000)
                          void bookHourlySlot({
                            listingId: listing.id,
                            societyId,
                            renterUserId: user.id,
                            renterFlatNumber: flat,
                            renterLabel: user.displayName || `Flat ${flat}`,
                            vehicleLabel: vehicle || undefined,
                            startsAt: start.toISOString(),
                            endsAt: end.toISOString()
                          })
                            .then(() => {
                              setMessage('Hourly booking created — pay via UPI and confirm below.')
                              return refresh()
                            })
                            .catch((err) => setError(err instanceof Error ? err.message : 'Book failed'))
                        } else {
                          void bookMonthlyLease({
                            listingId: listing.id,
                            societyId,
                            renterUserId: user.id,
                            renterFlatNumber: flat,
                            renterLabel: user.displayName || `Flat ${flat}`,
                            vehicleLabel: vehicle || undefined,
                            months: 1
                          })
                            .then(() => {
                              setMessage('Monthly lease booked — pay via UPI and confirm below.')
                              return refresh()
                            })
                            .catch((err) => setError(err instanceof Error ? err.message : 'Lease failed'))
                        }
                      }}
                    >
                      Book {listing.mode === 'HOURLY' ? 'hourly' : 'monthly'}
                    </button>
                  </div>
                </article>
              ))
          )}
        </div>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>My bookings · UPI confirm</h3>
        <div className="mt-4 space-y-3">
          {bookings.filter((b) => b.renter_user_id === user.id).length === 0 ? (
            <p className={ui.body}>No bookings yet.</p>
          ) : (
            bookings
              .filter((b) => b.renter_user_id === user.id)
              .map((b) => (
                <article key={b.id} className={ui.innerItem}>
                  <p className="font-semibold text-syncra-primary">
                    {b.mode} · {formatInr(Number(b.amount_inr))} · {b.payment_status}
                  </p>
                  <p className={`mt-1 text-sm ${ui.body}`}>
                    {new Date(b.starts_at).toLocaleString()} → {new Date(b.ends_at).toLocaleString()}
                    {b.vehicle_label ? ` · ${b.vehicle_label}` : ''}
                  </p>
                  {b.payment_status === 'PENDING_UPI' ? (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        className={ui.input}
                        placeholder="UPI txn ref"
                        value={upiRef[b.id] ?? ''}
                        onChange={(e) => setUpiRef((prev) => ({ ...prev, [b.id]: e.target.value }))}
                      />
                      <button
                        type="button"
                        className={ui.btnSecondary}
                        onClick={() =>
                          void confirmUpiPayment({ bookingId: b.id, upiReference: upiRef[b.id] || '' })
                            .then(() => {
                              setMessage('Payment confirmed — owner wallet credited.')
                              return refresh()
                            })
                            .catch((err) => setError(err instanceof Error ? err.message : 'Confirm failed'))
                        }
                      >
                        Confirm UPI paid
                      </button>
                    </div>
                  ) : null}
                </article>
              ))
          )}
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>
    </div>
  )
}
