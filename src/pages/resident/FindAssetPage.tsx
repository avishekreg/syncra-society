import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import {
  enqueueBleSignal,
  listLostAssets,
  markAssetFound,
  markAssetLost,
  processBleSignalQueue,
  reportAssetSighting,
  societyMapPins
} from '../../api/assetFinderService'
import type { LostAssetSignal, LostAssetType } from '../../types/db'
import { ui } from '../../lib/ui'

const TYPES: LostAssetType[] = ['PHONE', 'WATCH', 'KEYS', 'VEHICLE']

export default function ResidentFindAssetPage() {
  const { currentSocietyId, user } = useAuth()
  const [assets, setAssets] = useState<LostAssetSignal[]>([])
  const [name, setName] = useState('')
  const [type, setType] = useState<LostAssetType>('PHONE')
  const [location, setLocation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function refresh() {
    if (!currentSocietyId) return
    setAssets(await listLostAssets(currentSocietyId))
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [currentSocietyId])

  useEffect(() => {
    if (!currentSocietyId) return
    const tick = () => {
      void processBleSignalQueue(currentSocietyId)
        .then((matched) => {
          if (matched.length) {
            setMessage(`${matched.length} BLE mesh match(es) updated owner pins.`)
            return refresh()
          }
        })
        .catch(() => undefined)
    }
    tick()
    const timer = window.setInterval(tick, 30_000)
    return () => window.clearInterval(timer)
  }, [currentSocietyId])

  const pins = societyMapPins(assets)

  if (!currentSocietyId || !user?.id) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Sign in with a mapped flat to use mAI Find Asset.</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>mAI Find Asset</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Community Bluetooth mesh tracker</h2>
        <p className={`mt-2 ${ui.body}`}>
          Mark phones, watches, keys, or vehicles as lost. Neighbor devices report last-known sightings across the society.
        </p>
        <Link to="/resident/intelligence" className={`mt-3 inline-flex ${ui.btnGhost}`}>
          ← Intelligence hub
        </Link>
      </section>

      <section className={ui.card}>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            void markAssetLost({
              societyId: currentSocietyId,
              ownerUserId: user.id,
              ownerFlatNumber: user.flatNumber || undefined,
              assetName: name,
              assetType: type,
              lastSeenLocation: location || undefined
            })
              .then(() => {
                setName('')
                setMessage('Asset marked LOST on the community mesh.')
                return refresh()
              })
              .catch((err) => setError(err instanceof Error ? err.message : 'Failed'))
          }}
        >
          <div className="space-y-2">
            <label className={ui.label}>Asset name</label>
            <input className={ui.input} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Type</label>
            <select className={ui.input} value={type} onChange={(e) => setType(e.target.value as LostAssetType)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className={ui.label}>Last seen (optional)</label>
            <input className={ui.input} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Basement B2 · Column C" />
          </div>
          <button type="submit" className={ui.btnPrimary}>
            Mark as lost
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Society signal map</h3>
        <div className="relative mt-4 h-64 overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_20%_20%,rgba(0,180,216,0.12),transparent_40%),linear-gradient(135deg,#f8fafc,#e2e8f0)]">
          {pins.map((pin) => (
            <div
              key={pin.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-syncra-action px-2 py-1 text-[10px] font-bold text-white shadow"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              title={`${pin.label} · ${pin.location}`}
            >
              {pin.type.slice(0, 1)}
            </div>
          ))}
          {pins.length === 0 ? (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">No active lost signals</p>
          ) : null}
        </div>
      </section>

      <div className="space-y-3">
        {assets.map((asset) => (
          <article key={asset.id} className={ui.card}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-syncra-primary">
                  {asset.asset_name} · {asset.asset_type}
                </h4>
                <p className={`mt-1 text-sm ${ui.body}`}>
                  {asset.last_seen_location || 'Awaiting mesh ping'}
                  {asset.last_seen_at ? ` · ${new Date(asset.last_seen_at).toLocaleString()}` : ''}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{asset.status}</span>
            </div>
            {asset.status === 'LOST' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={ui.btnSecondary}
                  onClick={() =>
                    void enqueueBleSignal({
                      societyId: currentSocietyId,
                      bleFingerprint: asset.ble_fingerprint || '',
                      locationLabel: location.trim() || 'Neighbor mesh ping · Clubhouse walkway',
                      detectedByUserId: user.id
                    })
                      .then(() => processBleSignalQueue(currentSocietyId))
                      .then(() => {
                        setMessage('BLE signal queued and matched against lost tags.')
                        return refresh()
                      })
                      .catch((err) => setError(err instanceof Error ? err.message : 'Mesh ping failed'))
                  }
                >
                  Log BLE mesh ping
                </button>
                <button
                  type="button"
                  className={ui.btnGhost}
                  onClick={() =>
                    void reportAssetSighting({
                      assetId: asset.id,
                      detectedByUserId: user.id,
                      locationLabel: location.trim() || 'Neighbor mesh ping · Clubhouse walkway'
                    }).then(refresh)
                  }
                >
                  Report sighting
                </button>
                {asset.owner_user_id === user.id ? (
                  <button type="button" className={ui.btnGhost} onClick={() => void markAssetFound(asset.id).then(refresh)}>
                    Mark found
                  </button>
                ) : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}
