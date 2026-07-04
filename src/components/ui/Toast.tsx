import React from 'react'
import { ui } from '../../lib/ui'

type Props = {
  message: string | null
  onDismiss?: () => void
}

export default function Toast({ message, onDismiss }: Props) {
  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${ui.alert} flex items-start justify-between gap-4`}
    >
      <p className="text-sm font-medium text-syncra-primary">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-syncra-primary"
        >
          Dismiss
        </button>
      )}
    </div>
  )
}
