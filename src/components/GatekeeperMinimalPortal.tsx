import React, { useCallback, useEffect, useMemo, useState } from 'react'
import supabase from '../api/supabaseSdk'
import { ui } from '../lib/ui'

function readFlatNumber(row: Record<string, unknown>) {
  return String(row?.flat_no ?? row?.target_flat_number ?? '—')
}

function readStatusLabel(status: string | null | undefined) {
  if (status === 'pending' || status === 'pending_approval') return 'Pending approval'
  if (status === 'approved') return 'Approved'
  if (status === 'denied') return 'Denied'
  if (status === 'exited') return 'Exited'
  return status ?? '—'
}

function statusBadgeClass(status: string | null | undefined) {
  if (status === 'pending' || status === 'pending_approval') return 'bg-amber-100 text-amber-800'
  if (status === 'approved') return 'bg-emerald-100 text-emerald-800'
  if (status === 'denied') return 'bg-rose-100 text-rose-800'
  return 'bg-slate-100 text-slate-700'
}

function isToday(iso: string | null | undefined) {
  if (!iso) return false
  const date = new Date(iso)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

type GatekeeperMinimalPortalProps = {
  societyId: string | null
  societyName?: string
}

export default function GatekeeperMinimalPortal({ societyId, societyName }: GatekeeperMinimalPortalProps) {
  const [flatNumbers, setFlatNumbers] = useState<string[]>([])
  const [flatQuery, setFlatQuery] = useState('')
  const [selectedFlat, setSelectedFlat] = useState('')
  const [visitorName, setVisitorName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [todayLogs, setTodayLogs] = useState<Record<string, unknown>[]>([])
  const [latestStatus, setLatestStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredFlats = useMemo(() => {
    const query = flatQuery.trim().toLowerCase()
    if (!query) return flatNumbers
    return flatNumbers.filter((flat) => flat.toLowerCase().includes(query))
  }, [flatNumbers, flatQuery])

  const loadTodayLogs = useCallback(async () => {
    if (!societyId) {
      setTodayLogs([])
      setLoading(false)
      return
    }

    setLoading(true)
    const start = new Date()
    start.setHours(0, 0, 0, 0)

    const { data, error: logsError } = await supabase
      .from('visitor_logs')
      .select('*')
      .eq('society_id', societyId)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: false })

    if (logsError) {
      setError(logsError.message)
      setTodayLogs([])
    } else {
      const rows = (data ?? []).filter((row) => isToday(String(row.created_at ?? row.requested_at ?? '')))
      setTodayLogs(rows)
      setLatestStatus(rows[0]?.status ? String(rows[0].status) : null)
    }
    setLoading(false)
  }, [societyId])

  useEffect(() => {
    if (!societyId) return

    void supabase
      .from('user_and_flats')
      .select('flat_number')
      .eq('society_id', societyId)
      .then(({ data }) => {
        const flats = Array.from(
          new Set((data ?? []).map((row) => String(row.flat_number ?? '').trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        setFlatNumbers(flats)
      })

    void loadTodayLogs()
  }, [societyId, loadTodayLogs])

  useEffect(() => {
    if (!societyId) return

    const channel = supabase
      .channel(`gatekeeper-minimal-${societyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitor_logs', filter: `society_id=eq.${societyId}` },
        () => {
          void loadTodayLogs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [societyId, loadTodayLogs])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!societyId) {
      setError('Society context is missing.')
      return
    }

    const flatNo = selectedFlat.trim()
    if (!flatNo) {
      setError('Select a flat number.')
      return
    }
    if (!visitorName.trim() || !phoneNumber.trim()) {
      setError('Visitor name and phone are required.')
      return
    }

    setSubmitting(true)
    try {
      const now = new Date().toISOString()
      const { error: insertError } = await supabase.from('visitor_logs').insert({
        society_id: societyId,
        visitor_name: visitorName.trim(),
        phone_number: phoneNumber.trim(),
        flat_no: flatNo,
        target_flat_number: flatNo,
        target_building: 'Main',
        purpose: 'Gate entry',
        status: 'pending_approval',
        requested_at: now,
        created_at: now,
        updated_at: now
      })
      if (insertError) throw insertError

      setVisitorName('')
      setPhoneNumber('')
      setSelectedFlat('')
      setFlatQuery('')
      setLatestStatus('pending_approval')
      void loadTodayLogs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log entry.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:px-6">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-syncra-blue">Gatekeeper</p>
        <h1 className="mt-2 text-2xl font-semibold text-syncra-primary">{societyName ?? 'Visitor desk'}</h1>
        <p className="mt-2 text-sm text-slate-600">Log inbound visitors and track resident approval in real time.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-syncra-primary">New entry</h2>
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-4">
          <label className="block space-y-2">
            <span className={ui.label}>Flat number</span>
            <input
              list="gatekeeper-flats"
              className={ui.input}
              placeholder="Search flat…"
              value={flatQuery}
              onChange={(event) => {
                setFlatQuery(event.target.value)
                setSelectedFlat(event.target.value)
              }}
            />
            <datalist id="gatekeeper-flats">
              {filteredFlats.map((flat) => (
                <option key={flat} value={flat} />
              ))}
            </datalist>
          </label>

          <label className="block space-y-2">
            <span className={ui.label}>Visitor name</span>
            <input
              className={ui.input}
              value={visitorName}
              onChange={(event) => setVisitorName(event.target.value)}
              required
            />
          </label>

          <label className="block space-y-2">
            <span className={ui.label}>Phone</span>
            <input
              type="tel"
              className={ui.input}
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              required
            />
          </label>

          <button type="submit" disabled={submitting} className={`w-full ${ui.btnPrimary} disabled:opacity-60`}>
            {submitting ? 'Submitting…' : 'Submit for approval'}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-syncra-primary">Approval status</h2>
          {latestStatus && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusBadgeClass(latestStatus)}`}>
              {readStatusLabel(latestStatus)}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Latest entry stays pending until the flat owner approves or denies from their resident app.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-syncra-primary">Today&apos;s entry log</h2>
        {loading ? (
          <p className={`mt-4 ${ui.body}`}>Loading…</p>
        ) : todayLogs.length === 0 ? (
          <p className={`mt-4 ${ui.body}`}>No entries logged today.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {todayLogs.map((log) => (
              <li key={String(log.id)} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-syncra-primary">{String(log.visitor_name ?? 'Visitor')}</p>
                  <p className="text-sm text-slate-600">
                    Flat {readFlatNumber(log)}
                    {log.phone_number ? ` · ${String(log.phone_number)}` : ''}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${statusBadgeClass(String(log.status ?? ''))}`}>
                  {readStatusLabel(String(log.status ?? ''))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
