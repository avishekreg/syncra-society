import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import SyncraBrandLogo from '../components/brand/SyncraBrandLogo'
import AntiDisputeHarmonySection from '../components/landing/AntiDisputeHarmonySection'
import HeroDashboardMockup from '../components/landing/HeroDashboardMockup'
import SyncraPromiseSection from '../components/landing/SyncraPromiseSection'
import EnterpriseModulesSection from '../components/landing/EnterpriseModulesSection'
import CoreBasePlanSection from '../components/landing/CoreBasePlanSection'
import AddonPricingCalculator from '../components/landing/AddonPricingCalculator'
import ExperienceAiAuditModal from '../components/landing/ExperienceAiAuditModal'
import SyncraFooter from '../components/layout/SyncraFooter'
import FooterEnterpriseCta from '../components/layout/FooterEnterpriseCta'
import { SYNCRA_LEGAL_ENTITY } from '../lib/brandConstants'
import { usePlatformPricing } from '../hooks/usePlatformPricing'
import { formatInr } from '../lib/platformPricing'
import { ui } from '../lib/ui'

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
  const [auditDemoOpen, setAuditDemoOpen] = useState(false)

  return (
    <div className={`relative overflow-x-hidden ${ui.page}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,180,216,0.08),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(0,82,204,0.06),_transparent_24%)]" />

      <header className="relative z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-col items-stretch justify-between gap-3 px-4 py-3 sm:min-h-[4.25rem] sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-2">
          <SyncraBrandLogo to="/" size="lg" />
          <div className="flex w-full flex-wrap items-stretch gap-3 sm:w-auto sm:items-center">
            <a href="#enterprise-modules" className={`w-full sm:w-auto ${ui.btnGhost}`}>
              Modules
            </a>
            <Link to="/auth/login" className={`w-full sm:w-auto ${ui.btnGhost}`}>
              Login Now
            </Link>
            <Link to="/auth/signup" className={`w-full sm:w-auto ${ui.btnSecondary}`}>
              Create Account
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-16 px-4 py-12 sm:space-y-24 sm:px-6 sm:py-16 md:py-24">
        <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
          <div className="space-y-8 text-center lg:text-left">
            <div className="mx-auto max-w-2xl space-y-6 lg:mx-0">
              <p className={ui.eyebrow}>Zero-hardware society OS</p>
              <h2 className={`${ui.display} leading-[1.08]`}>
                Enterprise RWA software that scales with modular add-ons.
              </h2>
              <p className={`mx-auto max-w-2xl text-pretty text-lg leading-relaxed whitespace-normal break-words lg:mx-0 ${ui.body}`}>
                mAI Society from {SYNCRA_LEGAL_ENTITY} pairs essential RWA operations — billing, notices,
                gatekeeper, and helpdesk — with licensed zero-hardware add-ons like Elections, WhatsApp AI,
                Smart Parking, and AI RWA Audit.
              </p>
            </div>

            <div className="flex w-full flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center lg:justify-start">
              <a
                href="#pricing"
                className={`inline-flex w-full items-center justify-center sm:w-auto ${ui.btnPrimary} px-8 py-4 transition hover:-translate-y-0.5`}
              >
                Build your plan
              </a>
              <button
                type="button"
                onClick={() => setAuditDemoOpen(true)}
                className={`inline-flex w-full items-center justify-center sm:w-auto ${ui.btnSecondary} px-8 py-4`}
              >
                Experience AI Audit
              </button>
            </div>

            <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-3 lg:mx-0 lg:justify-start">
              {['Per-society licensing', 'No IoT hardware', 'Encrypted by design'].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <HeroDashboardMockup />
        </section>

        <AntiDisputeHarmonySection />

        <SyncraPromiseSection />

        <EnterpriseModulesSection onOpenAuditDemo={() => setAuditDemoOpen(true)} />

        <CoreBasePlanSection />

        <section className="space-y-16" id="pricing">
          <div className="space-y-10">
            <div className="mx-auto max-w-2xl space-y-4 text-center whitespace-normal break-words">
              <p className={ui.eyebrow}>Per-flat base rates</p>
              <h3 className="mx-auto max-w-2xl text-balance text-2xl font-semibold leading-snug text-syncra-primary whitespace-normal break-words sm:text-3xl md:text-4xl md:leading-tight">
                Transparent core pricing
              </h3>
              <p className={`mx-auto max-w-2xl text-pretty whitespace-normal break-words ${ui.body}`}>
                One-time activation {formatInr(pricing.activationFeeInr)}, then tiered per-flat rates. Stack
                enterprise modules in the calculator below.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
              {pricing.tiers.map((tier, index) => (
                <article
                  key={tier.id}
                  className={`flex h-full flex-col rounded-2xl border bg-white p-5 shadow-card sm:p-6 md:p-8 transition hover:-translate-y-1 ${
                    index === 1 ? 'border-syncra-accent/40 ring-1 ring-syncra-accent/20' : 'border-slate-200'
                  }`}
                >
                  <p className={ui.eyebrow}>{tier.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-syncra-primary">{tier.headline}</p>
                  <div className="mt-6 flex flex-wrap items-end gap-1">
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
                  <a href="#pricing-calculator" className={`mt-8 inline-flex w-full justify-center ${ui.btnPrimary}`}>
                    Configure add-ons
                  </a>
                </article>
              ))}
            </div>
          </div>

          <AddonPricingCalculator pricing={pricing} />
        </section>
      </main>

      <FooterEnterpriseCta />
      <SyncraFooter />

      <ExperienceAiAuditModal open={auditDemoOpen} onClose={() => setAuditDemoOpen(false)} />
    </div>
  )
}
