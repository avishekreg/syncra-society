import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { formatInr, type PlatformPricingConfig } from '../../lib/platformPricing'
import {
  LANDING_ADDONS,
  buildOnboardingHref,
  saveLandingCheckoutIntent,
  type LandingAddonId
} from '../../lib/landingAddons'
import { ui } from '../../lib/ui'

type AddonPricingCalculatorProps = {
  pricing: PlatformPricingConfig
}

function resolveTierForFlats(pricing: PlatformPricingConfig, flats: number) {
  // Match marketing tiers: tier1 ≤50, tier2 ≤150, tier3 151+
  if (flats <= 50) return pricing.tiers.find((t) => t.id === 'tier1') ?? pricing.tiers[0]
  if (flats <= 150) return pricing.tiers.find((t) => t.id === 'tier2') ?? pricing.tiers[1]
  return pricing.tiers.find((t) => t.id === 'tier3') ?? pricing.tiers[pricing.tiers.length - 1]
}

export default function AddonPricingCalculator({ pricing }: AddonPricingCalculatorProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [flats, setFlats] = useState(48)
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [selected, setSelected] = useState<LandingAddonId[]>(['whatsapp_automation'])

  const tier = useMemo(() => resolveTierForFlats(pricing, flats), [pricing, flats])
  const billableAddons = LANDING_ADDONS.filter((addon) => !addon.includedInBase)

  const addonMonthly = useMemo(
    () =>
      billableAddons
        .filter((addon) => selected.includes(addon.id))
        .reduce((sum, addon) => sum + addon.monthlyPriceInr, 0),
    [billableAddons, selected]
  )

  const baseMonthly = tier.price * flats
  const monthlyTotal = baseMonthly + addonMonthly
  const annualTotal = Math.round(monthlyTotal * 12 * 0.9)
  const displayTotal = billing === 'monthly' ? monthlyTotal : annualTotal
  const periodLabel = billing === 'monthly' ? '/ month' : '/ year'

  function toggleAddon(id: LandingAddonId) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  function handleCheckout() {
    const intent = {
      flats,
      billing,
      tierId: tier.id,
      addons: selected,
      createdAt: new Date().toISOString()
    }
    saveLandingCheckoutIntent(intent)
    const href = buildOnboardingHref(intent)
    if (user) {
      navigate(href)
      return
    }
    // Persist intent in sessionStorage; after signup/login, continue into onboarding.
    navigate(`/register?intent=checkout&flats=${flats}`)
  }

  return (
    <div className="space-y-10" id="pricing-calculator">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <p className={ui.eyebrow}>Build your stack</p>
        <h3 className="text-2xl font-semibold leading-tight text-syncra-primary sm:text-3xl md:text-4xl">
          Core plan + modular add-ons
        </h3>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-syncra-action">
          All prices exclude GST (18%)
        </p>
        <p className={`text-base leading-relaxed ${ui.body}`}>
          Base plan includes billing, maintenance, notices, and digital elections. Stack zero-hardware
          enterprise modules only for the societies that need them.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-card sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className={ui.label} htmlFor="flat-count">
                Number of flats
              </label>
              <input
                id="flat-count"
                type="number"
                min={5}
                max={1000}
                className={ui.input}
                value={flats}
                onChange={(event) => setFlats(Math.max(5, Math.min(1000, Number(event.target.value) || 5)))}
              />
            </div>
            <div className="space-y-2">
              <p className={ui.label}>Billing cycle</p>
              <div className="flex rounded-xl border border-slate-200 p-1">
                {(['monthly', 'annual'] as const).map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setBilling(cycle)}
                    className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold capitalize transition ${
                      billing === cycle
                        ? 'bg-syncra-blue text-white'
                        : 'text-slate-600 hover:bg-syncra-surface-alt'
                    }`}
                  >
                    {cycle}
                    {cycle === 'annual' ? ' · 10% off' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-syncra-surface-alt px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Core base plan</p>
            <p className="mt-2 text-lg font-semibold text-syncra-primary">
              {tier.label} · {formatInr(tier.price)} / flat / month
            </p>
            <p className={`mt-1 text-sm ${ui.body}`}>
              Includes billing, maintenance dues, notices, digital elections, vendor SLA, and marketplace.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-syncra-primary">Modular add-ons</p>
            {billableAddons.map((addon) => {
              const checked = selected.includes(addon.id)
              return (
                <label
                  key={addon.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                    checked
                      ? 'border-syncra-accent/40 bg-syncra-accent/5'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-syncra-blue focus:ring-syncra-accent/40"
                    checked={checked}
                    onChange={() => toggleAddon(addon.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-syncra-primary">{addon.shortLabel}</span>
                      <span className="text-sm font-semibold text-syncra-blue">
                        +{formatInr(addon.monthlyPriceInr)}/mo
                      </span>
                    </span>
                    <span className={`mt-1 block text-sm ${ui.body}`}>{addon.description}</span>
                  </span>
                </label>
              )
            })}
            <p className="text-xs text-slate-500">
              Vendor SLA & Marketplace ship with the core plan at no extra monthly fee.
            </p>
          </div>
        </div>

        <aside className="flex h-full flex-col rounded-3xl border border-syncra-accent/30 bg-gradient-to-b from-white to-syncra-surface-alt p-5 shadow-card sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-syncra-blue">Estimate</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-syncra-primary">
            {formatInr(displayTotal)}
            <span className="ml-2 text-base font-medium text-slate-500">{periodLabel}</span>
          </p>
          <p className={`mt-2 text-sm ${ui.body}`}>
            {flats} flats · {tier.headline} · activation {formatInr(pricing.activationFeeInr)} one-time
          </p>

          <dl className="mt-8 space-y-3 border-t border-slate-200 pt-6 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-600">Base ({flats} × {formatInr(tier.price)})</dt>
              <dd className="font-semibold text-slate-800">{formatInr(baseMonthly)}/mo</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-600">Selected add-ons</dt>
              <dd className="font-semibold text-slate-800">{formatInr(addonMonthly)}/mo</dd>
            </div>
            {billing === 'annual' ? (
              <div className="flex justify-between gap-3">
                <dt className="text-slate-600">Annual (10% off)</dt>
                <dd className="font-semibold text-emerald-700">{formatInr(annualTotal)}/yr</dd>
              </div>
            ) : null}
          </dl>

          <button type="button" onClick={handleCheckout} className={`mt-8 w-full ${ui.btnPrimary}`}>
            Get Started — Subscribe
          </button>
          <Link to="/auth/login" className={`mt-3 inline-flex w-full justify-center ${ui.btnGhost}`}>
            Already registered? Log in
          </Link>
          <p className="mt-4 text-center text-xs text-slate-500">
            Continues to onboarding checkout with your selected add-ons.
          </p>
        </aside>
      </div>
    </div>
  )
}
