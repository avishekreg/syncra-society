import React, { useEffect, useId, useState } from 'react'
import { ui } from '../../lib/ui'
import { BROCHURE_LOCALES, type BrochureLocale } from '../../lib/brochureI18n'
import { MAI_PRODUCT_BROCHURE_PDF } from '../../lib/brandConstants'

export type BrochureFormat = 'exec' | 'full'

type Props = {
  open: boolean
  onClose: () => void
  /** Prefill when opening from a specific CTA */
  defaultFormat?: BrochureFormat
  defaultLocale?: BrochureLocale
}

/**
 * Language + format picker for product collateral.
 * Exec decks open the live multilingual React deck in print layout (Save as PDF).
 * Full guide links the English technical PDF (or opens the English web brochure).
 */
export default function BrochureDownloadModal({
  open,
  onClose,
  defaultFormat = 'exec',
  defaultLocale = 'en'
}: Props) {
  const titleId = useId()
  const [locale, setLocale] = useState<BrochureLocale>(defaultLocale)
  const [format, setFormat] = useState<BrochureFormat>(defaultFormat)

  useEffect(() => {
    if (!open) return
    setLocale(defaultLocale)
    setFormat(defaultFormat)
  }, [open, defaultFormat, defaultLocale])

  if (!open) return null

  function downloadSelected() {
    if (format === 'full') {
      // Full technical guide: static English PDF + optional web viewer
      const a = document.createElement('a')
      a.href = MAI_PRODUCT_BROCHURE_PDF
      a.download = 'mAI-Society-Product-Brochure.pdf'
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.open(`/investor-brochure?deck=full&lang=en&print=1`, '_blank', 'noopener,noreferrer')
      onClose()
      return
    }

    // Quick Exec Deck — open print-ready multilingual page and auto-trigger Save as PDF
    const url = `/investor-brochure?deck=exec&lang=${locale}&print=1&autoprint=1`
    window.open(url, '_blank', 'noopener,noreferrer')
    onClose()
  }

  return (
    <div className={ui.overlay} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className={`${ui.modal} max-w-lg`}>
        <p className={ui.eyebrow}>Sales collateral</p>
        <h2 id={titleId} className={`mt-2 ${ui.headingLg}`}>
          Download brochure
        </h2>
        <p className={`mt-2 ${ui.body}`}>
          Choose language and format. The Quick Exec Deck is a 4-page board brief in your selected language —
          open the print dialog and choose “Save as PDF”.
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
              Full Technical Guide is English-only. Switch to Quick Exec Deck for {BROCHURE_LOCALES.find((l) => l.code === locale)?.native}.
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
                Regional board brief — EN / हिंदी / বাংলা / मराठी / தமிழ் / తెలుగు
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
              <span className="block text-sm font-semibold text-syncra-primary">Full Technical Guide</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Complete English product brochure (PDF + printable web)
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
