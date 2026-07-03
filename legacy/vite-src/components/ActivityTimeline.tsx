import React from 'react'
import { listActivities, formatActivityTimestamp, type ActivityCategory } from '../lib/activityLog'
import { ui } from '../lib/ui'

const categoryLabels: Record<ActivityCategory, string> = {
  account: 'Account',
  payment: 'Payment',
  visitor: 'Visitor',
  notice: 'Notice',
  survey: 'Survey',
  gallery: 'Gallery',
  election: 'Election',
  helpdesk: 'Helpdesk'
}

type Props = {
  societyId: string | null
  userId?: string | null
  flatNumber?: string | null
  limit?: number
}

export default function ActivityTimeline({ societyId, userId, flatNumber, limit = 50 }: Props) {
  if (!societyId) {
    return <p className={ui.body}>Link your account to a society to view activity history.</p>
  }

  const entries = listActivities(societyId, { userId, flatNumber }).slice(0, limit)

  if (entries.length === 0) {
    return <p className={ui.body}>No activity recorded yet.</p>
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className={`${ui.innerItem} text-sm`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-syncra-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-syncra-blue">
              {categoryLabels[entry.category]}
            </span>
            <time className="text-xs text-slate-500">{formatActivityTimestamp(entry.occurredAt)}</time>
          </div>
          <p className="mt-2 font-medium text-syncra-primary">{entry.summary}</p>
          {entry.flatNumber && <p className="mt-1 text-xs text-slate-500">Flat {entry.flatNumber}</p>}
        </li>
      ))}
    </ul>
  )
}
