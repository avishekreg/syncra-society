import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  ensureDemoInfraIfEmpty,
  getInfraRadarSummary,
  urgencyLabel,
  upsertInfraAsset,
  type InfrastructureKind,
  type MaintainInfraAsset
} from '../../services/maintainService'
import { ui } from '../../lib/ui'

export default function AdminMaintainPage() {
  const { currentSocietyId } = useAuth()
  const [assets, setAssets] = useState<MaintainInfraAsset[]>([])
  const [redFlags, setRedFlags] = useState(0)
  const [nocPressure, setNocPressure] = useState(0)
  const [kind, setKind] = useState<InfrastructureKind>('LIFT')
  const [label, setLabel] = useState('')
  const [noc, setNoc] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (!currentSocietyId) return
    await ensureDemoInfraIfEmpty(currentSocietyId)
    const summary = await getInfraRadarSummary(currentSocietyId)
    setAssets(summary.assets)
    setRedFlags(summary.redFlags)
    setNocPressure(summary.nocPressure)
  }, [currentSocietyId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function addAsset(e: React.FormEvent) {
    e.preventDefault()
    if (!currentSocietyId || !label.trim()) return
    setBusy(true)
    try {
      await upsertInfraAsset({
        societyId: currentSocietyId,
        kind,
        label,
        nocExpiresOn: noc || undefined,
        redFlag: kind === 'FIRE_SAFETY'
      })
      setLabel('')
      setNoc('')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>mAI Maintain · RWA Infrastructure Radar</p>
        <h1 className={`mt-2 ${ui.headingLg}`}>Statutory safety & asset lifecycle</h1>
        <p className={`mt-2 ${ui.body}`}>
          Lift ARD / wire-rope cycles, DG running hours & oil alerts, and Fire Safety NOC pressure — zero hardware
          sensors. Red flags surface on the President dashboard before legal risk crystallizes.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Tracked assets</p>
            <p className="mt-1 text-2xl font-semibold text-syncra-primary">{assets.length}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs font-semibold uppercase text-rose-600">Red safety flags</p>
            <p className="mt-1 text-2xl font-semibold text-rose-700">{redFlags}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase text-amber-700">NOC pressure (≤45d)</p>
            <p className="mt-1 text-2xl font-semibold text-amber-800">{nocPressure}</p>
          </div>
        </div>
      </section>

      <section className={ui.card}>
        <h2 className={ui.heading}>Add infrastructure asset</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(e) => void addAsset(e)}>
          <label className="text-sm font-medium text-slate-700">
            Kind
            <select className={`mt-1 ${ui.input}`} value={kind} onChange={(e) => setKind(e.target.value as InfrastructureKind)}>
              <option value="LIFT">Lift safety (ARD / rope / Govt NOC)</option>
              <option value="DG_SET">DG set lifecycle</option>
              <option value="FIRE_SAFETY">Fire safety NOC</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Label
            <input className={`mt-1 ${ui.input}`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Tower B · Lift 2" required />
          </label>
          <label className="text-sm font-medium text-slate-700">
            NOC / certificate expiry
            <input className={`mt-1 ${ui.input}`} type="date" value={noc} onChange={(e) => setNoc(e.target.value)} />
          </label>
          <div className="flex items-end">
            <button type="submit" className={ui.btnPrimary} disabled={busy}>
              Track asset
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {assets.map((asset) => {
          const urg = urgencyLabel(asset.next_due_on)
          return (
            <article
              key={asset.id}
              className={`rounded-2xl border p-5 ${
                asset.red_flag || urg.tone === 'overdue'
                  ? 'border-rose-300 bg-rose-50/80'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{asset.kind.replace('_', ' ')}</p>
              <h3 className="mt-1 text-sm font-semibold text-syncra-primary">{asset.label}</h3>
              <p className="mt-2 text-sm text-slate-600">
                Next due <strong>{asset.next_due_on}</strong> · {urg.label}
              </p>
              {asset.noc_expires_on ? (
                <p className="mt-1 text-xs text-slate-500">NOC / cert: {asset.noc_expires_on}</p>
              ) : null}
              {asset.running_hours != null ? (
                <p className="mt-1 text-xs text-slate-500">Running hours: {asset.running_hours}</p>
              ) : null}
              {asset.red_flag ? (
                <p className="mt-3 text-xs font-bold uppercase text-rose-700">Red safety flag · President attention</p>
              ) : null}
            </article>
          )
        })}
      </section>
    </div>
  )
}
