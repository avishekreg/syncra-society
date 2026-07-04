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
  {
    icon: '🛂',
    title: 'Syncra Gatekeeper',
    description: 'Syncra Gate Visitor Log — guard entry, resident approvals, and exit trace.'
  },
  {
    icon: '🛠️',
    title: 'Helpdesk & Asset Audit',
    description:
      'Integrated ticketing infrastructure for resident complaints coupled with scheduled maintenance lifecycle audits for community machinery.'
  }
]

type PremiumAddon = {
  id: string
  name: string
  description: string
  highlights: string[]
}

const premiumAddons: PremiumAddon[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Automation',
    description:
      'Stack automated notice broadcasts and resident alerts on any base plan — fixed monthly add-on or bundled volume packs.',
    highlights: ['n8n-powered notice relays', 'Opt-in resident contact routing', '3,000+ alerts / month tiers']
  },
  {
    id: 'voice-helpdesk',
    name: 'AI Voice Ticketing & Smart Helpdesk',
    description:
      'Speech-to-text complaint capture with Whisper, Llama auto-categorization, and a full resident ticket portal.',
    highlights: ['MediaRecorder voice input', 'HF Whisper transcription', 'Smart severity triage']
  },
  {
    id: 'elections',
    name: 'Encrypted Election Module',
    description:
      'Dynamic multi-position voting, encrypted ballots, and RWA election orchestration — activate per society via webhook.',
    highlights: ['Multi-position ballots', 'Resident & RWA election views', 'Governance-grade audit trail']
  }
]

function PricingFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm text-slate-600">
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-syncra-accent/15 text-xs font-bold text-syncra-blue"
        aria-hidden="true"
      >
        ✓
      </span>
      <span>{children}</span>
    </li>
  )
}

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

      <main className="relative z-10 mx-auto max-w-7xl space-y-24 px-6 py-24">
        <section className="space-y-10 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <p className={ui.eyebrow}>World-class society management</p>
            <h2 className="text-5xl font-semibold leading-tight tracking-tight text-syncra-primary sm:text-6xl">
              Ultra-premium governance for modern communities.
            </h2>
            <p className={`text-lg leading-relaxed ${ui.body}`}>
              syncra-society from Syncra Systems unifies Multi-Tenant RWA, Ledgers, Notice Board, Contract
              Tracking, and Syncra Gatekeeper into one elegant platform.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/register"
              className={`inline-flex items-center justify-center ${ui.btnPrimary} px-8 py-4 transition hover:-translate-y-0.5`}
            >
              Start Your Journey
            </Link>
            <a href="#pricing" className={`inline-flex items-center justify-center ${ui.btnSecondary} px-8 py-4`}>
              View Pricing
            </a>
          </div>
        </section>

        <section className="space-y-12" id="features">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <p className={ui.eyebrow}>Core Capabilities</p>
            <h3 className="text-4xl font-semibold leading-tight text-syncra-primary">
              Everything your society needs, beautifully organized.
            </h3>
            <p className={`text-base leading-relaxed ${ui.body}`}>
              From resident logistics to financial accountability, syncra-society provides clear workflows, fast
              approvals, and a premium user experience.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {landingFeatures.map((feature) => (
              <div
                key={feature.title}
                className={`flex h-full flex-col text-center transition hover:-translate-y-1 ${ui.innerItem} p-8`}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-syncra-accent/10 text-2xl">
                  {feature.icon}
                </div>
                <h4 className="mt-6 text-lg font-semibold text-syncra-primary">{feature.title}</h4>
                <p className={`mt-4 text-sm leading-relaxed ${ui.body}`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-16" id="pricing">
          {/* Core per-flat base plans */}
          <div className="space-y-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className={ui.eyebrow}>Pricing tiers</p>
              <h3 className="text-4xl font-semibold leading-tight text-syncra-primary">
                Simple, premium, and transparent pricing.
              </h3>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-syncra-action">
                All prices are excluding GST (18%).
              </p>
              <p className={`text-base leading-relaxed ${ui.body}`}>
                One-time activation {formatInr(pricing.activationFeeInr)}, then tiered pricing for every society
                size with clear, per-flat monthly costs.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3 lg:items-stretch">
              {pricing.tiers.map((tier, index) => (
                <article
                  key={tier.id}
                  className={`flex h-full flex-col rounded-2xl border bg-white p-8 shadow-card transition hover:-translate-y-1 ${
                    index === 1 ? 'border-syncra-accent/40 ring-1 ring-syncra-accent/20' : 'border-slate-200'
                  }`}
                >
                  <p className={ui.eyebrow}>{tier.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-syncra-primary">{tier.headline}</p>
                  <div className="mt-6 flex items-end gap-1">
                    <p className="text-5xl font-semibold tracking-tight text-syncra-primary">
                      {formatInr(tier.price)}
                    </p>
                    <p className="mb-2 text-sm text-slate-500">/ flat / month</p>
                  </div>
                  <p className={`mt-4 text-sm leading-relaxed ${ui.body}`}>{tier.description}</p>
                  <ul className="mt-8 flex-1 space-y-3">
                    {tier.features.map((feature) => (
                      <PricingFeature key={feature}>{feature}</PricingFeature>
                    ))}
                  </ul>
                  <Link to="/register" className={`mt-8 inline-flex w-full justify-center ${ui.btnPrimary}`}>
                    Start Your Journey
                  </Link>
                </article>
              ))}
            </div>
          </div>

          {/* Premium modular add-ons */}
          <div className="space-y-8 rounded-3xl border border-slate-200 bg-syncra-surface-alt p-8 md:p-10">
            <div className="mx-auto max-w-3xl space-y-3 text-center">
              <p className={ui.eyebrowPrimary}>Stack on any base plan</p>
              <h3 className="text-3xl font-semibold leading-tight text-syncra-primary">
                Premium AI & Communication Add-ons
              </h3>
              <p className={`text-base leading-relaxed ${ui.body}`}>
                Modular automation modules societies can activate on top of Tier 1–3 — zero-touch enablement via
                secure payment webhooks after checkout.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {premiumAddons.map((addon) => (
                <article
                  key={addon.id}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <h4 className="text-lg font-semibold text-syncra-primary">{addon.name}</h4>
                  <p className={`mt-3 flex-1 text-sm leading-relaxed ${ui.body}`}>{addon.description}</p>
                  <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5">
                    {addon.highlights.map((item) => (
                      <li key={item} className="text-xs font-medium text-slate-600">
                        · {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/register"
                    className={`mt-6 inline-flex w-full justify-center ${ui.btnSecondary} py-3 text-sm font-semibold`}
                  >
                    Add module
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-slate-500">
            Need a custom township rollout?{' '}
            <a href="mailto:hello@syncrasystems.com" className="font-medium text-syncra-blue hover:underline">
              Contact Syncra Systems
            </a>{' '}
            for enterprise onboarding.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-syncra-surface-alt py-8 text-slate-600">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-syncra-primary">Developed by Syncra Systems</p>
            <p className="text-sm">Premium society management for modern communities.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <a href="#" className="hover:text-syncra-blue">
              Terms & Conditions
            </a>
            <a href="#" className="hover:text-syncra-blue">
              Rules
            </a>
            <a href="#" className="hover:text-syncra-blue">
              Refund Policies
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
