import React from 'react'
import type { Complaint } from '../../types/db'
import { useSocietyComplaints } from '../../hooks/useSocietyComplaints'
import { ui } from '../../lib/ui'

type ComplaintsDashboardProps = {
  /** Primary PostgreSQL UUID used for queries and realtime. */
  societyId: string
  /** Legacy slug or alternate ids (e.g. syncra-windsor-castle) for fallback lookups. */
  alternateSocietyIds?: string[]
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

export default function ComplaintsDashboard({
  societyId,
  alternateSocietyIds = []
}: ComplaintsDashboardProps) {
  const { complaints, loading, error, live, refresh } = useSocietyComplaints(
    societyId,
    alternateSocietyIds
  )

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
          <button type="button" onClick={() => void refresh()} className={ui.btnGhost}>
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          <p className="font-medium">Unable to reach the live complaints service.</p>
          <p className="mt-1 text-amber-800/90">
            {error}. Showing cached or demo tickets where available — the dashboard remains usable.
          </p>
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

      {!loading && complaints.length === 0 && (
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
