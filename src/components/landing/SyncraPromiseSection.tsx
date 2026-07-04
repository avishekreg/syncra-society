import React from 'react'
import { ui } from '../../lib/ui'

type PromiseCard = {
  title: string
  description: string
  icon: React.ReactNode
}

const promiseCards: PromiseCard[] = [
  {
    title: 'Absolute Privacy (No Data Selling)',
    description:
      'Unlike free, ad-heavy alternatives, Syncra never monetizes your resident directory, gate logs, or contact graphs — and we do not broker leaks to home-service vendors or third-party marketers.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path
          d="M12 3L4 7v5c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-4z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9.5 12.5l1.8 1.8 3.7-3.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  },
  {
    title: 'Zero Ads, Pure Performance',
    description:
      'A clean, ad-free enterprise experience engineered for premium RWAs who expect elegant interfaces — not banner clutter, sponsored tiles, or distraction-driven monetization inside their governance stack.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <rect x="4" y="5" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M16 4l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  },
  {
    title: 'Next-Gen AI Automation',
    description:
      'Your subscription fuels secure, cutting-edge infrastructure — WhatsApp notice relays, Speech-to-Text voice ticketing, and encrypted election orchestration — not surveillance-style ad networks.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path
          d="M12 3v3M12 18v3M3 12h3M18 12h3M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M17.7 6.3l-2.1 2.1M8.4 15.6l-2.1 2.1"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    )
  }
]

export default function SyncraPromiseSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-syncra-surface-alt to-white px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-syncra-accent/40 to-transparent"
      />

      <div className="mx-auto max-w-3xl space-y-5 text-center">
        <p className={ui.eyebrowPrimary}>The Syncra Promise</p>
        <h3 className="text-3xl font-semibold leading-tight tracking-tight text-syncra-primary sm:text-4xl">
          Why Syncra Society? Because Your Privacy Is Not For Sale.
        </h3>
        <p className={`text-base leading-relaxed ${ui.body}`}>
          Premium societies deserve a platform that protects residents first — with enterprise-grade security,
          zero ad economics, and automation that earns trust.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {promiseCards.map((card) => (
          <article
            key={card.title}
            className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-syncra-accent/30 hover:shadow-card"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-syncra-accent/10 text-syncra-blue transition group-hover:bg-syncra-blue group-hover:text-white">
              {card.icon}
            </div>
            <h4 className="mt-5 text-lg font-semibold leading-snug text-syncra-primary">{card.title}</h4>
            <p className={`mt-3 flex-1 text-sm leading-relaxed ${ui.body}`}>{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
