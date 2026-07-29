import React, { useId } from 'react'
import { Link } from 'react-router-dom'
import { MAI_PLATFORM_NAME } from '../../lib/brandConstants'
import MaiSocietyWordmark from './MaiSocietyWordmark'

type SyncraBrandLogoProps = {
  to?: string
  className?: string
  variant?: 'light' | 'dark'
  /** When false, shows inline mAI without the Society subtitle. */
  showSubtitle?: boolean
}

function SyncraInsignia({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  const strokeId = `mai-stroke-${uid}`
  const fillId = `mai-fill-${uid}`
  const accentId = `mai-accent-${uid}`

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
        <linearGradient id={accentId} x1="14" y1="8" x2="22" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB347" />
          <stop offset="1" stopColor="#E67E00" />
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
      {/* Orange AI accent mark */}
      <path
        d="M21.5 10.5L23.5 8.5L25 10.5L23 12.5Z"
        fill={`url(#${accentId})`}
        opacity="0.95"
      />
    </svg>
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
      <MaiSocietyWordmark variant={variant} showSociety={showSubtitle} />
    </div>
  )

  if (!to) return content

  return (
    <Link
      to={to}
      aria-label={`${MAI_PLATFORM_NAME} home`}
      className={`inline-flex shrink-0 rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-cyan-400/40 ${
        variant === 'dark' ? 'focus-visible:ring-offset-[#0c1528]' : 'focus-visible:ring-offset-2'
      }`}
    >
      {content}
    </Link>
  )
}

export { SyncraInsignia }
