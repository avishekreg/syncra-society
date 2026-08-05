import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import {
  STAFF_ROLES,
  createRegularStaff,
  listStaffForFlat,
  setStaffActive,
  type StaffRole
} from '../../api/staffPassService'
import type { RegularStaff } from '../../types/db'
import { ui } from '../../lib/ui'

type Props = {
  societyId: string
  flatNumber: string
  userId?: string
}

export default function RegularStaffPanel({ societyId, flatNumber, userId }: Props) {
  const [staff, setStaff] = useState<RegularStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [qrMap, setQrMap] = useState<Record<string, string>>({})
  const [name, setName] = useState('')
  const [role, setRole] = useState<StaffRole>('Maid')
  const [phone, setPhone] = useState('')
  const [start, setStart] = useState('07:00')
  const [end, setEnd] = useState('19:00')

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const rows = await listStaffForFlat(societyId, flatNumber)
      setStaff(rows)
      const next: Record<string, string> = {}
      await Promise.all(
        rows.map(async (row) => {
          next[row.id] = await QRCode.toDataURL(row.qr_pass_code, { margin: 1, width: 180 })
        })
      )
      setQrMap(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load staff passes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [societyId, flatNumber])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Staff name is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createRegularStaff({
        societyId,
        flatNumber,
        name,
        role,
        phone,
        allowedTimeStart: start,
        allowedTimeEnd: end,
        createdByUserId: userId
      })
      setName('')
      setPhone('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create staff pass')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(row: RegularStaff) {
    try {
      await setStaffActive(row.id, !row.is_active)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update staff pass')
    }
  }

  function downloadQr(row: RegularStaff) {
    const dataUrl = qrMap[row.id]
    if (!dataUrl) return
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `staff-pass-${row.name.replace(/\s+/g, '-').toLowerCase()}.png`
    link.click()
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Regular staff</p>
        <h3 className={`mt-2 ${ui.heading}`}>Recurring fast-track passes</h3>
        <p className={`mt-2 ${ui.body}`}>
          Add maids, drivers, and daily help with shift hours. Guards scan the QR without ringing your phone.
        </p>

        <form onSubmit={handleCreate} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={ui.label} htmlFor="staff-name">
              Name
            </label>
            <input id="staff-name" className={ui.input} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className={ui.label} htmlFor="staff-role">
              Role
            </label>
            <select
              id="staff-role"
              className={ui.input}
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
            >
              {STAFF_ROLES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className={ui.label} htmlFor="staff-phone">
              Phone
            </label>
            <input
              id="staff-phone"
              className={ui.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className={ui.label} htmlFor="staff-start">
                Allowed from
              </label>
              <input
                id="staff-start"
                type="time"
                className={ui.input}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className={ui.label} htmlFor="staff-end">
                Allowed until
              </label>
              <input
                id="staff-end"
                type="time"
                className={ui.input}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className={ui.btnPrimary} disabled={saving}>
              {saving ? 'Creating…' : 'Create recurring pass'}
            </button>
          </div>
        </form>
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {loading ? <p className={ui.body}>Loading staff passes…</p> : null}
        {!loading && staff.length === 0 ? (
          <div className={ui.card}>
            <p className={ui.body}>No regular staff passes yet for flat {flatNumber}.</p>
          </div>
        ) : null}
        {staff.map((row) => (
          <article key={row.id} className={`${ui.card} flex flex-col`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-syncra-primary">{row.name}</h4>
                <p className={`mt-1 text-sm ${ui.body}`}>
                  {row.role} · {row.allowed_time_start.slice(0, 5)}–{row.allowed_time_end.slice(0, 5)}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  row.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {row.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {qrMap[row.id] ? (
              <img src={qrMap[row.id]} alt={`QR pass for ${row.name}`} className="mx-auto mt-4 h-40 w-40" />
            ) : null}
            <p className="mt-3 break-all text-center font-mono text-[11px] text-slate-500">{row.qr_pass_code}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={ui.btnSecondary} onClick={() => downloadQr(row)}>
                Download QR
              </button>
              <button type="button" className={ui.btnGhost} onClick={() => void toggleActive(row)}>
                {row.is_active ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
