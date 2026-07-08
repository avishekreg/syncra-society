import React, { useId } from 'react'
import { Link } from 'react-router-dom'

type SyncraBrandLogoProps = {
  to?: string
  className?: string
  variant?: 'light' | 'dark'
  /** When false, shows a single-line Syncra wordmark without the Society subtitle. */
  showSubtitle?: boolean
}

function SyncraInsignia({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  const strokeId = `syncra-stroke-${uid}`
  const fillId = `syncra-fill-${uid}`

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={strokeId} x1="6" y1="26" x2="26" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B4D8" />
          <stop offset="0.55" stopColor="#0052CC" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
        <linearGradient id={fillId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8FAFC" />
          <stop offset="1" stopColor="#EEF2FF" />
        </linearGradient>
      </defs>

      <rect width="32" height="32" rx="8" fill={`url(#${fillId})`} />
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="7.25"
        stroke={`url(#${strokeId})`}
        strokeOpacity="0.18"
        strokeWidth="1.5"
      />

      <path
        d="M10 22.5V12.5L16 9.5L22 12.5V22.5"
        stroke={`url(#${strokeId})`}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 22.5V15.2L16 13.9L18.5 15.2V22.5"
        stroke={`url(#${strokeId})`}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 12.5L16 15.8L22 12.5"
        stroke="#0052CC"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <circle cx="16" cy="18.8" r="1.35" fill="#0052CC" opacity="0.85" />
    </svg>
  )
}

function SyncraWordmark({
  variant = 'light',
  showSubtitle = true
}: {
  variant?: 'light' | 'dark'
  showSubtitle?: boolean
}) {
  const isDark = variant === 'dark'

  if (!showSubtitle) {
    return (
      <span
        className={
          isDark
            ? 'bg-gradient-to-r from-white via-slate-100 to-cyan-100 bg-clip-text text-base font-bold tracking-tight text-transparent'
            : 'text-base font-bold tracking-tight text-syncra-primary'
        }
      >
        Syncra
      </span>
    )
  }

  return (
    <div className="flex min-w-0 flex-col justify-center leading-none">
      <span
        className={
          isDark
            ? 'bg-gradient-to-r from-white via-slate-100 to-cyan-100 bg-clip-text text-[14px] font-bold tracking-tight text-transparent'
            : 'text-[14px] font-bold tracking-tight text-slate-900'
        }
      >
        Syncra
      </span>
      <span
        aria-hidden="true"
        className={isDark ? 'my-[3px] block h-px w-full bg-white/15' : 'my-[3px] block h-px w-full bg-slate-200'}
      />
      <span
        className={
          isDark
            ? 'text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/90'
            : 'text-[10px] font-semibold uppercase tracking-[0.14em] text-syncra-blue'
        }
      >
        Society
      </span>
    </div>
  )
}

export default function SyncraBrandLogo({
  to = '/',
  className = '',
  variant = 'light',
  showSubtitle = true
}: SyncraBrandLogoProps) {
  const content = (
    <div className={`flex h-9 items-center gap-2.5 ${className}`}>
      <SyncraInsignia className="h-8 w-8 shrink-0" />
      <SyncraWordmark variant={variant} showSubtitle={showSubtitle} />
    </div>
  )

  if (!to) return content

  return (
    <Link
      to={to}
      aria-label="Syncra Society home"
      className={`inline-flex shrink-0 rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-cyan-400/40 ${
        variant === 'dark' ? 'focus-visible:ring-offset-[#0c1528]' : 'focus-visible:ring-offset-2'
      }`}
    >
      {content}
    </Link>
  )
}

export { SyncraInsignia }
