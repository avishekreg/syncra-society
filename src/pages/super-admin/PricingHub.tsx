import React from 'react'
import SuperAdminPricing from './Pricing'
import SuperAdminSubscriptions from './Subscriptions'
import { ui } from '../../lib/ui'

export default function SuperAdminPricingHub() {
  return (
    <div className="space-y-8">
      <header>
        <p className={ui.eyebrow}>Platform monetization</p>
        <h1 className={`mt-2 ${ui.headingLg}`}>Pricing & Subscriptions</h1>
        <p className={`mt-2 max-w-2xl ${ui.body}`}>
          Configure SaaS tiers and monitor subscription revenue from a single control surface.
        </p>
      </header>

      <SuperAdminPricing />
      <SuperAdminSubscriptions />
    </div>
  )
}
