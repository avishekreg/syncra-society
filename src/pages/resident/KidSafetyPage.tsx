import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { createKidExitApproval, listKidExitApprovalsForFlat } from '../../api/kidSafetyService'
import type { KidExitApproval } from '../../types/db'
import { ui } from '../../lib/ui'

export default function ResidentKidSafetyPage() {
  const { currentSocietyId, user } = useAuth()
  const societyId = currentSocietyId
  const flatNumber = user?.flatNumber

  const [rows, setRows] = useState<KidExitApproval[]>([])
  const [kidName, setKidName] = useState('')
  const [accompaniedBy, setAccompaniedBy] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function refresh() {
    if (!societyId || !flatNumber) return
    setRows(await listKidExitApprovalsForFlat(societyId, flatNumber))
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [societyId, flatNumber])

  if (!societyId || !flatNumber) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Link your flat to manage kid exit approvals.</p>
      </section>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await createKidExitApproval({
        societyId,
        flatNumber,
        kidName,
        accompaniedBy,
        validUntil: new Date(validUntil).toISOString(),
        createdByUserId: user?.id
      })
      setKidName('')
      setAccompaniedBy('')
      setMessage('Kid exit pre-approved for the gate.')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save approval')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>KidGatekeeper</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Kid safety exit approvals</h2>
        <p className={`mt-2 ${ui.body}`}>
          Pre-approve child exits with a time window and accompanying adult. Guards get a loud parent alert if
          approval is missing.
        </p>
      </section>

      <section className={ui.card}>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={ui.label}>Child name</label>
            <input className={ui.input} value={kidName} onChange={(e) => setKidName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Accompanied by</label>
            <input className={ui.input} value={accompaniedBy} onChange={(e) => setAccompaniedBy(e.target.value)} required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className={ui.label}>Valid until</label>
            <input className={ui.input} type="datetime-local" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required />
          </div>
          <button type="submit" className={ui.btnPrimary} disabled={busy}>
            Pre-approve exit
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className="space-y-3">
        {rows.map((row) => (
          <article key={row.id} className={ui.card}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-syncra-primary">{row.kid_name}</h4>
                <p className={`text-sm ${ui.body}`}>
                  With {row.accompanied_by} · until {new Date(row.valid_until).toLocaleString()}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {row.status}
              </span>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
