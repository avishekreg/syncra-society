import React from 'react'
import { Link } from 'react-router-dom'
import SyncraBrandLogo from '../brand/SyncraBrandLogo'
import SyncraFooter from '../layout/SyncraFooter'
import { ui } from '../../lib/ui'

import {
  SYNCRA_BILLING_EMAIL,
  SYNCRA_CONTACT_EMAIL,
  SYNCRA_LEGAL_EFFECTIVE_DATE,
  SYNCRA_LEGAL_ENTITY,
  SYNCRA_PLATFORM_NAME,
  SYNCRA_PRIVACY_EMAIL,
  SYNCRA_REGISTERED_JURISDICTION
} from '../../lib/brandConstants'

export const LEGAL_EFFECTIVE_DATE = SYNCRA_LEGAL_EFFECTIVE_DATE
export const LEGAL_ENTITY = SYNCRA_LEGAL_ENTITY
export const LEGAL_PLATFORM = SYNCRA_PLATFORM_NAME
export const LEGAL_CONTACT_EMAIL = SYNCRA_CONTACT_EMAIL
export const LEGAL_PRIVACY_EMAIL = SYNCRA_PRIVACY_EMAIL
export const LEGAL_BILLING_EMAIL = SYNCRA_BILLING_EMAIL
export const LEGAL_REGISTERED_JURISDICTION = SYNCRA_REGISTERED_JURISDICTION

const legalLinks = [
  { to: '/legal/terms', label: 'Terms & Conditions' },
  { to: '/legal/privacy', label: 'Privacy Policy' },
  { to: '/legal/refund', label: 'Refund & Cancellation Policy' }
]

type LegalPageLayoutProps = {
  title: string
  children: React.ReactNode
}

export function LegalSection({
  id,
  title,
  children
}: {
  id?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-slate-200 pt-8 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-semibold tracking-tight text-syncra-primary sm:text-xl">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

export function LegalParagraph({ children }: { children: React.ReactNode }) {
  return <p className={`${ui.body} text-slate-700`}>{children}</p>
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 sm:text-base sm:leading-relaxed">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}

export default function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div className={`relative ${ui.page}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,180,216,0.06),_transparent_22%)]" />

      <header className="relative z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-14 max-w-5xl flex-col items-stretch justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
          <SyncraBrandLogo to="/" />
          <Link to="/" className={ui.btnGhost}>
            Back to Home
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className={ui.eyebrow}>Legal</p>
        <h1 className={`mt-3 ${ui.headingLg}`}>{title}</h1>
        <p className={`mt-3 ${ui.body}`}>
          Operated by {LEGAL_ENTITY} · Principal place of business: {LEGAL_REGISTERED_JURISDICTION} · Effective from{' '}
          {LEGAL_EFFECTIVE_DATE} · Last updated {LEGAL_EFFECTIVE_DATE}
        </p>

        <nav
          aria-label="Legal documents"
          className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-syncra-surface-alt p-3 sm:gap-3 sm:p-4"
        >
          {legalLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-syncra-accent/40 hover:text-syncra-blue"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <article className="mt-10 space-y-8">{children}</article>

        <div className={`mt-12 rounded-2xl border border-slate-200 bg-syncra-surface-alt p-5 sm:p-6 ${ui.body}`}>
          <p className="font-semibold text-syncra-primary">Questions about these policies?</p>
          <p className="mt-2">
            Contact {LEGAL_ENTITY} at{' '}
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-medium text-syncra-blue hover:underline">
              {LEGAL_CONTACT_EMAIL}
            </a>
            . For privacy-specific requests, write to{' '}
            <a href={`mailto:${LEGAL_PRIVACY_EMAIL}`} className="font-medium text-syncra-blue hover:underline">
              {LEGAL_PRIVACY_EMAIL}
            </a>
            .
          </p>
        </div>
      </main>

      <SyncraFooter compact />
    </div>
  )
}
