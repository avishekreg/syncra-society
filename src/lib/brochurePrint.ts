import type { BrochureLocale } from './brochureI18n'

export type BrochureDeck = 'exec' | 'full'

/**
 * Live print/PDF URL for the React brochure engine.
 * Always cache-busts so browsers / service workers cannot serve a stale static PDF.
 */
export function buildLiveBrochurePrintUrl(opts: {
  deck: BrochureDeck
  locale?: BrochureLocale
  /** Auto-open the browser print dialog (Save as PDF). Default true. */
  autoprint?: boolean
}): string {
  const t = String(Date.now())
  const params = new URLSearchParams({
    deck: opts.deck,
    lang: opts.locale ?? 'en',
    print: '1',
    t,
    cb: t,
    v: t
  })
  if (opts.autoprint !== false) params.set('autoprint', '1')
  return `/investor-brochure?${params.toString()}`
}

/** Open the live brochure print engine in a new tab (no static /downloads PDF). */
export function openLiveBrochurePrint(opts: {
  deck: BrochureDeck
  locale?: BrochureLocale
  autoprint?: boolean
}) {
  const url = buildLiveBrochurePrintUrl(opts)
  window.open(url, '_blank', 'noopener,noreferrer')
  return url
}
