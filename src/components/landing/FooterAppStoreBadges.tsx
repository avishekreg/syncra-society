import React, { useEffect, useState } from 'react'
import { SYNCRA_ANDROID_LANDING_PATH } from '../../lib/androidApp'
import { ui } from '../../lib/ui'

/** Identical shell — flat solid black, no borders, no nested frames. */
const STORE_BUTTON_CLASS =
  'inline-flex h-12 w-[172px] shrink-0 items-center gap-2.5 rounded-xl bg-black px-3.5 text-left text-white ' +
  'shadow-sm outline-none transition hover:opacity-90 ' +
  'focus-visible:ring-2 focus-visible:ring-syncra-accent/40 focus-visible:ring-offset-2'

function GooglePlayIcon({ className = 'h-7 w-7 shrink-0' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
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

function AppleIcon({ className = 'h-7 w-7 shrink-0' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.48-.12-1.06.466-2.21 1.115-2.96.748-.86 2.066-1.49 3.049-1.6zM20.75 17.13c-.577 1.32-1.253 2.62-2.262 3.73-1.01 1.11-2.188 2.35-3.756 2.35-1.568 0-1.965-.93-3.662-.93-1.697 0-2.053.9-3.656.93-1.603.03-2.823-1.22-3.4-2.54-1.468-3.35-1.295-8.17.72-10.36.99-1.09 2.462-1.73 3.892-1.73 1.43 0 2.334.93 3.518.93 1.183 0 1.901-.93 3.612-.93 1.29 0 2.646.7 3.636 1.91-3.19 1.74-2.673 6.27.518 7.57z" />
    </svg>
  )
}

function GooglePlayButtonLabel() {
  return (
    <span className="flex min-w-0 flex-col leading-none">
      <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-white">
        GET IT ON
      </span>
      <span className="mt-1 text-[15px] font-semibold tracking-tight text-white">Google Play</span>
    </span>
  )
}

function AppStoreButtonLabel() {
  return (
    <span className="flex min-w-0 flex-col leading-none">
      <span className="text-[9px] font-medium tracking-[0.01em] text-white/95">Download on the</span>
      <span className="mt-1 text-[15px] font-semibold tracking-tight text-white">App Store</span>
    </span>
  )
}

export default function FooterAppStoreBadges() {
  const [iosModalOpen, setIosModalOpen] = useState(false)

  useEffect(() => {
    if (!iosModalOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIosModalOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [iosModalOpen])

  return (
    <>
      <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-accent lg:text-center">
          Get the app
        </p>

        <div
          className="flex flex-row flex-wrap items-center gap-3 sm:gap-4"
          role="group"
          aria-label="Download Syncra Society mobile apps"
        >
          <a href={SYNCRA_ANDROID_LANDING_PATH} className={STORE_BUTTON_CLASS} aria-label="Get it on Google Play">
            <GooglePlayIcon />
            <GooglePlayButtonLabel />
          </a>

          <button
            type="button"
            onClick={() => setIosModalOpen(true)}
            className={`${STORE_BUTTON_CLASS} border-0`}
            aria-label="Download on the App Store — coming soon"
          >
            <AppleIcon />
            <AppStoreButtonLabel />
          </button>
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
