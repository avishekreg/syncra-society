import React, { useEffect, useState } from 'react'
import {
  fetchPlatformPricing,
  getPlatformPricing,
  savePlatformPricing,
  type PlatformPricingConfig,
  type PlatformTierConfig
} from '../../lib/platformPricing'
import { ui } from '../../lib/ui'

const saveBtn = 'rounded-xl bg-syncra-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0047b3]'

export default function SuperAdminPricing() {
  const [activationFeeInr, setActivationFeeInr] = useState(2499)
  const [tiers, setTiers] = useState<PlatformTierConfig[]>(() => getPlatformPricing().tiers)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void fetchPlatformPricing().then((config) => {
      setActivationFeeInr(config.activationFeeInr)
      setTiers(config.tiers)
    })
  }, [])

  function updateTierPrice(id: PlatformTierConfig['id'], price: number) {
    setTiers((current) => current.map((tier) => (tier.id === id ? { ...tier, price } : tier)))
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setStatus('')

    const payload: PlatformPricingConfig = {
      activationFeeInr,
      tiers
    }

    try {
      await savePlatformPricing(payload)
      setStatus('Pricing saved. Homepage and checkout now use these values.')
    } catch {
      setStatus('Saved locally. Run `npm run dev` (vercel dev) to sync checkout pricing.')
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
                <div className={`mt-4 flex items-center gap-3 ${ui.input}`}>
                  <span className="text-slate-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={activationFeeInr}
                    onChange={(event) => setActivationFeeInr(Number(event.target.value))}
                    className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                <p className={`mt-3 ${ui.body}`}>This onboarding fee is applied once per society and is independent of monthly tier pricing.</p>
              </div>

              <div className={ui.innerItem}>
                <p className="text-sm font-semibold text-syncra-primary">Save state</p>
                <p className={`mt-3 ${ui.body}`}>Pricing is stored in the browser and synced to the serverless API when available.</p>
                <div className={`mt-6 ${ui.innerItem} text-sm`}>
                  <p className="font-semibold text-syncra-primary">Current saved state</p>
                  <p className={`mt-2 ${ui.body}`}>Activation Fee: ₹{activationFeeInr.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {tiers.map((tier) => (
                <div key={tier.id} className={ui.innerItem}>
                  <p className={ui.eyebrow}>{tier.label}</p>
                  <h3 className={`mt-3 text-xl font-semibold text-syncra-primary`}>{tier.headline}</h3>
                  <div className={`mt-5 flex items-center gap-3 ${ui.input}`}>
                    <span className="text-slate-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={tier.price}
                      onChange={(event) => updateTierPrice(tier.id, Number(event.target.value))}
                      className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <p className={`mt-3 text-sm ${ui.body}`}>{tier.description}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button type="submit" disabled={saving} className={saveBtn}>
                {saving ? 'Saving…' : 'Save Pricing Slabs'}
              </button>
              {status && <p className={ui.body}>{status}</p>}
            </div>
          </form>
        </section>
    </div>
  )
}
