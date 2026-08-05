import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  acceptCarpoolRequest,
  listActiveCarpoolRides,
  listRequestsForRide,
  offerCarpoolRide,
  rejectCarpoolRequest,
  requestCarpoolSeat
} from '../../api/carpoolService'
import type { CarpoolRequest, CarpoolRide } from '../../types/db'
import { ui } from '../../lib/ui'

export default function ResidentCarpoolPage() {
  const { currentSocietyId, user } = useAuth()
  const societyId = currentSocietyId
  const flatNumber = user?.flatNumber
  const userId = user?.id

  const [rides, setRides] = useState<CarpoolRide[]>([])
  const [hostRequests, setHostRequests] = useState<Record<string, CarpoolRequest[]>>({})
  const [destination, setDestination] = useState('')
  const [departure, setDeparture] = useState('')
  const [seats, setSeats] = useState(2)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function refresh() {
    if (!societyId || !userId) return
    const list = await listActiveCarpoolRides(societyId)
    setRides(list)
    const mine = list.filter((r) => r.offered_by_user_id === userId)
    const map: Record<string, CarpoolRequest[]> = {}
    await Promise.all(
      mine.map(async (ride) => {
        map[ride.id] = await listRequestsForRide(ride.id)
      })
    )
    setHostRequests(map)
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Unable to load rides'))
  }, [societyId, userId])

  if (!societyId || !flatNumber || !userId) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Link your flat to use maiCommute.</p>
      </section>
    )
  }

  async function handleOffer(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await offerCarpoolRide({
        societyId,
        flatNumber,
        userId,
        destination,
        departureTime: new Date(departure).toISOString(),
        availableSeats: seats,
        notes
      })
      setDestination('')
      setNotes('')
      setMessage('Ride published to verified neighbors.')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to offer ride')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>maiCommute</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>In-society smart carpool</h2>
        <p className={`mt-2 ${ui.body}`}>
          Zero-commission peer rides with verified neighbors — tech parks, offices, schools, and weekends.
        </p>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Offer a ride</h3>
        <form onSubmit={handleOffer} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className={ui.label}>Destination</label>
            <input className={ui.input} value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Manyata Tech Park / ORR" required />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Departure</label>
            <input className={ui.input} type="datetime-local" value={departure} onChange={(e) => setDeparture(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Seats</label>
            <input className={ui.input} type="number" min={1} max={6} value={seats} onChange={(e) => setSeats(Number(e.target.value) || 1)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className={ui.label}>Notes</label>
            <input className={ui.input} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Via Hebbal flyover · AC" />
          </div>
          <button type="submit" className={ui.btnPrimary} disabled={busy}>
            Publish ride
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {rides.map((ride) => (
          <article key={ride.id} className={ui.card}>
            <h4 className="text-lg font-semibold text-syncra-primary">{ride.destination}</h4>
            <p className={`mt-1 text-sm ${ui.body}`}>
              Flat {ride.offered_by_flat_number} · {new Date(ride.departure_time).toLocaleString()} · {ride.available_seats} seats
            </p>
            {ride.notes ? <p className={`mt-2 text-sm ${ui.body}`}>{ride.notes}</p> : null}
            {ride.offered_by_user_id !== userId ? (
              <button
                type="button"
                className={`mt-4 ${ui.btnSecondary}`}
                disabled={busy || ride.available_seats < 1}
                onClick={() =>
                  void requestCarpoolSeat({
                    rideId: ride.id,
                    passengerUserId: userId,
                    passengerFlatNumber: flatNumber,
                    societyId
                  })
                    .then(() => {
                      setMessage('Seat request sent to the host.')
                      return refresh()
                    })
                    .catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))
                }
              >
                Request a seat
              </button>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Incoming requests</p>
                {(hostRequests[ride.id] ?? []).length === 0 ? (
                  <p className={`text-sm ${ui.body}`}>No requests yet.</p>
                ) : null}
                {(hostRequests[ride.id] ?? []).map((req) => (
                  <div key={req.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2">
                    <span className="text-sm font-medium">Flat {req.passenger_flat_number} · {req.status}</span>
                    {req.status === 'PENDING' ? (
                      <span className="flex gap-2">
                        <button type="button" className={ui.btnPrimary} onClick={() => void acceptCarpoolRequest(req.id).then(refresh)}>
                          Accept
                        </button>
                        <button type="button" className={ui.btnGhost} onClick={() => void rejectCarpoolRequest(req.id).then(refresh)}>
                          Reject
                        </button>
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}
