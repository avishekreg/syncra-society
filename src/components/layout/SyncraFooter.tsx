import React from 'react'
import { Link } from 'react-router-dom'
import FooterAndroidQr from '../landing/FooterAndroidQr'
import FooterAppStoreBadges from '../landing/FooterAppStoreBadges'
import MaiSocietyWordmark from '../brand/MaiSocietyWordmark'
import { SyncraInsignia } from '../brand/SyncraBrandLogo'
import { SYNCRA_LEGAL_ENTITY, MAI_PRODUCT_BROCHURE_PDF, MAI_PRODUCT_BROCHURE_FILENAME } from '../../lib/brandConstants'

const complianceLinks = [
  { to: '/legal/terms', label: 'Terms & Conditions' },
  { to: '/legal/privacy', label: 'Privacy Policy' },
  { to: '/legal/refund', label: 'Refund & Cancellation Policy' }
] as const

const platformLinks = [
  { to: '/', label: 'Home' },
  { to: '/register', label: 'Register society' },
  { to: '/auth/signin', label: 'Sign in' },
  { to: '/investor-brochure', label: 'Product brochure (web)' }
] as const

const FOOTER_TAGLINE =
  "Modularizing India's mobility and housing infrastructure for a smarter, unified future. A key component of the mAIRide ecosystem, seamlessly connecting homes and long-distance travel under Syncra Systems."

type SyncraFooterProps = {
  className?: string
  showAppBadges?: boolean
}

function FooterLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="block text-sm font-medium leading-snug text-slate-600 transition hover:text-syncra-blue"
    >
      {label}
    </Link>
  )
}

function FooterColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-syncra-blue">
      {children}
    </p>
  )
}

export default function SyncraFooter({ className = '', showAppBadges = true }: SyncraFooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer className={`border-t border-slate-200 bg-white pb-6 text-slate-600 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="flex w-full flex-wrap items-start justify-between gap-y-8">
          <div className="w-full space-y-3 md:w-[35%]">
            <div className="flex items-center gap-2.5">
              <SyncraInsignia className="h-9 w-9 shrink-0" />
              <MaiSocietyWordmark size="lg" className="font-bold" />
            </div>
            <p className="text-sm leading-relaxed text-slate-600">{FOOTER_TAGLINE}</p>
          </div>

          {showAppBadges && (
            <div className="flex w-full flex-col items-start gap-4 md:w-[28%]">
              <div className="w-full">
                <FooterColumnHeading>Get the app</FooterColumnHeading>
                <div className="flex flex-wrap items-start gap-5">
                  <FooterAndroidQr size={120} />
                  <FooterAppStoreBadges variant="store" stacked align="left" hideHeading />
                </div>
              </div>
            </div>
          )}

          <div className="w-full md:w-[14%]">
            <FooterColumnHeading>Platform</FooterColumnHeading>
            <nav aria-label="Platform links" className="flex flex-col gap-2">
              {platformLinks.map((link) => (
                <FooterLink key={link.to} {...link} />
              ))}
              <a
                href={MAI_PRODUCT_BROCHURE_PDF}
                download={MAI_PRODUCT_BROCHURE_FILENAME}
                className="block text-sm font-medium leading-snug text-slate-600 transition hover:text-syncra-blue"
              >
                Download brochure (PDF)
              </a>
            </nav>
          </div>

          <div className="w-full md:w-[18%]">
            <FooterColumnHeading>Compliance</FooterColumnHeading>
            <nav aria-label="Legal policies" className="flex flex-col gap-2">
              {complianceLinks.map((link) => (
                <FooterLink key={link.to} {...link} />
              ))}
            </nav>
          </div>
        </div>

        <p className="mt-8 text-sm leading-relaxed text-slate-600">
          mAI Society is an official product developed, owned, and maintained by {SYNCRA_LEGAL_ENTITY}. All
          rights reserved. © {year} {SYNCRA_LEGAL_ENTITY}.
        </p>
      </div>
    </footer>
  )
}
