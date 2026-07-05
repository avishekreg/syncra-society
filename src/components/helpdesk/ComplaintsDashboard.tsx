import React from 'react'
import type { Complaint } from '../../types/db'
import { useSocietyComplaints } from '../../hooks/useSocietyComplaints'
import { useResolvedSocietyUuid } from '../../hooks/useResolvedSocietyUuid'
import { useAuth } from '../../providers/AuthProvider'
import { ui } from '../../lib/ui'

function statusLabel(status: Complaint['status']) {
  switch (status) {
    case 'open':
      return 'Open'
    case 'in_progress':
      return 'In Progress'
    case 'resolved':
      return 'Resolved'
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

type ComplaintsDashboardProps = {
  societyId?: string | null
  title?: string
  description?: string
}

export default function ComplaintsDashboard({
  societyId: societyIdProp,
  title = 'Complaints & suggestions',
  description = 'All society tickets from the portal and WhatsApp automation — updates live when residents log new issues.'
}: ComplaintsDashboardProps) {
  const { currentSocietyId } = useAuth()
  const { uuid, societyKey, loading: resolvingUuid } = useResolvedSocietyUuid()
  const querySocietyId = societyIdProp ?? uuid ?? societyKey ?? currentSocietyId
  const alternateIds = [societyKey, currentSocietyId, uuid].filter(
    (id): id is string => Boolean(id && id !== querySocietyId)
  )

  const { complaints, loading, error, live, refresh } = useSocietyComplaints(
    querySocietyId,
    alternateIds
  )

  const isLoading = loading || resolvingUuid

  return (
    <div className={ui.sectionGap}>
      <header className={ui.sectionHeaderCenter}>
        <div>
          <p className={ui.eyebrow}>Smart Helpdesk</p>
          <h2 className={`mt-2 ${ui.headingLg}`}>{title}</h2>
          <p className={`mt-2 max-w-2xl ${ui.body}`}>{description}</p>
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
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {isLoading && (
        <div className={ui.card}>
          <p className={ui.body}>Loading complaints…</p>
        </div>
      )}

      {!isLoading && complaints.length === 0 && (
        <div className={ui.card}>
          <p className={ui.body}>No complaints logged yet for this society.</p>
        </div>
      )}

      {!isLoading && complaints.length > 0 && (
        <>
          <p className="text-sm text-slate-500">
            {complaints.length} ticket{complaints.length === 1 ? '' : 's'} · newest first
          </p>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {complaints.map((ticket) => (
              <article key={ticket.id} className={`${ui.card} flex flex-col gap-4`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-syncra-primary sm:text-lg">{ticket.subject}</h3>
                    {ticket.created_at && (
                      <time className="mt-1 block text-xs text-slate-500">
                        {new Date(ticket.created_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </time>
                    )}
                  </div>
                  <span
                    className={`inline-flex shrink-0 self-start rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(ticket.status)}`}
                  >
                    {statusLabel(ticket.status)}
                  </span>
                </div>

                {ticket.description && (
                  <div className="rounded-xl border border-slate-100 bg-syncra-surface-alt px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Description
                    </p>
                    <p className={`mt-2 whitespace-pre-wrap break-words ${ui.body}`}>{ticket.description}</p>
                  </div>
                )}

                <div className="mt-auto border-t border-slate-100 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Raised by</p>
                  <p className="mt-1 break-all font-mono text-sm text-slate-700">
                    {formatRaisedBy(ticket.raised_by_user_id)}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Raised by</th>
                  <th className="px-4 py-3">Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((ticket) => (
                  <tr key={`row-${ticket.id}`} className="text-sm text-slate-700">
                    <td className="max-w-[12rem] px-4 py-3 font-medium text-syncra-primary">{ticket.subject}</td>
                    <td className="max-w-[20rem] px-4 py-3">
                      <span className="line-clamp-3 whitespace-pre-wrap">{ticket.description ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(ticket.status)}`}
                      >
                        {statusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="max-w-[10rem] px-4 py-3 font-mono text-xs break-all">
                      {formatRaisedBy(ticket.raised_by_user_id)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {ticket.created_at
                        ? new Date(ticket.created_at).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
