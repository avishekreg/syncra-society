import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import {
  calculatePricePerSqft,
  createPropertyListing,
  listMyPropertyListings,
  publishAndSyndicateListing,
  closePropertyListing
} from '../../api/rentalSyndicationService'
import { uploadDocument } from '../../utils/upload'
import type {
  PropertyFurnishing,
  PropertyListingPurpose,
  PropertyMarketListing,
  PropertyOwnershipType
} from '../../types/db'
import { formatInr } from '../../lib/platformPricing'
import { ui } from '../../lib/ui'

const OWNERSHIP: PropertyOwnershipType[] = ['FREEHOLD', 'LEASEHOLD', 'COOPERATIVE']
const FURNISHING: PropertyFurnishing[] = ['UNFURNISHED', 'SEMI', 'FULLY']

export default function ResidentRentOutPage() {
  const { currentSocietyId, user } = useAuth()
  const [purpose, setPurpose] = useState<PropertyListingPurpose>('RENT')
  const [myListings, setMyListings] = useState<PropertyMarketListing[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [broadcastPreview, setBroadcastPreview] = useState<string | null>(null)

  // shared
  const [bhk, setBhk] = useState('2BHK')
  const [parking, setParking] = useState(true)
  const [parkingCount, setParkingCount] = useState(1)
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // rent
  const [rent, setRent] = useState(35000)
  const [deposit, setDeposit] = useState(70000)
  const [availableFrom, setAvailableFrom] = useState(new Date().toISOString().slice(0, 10))
  const [furnishing, setFurnishing] = useState<PropertyFurnishing>('SEMI')

  // sale
  const [salePrice, setSalePrice] = useState(8500000)
  const [carpet, setCarpet] = useState(980)
  const [superArea, setSuperArea] = useState(1180)
  const [ownership, setOwnership] = useState<PropertyOwnershipType>('FREEHOLD')
  const [noc, setNoc] = useState(false)
  const [negotiable, setNegotiable] = useState(true)
  const [duesClear, setDuesClear] = useState(true)
  const [titleUrl, setTitleUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const pricePerSqft = useMemo(
    () => calculatePricePerSqft(salePrice, carpet, superArea),
    [salePrice, carpet, superArea]
  )

  async function refresh() {
    if (!currentSocietyId || !user?.id) return
    setMyListings(await listMyPropertyListings(currentSocietyId, user.id))
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [currentSocietyId, user?.id])

  if (!currentSocietyId || !user?.id || !user.flatNumber) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Link your flat to list for rent or resale via maiList.</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>maiList</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Rent out or sell Flat {user.flatNumber}</h2>
        <p className={`mt-2 ${ui.body}`}>
          1-click dual engine for rental & resale syndication across MagicBricks, 99acres, Housing.com, and NoBroker —
          with Verified RWA Resale Certificate for sale listings.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/resident/my-flat" className={ui.btnGhost}>
            ← My Flat
          </Link>
          <Link to="/resident/rentals-marketplace" className={ui.btnSecondary}>
            Open marketplace
          </Link>
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        {broadcastPreview ? (
          <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            {broadcastPreview}
          </pre>
        ) : null}
      </section>

      <section className={ui.card}>
        <p className={ui.label}>I want to</p>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
          {(
            [
              ['RENT', 'Rent Out Flat'],
              ['SALE', 'Sell Flat']
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPurpose(id)}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                purpose === id ? 'bg-syncra-blue text-white shadow-sm' : 'text-slate-700 hover:bg-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>{purpose === 'SALE' ? 'Resale details' : 'Rental details'}</h3>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            void createPropertyListing({
              societyId: currentSocietyId,
              flatNumber: user.flatNumber!,
              userId: user.id,
              listingPurpose: purpose,
              monthlyRent: purpose === 'RENT' ? rent : undefined,
              securityDeposit: purpose === 'RENT' ? deposit : undefined,
              availableFrom: purpose === 'RENT' ? availableFrom : undefined,
              furnishing: purpose === 'RENT' ? furnishing : undefined,
              expectedSalePrice: purpose === 'SALE' ? salePrice : undefined,
              carpetAreaSqft: purpose === 'SALE' ? carpet : undefined,
              superAreaSqft: purpose === 'SALE' ? superArea : undefined,
              ownershipType: purpose === 'SALE' ? ownership : undefined,
              societyNocStatus: purpose === 'SALE' ? noc : false,
              isNegotiable: purpose === 'SALE' ? negotiable : true,
              titleDocumentUrl: purpose === 'SALE' ? titleUrl || undefined : undefined,
              maintenanceDuesClear: purpose === 'SALE' ? duesClear : false,
              societySecurityScore: 82,
              bhk,
              parkingAvailable: parking,
              parkingCount: parking ? parkingCount : 0,
              description,
              contactPhone: phone || user.phone || undefined,
              contactEmail: email || user.email || undefined
            })
              .then(async (listing) => {
                const { listing: syndicated, broadcast } = await publishAndSyndicateListing(listing.id)
                setMessage(
                  `${syndicated.listing_purpose} listing syndicated to ${
                    Array.isArray(syndicated.syndication_portals)
                      ? syndicated.syndication_portals.length
                      : 4
                  } portals.`
                )
                setBroadcastPreview(
                  `WhatsApp / Email broadcast queued\n\n${broadcast.whatsapp}\n\nEmail: ${broadcast.email.subject}`
                )
                return refresh()
              })
              .catch((err) => setError(err instanceof Error ? err.message : 'Publish failed'))
          }}
        >
          <div className="space-y-2">
            <label className={ui.label}>BHK</label>
            <input className={ui.input} value={bhk} onChange={(e) => setBhk(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Parking slots</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} />
                Available
              </label>
              {parking ? (
                <input
                  className={ui.input}
                  type="number"
                  min={1}
                  value={parkingCount}
                  onChange={(e) => setParkingCount(Number(e.target.value) || 1)}
                />
              ) : null}
            </div>
          </div>

          {purpose === 'RENT' ? (
            <>
              <div className="space-y-2">
                <label className={ui.label}>Monthly rent (₹)</label>
                <input className={ui.input} type="number" min={1000} value={rent} onChange={(e) => setRent(Number(e.target.value) || 0)} required />
              </div>
              <div className="space-y-2">
                <label className={ui.label}>Security deposit (₹)</label>
                <input className={ui.input} type="number" min={0} value={deposit} onChange={(e) => setDeposit(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <label className={ui.label}>Available from</label>
                <input className={ui.input} type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className={ui.label}>Furnishing</label>
                <select className={ui.input} value={furnishing} onChange={(e) => setFurnishing(e.target.value as PropertyFurnishing)}>
                  {FURNISHING.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className={ui.label}>Expected sale price (₹)</label>
                <input
                  className={ui.input}
                  type="number"
                  min={100000}
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={ui.label}>Price / sq.ft (auto)</label>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5 text-sm font-semibold text-emerald-900">
                  {pricePerSqft ? `${formatInr(pricePerSqft)} / sq.ft` : 'Enter area to calculate'}
                </div>
              </div>
              <div className="space-y-2">
                <label className={ui.label}>Carpet area (sq.ft)</label>
                <input className={ui.input} type="number" min={100} value={carpet} onChange={(e) => setCarpet(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <label className={ui.label}>Super area (sq.ft)</label>
                <input className={ui.input} type="number" min={100} value={superArea} onChange={(e) => setSuperArea(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <label className={ui.label}>Ownership</label>
                <select className={ui.input} value={ownership} onChange={(e) => setOwnership(e.target.value as PropertyOwnershipType)}>
                  {OWNERSHIP.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={ui.label}>Title / registry document</label>
                <input
                  className={ui.input}
                  type="file"
                  accept=".pdf,image/*"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploading(true)
                    void uploadDocument(file)
                      .then((url) => {
                        setTitleUrl(url)
                        setMessage('Title document attached.')
                      })
                      .catch((err) => setError(err instanceof Error ? err.message : 'Upload failed'))
                      .finally(() => setUploading(false))
                  }}
                />
                {titleUrl ? <p className="text-xs text-emerald-700">Document attached</p> : null}
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={noc} onChange={(e) => setNoc(e.target.checked)} />
                Society NOC cleared
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} />
                Price negotiable
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={duesClear} onChange={(e) => setDuesClear(e.target.checked)} />
                Maintenance dues clear (powers Verified RWA Resale Certificate)
              </label>
            </>
          )}

          <div className="space-y-2">
            <label className={ui.label}>Contact phone</label>
            <input className={ui.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={user.phone || ''} />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Contact email</label>
            <input className={ui.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={user.email || ''} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className={ui.label}>Description</label>
            <textarea className={ui.input} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <button type="submit" className={ui.btnPrimary}>
            1-Click publish & syndicate
          </button>
        </form>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Your listings</h3>
        <div className="mt-4 space-y-3">
          {myListings.map((listing) => (
            <article key={listing.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-syncra-primary">
                    {listing.listing_purpose} · Flat {listing.flat_number} · {listing.bhk || 'BHK n/a'}
                  </p>
                  <p className={`mt-1 text-sm ${ui.body}`}>
                    {listing.listing_purpose === 'SALE'
                      ? `${formatInr(Number(listing.expected_sale_price || 0))} · ${
                          listing.price_per_sqft ? `${formatInr(Number(listing.price_per_sqft))}/sqft` : '—'
                        }`
                      : `${formatInr(Number(listing.monthly_rent || 0))}/mo`}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {Array.isArray(listing.syndication_portals)
                      ? listing.syndication_portals.join(' · ')
                      : listing.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{listing.status}</span>
                  {listing.status !== 'CLOSED' ? (
                    <button
                      type="button"
                      className={ui.btnGhost}
                      onClick={() =>
                        void closePropertyListing(listing.id)
                          .then(() => refresh())
                          .catch((err) => setError(err instanceof Error ? err.message : 'Close failed'))
                      }
                    >
                      Close
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
          {myListings.length === 0 ? <p className={`text-sm ${ui.body}`}>No listings yet.</p> : null}
        </div>
      </section>
    </div>
  )
}
