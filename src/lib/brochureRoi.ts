/**
 * Shared RWA cost-justification figures for Exec Deck + Masterguide.
 * Illustrative mid-size society economics — used for board ROI math.
 */

export const ROI_SUBSCRIPTION_MO = 10_000
export const ROI_SAVINGS_EARNINGS_MO = 35_000
export const ROI_NET_PROFIT_MO = 25_000
export const ROI_MULTIPLIER_PCT = 300

export const HIDDEN_WASTE = [
  {
    title: 'Vendor bill inflation & tanker fraud',
    body: '~15–20% leakage of monthly maintenance funds from manual, unverified vendor logs.'
  },
  {
    title: 'Hardware maintenance AMC',
    body: '₹60,000–₹1,20,000/year on biometric gates, RFID tags, boom barriers — before process is fixed.'
  },
  {
    title: 'Uncollected dues lag',
    body: '8–12% monthly collection lag from manual follow-ups and fragmented ledgers.'
  }
] as const

export const PAYS_FOR_ITSELF = [
  {
    title: 'mAI Auditor savings',
    body: '₹15,000–₹40,000/month by auto-flagging vendor invoice anomalies and utility spikes before payment.'
  },
  {
    title: 'Zero hardware AMC',
    body: 'Saves 100% of physical gadget maintenance — ₹0 forced sensors, kiosks, or boom AMC.'
  },
  {
    title: 'Monetized parking revenue',
    body: '₹8,000–₹25,000/month passive income for society/owners via idle visitor-slot rentals.'
  }
] as const

export const COST_COMPARISON_ROWS: Array<[string, string, string]> = [
  ['Upfront gadgets', '₹2L–₹8L+ devices + install', '₹0 hardware'],
  ['Annual AMC', '₹60k–₹1.2L gate/RFID/boom', '₹0 gadget AMC'],
  ['Monthly platform', 'Legacy SaaS + ops overhead', `₹5k–₹20k · Core + modules`],
  ['Leakage control', 'Post-facto AGM surprises', 'Pre-payment Auditor holds'],
  ['Owner earnings', 'None from idle parking', '₹8k–₹25k/mo parking pool'],
  ['Net RWA outcome', 'Expense line forever', `Spend ₹${(ROI_SUBSCRIPTION_MO / 1000).toFixed(0)}k → Net +₹${(ROI_NET_PROFIT_MO / 1000).toFixed(0)}k/mo`]
]

export function formatInr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

export const NET_BOTTOM_LINE = `Society spends ${formatInr(ROI_SUBSCRIPTION_MO)}/mo → Saves & earns ${formatInr(ROI_SAVINGS_EARNINGS_MO)}/mo → Net profit to RWA = ${formatInr(ROI_NET_PROFIT_MO)}/month`
