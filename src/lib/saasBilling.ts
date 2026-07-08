import type { SaasPlanType, SaasSubscription, UsageCounter } from '../types/db'

export const WHATSAPP_MONTHLY_ALERT_LIMIT = 3000

export const TRIAL_FLAT_LIMIT = 5

export type PaidSaasPlanType = 'medium' | 'portfolio' | 'enterprise'

export type SaasPlanTier = {
  plan_type: SaasPlanType
  label: string
  max_flats: number
  price_per_flat_inr: number
  flat_range_label: string
}

/** Strict Syncra SaaS tier caps and per-flat pricing. */
export const SAAS_PLAN_TIERS: Record<SaasPlanType, SaasPlanTier> = {
  trial: {
    plan_type: 'trial',
    label: '1-Month Free Trial',
    max_flats: 5,
    price_per_flat_inr: 0,
    flat_range_label: 'Up to 5 flats'
  },
  medium: {
    plan_type: 'medium',
    label: 'Medium (Tier 1)',
    max_flats: 50,
    price_per_flat_inr: 149,
    flat_range_label: 'Up to 50 flats'
  },
  portfolio: {
    plan_type: 'portfolio',
    label: 'Portfolio (Tier 2)',
    max_flats: 150,
    price_per_flat_inr: 99,
    flat_range_label: '51 to 150 flats'
  },
  enterprise: {
    plan_type: 'enterprise',
    label: 'Enterprise (Tier 3)',
    max_flats: 1000,
    price_per_flat_inr: 75,
    flat_range_label: '151+ flats'
  }
}

export const PAID_UPGRADE_PLANS: PaidSaasPlanType[] = ['medium', 'portfolio', 'enterprise']

export const TRIAL_LIMIT_MESSAGE =
  'Trial Limit Reached. You can only add up to 5 flats in the 1-Month Free Trial. Upgrade to a paid plan to add more flats.'

export const TRIAL_WHATSAPP_SIMULATION_MESSAGE =
  '📢 [TRIAL MODE] WhatsApp Alert Simulated Successfully! (Live notifications require the ₹499/mo Add-on).'

export type SaasBillingContext = {
  subscription: SaasSubscription
  usage: UsageCounter
}

export function getPlanTier(planType: SaasPlanType | string | null | undefined): SaasPlanTier {
  if (planType && planType in SAAS_PLAN_TIERS) {
    return SAAS_PLAN_TIERS[planType as SaasPlanType]
  }
  return SAAS_PLAN_TIERS.trial
}

export function getMaxFlatsForPlan(planType: SaasPlanType | string): number {
  return getPlanTier(planType).max_flats
}

export function getPricePerFlatForPlan(planType: SaasPlanType | string): number {
  return getPlanTier(planType).price_per_flat_inr
}

export function getSubscriptionMaxFlats(subscription: SaasSubscription): number {
  return subscription.max_flats ?? getMaxFlatsForPlan(subscription.plan_type)
}

export function isTrialPlan(planType: string | null | undefined) {
  return planType === 'trial'
}

export function shouldSimulateWhatsApp(subscription: SaasSubscription, usage: UsageCounter) {
  return isTrialPlan(subscription.plan_type) || !usage.whatsapp_addon_active
}

export function isFlatLimitReached(subscription: SaasSubscription, currentFlatCount: number) {
  return currentFlatCount >= getSubscriptionMaxFlats(subscription)
}

/** @deprecated Use isFlatLimitReached — kept for existing imports. */
export function isTrialFlatLimitReached(subscription: SaasSubscription, currentFlatCount: number) {
  return isTrialPlan(subscription.plan_type) && isFlatLimitReached(subscription, currentFlatCount)
}

export function getNextUpgradePlan(planType: SaasPlanType | string): PaidSaasPlanType | null {
  if (planType === 'trial') return 'medium'
  if (planType === 'medium') return 'portfolio'
  if (planType === 'portfolio') return 'enterprise'
  return null
}

export function buildFlatLimitMessage(subscription: SaasSubscription): string {
  const tier = getPlanTier(subscription.plan_type)
  const maxFlats = getSubscriptionMaxFlats(subscription)
  const nextPlan = getNextUpgradePlan(subscription.plan_type)

  if (isTrialPlan(subscription.plan_type)) {
    return `Trial Limit Reached. You can only add up to ${maxFlats} flats in the 1-Month Free Trial. Upgrade to a paid plan to add more flats.`
  }

  if (!nextPlan) {
    return `Plan Limit Reached. Your ${tier.label} plan supports up to ${maxFlats} flats. Contact Syncra Systems LLP for custom capacity beyond this tier.`
  }

  const nextTier = getPlanTier(nextPlan)
  return `Plan Limit Reached. Your ${tier.label} plan supports up to ${maxFlats} flats. Upgrade to ${nextTier.label} (${nextTier.flat_range_label}, ₹${nextTier.price_per_flat_inr} per flat / month) to continue onboarding.`
}

export function formatPlanPriceLabel(planType: SaasPlanType | string): string {
  const tier = getPlanTier(planType)
  if (tier.price_per_flat_inr === 0) return 'Free trial'
  return `₹${tier.price_per_flat_inr} per flat / month`
}

export function formatWhatsAppUsageLabel(sent: number, limit = WHATSAPP_MONTHLY_ALERT_LIMIT) {
  return `${sent} / ${limit} Alerts Used`
}

export { WHATSAPP_MONTHLY_ALERT_LIMIT }
