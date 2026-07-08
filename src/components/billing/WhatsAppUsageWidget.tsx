import React, { useState } from 'react'
import { ui } from '../../lib/ui'
import {
  formatPlanPriceLabel,
  formatWhatsAppUsageLabel,
  getPlanTier,
  getSubscriptionMaxFlats,
  isTrialPlan,
  PAID_UPGRADE_PLANS,
  type PaidSaasPlanType
} from '../../lib/saasBilling'
import type { SaasSubscription, UsageCounter } from '../../types/db'

type WhatsAppUsageWidgetProps = {
  subscription: SaasSubscription | null
  usage: UsageCounter | null
  loading?: boolean
  onUpgrade?: (plan: PaidSaasPlanType) => Promise<void> | void
  onActivateAddon?: () => Promise<void> | void
}

export default function WhatsAppUsageWidget({
  subscription,
  usage,
  loading = false,
  onUpgrade,
  onActivateAddon
}: WhatsAppUsageWidgetProps) {
  const [actionStatus, setActionStatus] = useState('')
  const sent = usage?.whatsapp_alerts_sent ?? 0
  const addonActive = Boolean(usage?.whatsapp_addon_active)
  const trial = subscription ? isTrialPlan(subscription.plan_type) : true
  const planTier = subscription ? getPlanTier(subscription.plan_type) : getPlanTier('trial')

  async function handleUpgrade(plan: PaidSaasPlanType) {
    if (!onUpgrade) return
    setActionStatus('Processing sandbox upgrade…')
    try {
      await onUpgrade(plan)
      const tier = getPlanTier(plan)
      setActionStatus(
        `Sandbox upgrade applied: ${tier.label} (up to ${tier.max_flats} flats, ${formatPlanPriceLabel(plan)}). Live Razorpay Checkout coming soon.`
      )
    } catch (err) {
      setActionStatus(err instanceof Error ? err.message : 'Upgrade failed.')
    }
  }

  async function handleAddon() {
    if (!onActivateAddon) return
    setActionStatus('Activating WhatsApp add-on in test mode…')
    try {
      await onActivateAddon()
      setActionStatus('WhatsApp add-on enabled in sandbox mode.')
    } catch (err) {
      setActionStatus(err instanceof Error ? err.message : 'Add-on activation failed.')
    }
  }

  return (
    <div className={`${ui.innerItem} space-y-4`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-syncra-primary">WhatsApp alert telemetry</p>
          <p className={`mt-1 ${ui.body}`}>
            Current billing cycle usage for resident WhatsApp broadcasts and automation alerts.
          </p>
        </div>
        <div className="rounded-full border border-syncra-accent/30 bg-syncra-accent/10 px-4 py-2 text-sm font-semibold text-syncra-blue">
          {loading ? 'Loading…' : formatWhatsAppUsageLabel(sent)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Plan</p>
          <p className="mt-1 text-sm font-semibold text-syncra-primary">{planTier.label}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Flat cap</p>
          <p className="mt-1 text-sm font-semibold text-syncra-primary">
            {subscription ? getSubscriptionMaxFlats(subscription) : planTier.max_flats}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">WhatsApp add-on</p>
          <p className="mt-1 text-sm font-semibold text-syncra-primary">
            {addonActive ? 'Active' : 'Inactive'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Delivery mode</p>
          <p className="mt-1 text-sm font-semibold text-syncra-primary">
            {trial || !addonActive ? 'Simulated (trial / add-on off)' : 'Live gateway'}
          </p>
        </div>
      </div>

      {trial && onUpgrade ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Upgrade plan (test mode)
          </p>
          <div className="flex flex-wrap gap-2">
            {PAID_UPGRADE_PLANS.map((plan) => {
              const tier = getPlanTier(plan)
              return (
                <button
                  key={plan}
                  type="button"
                  onClick={() => void handleUpgrade(plan)}
                  className={ui.btnSecondary}
                >
                  {tier.label} · {formatPlanPriceLabel(plan)}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {!addonActive && onActivateAddon ? (
        <button type="button" onClick={() => void handleAddon()} className={ui.btnSecondary}>
          Enable WhatsApp Add-on (Test Mode)
        </button>
      ) : null}

      {actionStatus ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {actionStatus}
        </div>
      ) : null}
    </div>
  )
}
