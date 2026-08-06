import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  allocateVisitorSlot,
  ensureStaticSlotsForFlats,
  listActiveAllocations,
  listParkingSlots,
  listPresence,
  setFlatPresence,
  type ParkingAllocation,
  type ParkingPresence,
  type ParkingSlot
} from '../../api/smartParking'
import { formatInr, getParkingWallet, setEarnFromMySlot } from '../../api/parkingMonetizationService'
import { useAuth } from '../../providers/AuthProvider'
import { ui } from '../../lib/ui'

export default function SmartParkingPage() {
  const { currentSocietyId, user } = useAuth()
  const societyId = currentSocietyId ?? ''
  const flatNumber = user?.flatNumber ?? 'A-101'
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [presence, setPresence] = useState<ParkingPresence[]>([])
  const [allocations, setAllocations] = useState<ParkingAllocation[]>([])
  const [visitorLabel, setVisitorLabel] = useState('')
  const [earnOn, setEarnOn] = useState(false)
  const [earnings, setEarnings] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    if (!societyId) return
    await ensureStaticSlotsForFlats(societyId, [flatNumber, 'A-102', 'B-201', 'C-304'])
    const [nextSlots, nextPresence, nextAlloc] = await Promise.all([
      listParkingSlots(societyId),
      listPresence(societyId),
      listActiveAllocations(societyId)
    ])
    setSlots(nextSlots)
    setPresence(nextPresence)
    setAllocations(nextAlloc)
    if (user?.id) {
      const wallet = await getParkingWallet(societyId, user.id)
      setEarnings(Number(wallet?.lifetime_earned_inr || 0))
    }
  }

  useEffect(() => {
    void reload().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load parking'))
  }, [societyId, flatNumber, user?.id])

  const myStatus =
    presence.find((row) => row.flatNumber === flatNumber)?.status ?? 'in_station'

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>Zero-hardware</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Smart Parking</h2>
        <p className={`mt-2 ${ui.body}`}>
          Static bays are mapped per flat. Monetize vacant hours or lease unused slots — software listings and UPI
          credits, no sensors required.
        </p>
        <Link to="/resident/parking-marketplace" className={`mt-4 inline-flex ${ui.btnPrimary}`}>
          Open parking marketplace
        </Link>
      </section>

      <section className={ui.card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className={ui.heading}>Earn from my slot</h3>
            <p className={`mt-1 text-sm ${ui.body}`}>
              Lifetime rental credits: <span className="font-semibold">{formatInr(earnings)}</span>
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-syncra-primary">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={earnOn}
              disabled={!user?.id}
              onChange={(e) => {
                if (!user?.id) return
                const enabled = e.target.checked
                setEarnOn(enabled)
                void setEarnFromMySlot({
                  societyId,
                  ownerUserId: user.id,
                  ownerFlatNumber: flatNumber,
                  enabled,
                  hourlyRateInr: 20
                })
                  .then(() => {
                    setMessage(enabled ? 'Hourly earn listing is live.' : 'Earning paused.')
                    return reload()
                  })
                  .catch((err) => {
                    setEarnOn(!enabled)
                    setError(err instanceof Error ? err.message : 'Earn toggle failed')
                  })
              }}
            />
            {earnOn ? 'Earning ON' : 'Earning OFF'}
          </label>
        </div>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Your presence</h3>
        <p className={`mt-2 ${ui.body}`}>
          Flat <span className="font-semibold">{flatNumber}</span> is currently{' '}
          <span className="font-semibold">{myStatus === 'out_of_station' ? 'out of station' : 'in station'}</span>.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className={ui.btnPrimary}
            onClick={() =>
              void setFlatPresence(societyId, flatNumber, 'out_of_station')
                .then(reload)
                .then(() => setMessage('Marked out of station — slot available for visitors.'))
                .catch((err) => setError(err instanceof Error ? err.message : 'Update failed'))
            }
          >
            Mark out of station
          </button>
          <button
            type="button"
            className={ui.btnGhost}
            onClick={() =>
              void setFlatPresence(societyId, flatNumber, 'in_station')
                .then(reload)
                .then(() => setMessage('Marked in station — slot reserved for your vehicle.'))
                .catch((err) => setError(err instanceof Error ? err.message : 'Update failed'))
            }
          >
            Mark in station
          </button>
        </div>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Allocate visitor slot (legacy free pool)</h3>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            className={ui.input}
            placeholder="Visitor name / vehicle"
            value={visitorLabel}
            onChange={(event) => setVisitorLabel(event.target.value)}
          />
          <button
            type="button"
            className={ui.btnSecondary}
            onClick={() => {
              setError(null)
              void allocateVisitorSlot({
                societyId,
                visitorLabel: visitorLabel.trim() || 'Visitor',
                guestFlat: flatNumber
              })
                .then(() => {
                  setVisitorLabel('')
                  setMessage('Visitor slot allocated from an out-of-station bay.')
                  return reload()
                })
                .catch((err) => setError(err instanceof Error ? err.message : 'Allocation failed'))
            }}
          >
            Allocate
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-syncra-action-alt">{error}</p> : null}
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Live map</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {slots.map((slot) => {
            const status = presence.find((p) => p.flatNumber === slot.flatNumber)?.status ?? 'in_station'
            const alloc = allocations.find((a) => a.slotId === slot.id)
            return (
              <div key={slot.id} className={ui.innerItem}>
                <p className="text-sm font-semibold text-syncra-primary">{slot.slotCode}</p>
                <p className="mt-1 text-xs text-slate-500">Flat {slot.flatNumber}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {alloc
                    ? `Visitor: ${alloc.visitorLabel}`
                    : status === 'out_of_station'
                      ? 'Available for visitors'
                      : 'Occupied / reserved'}
                </p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
