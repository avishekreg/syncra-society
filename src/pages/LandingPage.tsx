import React from 'react'
import { Link } from 'react-router-dom'
import { usePlatformPricing } from '../hooks/usePlatformPricing'
import { formatInr } from '../lib/platformPricing'
import { ui } from '../lib/ui'

const landingFeatures = [
  { icon: '🏢', title: 'Multi-Tenant RWA', description: 'Smart workflows for societies, buildings, flats, and resident profiles.' },
  { icon: '📊', title: 'Ledgers', description: 'Transparent financial records, unified accounting, and audit-ready transaction histories.' },
  { icon: '📢', title: 'Notice Board', description: 'Publish announcements, approvals, and community reminders instantly.' },
  { icon: '📝', title: 'Contract Tracking', description: 'Monitor vendor agreements, renewals, and obligations from one control hub.' },
  { icon: '🛂', title: 'Syncra Gatekeeper', description: 'Syncra Gate-style visitor logs with guard entry, resident approvals, and exit trace.' },
  { icon: '🛠️', title: 'Helpdesk & Asset Audit', description: 'Integrated ticketing infrastructure for resident complaints coupled with scheduled maintenance lifecycle audits for community machinery.' }
]

export default function LandingPage() {
  const { pricing } = usePlatformPricing()

  return (
    <div className={`relative overflow-hidden ${ui.page}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,180,216,0.08),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(0,82,204,0.06),_transparent_24%)]" />

      <header className="relative z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className={ui.eyebrow}>Syncra Systems</p>
            <h1 className="text-xl font-semibold tracking-[0.2em] text-syncra-primary">syncra-society</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/auth" className={ui.btnGhost}>
              Login Now
            </Link>
            <Link to="/auth/signup" className={ui.btnSecondary}>
              Create Account
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-24 space-y-24">
        <section className="space-y-10 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <p className={ui.eyebrow}>World-class society management</p>
            <h2 className="text-5xl font-semibold tracking-tight text-syncra-primary leading-tight sm:text-6xl">
              Ultra-premium governance for modern communities.
            </h2>
            <p className={`text-lg leading-relaxed ${ui.body}`}>
              syncra-society from Syncra Systems unifies Multi-Tenant RWA, Ledgers, Notice Board, Contract Tracking, and Syncra Gatekeeper into one elegant platform.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/register" className={`inline-flex items-center justify-center ${ui.btnPrimary} px-8 py-4 transition hover:-translate-y-0.5`}>
              Start Your Journey
            </Link>
            <a href="#pricing" className={`inline-flex items-center justify-center ${ui.btnSecondary} px-8 py-4`}>
              View Pricing
            </a>
          </div>
        </section>

        <section className="space-y-12" id="features">
          <div className="space-y-6 text-center mx-auto max-w-3xl">
            <p className={ui.eyebrow}>Core Capabilities</p>
            <h3 className="text-4xl font-semibold text-syncra-primary leading-tight">Everything your society needs, beautifully organized.</h3>
            <p className={`text-base leading-relaxed ${ui.body}`}>
              From resident logistics to financial accountability, syncra-society provides clear workflows, fast approvals, and a premium user experience.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {landingFeatures.map((feature) => (
              <div key={feature.title} className={`flex h-full flex-col text-center transition hover:-translate-y-1 ${ui.innerItem} p-8`}>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-syncra-accent/10 text-2xl">{feature.icon}</div>
                <h4 className="mt-6 text-lg font-semibold text-syncra-primary">{feature.title}</h4>
                <p className={`mt-4 text-sm leading-relaxed ${ui.body}`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-10" id="pricing">
          <div className="space-y-4 text-center mx-auto max-w-3xl">
            <p className={ui.eyebrow}>Pricing tiers</p>
            <h3 className="text-4xl font-semibold text-syncra-primary leading-tight">Simple, premium, and transparent pricing.</h3>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-syncra-action">All prices are excluding GST (18%).</p>
            <p className={`text-base leading-relaxed ${ui.body}`}>
              One-time activation {formatInr(pricing.activationFeeInr)}, then tiered pricing for every society size with clear, per-flat monthly costs.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {pricing.tiers.map((tier, index) => (
              <div
                key={tier.id}
                className={`${ui.card}${index === 1 ? ' border-syncra-accent/40 ring-1 ring-syncra-accent/20' : ''}`}
              >
                <p className={ui.eyebrow}>{tier.label}</p>
                <p className="mt-3 text-2xl font-semibold text-syncra-primary">{tier.headline}</p>
                <p className="mt-6 text-5xl font-semibold text-syncra-primary">{formatInr(tier.price)}</p>
                <p className="text-sm text-slate-500">/ flat / month</p>
                <p className={`mt-4 text-sm leading-relaxed ${ui.body}`}>{tier.description}</p>
                <ul className="mt-6 space-y-3 text-slate-600">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <span className="text-syncra-accent">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`mt-8 inline-flex w-full justify-center ${ui.btnPrimary}`}>
                  Start Your Journey
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-syncra-surface-alt py-8 text-slate-600">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-syncra-primary">Developed by Syncra Systems</p>
            <p className="text-sm">Premium society management for modern communities.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <a href="#" className="hover:text-syncra-blue">Terms & Conditions</a>
            <a href="#" className="hover:text-syncra-blue">Rules</a>
            <a href="#" className="hover:text-syncra-blue">Refund Policies</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
