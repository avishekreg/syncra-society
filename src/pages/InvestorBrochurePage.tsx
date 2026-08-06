import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import InvestorBrochureDocument from '../components/brochure/InvestorBrochureDocument'
import QuickExecDeck from '../components/brochure/QuickExecDeck'
import { MAI_PLATFORM_NAME } from '../lib/brandConstants'
import { BROCHURE_LOCALES, type BrochureLocale } from '../lib/brochureI18n'
import { buildLiveBrochurePrintUrl } from '../lib/brochurePrint'
import { ui } from '../lib/ui'
import '../styles/investor-brochure.css'

type DeckMode = 'full' | 'exec'

export default function InvestorBrochurePage() {
  const [params, setParams] = useSearchParams()
  const printMode = params.get('print') === '1'
  const autoPrint = params.get('autoprint') === '1'
  const cacheBust = params.get('t') || params.get('cb') || ''
  const initialLocale = (params.get('lang') as BrochureLocale) || 'en'
  const initialMode = (params.get('deck') as DeckMode) === 'exec' ? 'exec' : 'full'
  const [locale, setLocale] = useState<BrochureLocale>(
    BROCHURE_LOCALES.some((l) => l.code === initialLocale) ? initialLocale : 'en'
  )
  const [mode, setMode] = useState<DeckMode>(initialMode)

  useEffect(() => {
    document.title =
      mode === 'exec'
        ? `${MAI_PLATFORM_NAME} · Quick Exec Deck`
        : `${MAI_PLATFORM_NAME} · Product Brochure`
    document.documentElement.classList.add('brochure-root')
    if (printMode) document.documentElement.classList.add('brochure-print-mode')

    // Discourage intermediary caches when printing/exporting PDFs
    let robots: HTMLMetaElement | null = document.querySelector('meta[name="brochure-cache"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'brochure-cache'
      document.head.appendChild(robots)
    }
    robots.content = `no-store; t=${Date.now()}`

    return () => {
      document.documentElement.classList.remove('brochure-root', 'brochure-print-mode')
    }
  }, [printMode, mode])

  useEffect(() => {
    if (!autoPrint || !printMode) return
    // Wait for fonts + layout paint before opening print dialog
    const timer = window.setTimeout(() => {
      window.print()
    }, 900)
    return () => window.clearTimeout(timer)
  }, [autoPrint, printMode, locale, mode, cacheBust])

  function updateQuery(next: { lang?: BrochureLocale; deck?: DeckMode }) {
    const lang = next.lang ?? locale
    const deck = next.deck ?? mode
    const q = new URLSearchParams(params)
    q.set('lang', lang)
    q.set('deck', deck)
    if (printMode) {
      q.set('print', '1')
      q.set('t', String(Date.now()))
    }
    setParams(q, { replace: true })
  }

  const printLayoutHref = buildLiveBrochurePrintUrl({
    deck: mode,
    locale,
    autoprint: false
  })

  return (
    <div className={`brochure-shell ${printMode ? 'brochure-shell--print' : ''}`}>
      <header className="brochure-toolbar print:hidden">
        <div className="mx-auto flex w-full max-w-[210mm] flex-col gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase text-syncra-accent sm:text-[11px]">
                Live brochure engine · not a static PDF
              </p>
              <h1 className="text-sm font-semibold text-syncra-primary sm:text-base">
                {mode === 'exec'
                  ? `${MAI_PLATFORM_NAME} Quick Exec Deck (4-Page)`
                  : `${MAI_PLATFORM_NAME} Product Brochure (18-Page)`}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/" className={ui.btnGhost}>
                Back to site
              </Link>
              <button type="button" className={ui.btnSecondary} onClick={() => window.print()}>
                Print / Save PDF
              </button>
              <a href={printLayoutHref} className={ui.btnPrimary}>
                Print layout
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  mode === 'full' ? 'bg-syncra-blue text-white' : 'text-slate-600'
                }`}
                onClick={() => {
                  setMode('full')
                  updateQuery({ deck: 'full' })
                }}
              >
                Full brochure
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  mode === 'exec' ? 'bg-syncra-blue text-white' : 'text-slate-600'
                }`}
                onClick={() => {
                  setMode('exec')
                  updateQuery({ deck: 'exec' })
                }}
              >
                Quick Exec Deck (4)
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              Language
              <select
                className={`${ui.input} min-h-9 w-auto py-1.5 text-xs`}
                value={locale}
                onChange={(e) => {
                  const next = e.target.value as BrochureLocale
                  setLocale(next)
                  updateQuery({ lang: next })
                }}
              >
                {BROCHURE_LOCALES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.native} ({item.label})
                  </option>
                ))}
              </select>
            </label>
          </div>
          {mode === 'full' && locale !== 'en' ? (
            <p className="text-xs text-slate-500">
              Full 18-page brochure is English. Switch to Quick Exec Deck for Hindi, Bengali, Marathi, Tamil, and
              Telugu.
            </p>
          ) : null}
        </div>
      </header>

      <main className="brochure-main">
        {mode === 'exec' ? <QuickExecDeck locale={locale} /> : <InvestorBrochureDocument />}
      </main>
    </div>
  )
}
