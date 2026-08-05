import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  VERIFIED_INTERIOR_PARTNERS,
  computeRecommendedTvSizeInches,
  createSpatialScan,
  dispatchInteriorVendorLead,
  guidanceFromScan,
  listSpatialScans
} from '../../api/maiSpaceService'
import type { InteriorRoomType, InteriorSpatialScan, InteriorVendorCategory } from '../../types/db'
import { ui } from '../../lib/ui'

type Tab = 'scanner' | 'consult'

const ROOM_TYPES: InteriorRoomType[] = ['LIVING_ROOM', 'BEDROOM', 'BALCONY', 'KITCHEN']

export default function ResidentMaiSpacePage() {
  const { currentSocietyId, user } = useAuth()
  const [tab, setTab] = useState<Tab>('scanner')
  const [scans, setScans] = useState<InteriorSpatialScan[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [roomType, setRoomType] = useState<InteriorRoomType>('LIVING_ROOM')
  const [distanceFt, setDistanceFt] = useState(8)
  const [photoName, setPhotoName] = useState('')
  const [latest, setLatest] = useState<InteriorSpatialScan | null>(null)

  const [vendorName, setVendorName] = useState(VERIFIED_INTERIOR_PARTNERS[0].name)
  const [vendorCategory, setVendorCategory] = useState<InteriorVendorCategory>(VERIFIED_INTERIOR_PARTNERS[0].category)
  const [budget, setBudget] = useState(VERIFIED_INTERIOR_PARTNERS[0].budgetBands[1])
  const [notes, setNotes] = useState('')

  const livePreview = useMemo(() => computeRecommendedTvSizeInches(distanceFt), [distanceFt])

  async function refresh() {
    if (!currentSocietyId || !user?.flatNumber) return
    const rows = await listSpatialScans(currentSocietyId, user.flatNumber)
    setScans(rows)
    if (rows[0]) setLatest(rows[0])
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [currentSocietyId, user?.flatNumber])

  if (!currentSocietyId || !user?.id || !user.flatNumber) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Link your flat to open mAI Space room intelligence.</p>
      </section>
    )
  }

  const selectedPartner = VERIFIED_INTERIOR_PARTNERS.find((p) => p.name === vendorName) || VERIFIED_INTERIOR_PARTNERS[0]

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>mAI Space</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Spatial & interior intelligence</h2>
        <p className={`mt-2 ${ui.body}`}>
          Upload a room photo, enter viewing distance, and get TV sizing, sofa layout, and acoustics guidance —
          then connect with RWA-verified interior partners in one tap.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ['scanner', 'mAI Room Scanner'],
              ['consult', 'Interior Consultation']
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                tab === id ? 'bg-syncra-blue text-white' : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      {tab === 'scanner' ? (
        <>
          <section className={ui.card}>
            <h3 className={ui.heading}>Room scan</h3>
            <form
              className="mt-4 grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                void createSpatialScan({
                  societyId: currentSocietyId,
                  flatNumber: user.flatNumber!,
                  userId: user.id,
                  roomType,
                  viewingDistanceFt: distanceFt,
                  roomPhotoUrl: photoName ? `local-photo://${photoName}` : undefined
                })
                  .then((scan) => {
                    setLatest(scan)
                    setMessage(`Scan saved — recommended TV ${scan.recommended_tv_size_inches}.`)
                    return refresh()
                  })
                  .catch((err) => setError(err instanceof Error ? err.message : 'Scan failed'))
              }}
            >
              <div className="space-y-2">
                <label className={ui.label}>Room type</label>
                <select className={ui.input} value={roomType} onChange={(e) => setRoomType(e.target.value as InteriorRoomType)}>
                  {ROOM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={ui.label}>Viewing distance (ft)</label>
                <input
                  className={ui.input}
                  type="number"
                  min={4}
                  max={20}
                  step={0.5}
                  value={distanceFt}
                  onChange={(e) => setDistanceFt(Number(e.target.value) || 8)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className={ui.label}>Room photo</label>
                <input
                  className={ui.input}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoName(e.target.files?.[0]?.name || '')}
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:col-span-2">
                <p className="text-sm font-semibold text-syncra-primary">Live TV size preview</p>
                <p className={`mt-1 text-sm ${ui.body}`}>
                  Formula: distance″ / 1.6 → ~{livePreview.exactInches}" → retail snap{' '}
                  <span className="font-semibold text-syncra-blue">{livePreview.recommendedLabel}</span>
                  {' '}(compare 43&quot; / 55&quot; / 65&quot; class options).
                </p>
              </div>
              <button type="submit" className={ui.btnPrimary}>
                Run spatial analysis
              </button>
            </form>
          </section>

          {latest ? (
            <section className={ui.card}>
              <h3 className={ui.heading}>Latest recommendation</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <article className="rounded-xl border border-slate-200 p-4">
                  <p className={ui.eyebrow}>TV size</p>
                  <p className="mt-2 text-2xl font-semibold text-syncra-primary">{latest.recommended_tv_size_inches}</p>
                </article>
                <article className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
                  <p className={ui.eyebrow}>Sofa / seating</p>
                  <p className={`mt-2 text-sm ${ui.body}`}>{latest.recommended_sofa_type}</p>
                </article>
              </div>
              <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/60 p-4">
                <p className="text-sm font-semibold text-sky-900">Acoustics</p>
                <p className={`mt-1 text-sm ${ui.body}`}>{latest.acoustics_recommendation}</p>
              </div>
              <ul className="mt-4 space-y-2">
                {guidanceFromScan(latest).map((line) => (
                  <li key={line} className={`text-sm ${ui.body}`}>
                    • {line}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`mt-4 ${ui.btnSecondary}`}
                onClick={() => {
                  setTab('consult')
                  setMessage('Attach this scan when requesting an interior consultation.')
                }}
              >
                Connect with interior partners →
              </button>
            </section>
          ) : null}

          <section className={ui.card}>
            <h3 className={ui.heading}>Your scan history</h3>
            <div className="mt-4 space-y-3">
              {scans.map((scan) => (
                <article key={scan.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-semibold text-syncra-primary">
                    {scan.room_type.replaceAll('_', ' ')} · {scan.recommended_tv_size_inches}
                  </p>
                  <p className={`text-sm ${ui.body}`}>
                    {scan.viewing_distance_ft} ft · {new Date(scan.created_at).toLocaleString()}
                  </p>
                </article>
              ))}
              {scans.length === 0 ? <p className={`text-sm ${ui.body}`}>No scans yet — run your first room analysis above.</p> : null}
            </div>
          </section>
        </>
      ) : null}

      {tab === 'consult' ? (
        <section className={ui.card}>
          <h3 className={ui.heading}>Verified interior consultation</h3>
          <p className={`mt-2 text-sm ${ui.body}`}>
            1-tap lead to RWA-approved decorators, woodcraft, electronics, and lighting partners.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {VERIFIED_INTERIOR_PARTNERS.map((partner) => (
              <button
                key={partner.name}
                type="button"
                onClick={() => {
                  setVendorName(partner.name)
                  setVendorCategory(partner.category)
                  setBudget(partner.budgetBands[1])
                }}
                className={`rounded-xl border p-4 text-left transition ${
                  vendorName === partner.name
                    ? 'border-syncra-accent/50 ring-1 ring-syncra-accent/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-semibold text-syncra-primary">{partner.name}</p>
                <p className={`mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500`}>{partner.category}</p>
                <p className={`mt-2 text-sm ${ui.body}`}>{partner.specialty}</p>
              </button>
            ))}
          </div>

          <form
            className="mt-6 grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              void dispatchInteriorVendorLead({
                societyId: currentSocietyId,
                flatNumber: user.flatNumber!,
                userId: user.id,
                vendorName,
                vendorCategory,
                budgetRange: budget,
                scanId: latest?.id,
                notes
              })
                .then(() => {
                  setNotes('')
                  setMessage(`Lead sent to ${vendorName}. RWA can track monetization from Interior Partners.`)
                })
                .catch((err) => setError(err instanceof Error ? err.message : 'Lead failed'))
            }}
          >
            <div className="space-y-2">
              <label className={ui.label}>Budget band</label>
              <select className={ui.input} value={budget} onChange={(e) => setBudget(e.target.value)}>
                {selectedPartner.budgetBands.map((band) => (
                  <option key={band} value={band}>
                    {band}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className={ui.label}>Notes for vendor</label>
              <textarea
                className={ui.input}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Prefer modular TV unit, warm lighting, delivery this month…"
              />
            </div>
            <button type="submit" className={ui.btnPrimary}>
              Submit consultation request
            </button>
          </form>
        </section>
      ) : null}
    </div>
  )
}
