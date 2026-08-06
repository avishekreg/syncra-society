import React, { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ui } from '../../lib/ui'
import { BROCHURE_LOCALES, type BrochureLocale } from '../../lib/brochureI18n'
import { openLiveBrochurePrint, type BrochureDeck } from '../../lib/brochurePrint'

export type BrochureFormat = BrochureDeck

type Props = {
  open: boolean
  onClose: () => void
  /** Prefill when opening from a specific CTA */
  defaultFormat?: BrochureFormat
  defaultLocale?: BrochureLocale
}

/**
 * Language + format picker for product collateral.
 * Always opens the live React brochure print engine — never the stale static PDF.
 */
export default function BrochureDownloadModal({
  open,
  onClose,
  defaultFormat = 'exec',
  defaultLocale = 'en'
}: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [locale, setLocale] = useState<BrochureLocale>(defaultLocale)
  const [format, setFormat] = useState<BrochureFormat>(defaultFormat)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    setLocale(defaultLocale)
    setFormat(defaultFormat)
  }, [open, defaultFormat, defaultLocale])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(focusTimer)
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  function downloadSelected() {
    const deckLocale = format === 'full' ? 'en' : locale
    openLiveBrochurePrint({ deck: format, locale: deckLocale, autoprint: true })
    onClose()
  }

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[10000] max-h-[90vh] w-full max-w-lg transform overflow-y-auto rounded-2xl bg-white/95 p-6 shadow-2xl ring-1 ring-white/40 transition-all backdrop-blur-md"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          aria-label="Close brochure download"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <p className="text-[10px] font-semibold uppercase text-syncra-accent sm:text-[11px]">Sales collateral</p>
        <h2 id={titleId} className={`mt-2 pr-10 ${ui.headingLg}`}>
          Download brochure
        </h2>
        <p className={`mt-2 ${ui.body}`}>
          Opens the live brochure engine (not a cached static file). Use the print dialog → “Save as PDF” for a fresh
          export every time.
        </p>

        <fieldset className="mt-6 space-y-2">
          <legend className={ui.label}>Language</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BROCHURE_LOCALES.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLocale(item.code)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                  locale === item.code
                    ? 'border-syncra-blue bg-syncra-accent/10 text-syncra-blue'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="block">{item.native}</span>
                <span className="text-[11px] font-medium text-slate-500">{item.label}</span>
              </button>
            ))}
          </div>
          {format === 'full' && locale !== 'en' ? (
            <p className="text-xs text-amber-700">
              Full Technical Guide is English-only. Switch to Quick Exec Deck for{' '}
              {BROCHURE_LOCALES.find((l) => l.code === locale)?.native}.
            </p>
          ) : null}
        </fieldset>

        <fieldset className="mt-5 space-y-2">
          <legend className={ui.label}>Format</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 has-[:checked]:border-syncra-blue has-[:checked]:bg-syncra-accent/5">
            <input
              type="radio"
              name="brochure-format"
              className="mt-1"
              checked={format === 'exec'}
              onChange={() => setFormat('exec')}
            />
            <span>
              <span className="block text-sm font-semibold text-syncra-primary">Quick Exec Deck (4 Pages)</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Live board brief — EN / हिंदी / বাংলা / मराठी / தமிழ் / తెలుగు
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 has-[:checked]:border-syncra-blue has-[:checked]:bg-syncra-accent/5">
            <input
              type="radio"
              name="brochure-format"
              className="mt-1"
              checked={format === 'full'}
              onChange={() => setFormat('full')}
            />
            <span>
              <span className="block text-sm font-semibold text-syncra-primary">Full Technical Guide (18 Pages)</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Live English masterguide — architecture, ROI framework, modules
              </span>
            </span>
          </label>
        </fieldset>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" className={ui.btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={ui.btnPrimary} onClick={downloadSelected}>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

/** Shared trigger button + modal for landing / footer / admin download CTAs. */
export function BrochureDownloadTrigger({
  className,
  children = 'Download Brochure',
  defaultFormat = 'exec'
}: {
  className?: string
  children?: React.ReactNode
  defaultFormat?: BrochureFormat
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <BrochureDownloadModal open={open} onClose={() => setOpen(false)} defaultFormat={defaultFormat} />
    </>
  )
}
