import React from 'react'
import {
  SYNCRA_ANDROID_DOWNLOAD_API,
  SYNCRA_ANDROID_LANDING_PATH
} from '../../lib/androidApp'
import { ui } from '../../lib/ui'

type AndroidDownloadCtaProps = {
  variant?: 'navbar' | 'hero' | 'footer' | 'inline'
  className?: string
}

function AndroidIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7 4.5L8.8 2.2M17 4.5L15.2 2.2M8 15.5V17.5M16 15.5V17.5M6.5 9.5H17.5C18.6 9.5 19.5 10.4 19.5 11.5V17C19.5 18.1 18.6 19 17.5 19H6.5C5.4 19 4.5 18.1 4.5 17V11.5C4.5 10.4 5.4 9.5 6.5 9.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 7.5C9.5 6.12 10.62 5 12 5C13.38 5 14.5 6.12 14.5 7.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function AndroidDownloadCta({ variant = 'inline', className = '' }: AndroidDownloadCtaProps) {
  if (variant === 'navbar') {
    return (
      <a
        href={SYNCRA_ANDROID_LANDING_PATH}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-syncra-accent/35 bg-syncra-accent/10 px-4 py-3 text-sm font-semibold text-syncra-blue transition hover:bg-syncra-accent/20 ${className}`}
      >
        <AndroidIcon className="h-4 w-4" />
        Android App
      </a>
    )
  }

  if (variant === 'hero') {
    return (
      <a
        href={SYNCRA_ANDROID_LANDING_PATH}
        className={`inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-syncra-primary/15 bg-syncra-primary px-8 py-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#153052] sm:w-auto ${className}`}
      >
        <AndroidIcon className="h-5 w-5" />
        Download Android App
      </a>
    )
  }

  if (variant === 'footer') {
    return (
      <a
        href={SYNCRA_ANDROID_LANDING_PATH}
        className={`inline-flex items-center gap-2 hover:text-syncra-blue ${className}`}
      >
        <AndroidIcon className="h-4 w-4" />
        Download Android App
      </a>
    )
  }

  return (
    <a
      href={SYNCRA_ANDROID_DOWNLOAD_API}
      className={`inline-flex min-h-11 items-center justify-center gap-2 ${ui.btnSecondary} ${className}`}
    >
      <AndroidIcon className="h-4 w-4" />
      Download APK
    </a>
  )
}
