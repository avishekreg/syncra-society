import React from 'react'
import { ui } from '../../lib/ui'
import {
  formatPlanPriceLabel,
  getPlanTier,
  PAID_UPGRADE_PLANS,
  type PaidSaasPlanType
} from '../../lib/saasBilling'

type PlanLimitModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  message: string
  upgradeOptions?: PaidSaasPlanType[]
  onUpgrade?: (plan: PaidSaasPlanType) => void
}

export default function PlanLimitModal({
  open,
  onClose,
  title = 'Plan limit reached',
  message,
  upgradeOptions = PAID_UPGRADE_PLANS,
  onUpgrade
}: PlanLimitModalProps) {
  if (!open) return null

  return (
    <div className={ui.overlay} role="presentation" onClick={onClose}>
      <div
        className={`${ui.modal} max-w-lg`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-limit-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p className={ui.eyebrowPrimary}>Upgrade required</p>
        <h2 id="plan-limit-title" className={`mt-2 ${ui.heading}`}>
          {title}
        </h2>
        <p className={`mt-3 ${ui.body}`}>{message}</p>

        {onUpgrade ? (
          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Select a paid tier (test mode)
            </p>
            {upgradeOptions.map((plan) => {
              const tier = getPlanTier(plan)
              return (
                <button
                  key={plan}
                  type="button"
                  onClick={() => onUpgrade(plan)}
                  className={`${ui.btnSecondary} w-full justify-between px-4 py-3 text-left`}
                >
                  <span className="font-semibold text-syncra-primary">{tier.label}</span>
                  <span className="text-xs text-slate-600">
                    {tier.flat_range_label} · {formatPlanPriceLabel(plan)}
                  </span>
                </button>
              )
            })}
          </div>
        ) : null}

        <div className="mt-6">
          <button type="button" onClick={onClose} className={`${ui.btnGhost} w-full justify-center`}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/** @deprecated Use PlanLimitModal */
export { PlanLimitModal as TrialLimitModal }
