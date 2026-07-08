import React, { useEffect, useState } from 'react'
import { SYNCRA_ANDROID_LANDING_PATH } from '../../lib/androidApp'
import { ui } from '../../lib/ui'

const BADGE_IMG_STYLE: React.CSSProperties = { borderRadius: '8px' }
const BADGE_IMG_CLASS = 'block h-10 w-[135px] max-w-full rounded-md object-cover overflow-hidden'
const BADGE_IMG_CLASS_FULL = 'block h-12 w-[172px] max-w-full rounded-md object-cover overflow-hidden'

const PILL_BUTTON_CLASS =
  'inline-flex min-h-11 items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-syncra-primary ' +
  'shadow-sm outline-none transition hover:border-syncra-accent/40 hover:bg-syncra-surface-alt ' +
  'focus-visible:ring-2 focus-visible:ring-syncra-accent/40 focus-visible:ring-offset-2'

function GooglePlayIcon({ className = 'h-5 w-5 shrink-0 rounded-md overflow-hidden' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={BADGE_IMG_STYLE}
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12 3.84 21.85C3.34 21.61 3 21.09 3 20.5Z"
      />
      <path fill="#34A853" d="M16.81 15.12 6.05 21.34 14.54 12.85 16.81 15.12Z" />
      <path
        fill="#FBBC04"
        d="M20.16 10.81c.34.27.59.69.59 1.19 0 .5-.25.92-.59 1.19l-2.27 1.31-2.5-2.5 2.5-2.5 2.27 1.31Z"
      />
      <path fill="#EA4335" d="M6.05 2.66 16.81 8.88 14.54 11.15 6.05 2.66Z" />
    </svg>
  )
}

function AppleIcon({ className = 'h-5 w-5 shrink-0 rounded-md overflow-hidden' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={BADGE_IMG_STYLE}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.48-.12-1.06.466-2.21 1.115-2.96.748-.86 2.066-1.49 3.049-1.6zM20.75 17.13c-.577 1.32-1.253 2.62-2.262 3.73-1.01 1.11-2.188 2.35-3.756 2.35-1.568 0-1.965-.93-3.662-.93-1.697 0-2.053.9-3.656.93-1.603.03-2.823-1.22-3.4-2.54-1.468-3.35-1.295-8.17.72-10.36.99-1.09 2.462-1.73 3.892-1.73 1.43 0 2.334.93 3.518.93 1.183 0 1.901-.93 3.612-.93 1.29 0 2.646.7 3.636 1.91-3.19 1.74-2.673 6.27.518 7.57z" />
    </svg>
  )
}

type FooterAppStoreBadgesProps = {
  align?: 'left' | 'center'
  variant?: 'store' | 'pill'
  /** Stack store buttons vertically instead of side-by-side. */
  stacked?: boolean
  /** Hide the built-in heading (when rendered by SyncraFooter). */
  hideHeading?: boolean
}

export default function FooterAppStoreBadges({
  align = 'left',
  variant = 'store',
  stacked = false,
  hideHeading = false
}: FooterAppStoreBadgesProps) {
  const [iosModalOpen, setIosModalOpen] = useState(false)
  const compact = stacked
  const badgeImgClass = compact ? BADGE_IMG_CLASS : BADGE_IMG_CLASS_FULL
  const alignClass = align === 'center' ? 'items-center text-center' : 'items-start text-left'

  useEffect(() => {
    if (!iosModalOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIosModalOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [iosModalOpen])

  const iosTrigger =
    variant === 'pill' ? (
      <button
        type="button"
        onClick={() => setIosModalOpen(true)}
        className={PILL_BUTTON_CLASS}
        aria-label="Download on the App Store — coming soon"
      >
        <AppleIcon className="h-5 w-5 shrink-0 text-syncra-primary" />
        iPhone App
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setIosModalOpen(true)}
        className="inline-block border-0 bg-transparent p-0"
        aria-label="Download on the App Store — coming soon"
      >
        <img
          src="/badges/app-store.svg"
          alt="Download on the App Store"
          className={badgeImgClass}
          style={BADGE_IMG_STYLE}
        />
      </button>
    )

  const androidLink =
    variant === 'pill' ? (
      <a href={SYNCRA_ANDROID_LANDING_PATH} className={PILL_BUTTON_CLASS} aria-label="Get Android app">
        <GooglePlayIcon />
        Android App
      </a>
    ) : (
      <a href={SYNCRA_ANDROID_LANDING_PATH} className="inline-block" aria-label="Get it on Google Play">
        <img
          src="/badges/google-play.svg"
          alt="Get it on Google Play"
          className={badgeImgClass}
          style={BADGE_IMG_STYLE}
        />
      </a>
    )

  return (
    <>
      <div className={`flex w-full flex-col space-y-2 lg:w-auto ${alignClass}`}>
        {variant === 'store' && !hideHeading && (
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-syncra-blue">
            Get the app
          </p>
        )}

        <div
          className={
            stacked
              ? 'flex w-full flex-col items-start space-y-1.5'
              : 'flex flex-nowrap items-center gap-3 sm:gap-4'
          }
          role="group"
          aria-label="Download Syncra Society mobile apps"
        >
          {androidLink}
          {iosTrigger}
        </div>
      </div>

      {iosModalOpen && (
        <div className={ui.overlay} role="presentation" onClick={() => setIosModalOpen(false)}>
          <div
            className={`${ui.modal} max-w-md`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-coming-soon-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className={ui.eyebrowPrimary}>iOS app</p>
            <h2 id="ios-coming-soon-title" className={`mt-2 ${ui.heading}`}>
              Coming soon
            </h2>
            <p className={`mt-3 ${ui.body}`}>
              The Syncra Society iOS app is in development. Android is available now — or use the web
              platform on Safari in the meantime.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={SYNCRA_ANDROID_LANDING_PATH} className={`${ui.btnPrimary} w-full justify-center sm:flex-1`}>
                Get Android app
              </a>
              <button
                type="button"
                onClick={() => setIosModalOpen(false)}
                className={`${ui.btnGhost} w-full justify-center sm:flex-1`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
