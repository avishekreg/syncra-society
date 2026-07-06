import React, { useEffect, useState } from 'react'
import { SYNCRA_ANDROID_LANDING_PATH } from '../../lib/androidApp'
import { ui } from '../../lib/ui'

const BADGE_WIDTH = 135
const BADGE_HEIGHT = 40

function StoreBadgeButton({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex shrink-0 leading-none ${className}`}
      style={{ width: BADGE_WIDTH, height: BADGE_HEIGHT }}
    >
      {children}
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
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-accent">
          Get the app
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={SYNCRA_ANDROID_LANDING_PATH}
            className="inline-flex outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-syncra-accent/40 focus-visible:ring-offset-2"
            aria-label="Download Syncra Society for Android"
          >
            <StoreBadgeButton>
              <img
                src="/badges/google-play-badge.png"
                alt="Get it on Google Play"
                width={BADGE_WIDTH}
                height={BADGE_HEIGHT}
                className="block h-full w-full object-contain"
                loading="lazy"
                draggable={false}
              />
            </StoreBadgeButton>
          </a>
          <button
            type="button"
            onClick={() => setIosModalOpen(true)}
            className="inline-flex border-0 bg-transparent p-0 outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-syncra-accent/40 focus-visible:ring-offset-2"
            aria-label="Syncra Society on the App Store — coming soon"
          >
            <StoreBadgeButton>
              <img
                src="/badges/app-store-badge.png"
                alt="Download on the App Store"
                width={BADGE_WIDTH}
                height={BADGE_HEIGHT}
                className="block h-full w-full object-contain"
                loading="lazy"
                draggable={false}
              />
            </StoreBadgeButton>
          </button>
        </div>
      </div>

      {iosModalOpen && (
        <div
          className={ui.overlay}
          role="presentation"
          onClick={() => setIosModalOpen(false)}
        >
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
