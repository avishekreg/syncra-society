import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  bookAmenitySlot,
  buildDaySlots,
  isSlotAvailable,
  listAmenities,
  listBookingsForAmenityDate,
  listMyAmenityBookings
} from '../../api/amenityBookingService'
import type { Amenity, AmenityBooking } from '../../types/db'
import { formatInr } from '../../lib/platformPricing'
import { ui } from '../../lib/ui'

export default function ResidentAmenitiesPage() {
  const { currentSocietyId, user } = useAuth()
  const societyId = currentSocietyId
  const flatNumber = user?.flatNumber
  const userId = user?.id

  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [dayBookings, setDayBookings] = useState<AmenityBooking[]>([])
  const [myBookings, setMyBookings] = useState<AmenityBooking[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const selected = amenities.find((a) => a.id === selectedId) ?? amenities[0]

  useEffect(() => {
    if (!societyId || !userId) return
    void (async () => {
      try {
        const list = await listAmenities(societyId)
        setAmenities(list)
        setSelectedId((prev) => prev || list[0]?.id || '')
        setMyBookings(await listMyAmenityBookings(societyId, userId))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load amenities')
      }
    })()
  }, [societyId, userId])

  useEffect(() => {
    if (!selected?.id || !date) return
    void listBookingsForAmenityDate(selected.id, date)
      .then(setDayBookings)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load slots'))
  }, [selected?.id, date])

  const slots = useMemo(
    () => (selected ? buildDaySlots(selected.slot_duration_mins) : []),
    [selected]
  )

  if (!societyId || !flatNumber || !userId) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Link your flat to book amenities.</p>
      </section>
    )
  }

  async function handleBook(start: string, end: string) {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await bookAmenitySlot({
        societyId,
        amenityId: selected.id,
        flatNumber,
        userId,
        bookingDate: date,
        startTime: start,
        endTime: end
      })
      setMessage(`Booked ${selected.name} ${start}–${end}`)
      setDayBookings(await listBookingsForAmenityDate(selected.id, date))
      setMyBookings(await listMyAmenityBookings(societyId, userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Amenities</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Clubhouse & facility booking</h2>
        <p className={`mt-2 ${ui.body}`}>Instant slot reservations with double-booking protection.</p>
      </section>

      <div className="flex flex-wrap gap-2">
        {amenities.map((amenity) => (
          <button
            key={amenity.id}
            type="button"
            onClick={() => setSelectedId(amenity.id)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
              selected?.id === amenity.id ? 'bg-syncra-blue text-white' : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            {amenity.name}
          </button>
        ))}
      </div>

      {selected ? (
        <section className={ui.card}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className={ui.heading}>{selected.name}</h3>
              <p className={`mt-1 text-sm ${ui.body}`}>
                {selected.slot_duration_mins} min slots · capacity {selected.capacity} ·{' '}
                {selected.pricing_type === 'PAID' ? formatInr(selected.price_per_slot) : 'Free'}
              </p>
            </div>
            <div className="space-y-2">
              <label className={ui.label}>Date</label>
              <input className={ui.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {slots.map((slot) => {
              const free = isSlotAvailable(selected, dayBookings, slot.start, slot.end)
              return (
                <button
                  key={`${slot.start}-${slot.end}`}
                  type="button"
                  disabled={!free || busy}
                  onClick={() => void handleBook(slot.start, slot.end)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                    free
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                  }`}
                >
                  {slot.start}–{slot.end}
                  <span className="mt-1 block text-[11px] font-medium">{free ? 'Available' : 'Booked'}</span>
                </button>
              )
            })}
          </div>
          {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
        </section>
      ) : null}

      <section className={ui.card}>
        <h3 className={ui.heading}>My bookings</h3>
        <ul className="mt-4 space-y-2">
          {myBookings.length === 0 ? <li className={ui.body}>No bookings yet.</li> : null}
          {myBookings.slice(0, 8).map((b) => (
            <li key={b.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              {b.booking_date} · {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)} · {b.status}
              {b.amount_paid > 0 ? ` · ${formatInr(b.amount_paid)}` : ''}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
