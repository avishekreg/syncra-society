import React, { useMemo } from 'react'

type Props = {
  active: boolean
  level?: number
}

const BAR_COUNT = 7

export default function VoiceSoundwave({ active, level = 0 }: Props) {
  const bars = useMemo(() => Array.from({ length: BAR_COUNT }, (_, index) => index), [])

  if (!active) return null

  const amplified = Math.min(1, level * 2.4 + 0.08)

  return (
    <div
      className="flex h-8 items-end justify-center gap-1 rounded-xl border border-syncra-accent/25 bg-syncra-accent/5 px-3 py-2"
      aria-hidden="true"
    >
      {bars.map((bar) => {
        const phase = (bar / BAR_COUNT) * Math.PI
        const height = 28 + Math.sin(phase + amplified * 6) * 12 + amplified * 36
        return (
          <span
            key={bar}
            className="w-1 rounded-full bg-syncra-blue transition-[height] duration-100 ease-out"
            style={{ height: `${Math.max(12, Math.min(52, height))}%` }}
          />
        )
      })}
    </div>
  )
}
