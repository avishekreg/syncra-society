import React, { useEffect, useState } from 'react'

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, '0')
}

export function formatCountdown(targetIso: string | null | undefined, nowMs = Date.now()) {
  if (!targetIso) return null
  const target = new Date(targetIso).getTime()
  if (Number.isNaN(target)) return null
  const diff = Math.max(0, target - nowMs)
  const totalSec = Math.floor(diff / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return {
    done: diff <= 0,
    label: `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`,
    hours,
    minutes,
    seconds,
    totalMs: diff
  }
}

export function ElectionTurnoutBar({
  percent,
  voted,
  eligible,
  label = 'Residents Voted'
}: {
  percent: number
  voted: number
  eligible: number
  label?: string
}) {
  const safe = Math.max(0, Math.min(100, percent || 0))
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-syncra-blue">
          {safe}% {label}
        </p>
        <p className="text-xs text-slate-500">
          {voted}/{eligible || '—'} flats
        </p>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safe}
        aria-label={`${safe}% ${label}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-syncra-blue to-syncra-accent transition-[width] duration-500"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  )
}

export function ElectionCountdown({
  targetIso,
  prefix,
  onComplete
}: {
  targetIso: string | null | undefined
  prefix: string
  onComplete?: () => void
}) {
  const [now, setNow] = useState(() => Date.now())
  const countdown = formatCountdown(targetIso, now)

  useEffect(() => {
    if (!targetIso) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [targetIso])

  useEffect(() => {
    if (countdown?.done) onComplete?.()
  }, [countdown?.done, onComplete])

  if (!countdown) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{prefix}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-syncra-primary">
        {countdown.done ? '00h 00m 00s' : countdown.label}
      </p>
    </div>
  )
}
