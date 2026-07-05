import React, { useCallback, useEffect, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import supabase from '../../api/supabaseSdk'
import type { Complaint } from '../../types/db'
import { ui } from '../../lib/ui'

const TABLE = 'complaints_and_suggestions'

type ComplaintsDashboardProps = {
  societyId: string
}

function normalizeRow(row: Record<string, unknown>): Complaint {
  return {
    id: String(row.id),
    society_id: String(row.society_id),
    raised_by_user_id: String(row.raised_by_user_id),
    subject: String(row.subject),
    description: row.description != null ? String(row.description) : null,
    status: (row.status as Complaint['status']) ?? 'open',
    created_at: row.created_at != null ? String(row.created_at) : undefined,
    updated_at: row.updated_at != null ? String(row.updated_at) : undefined
  }
}

function statusLabel(status: Complaint['status']) {
  switch (status) {
    case 'open':
      return 'Open'
    case 'resolved':
      return 'Resolved'
    case 'in_progress':
      return 'In Progress'
    case 'closed':
      return 'Closed'
    default:
      return status
  }
}

function statusBadgeClass(status: Complaint['status']) {
  switch (status) {
    case 'open':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'resolved':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'in_progress':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    case 'closed':
      return 'border-slate-200 bg-slate-100 text-slate-600'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600'
  }
}

function formatRaisedBy(value: string) {
  const trimmed = value.trim()
  if (/^\+?\d{10,15}$/.test(trimmed.replace(/\s/g, ''))) {
    return trimmed.startsWith('+') ? trimmed : `+${trimmed.replace(/^0/, '91')}`
  }
  if (trimmed.startsWith('whatsapp:')) return trimmed.replace('whatsapp:', '')
  return trimmed
}

function formatTimestamp(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

function prependComplaint(prev: Complaint[], incoming: Complaint) {
  if (prev.some((item) => item.id === incoming.id)) return prev
  return [incoming, ...prev]
}

export default function ComplaintsDashboard({ societyId }: ComplaintsDashboardProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(false)

  const fetchComplaints = useCallback(async () => {
    if (!societyId) {
      setComplaints([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from(TABLE)
      .select('*')
      .eq('society_id', societyId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setComplaints([])
    } else {
      setComplaints((data ?? []).map((row) => normalizeRow(row as Record<string, unknown>)))
    }

    setLoading(false)
  }, [societyId])

  useEffect(() => {
    void fetchComplaints()
  }, [fetchComplaints])

  useEffect(() => {
    if (!societyId) {
      setLive(false)
      return
    }

    let channel: RealtimeChannel | null = null

    channel = supabase
      .channel(`complaints-insert-${societyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLE,
          filter: `society_id=eq.${societyId}`
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          setComplaints((prev) => prependComplaint(prev, normalizeRow(row)))
        }
      )
      .subscribe((status) => {
        setLive(status === 'SUBSCRIBED')
      })

    return () => {
      setLive(false)
      if (channel) {
        void supabase.removeChannel(channel)
      }
    }
  }, [societyId])

  if (!societyId) {
    return (
      <div className={ui.card}>
        <p className={ui.body}>Society ID is required to load the complaints dashboard.</p>
      </div>
    )
  }

  return (
    <div className={ui.sectionGap}>
      <header className={ui.sectionHeaderCenter}>
        <div>
          <p className={ui.eyebrow}>Smart Helpdesk</p>
          <h2 className={`mt-2 ${ui.headingLg}`}>Live complaints dashboard</h2>
          <p className={`mt-2 max-w-2xl ${ui.body}`}>
            All tickets for this society — including inbound WhatsApp messages — update instantly without a page
            refresh.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {live && (
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
              Live
            </span>
          )}
          <button type="button" onClick={() => void fetchComplaints()} className={ui.btnGhost}>
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className={ui.card} aria-busy="true" aria-live="polite">
          <div className="flex items-center gap-3">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-syncra-accent border-t-transparent" />
            <p className={ui.body}>Loading complaints…</p>
          </div>
        </div>
      )}

      {!loading && !error && complaints.length === 0 && (
        <div className={ui.card}>
          <p className={ui.body}>No complaints logged yet for this society.</p>
        </div>
      )}

      {!loading && complaints.length > 0 && (
        <>
          <p className="text-sm text-slate-500">
            {complaints.length} ticket{complaints.length === 1 ? '' : 's'} · newest first
          </p>

          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {complaints.map((ticket) => (
              <li key={ticket.id}>
                <article className={`${ui.card} flex h-full flex-col gap-4`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-syncra-primary sm:text-lg">{ticket.subject}</h3>
                      <time className="mt-1 block text-xs text-slate-500" dateTime={ticket.created_at}>
                        {formatTimestamp(ticket.created_at)}
                      </time>
                    </div>
                    <span
                      className={`inline-flex shrink-0 self-start rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(ticket.status)}`}
                    >
                      {statusLabel(ticket.status)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-syncra-surface-alt px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Description</p>
                    <p className={`mt-2 whitespace-pre-wrap break-words ${ui.body}`}>
                      {ticket.description?.trim() || 'No message body provided.'}
                    </p>
                  </div>

                  <div className="mt-auto border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Raised by</p>
                    <p className="mt-1 break-all font-mono text-sm text-slate-700">
                      {formatRaisedBy(ticket.raised_by_user_id)}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
