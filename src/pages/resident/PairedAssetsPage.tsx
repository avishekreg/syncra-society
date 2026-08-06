import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import {
  PAIRED_DEVICE_TYPES,
  deactivatePairedDevice,
  listPairedDevices,
  logPairedDisconnect,
  registerPairedDevice,
  requestProximityPing
} from '../../api/pairedAssetsService'
import type { PairedBluetoothDevice, PairedDeviceType } from '../../types/db'
import { ui } from '../../lib/ui'

export default function ResidentPairedAssetsPage() {
  const { currentSocietyId, user } = useAuth()
  const [devices, setDevices] = useState<PairedBluetoothDevice[]>([])
  const [name, setName] = useState('')
  const [type, setType] = useState<PairedDeviceType>('SMARTWATCH')
  const [zone, setZone] = useState('Tower lobby')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function refresh() {
    if (!currentSocietyId || !user?.id) return
    setDevices(await listPairedDevices(currentSocietyId, user.id))
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [currentSocietyId, user?.id])

  if (!currentSocietyId || !user?.id) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Sign in with a mapped flat to manage paired devices.</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>mAI Find · paired accessories</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>My paired Bluetooth devices</h2>
        <p className={`mt-2 ${ui.body}`}>
          Register smartwatches, TWS earbuds, or a secondary phone already paired to your phone. Last-seen comes from
          your phone’s Bluetooth disconnect / RSSI — not a society radio mesh, and not for keys or wallets.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/resident/find-asset" className={ui.btnGhost}>
            ← Find hub
          </Link>
          <Link to="/resident/find-asset#lost-found" className={ui.btnGhost}>
            Community Lost &amp; Found
          </Link>
        </div>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Register accessory</h3>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            void registerPairedDevice({
              societyId: currentSocietyId,
              ownerUserId: user.id,
              ownerFlatNumber: user.flatNumber || undefined,
              deviceName: name,
              deviceType: type
            })
              .then(() => {
                setName('')
                setMessage('Device registered. Log disconnects when you misplace it near home.')
                return refresh()
              })
              .catch((err) => setError(err instanceof Error ? err.message : 'Register failed'))
          }}
        >
          <div className="space-y-2">
            <label className={ui.label}>Device name</label>
            <input
              className={ui.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Galaxy Watch 6"
              required
            />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Type</label>
            <select className={ui.input} value={type} onChange={(e) => setType(e.target.value as PairedDeviceType)}>
              {PAIRED_DEVICE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={`sm:col-span-2 ${ui.btnPrimary}`}>
            Add paired device
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Connected wearables</h3>
        <div className="mt-3 space-y-2">
          <label className={ui.label}>Default zone for disconnect logs</label>
          <input className={ui.input} value={zone} onChange={(e) => setZone(e.target.value)} />
        </div>
        <div className="mt-4 space-y-3">
          {devices.length === 0 ? (
            <p className={ui.body}>No paired devices yet.</p>
          ) : (
            devices.map((device) => (
              <article key={device.id} className={ui.innerItem}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-syncra-primary">
                      {device.device_name}{' '}
                      <span className="text-xs font-medium text-slate-500">· {device.device_type}</span>
                    </p>
                    <p className={`mt-1 text-sm ${ui.body}`}>
                      Last seen: {device.last_seen_zone || '—'}
                      {device.last_seen_at ? ` · ${new Date(device.last_seen_at).toLocaleString()}` : ''}
                      {device.last_rssi != null ? ` · RSSI ${device.last_rssi} dBm` : ''}
                    </p>
                    {device.last_ping_at ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Last ping: {new Date(device.last_ping_at).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={ui.btnSecondary}
                      disabled={busyId === device.id}
                      onClick={() => {
                        setBusyId(device.id)
                        setError(null)
                        void requestProximityPing({ deviceId: device.id, societyId: currentSocietyId })
                          .then((res) => {
                            setMessage(res.message)
                            return refresh()
                          })
                          .catch((err) => setError(err instanceof Error ? err.message : 'Ping failed'))
                          .finally(() => setBusyId(null))
                      }}
                    >
                      Find proximity ping
                    </button>
                    <button
                      type="button"
                      className={ui.btnGhost}
                      onClick={() =>
                        void logPairedDisconnect({
                          deviceId: device.id,
                          societyId: currentSocietyId,
                          zoneLabel: zone.trim() || 'Tower lobby',
                          rssi: -72
                        })
                          .then(() => {
                            setMessage('Disconnect / RSSI last-seen logged.')
                            return refresh()
                          })
                          .catch((err) => setError(err instanceof Error ? err.message : 'Log failed'))
                      }
                    >
                      Log disconnect
                    </button>
                    <button
                      type="button"
                      className={ui.btnGhost}
                      onClick={() =>
                        void deactivatePairedDevice(device.id)
                          .then(refresh)
                          .catch((err) => setError(err instanceof Error ? err.message : 'Remove failed'))
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
