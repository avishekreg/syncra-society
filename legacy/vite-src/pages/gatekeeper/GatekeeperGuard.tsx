import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  createVisitorLog,
  listVisitorLogEvents,
  listVisitorLogs,
  logVisitorExit
} from '../../api/visitorLogs'
import type { VisitorLog, VisitorLogEvent } from '../../types/db'
import { ui } from '../../lib/ui'

const inputClass = ui.input

export default function GatekeeperGuard() {
  const { currentSocietyId } = useAuth()
  const [visitorName, setVisitorName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [targetBuilding, setTargetBuilding] = useState('')
  const [targetFlat, setTargetFlat] = useState('')
  const [logs, setLogs] = useState<VisitorLog[]>([])
  const [events, setEvents] = useState<Record<string, VisitorLogEvent[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credentialPayload, setCredentialPayload] = useState<{ guard: string; location: string; token: string; issuedAt: string } | null>(null)

  useEffect(() => {
    fetchLogs()

    const stored = sessionStorage.getItem('syncra-gatekeeper-credential')
    if (stored) {
      try {
        setCredentialPayload(JSON.parse(stored))
      } catch {
        setCredentialPayload(null)
      }
    }
  }, [currentSocietyId])

  async function fetchLogs() {
    if (!currentSocietyId) return
    setLoading(true)
    setError(null)
    try {
      const data = await listVisitorLogs(currentSocietyId)
      setLogs(data ?? [])
    } catch (err: any) {
      setError(err.message || 'Failed to load visitor logs')
    } finally {
      setLoading(false)
    }
  }

  async function loadEvents(logId: string) {
    try {
      const data = await listVisitorLogEvents(logId)
      setEvents((prev) => ({ ...prev, [logId]: data ?? [] }))
    } catch {
      // trace optional if events table unavailable
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentSocietyId) return alert('No society context available')
    if (!visitorName || !purpose || !targetBuilding || !targetFlat) {
      return alert('Visitor name, purpose, building, and flat are required')
    }
    try {
      await createVisitorLog({
        society_id: currentSocietyId,
        visitor_name: visitorName,
        purpose,
        vehicle_number: vehicleNumber || undefined,
        target_building: targetBuilding,
        target_flat_number: targetFlat
      })
      setVisitorName('')
      setPurpose('')
      setVehicleNumber('')
      setTargetBuilding('')
      setTargetFlat('')
      fetchLogs()
    } catch (err: any) {
      alert(err.message || 'Failed to create entry log')
    }
  }

  async function handleExit(id: string) {
    try {
      await logVisitorExit(id)
      fetchLogs()
    } catch (err: any) {
      alert(err.message || 'Failed to log exit')
    }
  }

  const statusBadge: Record<string, string> = {
    pending_approval: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    denied: 'bg-rose-100 text-rose-800',
    exited: 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="space-y-6">
        {credentialPayload ? (
          <div className="rounded-2xl border border-syncra-accent/30 bg-syncra-accent/10 p-6 shadow-card">
            <p className={ui.eyebrow}>Gatekeeper Credential</p>
            <h2 className={`mt-2 ${ui.heading}`}>Secure credential token generated</h2>
            <p className={`mt-2 ${ui.body}`}>Guard: {credentialPayload.guard}</p>
            <p className={ui.body}>Location: {credentialPayload.location}</p>
            <p className={ui.body}>Token: <span className="font-mono text-syncra-primary">{credentialPayload.token}</span></p>
            <p className="text-sm text-slate-500">Issued: {new Date(credentialPayload.issuedAt).toLocaleString()}</p>
          </div>
        ) : null}
        <div className={ui.card}>
          <p className={ui.eyebrow}>Guard Interface</p>
          <h2 className={`mt-2 ${ui.heading}`}>Log Visitor Entry</h2>
          <p className={`mt-1 ${ui.body}`}>New requests default to Pending Approval until the resident acts.</p>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <input className={inputClass} placeholder="Visitor Name" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} />
            <input className={inputClass} placeholder="Purpose of Visit" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            <input className={inputClass} placeholder="Vehicle Number (optional)" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
            <input className={inputClass} placeholder="Target Building" value={targetBuilding} onChange={(e) => setTargetBuilding(e.target.value)} />
            <input className={inputClass} placeholder="Target Flat Number" value={targetFlat} onChange={(e) => setTargetFlat(e.target.value)} />
            <button type="submit" className={`${ui.btnPrimary} sm:col-span-2`}>
              Submit Entry Request
            </button>
          </form>
        </div>

        <div className={ui.card}>
          <div className="flex items-center justify-between gap-4">
            <h3 className={ui.heading}>Live Visitor Logs</h3>
            {loading && <span className={ui.body}>Syncing…</span>}
          </div>
          {error && <p className="mt-3 text-sm text-syncra-action-alt">{error}</p>}
          <ul className="mt-4 space-y-3">
            {logs.map((log) => (
              <li key={log.id} className={ui.innerItem}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-syncra-primary">{log.visitor_name}</p>
                    <p className={ui.body}>{log.purpose}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {log.target_building} · Flat {log.target_flat_number}
                      {log.vehicle_number ? ` · ${log.vehicle_number}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Requested: {new Date(log.requested_at).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusBadge[log.status]}`}>
                    {log.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {log.status === 'approved' && (
                    <button onClick={() => handleExit(log.id)} className={ui.btnGhost}>
                      Log Exit
                    </button>
                  )}
                  <button onClick={() => loadEvents(log.id)} className={ui.btnSecondary}>
                    View Trace
                  </button>
                </div>
                {events[log.id]?.length ? (
                  <ul className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-xs text-slate-500">
                    {(events[log.id] || []).map((ev) => (
                      <li key={ev.id}>
                        {new Date(ev.created_at).toLocaleString()} — {ev.event_type.replace('_', ' ')}
                        {ev.notes ? ` · ${ev.notes}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
            {!loading && logs.length === 0 && !error && (
              <li className={ui.body}>No visitor logs yet.</li>
            )}
          </ul>
        </div>
      </div>
  )
}
