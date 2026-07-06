import React, { useEffect, useState } from 'react'
import { SYNCRA_ANDROID_LANDING_PATH } from '../../lib/androidApp'
import { ui } from '../../lib/ui'

/** Canonical badge display size — Apple SVG native ratio (~120×40). */
const BADGE_CLASS = 'block h-10 w-[120px] shrink-0 select-none'

const badgeTriggerClass =
  'inline-flex rounded-xl outline-none transition hover:opacity-90 ' +
  'focus-visible:ring-2 focus-visible:ring-syncra-accent/40 focus-visible:ring-offset-2'

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
          className="flex flex-wrap items-center gap-3 sm:gap-3.5"
          role="group"
          aria-label="Download Syncra Society mobile apps"
        >
          <a
            href={SYNCRA_ANDROID_LANDING_PATH}
            className={badgeTriggerClass}
            aria-label="Download Syncra Society for Android"
          >
            <img
              src="/badges/google-play-official.png"
              alt="Get it on Google Play"
              width={120}
              height={40}
              className={BADGE_CLASS}
              loading="lazy"
              draggable={false}
              decoding="async"
            />
          </a>

          <button
            type="button"
            onClick={() => setIosModalOpen(true)}
            className={`${badgeTriggerClass} border-0 bg-transparent p-0`}
            aria-label="Syncra Society on the App Store — coming soon"
          >
            <img
              src="/badges/app-store.svg"
              alt="Download on the App Store"
              width={120}
              height={40}
              className={BADGE_CLASS}
              loading="lazy"
              draggable={false}
              decoding="async"
            />
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
