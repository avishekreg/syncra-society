import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { listAllAmenitiesAdmin, upsertAmenity } from '../../api/amenityBookingService'
import type { Amenity } from '../../types/db'
import { formatInr } from '../../lib/platformPricing'
import { ui } from '../../lib/ui'

export default function AdminAmenitiesPage() {
  const { currentSocietyId } = useAuth()
  const [rows, setRows] = useState<Amenity[]>([])
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState(1)
  const [duration, setDuration] = useState(60)
  const [paid, setPaid] = useState(false)
  const [price, setPrice] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!currentSocietyId) return
    setRows(await listAllAmenitiesAdmin(currentSocietyId))
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [currentSocietyId])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!currentSocietyId) return
    try {
      await upsertAmenity({
        societyId: currentSocietyId,
        name,
        capacity,
        slotDurationMins: duration,
        pricingType: paid ? 'PAID' : 'FREE',
        pricePerSlot: price
      })
      setName('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Amenities</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Society facility slots</h2>
        <p className={`mt-2 ${ui.body}`}>Configure clubhouse, pool, courts, banquet, and guest rooms.</p>
      </section>

      <section className={ui.card}>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className={ui.label}>Name</label>
            <input className={ui.input} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Capacity</label>
            <input className={ui.input} type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value) || 1)} />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Slot minutes</label>
            <input className={ui.input} type="number" min={15} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 60)} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
            Paid amenity
          </label>
          {paid ? (
            <div className="space-y-2">
              <label className={ui.label}>Price / slot</label>
              <input className={ui.input} type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} />
            </div>
          ) : null}
          <button type="submit" className={ui.btnPrimary}>
            Add amenity
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((row) => (
          <article key={row.id} className={ui.card}>
            <h3 className="font-semibold text-syncra-primary">{row.name}</h3>
            <p className={`mt-1 text-sm ${ui.body}`}>
              {row.slot_duration_mins} min · cap {row.capacity} ·{' '}
              {row.pricing_type === 'PAID' ? formatInr(row.price_per_slot) : 'Free'} ·{' '}
              {row.is_active ? 'Active' : 'Inactive'}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
