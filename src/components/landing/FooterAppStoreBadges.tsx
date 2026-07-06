import React, { useEffect, useState } from 'react'
import { SYNCRA_ANDROID_LANDING_PATH } from '../../lib/androidApp'
import { ui } from '../../lib/ui'

/** Shared pixel dimensions — both badges must match exactly. */
export const BADGE_WIDTH_PX = 135
export const BADGE_HEIGHT_PX = 40

/** 10px radius @ 40px height — matches store badge curvature. */
export const BADGE_RADIUS_CLASS = 'rounded-[10px]'

/**
 * Tight clip frame: overflow-hidden + solid black fill so no PNG transparency
 * or checkerboard fringe can bleed through on light footer backgrounds.
 */
export const badgeFrameClass = [
  'relative inline-flex shrink-0 overflow-hidden bg-black shadow-sm',
  'aspect-[135/40] h-10 w-[135px]',
  BADGE_RADIUS_CLASS
].join(' ')

/** App Store — standard clip. */
export const badgeImageClass =
  'pointer-events-none absolute inset-0 block h-full w-full object-cover object-center select-none'

/**
 * Google Play — aggressive horizontal crop: scale-x pushes ~7% of each side
 * outside the overflow-hidden frame, eliminating baked-in checkerboard strips.
 */
export const googlePlayFrameClass = [
  'relative inline-flex shrink-0 isolate overflow-hidden bg-black shadow-sm',
  'aspect-[135/40] h-10 w-[135px]',
  BADGE_RADIUS_CLASS
].join(' ')

export const googlePlayImageClass = [
  'pointer-events-none absolute left-1/2 top-1/2 block max-w-none select-none',
  'h-full w-[116%] -translate-x-1/2 -translate-y-1/2',
  'origin-center scale-x-[1.12] scale-y-[1.05]',
  'object-cover object-center'
].join(' ')

export const googlePlayTriggerClass = [
  'inline-flex overflow-hidden bg-black p-0 outline-none transition hover:opacity-90',
  'aspect-[135/40] h-10 w-[135px]',
  BADGE_RADIUS_CLASS,
  'focus-visible:ring-2 focus-visible:ring-syncra-accent/40 focus-visible:ring-offset-2'
].join(' ')

export const badgeTriggerClass = [
  'inline-flex overflow-hidden p-0 outline-none transition hover:opacity-90',
  BADGE_RADIUS_CLASS,
  'focus-visible:ring-2 focus-visible:ring-syncra-accent/40 focus-visible:ring-offset-2'
].join(' ')

type StoreBadgeFrameProps = {
  src: string
  alt: string
  imageClassName?: string
  frameClassName?: string
}

function StoreBadgeFrame({
  src,
  alt,
  imageClassName = badgeImageClass,
  frameClassName = badgeFrameClass
}: StoreBadgeFrameProps) {
  return (
    <span className={frameClassName}>
      <img
        src={src}
        alt={alt}
        width={BADGE_WIDTH_PX}
        height={BADGE_HEIGHT_PX}
        className={imageClassName}
        loading="lazy"
        draggable={false}
        decoding="async"
      />
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
          className="flex flex-wrap items-center gap-3 sm:gap-3.5"
          role="group"
          aria-label="Download Syncra Society mobile apps"
        >
          <a
            href={SYNCRA_ANDROID_LANDING_PATH}
            className={googlePlayTriggerClass}
            aria-label="Download Syncra Society for Android"
          >
            <StoreBadgeFrame
              src="/badges/google-play-badge.png"
              alt="Get it on Google Play"
              frameClassName={googlePlayFrameClass}
              imageClassName={googlePlayImageClass}
            />
          </a>

          <button
            type="button"
            onClick={() => setIosModalOpen(true)}
            className={`${badgeTriggerClass} border-0 bg-transparent`}
            aria-label="Syncra Society on the App Store — coming soon"
          >
            <StoreBadgeFrame src="/badges/app-store-badge.png" alt="Download on the App Store" />
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
