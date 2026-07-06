import React, { useEffect, useState } from 'react'
import type { ActivityEntry } from '../../lib/activityLog'
import { listRegisteredSocieties } from '../../lib/societyRegistry'
import { ui } from '../../lib/ui'

function readAllActivityLogs(): ActivityEntry[] {
  if (typeof window === 'undefined') return []
  const societies = listRegisteredSocieties()
  const keys = societies.map((s) => `syncra-activity-${s.id}`)

  const discoveredKeys = Object.keys(localStorage).filter((key) => key.startsWith('syncra-activity-'))
  const allKeys = Array.from(new Set([...keys, ...discoveredKeys]))

  const entries: ActivityEntry[] = []
  for (const key of allKeys) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as ActivityEntry[]
      entries.push(...parsed)
    } catch {
      continue
    }
  }

  return entries.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
}

export default function SuperAdminAuditLogs() {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setEntries(readAllActivityLogs())
    setLoading(false)
  }, [])

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>Cross-society audit trail</p>
        <p className={`mt-2 max-w-2xl ${ui.body}`}>
          Aggregated platform events from helpdesk, payments, visitors, and governance modules — read-only for
          compliance review.
        </p>
      </section>

      {loading && (
        <div className={ui.card} aria-busy="true">
          <p className={ui.body}>Loading audit logs…</p>
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className={ui.card}>
          <p className={ui.body}>No platform audit events recorded yet.</p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <ul className="space-y-3">
          {entries.slice(0, 100).map((entry) => (
            <li key={entry.id} className={ui.card}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{entry.category}</p>
                  <p className="mt-1 font-medium text-syncra-primary">{entry.summary}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Society {entry.societyId}
                    {entry.flatNumber ? ` · Flat ${entry.flatNumber}` : ''}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-slate-500">
                  {new Date(entry.occurredAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
