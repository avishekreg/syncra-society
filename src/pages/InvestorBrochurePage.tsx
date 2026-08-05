import React, { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import InvestorBrochureDocument from '../components/brochure/InvestorBrochureDocument'
import { MAI_PLATFORM_NAME } from '../lib/brandConstants'
import { ui } from '../lib/ui'
import '../styles/investor-brochure.css'

export default function InvestorBrochurePage() {
  const [params] = useSearchParams()
  const printMode = params.get('print') === '1'

  useEffect(() => {
    document.title = `${MAI_PLATFORM_NAME} · Investor Brochure`
    document.documentElement.classList.add('brochure-root')
    if (printMode) document.documentElement.classList.add('brochure-print-mode')
    return () => {
      document.documentElement.classList.remove('brochure-root', 'brochure-print-mode')
    }
  }, [printMode])

  return (
    <div className={`brochure-shell ${printMode ? 'brochure-shell--print' : ''}`}>
      <header className="brochure-toolbar print:hidden">
        <div className="mx-auto flex w-full max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className={ui.eyebrow}>Premium brief</p>
            <h1 className="text-sm font-semibold text-syncra-primary sm:text-base">
              {MAI_PLATFORM_NAME} Investor Brochure
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/" className={ui.btnGhost}>
              Back to site
            </Link>
            <button type="button" className={ui.btnSecondary} onClick={() => window.print()}>
              Print / Save PDF
            </button>
            <a href="/investor-brochure?print=1" className={ui.btnPrimary}>
              Print layout
            </a>
          </div>
        </div>
      </header>

      <main className="brochure-main">
        <InvestorBrochureDocument />
      </main>
    </div>
  )
}
