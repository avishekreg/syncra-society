import React, { useEffect, useState } from 'react'
import {
  fetchPlatformPricing,
  getPlatformPricing,
  savePlatformPricing,
  type ElectionBillingMode,
  type PlatformPricingConfig,
  type PlatformTierConfig,
  type PremiumAddonsPricingConfig
} from '../../lib/platformPricing'
import { ui } from '../../lib/ui'

const saveBtn =
  'inline-flex min-h-11 items-center justify-center rounded-xl bg-syncra-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0047b3] disabled:cursor-not-allowed disabled:opacity-70'

function InrInput({
  value,
  onChange,
  min = 0,
  step = 1
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  step?: number
}) {
  return (
    <div className={`flex items-center gap-3 ${ui.input}`}>
      <span className="text-slate-500">₹</span>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
      />
    </div>
  )
}

function CountInput({
  value,
  onChange,
  min = 0,
  step = 1,
  suffix
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  step?: number
  suffix?: string
}) {
  return (
    <div className={`flex items-center gap-3 ${ui.input}`}>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
      />
      {suffix && <span className="shrink-0 text-xs text-slate-500">{suffix}</span>}
    </div>
  )
}

export default function SuperAdminPricing() {
  const [activationFeeInr, setActivationFeeInr] = useState(2499)
  const [tiers, setTiers] = useState<PlatformTierConfig[]>(() => getPlatformPricing().tiers)
  const [premiumAddons, setPremiumAddons] = useState<PremiumAddonsPricingConfig>(
    () => getPlatformPricing().premiumAddons
  )
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void fetchPlatformPricing().then((config) => {
      setActivationFeeInr(config.activationFeeInr)
      setTiers(config.tiers)
      setPremiumAddons(config.premiumAddons)
    })
  }, [])

  function updateTierPrice(id: PlatformTierConfig['id'], price: number) {
    setTiers((current) => current.map((tier) => (tier.id === id ? { ...tier, price } : tier)))
  }

  function patchPremiumAddons(patch: {
    whatsapp?: Partial<PremiumAddonsPricingConfig['whatsapp']>
    voiceHelpdesk?: Partial<PremiumAddonsPricingConfig['voiceHelpdesk']>
    elections?: Partial<PremiumAddonsPricingConfig['elections']>
  }) {
    setPremiumAddons((current) => ({
      whatsapp: { ...current.whatsapp, ...patch.whatsapp },
      voiceHelpdesk: { ...current.voiceHelpdesk, ...patch.voiceHelpdesk },
      elections: { ...current.elections, ...patch.elections }
    }))
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setStatus('')

    const payload: PlatformPricingConfig = {
      activationFeeInr,
      tiers,
      premiumAddons
    }

    try {
      const { remoteSynced } = await savePlatformPricing(payload)
      setStatus(
        remoteSynced
          ? 'Pricing saved. Homepage, checkout, and system_configs billing rules are updated.'
          : 'Pricing saved locally. Homepage and checkout now use these values.'
      )
    } catch {
      setStatus('Saved locally. Run `npm run dev:api` to sync checkout pricing to the server.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <div>
          <p className={ui.eyebrow}>Pricing configuration</p>
          <h2 className={`mt-3 ${ui.headingLg}`}>Configure subscription tiers</h2>
          <p className={`mt-3 ${ui.body}`}>
            Update the core tier prices and activation fee for new society onboarding. Changes apply to the
            marketing homepage and Razorpay checkout.
          </p>
        </div>

        <form onSubmit={(event) => void handleSave(event)} className="mt-8 space-y-8">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className={ui.innerItem}>
              <p className="text-sm font-semibold text-syncra-primary">Activation Fee</p>
              <div className="mt-4">
                <InrInput value={activationFeeInr} onChange={setActivationFeeInr} />
              </div>
              <p className={`mt-3 ${ui.body}`}>
                This onboarding fee is applied once per society and is independent of monthly tier pricing.
              </p>
            </div>

            <div className={ui.innerItem}>
              <p className="text-sm font-semibold text-syncra-primary">Save state</p>
              <p className={`mt-3 ${ui.body}`}>
                Pricing is stored in the browser and synced to the serverless API and{' '}
                <code className="text-xs">system_configs</code> when available.
              </p>
              <div className={`mt-6 ${ui.innerItem} text-sm`}>
                <p className="font-semibold text-syncra-primary">Current saved state</p>
                <p className={`mt-2 ${ui.body}`}>Activation Fee: ₹{activationFeeInr.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tiers.map((tier) => (
              <div key={tier.id} className={ui.innerItem}>
                <p className={ui.eyebrow}>{tier.label}</p>
                <h3 className="mt-3 text-xl font-semibold text-syncra-primary">{tier.headline}</h3>
                <div className="mt-5">
                  <InrInput value={tier.price} onChange={(price) => updateTierPrice(tier.id, price)} />
                </div>
                <p className={`mt-3 text-sm ${ui.body}`}>{tier.description}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6 border-t border-slate-100 pt-8">
            <div>
              <p className={ui.eyebrowPrimary}>Premium add-ons engine</p>
              <h3 className={`mt-3 ${ui.heading}`}>Stack-on module billing rules</h3>
              <p className={`mt-3 max-w-3xl ${ui.body}`}>
                Configure WhatsApp automation, AI Voice Helpdesk, and Encrypted Election pricing. These values
                drive the marketing homepage add-on cards and the SaaS billing rules engine.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div className={ui.innerItem}>
                <p className={ui.eyebrow}>WhatsApp automation</p>
                <h4 className="mt-3 text-lg font-semibold text-syncra-primary">Notice & alert routing</h4>
                <p className={`mt-2 text-sm ${ui.body}`}>
                  Base monthly add-on plus volume-tier overage after the included alert allowance.
                </p>

                <label className={`mt-5 block ${ui.label}`}>Base monthly add-on price</label>
                <div className="mt-2">
                  <InrInput
                    value={premiumAddons.whatsapp.baseMonthlyPriceInr}
                    onChange={(baseMonthlyPriceInr) =>
                      patchPremiumAddons({ whatsapp: { baseMonthlyPriceInr } })
                    }
                  />
                </div>

                <label className={`mt-5 block ${ui.label}`}>Included alerts per month</label>
                <div className="mt-2">
                  <CountInput
                    value={premiumAddons.whatsapp.includedMessagesPerMonth}
                    onChange={(includedMessagesPerMonth) =>
                      patchPremiumAddons({ whatsapp: { includedMessagesPerMonth } })
                    }
                    suffix="alerts"
                  />
                </div>

                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-syncra-primary">Volume overage block</p>
                  <p className={`mt-2 text-xs ${ui.body}`}>
                    Charged per additional block after the included allowance (e.g. every 1,000 extra alerts).
                  </p>

                  <label className={`mt-4 block text-xs font-medium text-slate-700`}>Block size</label>
                  <div className="mt-2">
                    <CountInput
                      value={premiumAddons.whatsapp.overageBlockSize}
                      onChange={(overageBlockSize) => patchPremiumAddons({ whatsapp: { overageBlockSize } })}
                      suffix="messages"
                    />
                  </div>

                  <label className={`mt-4 block text-xs font-medium text-slate-700`}>Price per block</label>
                  <div className="mt-2">
                    <InrInput
                      value={premiumAddons.whatsapp.overageBlockPriceInr}
                      onChange={(overageBlockPriceInr) =>
                        patchPremiumAddons({ whatsapp: { overageBlockPriceInr } })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className={ui.innerItem}>
                <p className={ui.eyebrow}>AI voice ticketing</p>
                <h4 className="mt-3 text-lg font-semibold text-syncra-primary">Smart Helpdesk bundle</h4>
                <p className={`mt-2 text-sm ${ui.body}`}>
                  Hugging Face Whisper transcription + Llama auto-categorization per society.
                </p>

                <label className={`mt-5 block ${ui.label}`}>Monthly flat fee per society</label>
                <div className="mt-2">
                  <InrInput
                    value={premiumAddons.voiceHelpdesk.monthlyFlatFeeInr}
                    onChange={(monthlyFlatFeeInr) =>
                      patchPremiumAddons({ voiceHelpdesk: { monthlyFlatFeeInr } })
                    }
                  />
                </div>

                <div className={`mt-6 rounded-xl border border-syncra-accent/20 bg-cyan-50/60 p-4 text-xs ${ui.body}`}>
                  Requires HF token in Global Platform Settings. Voice capture is gated per society via Configure
                  Modules.
                </div>
              </div>

              <div className={ui.innerItem}>
                <p className={ui.eyebrow}>Encrypted elections</p>
                <h4 className="mt-3 text-lg font-semibold text-syncra-primary">Election engine</h4>
                <p className={`mt-2 text-sm ${ui.body}`}>
                  Choose recurring monthly billing or per-election event orchestration.
                </p>

                <fieldset className="mt-5 space-y-3">
                  <legend className={`${ui.label} mb-2`}>Billing orchestration</legend>
                  {(
                    [
                      { id: 'monthly', label: 'Flat monthly recurring fee' },
                      { id: 'per_event', label: 'Per-election event billing' }
                    ] as const
                  ).map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                    >
                      <input
                        type="radio"
                        name="election-billing-mode"
                        checked={premiumAddons.elections.billingMode === option.id}
                        onChange={() =>
                          patchPremiumAddons({
                            elections: { billingMode: option.id as ElectionBillingMode }
                          })
                        }
                        className="accent-syncra-blue"
                      />
                      {option.label}
                    </label>
                  ))}
                </fieldset>

                {premiumAddons.elections.billingMode === 'monthly' ? (
                  <>
                    <label className={`mt-5 block ${ui.label}`}>Monthly recurring fee</label>
                    <div className="mt-2">
                      <InrInput
                        value={premiumAddons.elections.monthlyFeeInr}
                        onChange={(monthlyFeeInr) => patchPremiumAddons({ elections: { monthlyFeeInr } })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <label className={`mt-5 block ${ui.label}`}>Per-election event fee</label>
                    <div className="mt-2">
                      <InrInput
                        value={premiumAddons.elections.perEventFeeInr}
                        onChange={(perEventFeeInr) => patchPremiumAddons({ elections: { perEventFeeInr } })}
                      />
                    </div>
                    <p className={`mt-3 text-xs ${ui.body}`}>
                      Monthly fee is bypassed in per-event mode — societies are billed when an election is
                      orchestrated.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <button type="submit" disabled={saving} className={saveBtn}>
              {saving ? 'Saving…' : 'Save Pricing Engine'}
            </button>
            {status && <p className={ui.body}>{status}</p>}
          </div>
        </form>
      </section>
    </div>
  )
}
