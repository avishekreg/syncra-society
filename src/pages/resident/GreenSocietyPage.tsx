import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  adoptBotanicalAsset,
  applyPlantDiagnosis,
  claimPlantSwap,
  createPlantSwap,
  findAssetByQr,
  listBotanicalAssets,
  listCompostInventory,
  listCompostOrders,
  listPlantSwaps,
  requestCompostDelivery
} from '../../api/botanistService'
import type {
  GreenCompostInventory,
  GreenCompostOrder,
  PlantSwapListing,
  PlantSwapType,
  SocietyBotanicalAsset
} from '../../types/db'
import { formatInr } from '../../lib/platformPricing'
import { ui } from '../../lib/ui'

type Tab = 'botanist' | 'compost' | 'swap'

const SWAP_TYPES: PlantSwapType[] = ['CUTTING', 'POTTED', 'SEEDS', 'SAPLING']

export default function ResidentGreenSocietyPage() {
  const { currentSocietyId, user } = useAuth()
  const [tab, setTab] = useState<Tab>('botanist')
  const [assets, setAssets] = useState<SocietyBotanicalAsset[]>([])
  const [inventory, setInventory] = useState<GreenCompostInventory[]>([])
  const [orders, setOrders] = useState<GreenCompostOrder[]>([])
  const [swaps, setSwaps] = useState<PlantSwapListing[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [qrCode, setQrCode] = useState('')
  const [scanned, setScanned] = useState<SocietyBotanicalAsset | null>(null)
  const [symptoms, setSymptoms] = useState('')
  const [photoName, setPhotoName] = useState('')

  const [compostQty, setCompostQty] = useState(2)
  const [selectedBatch, setSelectedBatch] = useState('')

  const [swapTitle, setSwapTitle] = useState('')
  const [swapType, setSwapType] = useState<PlantSwapType>('CUTTING')
  const [swapDesc, setSwapDesc] = useState('')

  async function refresh() {
    if (!currentSocietyId) return
    const [a, inv, ord, sw] = await Promise.all([
      listBotanicalAssets(currentSocietyId),
      listCompostInventory(currentSocietyId),
      listCompostOrders(currentSocietyId),
      listPlantSwaps(currentSocietyId)
    ])
    setAssets(a)
    setInventory(inv)
    setOrders(ord)
    setSwaps(sw)
    if (!selectedBatch && inv[0]) setSelectedBatch(inv[0].id)
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [currentSocietyId])

  if (!currentSocietyId || !user?.id || !user.flatNumber) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Link your flat to open the Green Society portal.</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Green Society Intelligence</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>mAI Botanist</h2>
        <p className={`mt-2 ${ui.body}`}>
          Scan QR-tagged trees, request organic compost to your doorstep, and swap cuttings with neighbors —
          zero landscape hardware required.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ['botanist', 'mAI Botanist'],
              ['compost', 'Compost Delivery'],
              ['swap', 'Plant Swap']
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                tab === id ? 'bg-emerald-700 text-white' : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      {tab === 'botanist' ? (
        <>
          <section className={ui.card}>
            <h3 className={ui.heading}>Scan plant QR</h3>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"
              onSubmit={(e) => {
                e.preventDefault()
                void findAssetByQr(currentSocietyId, qrCode)
                  .then((row) => {
                    if (!row) {
                      setScanned(null)
                      setError('No plant found for that QR tag in this society.')
                      return
                    }
                    setError(null)
                    setScanned(row)
                    setMessage(`Loaded ${row.plant_name} · ${row.location_zone}`)
                  })
                  .catch((err) => setError(err instanceof Error ? err.message : 'Scan failed'))
              }}
            >
              <input
                className={ui.input}
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="BOT-XXXXXXXX"
                required
              />
              <button type="submit" className={ui.btnPrimary}>
                Look up
              </button>
            </form>
          </section>

          {scanned ? (
            <section className={ui.card}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-syncra-primary">{scanned.plant_name}</h3>
                  <p className={`mt-1 text-sm ${ui.body}`}>
                    {scanned.species || 'Species TBD'} · {scanned.location_zone} · QR {scanned.qr_tag_code}
                  </p>
                  <p className="mt-2 text-sm font-medium text-emerald-800">
                    ~{scanned.carbon_offset_kg} kg CO₂ offset · {scanned.health_status}
                  </p>
                  {scanned.adopted_by_flat_number ? (
                    <p className={`mt-1 text-sm ${ui.body}`}>Adopted by flat {scanned.adopted_by_flat_number}</p>
                  ) : null}
                </div>
                {!scanned.adopted_by_flat_id ? (
                  <button
                    type="button"
                    className={ui.btnSecondary}
                    onClick={() =>
                      void adoptBotanicalAsset({
                        assetId: scanned.id,
                        societyId: currentSocietyId,
                        flatNumber: user.flatNumber!
                      })
                        .then((row) => {
                          setScanned(row)
                          setMessage(`You adopted ${row.plant_name}. Thank you for sponsoring this tree.`)
                          return refresh()
                        })
                        .catch((err) => setError(err instanceof Error ? err.message : 'Adopt failed'))
                    }
                  >
                    Adopt this tree
                  </button>
                ) : null}
              </div>

              {scanned.last_diagnosis ? (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <p className="text-sm font-semibold text-emerald-900">Plant doctor</p>
                  <p className={`mt-1 text-sm ${ui.body}`}>{scanned.last_diagnosis}</p>
                  {scanned.care_steps ? (
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-600">{scanned.care_steps}</pre>
                  ) : null}
                </div>
              ) : null}

              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  void applyPlantDiagnosis({
                    assetId: scanned.id,
                    plantName: scanned.plant_name,
                    species: scanned.species || undefined,
                    symptomNotes: symptoms,
                    photoDataUrl: photoName ? `local-photo://${photoName}` : undefined
                  })
                    .then((row) => {
                      setScanned(row)
                      setSymptoms('')
                      setMessage('Diagnosis updated from plant doctor.')
                      return refresh()
                    })
                    .catch((err) => setError(err instanceof Error ? err.message : 'Diagnosis failed'))
                }}
              >
                <div className="space-y-2">
                  <label className={ui.label}>Condition notes / symptoms</label>
                  <textarea
                    className={ui.input}
                    rows={3}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Yellow leaves, dry tips, spots…"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className={ui.label}>Condition photo (optional)</label>
                  <input
                    className={ui.input}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoName(e.target.files?.[0]?.name || '')}
                  />
                </div>
                <button type="submit" className={ui.btnPrimary}>
                  Run plant doctor
                </button>
              </form>
            </section>
          ) : null}

          <section className={ui.card}>
            <h3 className={ui.heading}>Society botanical assets</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {assets.map((asset) => (
                <article key={asset.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold text-syncra-primary">{asset.plant_name}</p>
                  <p className={`mt-1 text-sm ${ui.body}`}>
                    {asset.location_zone} · {asset.qr_tag_code}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {asset.health_status} · {asset.carbon_offset_kg} kg CO₂
                  </p>
                  <button
                    type="button"
                    className={`mt-3 ${ui.btnGhost}`}
                    onClick={() => {
                      setQrCode(asset.qr_tag_code)
                      setScanned(asset)
                      setTab('botanist')
                    }}
                  >
                    Open tag
                  </button>
                </article>
              ))}
              {assets.length === 0 ? (
                <p className={`text-sm ${ui.body}`}>No tagged plants yet — RWA can register assets from Landscape admin.</p>
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      {tab === 'compost' ? (
        <section className={ui.card}>
          <h3 className={ui.heading}>Organic compost to doorstep</h3>
          <p className={`mt-2 text-sm ${ui.body}`}>
            Order society-produced compost from organic waste batches. Delivery is routed to flat {user.flatNumber}.
          </p>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!selectedBatch) return
              void requestCompostDelivery({
                societyId: currentSocietyId,
                inventoryId: selectedBatch,
                flatNumber: user.flatNumber!,
                userId: user.id,
                quantityKg: compostQty
              })
                .then(() => {
                  setMessage('Compost request placed for doorstep delivery.')
                  return refresh()
                })
                .catch((err) => setError(err instanceof Error ? err.message : 'Order failed'))
            }}
          >
            <div className="space-y-2 sm:col-span-2">
              <label className={ui.label}>Batch</label>
              <select className={ui.input} value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} required>
                <option value="">Select batch</option>
                {inventory.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batch_number} · {batch.available_for_residents_kg} kg left ·{' '}
                    {batch.price_per_kg > 0 ? `${formatInr(batch.price_per_kg)}/kg` : 'Free'}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className={ui.label}>Quantity (kg)</label>
              <input
                className={ui.input}
                type="number"
                min={0.5}
                step={0.5}
                value={compostQty}
                onChange={(e) => setCompostQty(Number(e.target.value) || 1)}
              />
            </div>
            <button type="submit" className={ui.btnPrimary} disabled={inventory.length === 0}>
              Request delivery
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <h4 className="font-semibold text-syncra-primary">Your / society orders</h4>
            {orders.map((order) => (
              <article key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3">
                <p className={`text-sm ${ui.body}`}>
                  Flat {order.flat_number} · {order.quantity_kg} kg · {new Date(order.created_at).toLocaleDateString()}
                </p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{order.status}</span>
              </article>
            ))}
            {orders.length === 0 ? <p className={`text-sm ${ui.body}`}>No compost orders yet.</p> : null}
          </div>
        </section>
      ) : null}

      {tab === 'swap' ? (
        <>
          <section className={ui.card}>
            <h3 className={ui.heading}>List a cutting / pot / seeds</h3>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                void createPlantSwap({
                  societyId: currentSocietyId,
                  flatNumber: user.flatNumber!,
                  userId: user.id,
                  title: swapTitle,
                  plantType: swapType,
                  description: swapDesc
                })
                  .then(() => {
                    setSwapTitle('')
                    setSwapDesc('')
                    setMessage('Plant swap listing published to neighbors.')
                    return refresh()
                  })
                  .catch((err) => setError(err instanceof Error ? err.message : 'List failed'))
              }}
            >
              <div className="space-y-2">
                <label className={ui.label}>Title</label>
                <input className={ui.input} value={swapTitle} onChange={(e) => setSwapTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className={ui.label}>Type</label>
                <select className={ui.input} value={swapType} onChange={(e) => setSwapType(e.target.value as PlantSwapType)}>
                  {SWAP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className={ui.label}>Description</label>
                <textarea className={ui.input} rows={2} value={swapDesc} onChange={(e) => setSwapDesc(e.target.value)} />
              </div>
              <button type="submit" className={ui.btnPrimary}>
                Publish swap
              </button>
            </form>
          </section>

          <div className="grid gap-3 md:grid-cols-2">
            {swaps.map((listing) => (
              <article key={listing.id} className={ui.card}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-syncra-primary">{listing.title}</h4>
                    <p className={`mt-1 text-sm ${ui.body}`}>
                      {listing.plant_type} · Flat {listing.offered_by_flat_number}
                    </p>
                    {listing.description ? <p className={`mt-2 text-sm ${ui.body}`}>{listing.description}</p> : null}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{listing.status}</span>
                </div>
                {listing.status === 'AVAILABLE' && listing.offered_by_user_id !== user.id ? (
                  <button
                    type="button"
                    className={`mt-3 ${ui.btnSecondary}`}
                    onClick={() =>
                      void claimPlantSwap({ listingId: listing.id, claimerFlatNumber: user.flatNumber! })
                        .then(() => {
                          setMessage(`Claimed “${listing.title}”. Coordinate pickup with Flat ${listing.offered_by_flat_number}.`)
                          return refresh()
                        })
                        .catch((err) => setError(err instanceof Error ? err.message : 'Claim failed'))
                    }
                  >
                    Claim
                  </button>
                ) : null}
                {listing.claimed_by_flat_number ? (
                  <p className={`mt-2 text-xs ${ui.body}`}>Claimed by flat {listing.claimed_by_flat_number}</p>
                ) : null}
              </article>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
