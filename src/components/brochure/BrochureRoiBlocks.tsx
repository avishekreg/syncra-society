import React from 'react'
import {
  COST_COMPARISON_ROWS,
  HIDDEN_WASTE,
  NET_BOTTOM_LINE,
  PAYS_FOR_ITSELF,
  ROI_MULTIPLIER_PCT,
  ROI_NET_PROFIT_MO,
  ROI_SAVINGS_EARNINGS_MO,
  ROI_SUBSCRIPTION_MO,
  formatInr
} from '../../lib/brochureRoi'

type Labels = {
  wasteTitle?: string
  paysTitle?: string
  netTitle?: string
  costTitle?: string
  costHeaders?: [string, string, string]
}

const DEFAULT: Required<Labels> = {
  wasteTitle: 'Traditional RWA financial waste — the hidden money drain',
  paysTitle: 'How maiSociety pays for itself — the 300% ROI math',
  netTitle: 'Why the society pays ₹0 net',
  costTitle: 'Cost comparison — gadgets vs phone-first OS',
  costHeaders: ['Line item', 'Legacy gatekeeper path', 'maiSociety']
}

/** Compact waste cards — Exec Deck + Masterguide page 15. */
export function HiddenWasteGrid({ title }: { title?: string }) {
  return (
    <div className="roi-block">
      <h3 className="roi-section-title">{title ?? DEFAULT.wasteTitle}</h3>
      <div className="roi-grid-3">
        {HIDDEN_WASTE.map((item) => (
          <article key={item.title} className="roi-waste-card">
            <p className="roi-card-title">{item.title}</p>
            <p className="roi-card-body">{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

/** Savings / earnings cards. */
export function PaysForItselfGrid({ title }: { title?: string }) {
  return (
    <div className="roi-block">
      <h3 className="roi-section-title roi-section-title--green">{title ?? DEFAULT.paysTitle}</h3>
      <div className="roi-grid-3">
        {PAYS_FOR_ITSELF.map((item) => (
          <article key={item.title} className="roi-save-card">
            <p className="roi-card-title">{item.title}</p>
            <p className="roi-card-body">{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

/** Big math strip: spend → save/earn → net profit. */
export function NetProfitBanner({ title }: { title?: string }) {
  return (
    <div className="roi-net-banner">
      <p className="roi-net-kicker">{title ?? DEFAULT.netTitle}</p>
      <div className="roi-net-flow">
        <div className="roi-net-step">
          <span className="roi-net-label">Spend</span>
          <strong>{formatInr(ROI_SUBSCRIPTION_MO)}/mo</strong>
        </div>
        <span className="roi-net-arrow" aria-hidden>
          →
        </span>
        <div className="roi-net-step roi-net-step--mid">
          <span className="roi-net-label">Save & earn</span>
          <strong>{formatInr(ROI_SAVINGS_EARNINGS_MO)}/mo</strong>
        </div>
        <span className="roi-net-arrow" aria-hidden>
          →
        </span>
        <div className="roi-net-step roi-net-step--win">
          <span className="roi-net-label">Net RWA profit</span>
          <strong>
            {formatInr(ROI_NET_PROFIT_MO)}/mo · {ROI_MULTIPLIER_PCT}% ROI
          </strong>
        </div>
      </div>
      <p className="roi-net-footnote">{NET_BOTTOM_LINE}</p>
    </div>
  )
}

/** Zebra cost table for Exec page 2 / Masterguide. */
export function CostComparisonTable({
  title,
  headers
}: {
  title?: string
  headers?: [string, string, string]
}) {
  const h = headers ?? DEFAULT.costHeaders
  return (
    <div className="roi-block">
      <h3 className="roi-section-title">{title ?? DEFAULT.costTitle}</h3>
      <table className="roi-table">
        <thead>
          <tr>
            {h.map((label, i) => (
              <th key={label} className={i === 2 ? 'roi-th-win' : undefined}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COST_COMPARISON_ROWS.map((row, idx) => (
            <tr key={row[0]} className={idx % 2 ? 'roi-tr-odd' : undefined}>
              <td className="roi-td-key">{row[0]}</td>
              <td>{row[1]}</td>
              <td className="roi-td-win">{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
