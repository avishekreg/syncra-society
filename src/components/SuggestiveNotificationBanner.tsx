import React from 'react'
import { Link } from 'react-router-dom'
import type { SuggestiveNotification } from '../lib/suggestiveNotifications'
import { ui } from '../lib/ui'

const severityStyles: Record<SuggestiveNotification['severity'], string> = {
  info: 'border-syncra-accent/30 bg-syncra-accent/10 text-syncra-primary',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  critical: 'border-rose-200 bg-rose-50 text-rose-900'
}

export default function SuggestiveNotificationBanner({
  notifications
}: {
  notifications: SuggestiveNotification[]
}) {
  if (notifications.length === 0) return null

  return (
    <div className="space-y-3">
      {notifications.map((item) => (
        <article
          key={item.id}
          className={`rounded-2xl border px-4 py-4 shadow-sm sm:px-5 ${severityStyles[item.severity]}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">Suggestive alert</p>
          <h3 className="mt-1 text-base font-semibold">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed opacity-90">{item.message}</p>
          {item.actionPath && item.actionLabel && (
            <Link to={item.actionPath} className={`mt-3 inline-flex ${ui.btnGhost}`}>
              {item.actionLabel}
            </Link>
          )}
        </article>
      ))}
    </div>
  )
}
