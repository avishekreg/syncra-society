import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import {
  createListingInquiry,
  estimateHomeLoanEmi,
  listPropertyListings,
  parseResaleBadge
} from '../../api/rentalSyndicationService'
import type { PropertyListingPurpose, PropertyMarketListing } from '../../types/db'
import { formatInr } from '../../lib/platformPricing'
import { ui } from '../../lib/ui'

type Filter = 'ALL' | 'RENT' | 'SALE'

export default function ResidentRentalsMarketplacePage() {
  const { currentSocietyId, user } = useAuth()
  const [filter, setFilter] = useState<Filter>('ALL')
  const [verifiedResaleOnly, setVerifiedResaleOnly] = useState(false)
  const [listings, setListings] = useState<PropertyMarketListing[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loanRate, setLoanRate] = useState(8.5)
  const [loanYears, setLoanYears] = useState(20)
  const [emiListingId, setEmiListingId] = useState<string | null>(null)

  async function refresh() {
    if (!currentSocietyId) return
    const purpose = filter === 'ALL' ? undefined : (filter as PropertyListingPurpose)
    setListings(await listPropertyListings(currentSocietyId, { purpose, statusPublishedOnly: true }))
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [currentSocietyId, filter])

  const visible = useMemo(() => {
    return listings.filter((listing) => {
      if (!verifiedResaleOnly) return true
      if (listing.listing_purpose !== 'SALE') return false
      const badge = parseResaleBadge(listing.rwa_resale_badge)
      return Boolean(badge && (badge.maintenanceDuesClear || listing.maintenance_dues_clear))
    })
  }, [listings, verifiedResaleOnly])

  if (!currentSocietyId) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Select a society to browse rentals and resale listings.</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Zero brokerage</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Rentals & society resale marketplace</h2>
        <p className={`mt-2 ${ui.body}`}>
          Internal residents and verified buyer networks can browse flats for rent or sale, estimate EMIs, and contact
          owners directly — no brokerage.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/resident/my-flat/rent-out" className={ui.btnPrimary}>
            List my flat
          </Link>
          {(
            [
              ['ALL', 'All'],
              ['RENT', 'For rent'],
              ['SALE', 'For sale']
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                filter === id ? 'bg-syncra-blue text-white' : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={verifiedResaleOnly} onChange={(e) => setVerifiedResaleOnly(e.target.checked)} />
          Verified Society Resale only
        </label>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Home loan EMI estimator</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={ui.label}>Interest % p.a.</label>
            <input className={ui.input} type="number" step={0.1} value={loanRate} onChange={(e) => setLoanRate(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Tenure (years)</label>
            <input className={ui.input} type="number" min={5} max={30} value={loanYears} onChange={(e) => setLoanYears(Number(e.target.value) || 20)} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((listing) => {
          const badge = parseResaleBadge(listing.rwa_resale_badge)
          const emi =
            listing.listing_purpose === 'SALE'
              ? estimateHomeLoanEmi({
                  principalInr: Number(listing.expected_sale_price || 0),
                  annualRatePct: loanRate,
                  tenureYears: loanYears
                })
              : null
          const showEmi = emiListingId === listing.id

          return (
            <article key={listing.id} className={ui.card}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {listing.listing_purpose} · Flat {listing.flat_number}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-syncra-primary">
                    {listing.bhk || 'Flat'} · {listing.parking_available ? `${listing.parking_count} parking` : 'No parking'}
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  Zero brokerage
                </span>
              </div>

              <p className="mt-3 text-2xl font-semibold text-syncra-primary">
                {listing.listing_purpose === 'SALE'
                  ? formatInr(Number(listing.expected_sale_price || 0))
                  : `${formatInr(Number(listing.monthly_rent || 0))}/mo`}
              </p>
              {listing.listing_purpose === 'SALE' && listing.price_per_sqft ? (
                <p className={`text-sm ${ui.body}`}>{formatInr(Number(listing.price_per_sqft))} / sq.ft</p>
              ) : null}

              {badge ? (
                <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                  <p className="text-sm font-semibold text-amber-900">{badge.label}</p>
                  <p className="mt-1 text-xs text-amber-800">
                    Dues {badge.maintenanceDuesClear ? 'clear' : 'pending'} · Security score {badge.societySecurityScore}
                    {badge.nocCleared ? ' · NOC cleared' : ''}
                  </p>
                </div>
              ) : null}

              {listing.description ? <p className={`mt-3 text-sm ${ui.body}`}>{listing.description}</p> : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {listing.listing_purpose === 'SALE' && emi ? (
                  <button
                    type="button"
                    className={ui.btnSecondary}
                    onClick={() => setEmiListingId(showEmi ? null : listing.id)}
                  >
                    {showEmi ? 'Hide EMI' : `EMI ~ ${formatInr(emi.emi)}`}
                  </button>
                ) : null}
                <button
                  type="button"
                  className={ui.btnPrimary}
                  onClick={() => {
                    if (!user?.id) {
                      setError('Sign in to contact the owner.')
                      return
                    }
                    void createListingInquiry({
                      societyId: currentSocietyId,
                      listingId: listing.id,
                      userId: user.id,
                      name: user.username || user.email || 'Resident',
                      phone: user.phone || undefined,
                      email: user.email || undefined,
                      message: `Interested in ${listing.listing_purpose.toLowerCase()} for Flat ${listing.flat_number}`,
                      inquiryType: 'CONTACT'
                    })
                      .then(() => setMessage(`Inquiry sent to owner of Flat ${listing.flat_number}.`))
                      .catch((err) => setError(err instanceof Error ? err.message : 'Inquiry failed'))
                  }}
                >
                  Contact owner
                </button>
              </div>

              {showEmi && emi ? (
                <p className={`mt-3 text-sm ${ui.body}`}>
                  Est. EMI {formatInr(emi.emi)} / mo · {loanYears} yrs @ {loanRate}% · total interest{' '}
                  {formatInr(emi.totalInterest)}
                </p>
              ) : null}
            </article>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <section className={ui.card}>
          <p className={`text-sm ${ui.body}`}>No listings match this filter yet.</p>
        </section>
      ) : null}
    </div>
  )
}
