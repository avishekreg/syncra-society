import React, { useCallback, useEffect, useMemo, useState } from 'react'
import supabase from '../api/supabaseSdk'
import { ui } from '../lib/ui'

function readFlatNumber(row) {
  return row?.flat_no ?? row?.target_flat_number ?? '—'
}

function readStatusLabel(status) {
  if (status === 'pending' || status === 'pending_approval') return 'Pending'
  if (status === 'approved') return 'Approved'
  if (status === 'denied') return 'Denied'
  if (status === 'exited') return 'Exited'
  return status ?? '—'
}

function statusBadgeClass(status) {
  if (status === 'pending' || status === 'pending_approval') return 'bg-amber-100 text-amber-800'
  if (status === 'approved') return 'bg-emerald-100 text-emerald-800'
  if (status === 'denied') return 'bg-rose-100 text-rose-800'
  return 'bg-slate-100 text-slate-700'
}

function formatLogTime(row) {
  const raw = row?.created_at ?? row?.requested_at
  if (!raw) return '—'
  return new Date(raw).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
}

async function fetchSocietyFlatNumbers(societyId) {
  const unique = new Set()

  const { data: userFlats, error: userFlatsError } = await supabase
    .from('user_and_flats')
    .select('flat_number')
    .eq('society_id', societyId)
    .order('flat_number', { ascending: true })

  if (!userFlatsError && userFlats?.length) {
    userFlats.forEach((row) => {
      const flat = String(row.flat_number ?? '').trim()
      if (flat) unique.add(flat)
    })
  }

  if (unique.size === 0) {
    const { data: flatsRows, error: flatsError } = await supabase
      .from('flats')
      .select('flat_number')
      .eq('society_id', societyId)
      .order('flat_number', { ascending: true })

    if (!flatsError && flatsRows?.length) {
      flatsRows.forEach((row) => {
        const flat = String(row.flat_number ?? '').trim()
        if (flat) unique.add(flat)
      })
    }
  }

  return Array.from(unique).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

const VISIT_PURPOSES = ['Gate entry', 'Delivery', 'Guest', 'Service', 'Cab / Ride', 'Other']

const GatekeeperConsole = ({ societyId }) => {
  const [flatNumbers, setFlatNumbers] = useState([])
  const [flatQuery, setFlatQuery] = useState('')
  const [selectedFlat, setSelectedFlat] = useState('')
  const [flatPickerOpen, setFlatPickerOpen] = useState(false)

  const [visitorName, setVisitorName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [purpose, setPurpose] = useState('Gate entry')

  const [recentLogs, setRecentLogs] = useState([])
  const [loadingFlats, setLoadingFlats] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [flatRegistryWarning, setFlatRegistryWarning] = useState(null)
  const [success, setSuccess] = useState(null)

  const filteredFlats = useMemo(() => {
    const query = flatQuery.trim().toLowerCase()
    if (!query) return flatNumbers
    return flatNumbers.filter((flat) => flat.toLowerCase().includes(query))
  }, [flatNumbers, flatQuery])

  const loadRecentLogs = useCallback(async () => {
    if (!societyId) {
      setRecentLogs([])
      setLoadingLogs(false)
      return
    }

    setLoadingLogs(true)
    const { data, error: logsError } = await supabase
      .from('visitor_logs')
      .select('*')
      .eq('society_id', societyId)
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(5)

    if (logsError) {
      setSubmitError(logsError.message)
      setRecentLogs([])
    } else {
      setRecentLogs(data ?? [])
    }
    setLoadingLogs(false)
  }, [societyId])

  useEffect(() => {
    if (!societyId) {
      setFlatNumbers([])
      setLoadingFlats(false)
      return
    }

    let active = true
    setLoadingFlats(true)
    setFlatRegistryWarning(null)

    void fetchSocietyFlatNumbers(societyId)
      .then((flats) => {
        if (!active) return
        setFlatNumbers(flats)
        setLoadingFlats(false)
        if (flats.length === 0) {
          setFlatRegistryWarning(
            'No registered flats found for this society. Import residents before logging visitors.'
          )
        }
      })
      .catch(() => {
        if (!active) return
        setFlatNumbers([])
        setLoadingFlats(false)
        setFlatRegistryWarning(
          'Unable to load the flat registry right now. Purpose and visitor details can still be prepared.'
        )
      })

    return () => {
      active = false
    }
  }, [societyId])

  useEffect(() => {
    void loadRecentLogs()
  }, [loadRecentLogs])

  useEffect(() => {
    if (!societyId) return

    const channel = supabase
      .channel(`gatekeeper-console-${societyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visitor_logs',
          filter: `society_id=eq.${societyId}`
        },
        () => {
          void loadRecentLogs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [societyId, loadRecentLogs])

  function selectFlat(flat) {
    setSelectedFlat(flat)
    setFlatQuery(flat)
    setFlatPickerOpen(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError(null)
    setSuccess(null)

    if (!societyId) {
      setSubmitError('Society context is missing.')
      return
    }

    const flatNo = selectedFlat.trim()
    if (!flatNo || !flatNumbers.includes(flatNo)) {
      setSubmitError('Select a valid flat number from the registered list — manual entry is not allowed.')
      return
    }

    if (!visitorName.trim()) {
      setSubmitError('Visitor name is required.')
      return
    }

    if (!phoneNumber.trim()) {
      setSubmitError('Visitor phone number is required.')
      return
    }

    setSubmitting(true)

    try {
      const now = new Date().toISOString()
      const payload = {
        society_id: societyId,
        visitor_name: visitorName.trim(),
        phone_number: phoneNumber.trim(),
        flat_no: flatNo,
        target_flat_number: flatNo,
        target_building: 'Main',
        purpose: purpose.trim() || 'Gate entry',
        status: 'pending',
        requested_at: now,
        created_at: now,
        updated_at: now
      }

      const { error: insertError } = await supabase.from('visitor_logs').insert(payload)

      if (insertError) throw insertError

      setVisitorName('')
      setPhoneNumber('')
      setPurpose('Gate entry')
      setSelectedFlat('')
      setFlatQuery('')
      setSuccess(`Entry logged for Flat ${flatNo}. Resident alert dispatched via Realtime.`)
      void loadRecentLogs()
    } catch (err) {
      setSubmitError(err?.message ?? 'Unable to log visitor entry.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!societyId) {
    return (
      <div className={ui.card}>
        <p className={ui.body}>Society ID is required to open the gatekeeper console.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className={ui.card}>
        <p className={ui.eyebrow}>Syncra Gatekeeper</p>
        <h2 className={`mt-2 ${ui.heading}`}>Visitor entry console</h2>
        <p className={`mt-2 ${ui.body}`}>
          Flat numbers are loaded from society records — guards cannot type arbitrary flat numbers, ensuring
          resident alerts always match.
        </p>

        {loadingFlats && <p className={`mt-4 ${ui.body}`}>Loading registered flats…</p>}

        {!loadingFlats && flatNumbers.length > 0 && (
          <p className="mt-4 text-sm text-slate-500">{flatNumbers.length} flats registered in this society</p>
        )}

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2">
            <span className={ui.label}>Flat number (select from registry)</span>
            <div className="relative">
              <input
                type="text"
                role="combobox"
                aria-expanded={flatPickerOpen}
                aria-autocomplete="list"
                autoComplete="off"
                placeholder="Search flat number…"
                value={flatQuery}
                disabled={loadingFlats || flatNumbers.length === 0}
                onChange={(event) => {
                  setFlatQuery(event.target.value)
                  setSelectedFlat('')
                  setFlatPickerOpen(true)
                }}
                onFocus={() => setFlatPickerOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setFlatPickerOpen(false), 150)
                }}
                className={ui.input}
              />
              {flatPickerOpen && filteredFlats.length > 0 && (
                <ul
                  role="listbox"
                  className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                >
                  {filteredFlats.map((flat) => (
                    <li key={flat}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selectedFlat === flat}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectFlat(flat)}
                        className={`flex min-h-11 w-full items-center px-4 py-2.5 text-left text-sm hover:bg-syncra-surface-alt ${
                          selectedFlat === flat ? 'bg-syncra-accent/10 font-semibold text-syncra-blue' : 'text-slate-700'
                        }`}
                      >
                        Flat {flat}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selectedFlat && (
              <p className="text-xs font-medium text-emerald-700">Mapped flat: {selectedFlat}</p>
            )}
          </label>

          <label className="space-y-2">
            <span className={ui.label}>Visitor name</span>
            <input
              type="text"
              value={visitorName}
              onChange={(event) => setVisitorName(event.target.value)}
              className={ui.input}
              placeholder="Full name"
              required
            />
          </label>

          <label className="space-y-2">
            <span className={ui.label}>Phone number</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className={ui.input}
              placeholder="+91 …"
              required
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className={ui.label}>Purpose of visit</span>
            <select
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              className={ui.input}
              aria-label="Purpose of visit"
            >
              {VISIT_PURPOSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={submitting || loadingFlats || flatNumbers.length === 0}
            className={`sm:col-span-2 ${ui.btnPrimary} disabled:opacity-60`}
          >
            {submitting ? 'Logging entry…' : 'Submit entry & alert resident'}
          </button>
        </form>

        {flatRegistryWarning && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
            {flatRegistryWarning}
          </p>
        )}
        {submitError && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {submitError}
          </p>
        )}
        {success && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        )}
      </div>

      <div className={ui.card}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className={ui.heading}>Live entry log (last 5)</h3>
          {loadingLogs && <span className="text-sm text-slate-500">Syncing…</span>}
        </div>

        <ul className="mt-4 space-y-3">
          {recentLogs.map((log) => (
            <li key={log.id} className={ui.innerItem}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-syncra-primary">{log.visitor_name}</p>
                  <p className={`mt-1 ${ui.body}`}>
                    Flat {readFlatNumber(log)}
                    {log.phone_number ? ` · ${log.phone_number}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{formatLogTime(log)}</p>
                </div>
                <span
                  className={`inline-flex shrink-0 self-start rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusBadgeClass(log.status)}`}
                >
                  {readStatusLabel(log.status)}
                </span>
              </div>
            </li>
          ))}

          {!loadingLogs && recentLogs.length === 0 && (
            <li className={ui.body}>No visitor entries yet for this society.</li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default GatekeeperConsole
