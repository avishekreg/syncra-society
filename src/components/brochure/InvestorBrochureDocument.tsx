import React, { useMemo } from 'react'
import QRCode from 'qrcode'
import {
  DeliveryInterceptorMock,
  AuditorAnomalyMock,
  ParkingEarningsMock,
  MaiListPipelineMock,
  ArchitectureFlowMock
} from './MasterguideMocks'
import {
  CostComparisonTable,
  HiddenWasteGrid,
  NetProfitBanner,
  PaysForItselfGrid
} from './BrochureRoiBlocks'
import {
  MAI_PLATFORM_NAME,
  MAI_PRODUCTION_ORIGIN,
  SYNCRA_CONTACT_EMAIL,
  SYNCRA_LEGAL_ENTITY,
  SYNCRA_REGISTERED_JURISDICTION
} from '../../lib/brandConstants'
import { ROI_MULTIPLIER_PCT, ROI_NET_PROFIT_MO, formatInr } from '../../lib/brochureRoi'

const TOTAL = 18
const NAVY = '#0f172a'
const BLUE = '#2563eb'
const EMERALD = '#059669'

function MaiMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#fff" />
      <path
        d="M10 22.5V12.5L16 9.5L22 12.5V22.5"
        stroke="#2563eb"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 22.5V15.2L16 13.9L18.5 15.2V22.5"
        stroke="#2563eb"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="18.8" r="1.35" fill="#0052CC" />
      <path d="M21.5 10.5L23.5 8.5L25 10.5L23 12.5Z" fill="#E67E00" />
    </svg>
  )
}

function MasterPage({
  page,
  children,
  dark
}: {
  page: number
  children: React.ReactNode
  dark?: boolean
}) {
  return (
    <article
      className={`brochure-page pdf-page master-a4 ${dark ? 'master-a4--dark' : ''}`}
      data-brochure-page
    >
      <header className="master-hdr">
        <div className="master-hdr-brand">
          <MaiMark size={26} />
          <div>
            <p className="master-wordmark">
              <span style={{ color: '#7dd3fc' }}>m</span>
              <span style={{ color: '#E67E00' }}>AI</span>
              <span>Society</span>
            </p>
            <p className="master-hdr-sub">by Syncra Systems · Technical Masterguide</p>
          </div>
        </div>
        <span className="master-pill">18-Page Architecture Whitepaper</span>
      </header>
      <div className="master-body">{children}</div>
      <footer className="master-ftr">
        <span>
          {SYNCRA_LEGAL_ENTITY} · {MAI_PLATFORM_NAME}
        </span>
        <span>
          Page {page}/{TOTAL}
        </span>
      </footer>
    </article>
  )
}

function Kicker({ children, green }: { children: React.ReactNode; green?: boolean }) {
  return <p className={`master-kicker ${green ? 'master-kicker--green' : ''}`}>{children}</p>
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="master-feature-pill">{children}</span>
}

function SpecCard({ title, body, accent }: { title: string; body: string; accent?: string }) {
  return (
    <div className="master-spec-card" style={accent ? { borderLeftColor: accent } : undefined}>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  )
}

/** 18-page enterprise Masterguide — visual SaaS whitepaper + 2-page RWA ROI framework. */
export default function InvestorBrochureDocument() {
  const qrSvg = useMemo(() => {
    const modules = QRCode.create(MAI_PRODUCTION_ORIGIN, { errorCorrectionLevel: 'M' }).modules
    const n = modules.size
    const rects: string[] = []
    for (let y = 0; y < n; y += 1) {
      for (let x = 0; x < n; x += 1) {
        if (modules.get(x, y)) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${NAVY}"/>`)
      }
    }
    return { n, html: rects.join('') }
  }, [])

  return (
    <div id="investor-brochure-root" className="brochure-document master-document">
      {/* 1 Cover */}
      <MasterPage page={1} dark>
        <section className="master-cover-hero">
          <Kicker>Platform overview</Kicker>
          <h1 className="master-h1">{MAI_PLATFORM_NAME}</h1>
          <p className="master-lead-light">
            Next-gen autonomous AI society OS — billing, gatekeeper, governance, finance intelligence, green ops, and
            1-click property syndication. Phone-first. Zero forced hardware. Built as a net-profit line for RWAs.
          </p>
          <div className="master-metric-row">
            {['0 Hardware', '24h Go-live', `${ROI_MULTIPLIER_PCT}% ROI`, 'Modular license'].map((m) => (
              <div key={m} className="master-metric">
                {m}
              </div>
            ))}
          </div>
        </section>
        <div className="master-cover-grid">
          <div className="master-cover-card">
            <h3>Who it serves</h3>
            <p>Residents · Guards · Secretary · President · Finance — one private society workspace.</p>
          </div>
          <div className="master-cover-card">
            <h3>How it ships</h3>
            <p>Web + mobile shell + WhatsApp assistant. Supabase RLS · Edge jobs · Realtime gate alerts.</p>
          </div>
          <div className="master-cover-card master-cover-card--accent">
            <h3>Syncra watermark</h3>
            <p>
              {SYNCRA_LEGAL_ENTITY} · {SYNCRA_REGISTERED_JURISDICTION}
            </p>
            <p style={{ marginTop: 6 }}>{MAI_PRODUCTION_ORIGIN.replace('https://', '')}</p>
          </div>
        </div>
      </MasterPage>

      {/* 2 Problem */}
      <MasterPage page={2}>
        <Kicker>01 · Industry problem</Kicker>
        <h2 className="master-h2">Why legacy society software still feels broken</h2>
        <p className="master-lead">
          Traditional gatekeeper apps stop at dues and visitor logs. Daily life — deliveries, kid exits, expense leaks,
          elections, parking, gardens — stays in notebooks and chat chaos. Committees pay twice: SaaS fees plus gadget
          AMC, while leakage continues.
        </p>
        <div className="master-grid-2">
          {[
            ['Costly gadgets', 'Cameras, kiosks, and AMC bills before process is fixed.'],
            ['Weak gate control', 'Verbal staff entry · forged visitor books · interrupted flats.'],
            ['Opaque money', 'Spreadsheets hide 15–20% vendor leakage until the AGM explodes.'],
            ['Governance by chat', 'Elections and bylaws live in WhatsApp forwards.'],
            ['Disconnected tools', 'Gate, billing, complaints, and listings never share one flat graph.'],
            ['No owner earnings', 'Static parking bays · broker lock-in on rent/resale.']
          ].map(([t, d]) => (
            <SpecCard key={t} title={t} body={d} accent="#dc2626" />
          ))}
        </div>
      </MasterPage>

      {/* 3 Solution */}
      <MasterPage page={3}>
        <Kicker green>02 · Autonomous AI solution</Kicker>
        <h2 className="master-h2">One society OS — humans stay in the loop where it matters</h2>
        <div className="master-grid-2 master-tight-top">
          <div>
            <h3 className="master-h3">What changes</h3>
            <ul className="master-bullets">
              <li>Delivery SMS / push interceptor pre-clears couriers</li>
              <li>mAI Auditor flags MoM invoice leakage before dual-sign pay</li>
              <li>Cryptographic 1-Flat-1-Vote + recall motions</li>
              <li>Hourly / monthly parking marketplace with UPI credits</li>
              <li>mAI Maintain — appliance + Lift/Fire NOC radar</li>
              <li>maiList 1-click syndication to major portals</li>
              <li>Kid safety windows · SOS · WhatsApp rulebook assistant</li>
            </ul>
          </div>
          <div>
            <h3 className="master-h3">HITL rails (never auto-paid)</h3>
            <ul className="master-bullets">
              <li>Finance dual-signatory on dispute settlements & vendor holds</li>
              <li>Guard override on disputed kid exits</li>
              <li>Committee licensing of premium modules per society</li>
              <li>Private RLS workspace — no cross-society data bleed</li>
            </ul>
            <div className="master-callout">
              Start with core ops. License AI modules when the board is ready — no IoT purchase required. Target net
              outcome: spend ~{formatInr(10000)}/mo → keep ~{formatInr(ROI_NET_PROFIT_MO)}/mo in the society.
            </div>
          </div>
        </div>
      </MasterPage>

      {/* 4 Matrix */}
      <MasterPage page={4}>
        <Kicker>03 · Competitive edge</Kicker>
        <h2 className="master-h2">Legacy gatekeeper apps vs maiSociety</h2>
        <p className="master-lead">Board-ready matrix for shortlists — trademark-safe vs legacy platforms.</p>
        <table className="master-table">
          <thead>
            <tr>
              <th>Capability</th>
              <th>Legacy Platforms</th>
              <th className="master-th-win">maiSociety</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Hardware', 'Devices / sensors / kiosks', 'Phone + WhatsApp · zero gadgets'],
              ['Scope', 'Mostly billing + visitors', 'Full community OS + AI modules'],
              ['Elections', 'Paper / basic polls', 'Cryptographic 1-Flat-1-Vote + recall'],
              ['Finance AI', 'After-the-fact ledgers', 'Auditor flags leakage pre-payment'],
              ['Deliveries', 'Call / paste every time', 'SMS interceptor pre-approve'],
              ['Parking', 'Static bays', 'Hourly + monthly marketplace · UPI'],
              ['Listings', 'Broker / re-type portals', 'maiList 1-click syndication'],
              ['Buying model', 'One big package', 'Core + modular add-ons'],
              ['RWA outcome', 'Expense forever', `${ROI_MULTIPLIER_PCT}% ROI path · net profit`]
            ].map((row, i) => (
              <tr key={row[0]} className={i % 2 ? 'master-tr-odd' : undefined}>
                <td className="master-td-key">{row[0]}</td>
                <td>{row[1]}</td>
                <td className="master-td-win">{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </MasterPage>

      {/* 5 Gatekeeper */}
      <MasterPage page={5}>
        <Kicker>04 · Gatekeeper & security</Kicker>
        <h2 className="master-h2">Safer entry without gate machines</h2>
        <div className="master-split">
          <div>
            <div className="master-pill-row">
              {['Delivery interceptor', 'Staff QR', 'Kid safety', 'Tenant NOC', 'SOS'].map((p) => (
                <Pill key={p}>{p}</Pill>
              ))}
            </div>
            <ul className="master-bullets">
              <li>Resident pre-approves couriers; guard sees green clearance</li>
              <li>Recurring staff QR with time windows + exit close</li>
              <li>Parent expected-return windows; loud alert if missing</li>
              <li>Lease upload · committee digital sign-off · police-ready trail</li>
              <li>1-tap SOS with flat location to guards & volunteers</li>
            </ul>
          </div>
          <DeliveryInterceptorMock />
        </div>
      </MasterPage>

      {/* 6 Governance */}
      <MasterPage page={6}>
        <Kicker>05 · Governance</Kicker>
        <h2 className="master-h2">Fair decisions residents can audit</h2>
        <div className="master-grid-2">
          <SpecCard
            title="Digital elections"
            body="1-Flat-1-Vote secrecy · live turnout without revealing choices · scheduled result reveal."
            accent={BLUE}
          />
          <SpecCard
            title="Recall motions"
            body="Cryptographic ballots for impeachment / recall — accountability without chat mobs."
            accent={BLUE}
          />
          <SpecCard
            title="Digital rulebook"
            body="Bylaws searchable in-app and via WhatsApp assistant — fewer ‘what does the rule say’ fights."
            accent={EMERALD}
          />
          <SpecCard
            title="WhatsApp AI channel"
            body="Dues, notices, and rule lookups answered from society data; hard cases escalate to humans."
            accent={EMERALD}
          />
        </div>
        <div className="master-flow">
          <span>Motion</span>→<span>Eligible flats</span>→<span>Ballot hash</span>→<span>Threshold</span>→
          <span>Publish</span>
        </div>
      </MasterPage>

      {/* 7 Auditor */}
      <MasterPage page={7}>
        <Kicker>06 · Money & mAI Auditor</Kicker>
        <h2 className="master-h2">Catch leakage before payment — not after AGM</h2>
        <div className="master-split">
          <div>
            <div className="master-pill-row">
              {['MoM variance', 'Vendor invoice AI', 'Health score', 'Dual-sign gate'].map((p) => (
                <Pill key={p}>{p}</Pill>
              ))}
            </div>
            <ul className="master-bullets">
              <li>Utility & repair spikes scored against society expense ledger</li>
              <li>Typical save band: ₹15,000–₹40,000/month on anomaly holds</li>
              <li>Payment holds require dual-signatory finance confirmation</li>
              <li>Exportable audit trail for residents and external auditors</li>
            </ul>
          </div>
          <AuditorAnomalyMock />
        </div>
      </MasterPage>

      {/* 8 Community + Parking */}
      <MasterPage page={8}>
        <Kicker>07 · Community & parking monetization</Kicker>
        <h2 className="master-h2">Neighbours help neighbours — and earn from vacant bays</h2>
        <div className="master-split">
          <div>
            <ul className="master-bullets">
              <li>Hourly visitor rent while owners are at work (e.g. ₹20/hr)</li>
              <li>Monthly zero-brokerage lease of unused slots</li>
              <li>UPI confirm → owner wallet credit</li>
              <li>Pool potential ₹8,000–₹25,000/month across idle visitor slots</li>
              <li>Auto-vacate reminder 30 minutes before return</li>
            </ul>
          </div>
          <ParkingEarningsMock />
        </div>
      </MasterPage>

      {/* 9 maiCommute */}
      <MasterPage page={9}>
        <Kicker>08 · maiCommute</Kicker>
        <h2 className="master-h2">Zero-commission in-society carpool</h2>
        <div className="master-grid-3">
          <SpecCard title="Verified graph" body="Only flats inside the same society can offer or request seats." accent={BLUE} />
          <SpecCard title="Route windows" body="Departure times matched to neighbor office / school runs." accent={BLUE} />
          <SpecCard title="No take-rate" body="Seat booking without external commission apps or stranger risk." accent={EMERALD} />
        </div>
        <div className="master-flow master-tight-top">
          <span>Offer ride</span>→<span>Seat request</span>→<span>Flat verify</span>→<span>Depart</span>→
          <span>Complete</span>
        </div>
        <div className="master-callout master-tight-top">
          Trust comes from society identity — not anonymous marketplace ratings.
        </div>
      </MasterPage>

      {/* 10 mAI Maintain — Resident appliances */}
      <MasterPage page={10}>
        <Kicker>09 · mAI Maintain · Resident radar</Kicker>
        <h2 className="master-h2">Appliance ledger that pays for itself</h2>
        <p className="master-lead">
          Zero-hardware service cycles for RO filters, Split ACs, chimneys, and geysers — with push/WhatsApp reminders
          before due dates or AMC expiry, plus 1-click verified technician referrals.
        </p>
        <div className="master-grid-2">
          <SpecCard title="RO filters · 90-day cycle" body="Auto countdown from last service · AMC expiry alerts." accent={BLUE} />
          <SpecCard title="Split AC · 180-day cycle" body="Seasonal service windows before summer peak." accent={BLUE} />
          <SpecCard title="Chimney & geyser" body="Tracked in the flat ledger — no spreadsheets for residents." accent={EMERALD} />
          <SpecCard
            title="Technician referrals"
            body="1-click booking queues local verified AMC partners — resident savings + platform monetization."
            accent={EMERALD}
          />
        </div>
        <div className="master-callout master-tight-top">
          Dual benefit: residents avoid emergency breakdowns · societies earn referral revenue without owning a call center.
        </div>
      </MasterPage>

      {/* 11 mAI Maintain — RWA infrastructure */}
      <MasterPage page={11}>
        <Kicker green>10 · mAI Maintain · RWA infrastructure radar</Kicker>
        <h2 className="master-h2">Zero RWA legal risk on Lift · DG · Fire NOCs</h2>
        <p className="master-lead">
          Statutory infrastructure tracking for Presidents — red safety flags before certificates lapse. No IoT sensors.
        </p>
        <div className="master-grid-2">
          <SpecCard
            title="Lift safety audit"
            body="ARD test logs, wire-rope inspection cycles, Govt Safety NOC expiry warnings."
            accent="#dc2626"
          />
          <SpecCard
            title="DG set lifecycle"
            body="Running hours tracker, mobil oil change alerts, battery health logs."
            accent={BLUE}
          />
          <SpecCard
            title="Fire safety NOC"
            body="Cylinder refill expiry, hydrant pressure tests, Red Safety Flags on the President dashboard."
            accent="#dc2626"
          />
          <SpecCard
            title="Board-ready pressure"
            body="NOC ≤45-day pressure counters and overdue red flags — explainable in AGM minutes."
            accent={EMERALD}
          />
        </div>
      </MasterPage>

      {/* 12 maiList */}
      <MasterPage page={12}>
        <Kicker>11 · maiList rent & resale</Kicker>
        <h2 className="master-h2">List once. Reach renters and buyers faster.</h2>
        <MaiListPipelineMock />
        <div className="master-grid-2 master-tight-top">
          <SpecCard title="Rent" body="Monthly rent, deposit, furnishing, move-in — portal-ready payloads." accent={BLUE} />
          <SpecCard
            title="Resale"
            body="₹/sqft, ownership, NOC, dues-clear Verified Society badge · zero brokerage in-society."
            accent={EMERALD}
          />
        </div>
      </MasterPage>

      {/* 13 Financial ROI Framework — Part A: Hidden waste */}
      <MasterPage page={13}>
        <Kicker>12 · RWA financial ROI · Part A</Kicker>
        <h2 className="master-h2">Traditional RWA financial waste — the hidden money drain</h2>
        <p className="master-lead">
          Boards ask why pay ₹5,000–₹20,000/month. Start with what already leaks — then compare to a phone-first OS that
          turns subscription into net profit.
        </p>
        <HiddenWasteGrid />
        <CostComparisonTable />
        <div className="master-callout master-tight-top">
          Hardware AMC alone (₹60k–₹1.2L/year) often exceeds a full year of maiSociety Core — before counting Auditor
          savings or parking earnings.
        </div>
      </MasterPage>

      {/* 14 Financial ROI Framework — Part B: 300% math */}
      <MasterPage page={14}>
        <Kicker green>13 · RWA financial ROI · Part B</Kicker>
        <h2 className="master-h2">How maiSociety pays for itself — the {ROI_MULTIPLIER_PCT}% ROI math</h2>
        <p className="master-lead">
          Illustrative mid-size society: subscribe around {formatInr(10000)}/month, recover multiples via leakage control,
          zero gadget AMC, and parking monetization.
        </p>
        <PaysForItselfGrid />
        <NetProfitBanner />
        <div className="master-split master-tight-top">
          <div className="master-roi-math">
            <p>
              <strong>Parking illustration:</strong> 20 weekdays × 8 hrs × ₹20 = ₹3,200/bay/month potential · pool idle
              visitor slots to ₹8k–₹25k society/owner income.
            </p>
          </div>
          <ParkingEarningsMock />
        </div>
      </MasterPage>

      {/* 15 Tech Architecture — unique specs only (no filler loops) */}
      <MasterPage page={15}>
        <Kicker>14 · Technology architecture</Kicker>
        <h2 className="master-h2">Enterprise stack — precise, not jargon theatre</h2>
        <p className="master-lead">
          Production path: Vite/React client · Supabase Postgres + RLS · Edge/RPC jobs · Capacitor native shell.
        </p>
        <ArchitectureFlowMock />
        <div className="master-grid-2 master-tight-top">
          <SpecCard
            title="Edge Functions & autonomous jobs"
            body="Auditor sweeps, vacate reminders, kid-exit expiry, botanist weather dispatch — scheduled without waking staff."
            accent={BLUE}
          />
          <SpecCard
            title="Supabase Row-Level Security"
            body="Per-society isolation. Roles (resident, guard, secretary, president, finance) bound in policies."
            accent={BLUE}
          />
          <SpecCard
            title="Encrypted telephony webhooks"
            body="WhatsApp / SMS provider callbacks verified and encrypted in transit; OTP never logged in cleartext UI."
            accent={EMERALD}
          />
          <SpecCard
            title="Realtime WebSockets"
            body="Gate approvals, SOS, notices, and complaint status stream to open consoles without polling spam."
            accent={EMERALD}
          />
          <SpecCard
            title="P2P BLE signal queues"
            body="Owner-registered paired devices queue disconnect/RSSI tips — find aids, not society-wide key meshes."
            accent={NAVY}
          />
          <SpecCard
            title="Modular feature toggles"
            body="License elections, auditor, parking, maiList, maintain per society — draft modules stay Super Admin only."
            accent={NAVY}
          />
        </div>
      </MasterPage>

      {/* 16 Security threat model + privacy */}
      <MasterPage page={16}>
        <Kicker>15 · Security threat model & data privacy</Kicker>
        <h2 className="master-h2">Trust controls committees can explain</h2>
        <div className="master-grid-2">
          {[
            ['Auth & roles', 'Secure sign-in · flat mapping · least-privilege module routes.'],
            ['Threat: credential share', 'Session controls + role-bound RLS; finance dual-sign blocks solo payouts.'],
            ['Threat: fake visitor', 'Pre-cleared delivery tokens + staff QR windows beat verbal entry.'],
            ['Encryption', 'TLS in transit · encrypted storage for media/PII buckets.'],
            ['Audit trails', 'Payments, votes, tenant NOCs, and gate events leave exportable history.'],
            ['Delivery privacy', 'SMS consent gated · interceptor only with resident opt-in on Android.'],
            ['HITL finance', 'No silent auto-payout of vendor holds or dispute settlements.'],
            ['Vendor boundaries', 'WhatsApp/Meta and payment providers remain contracted processors.']
          ].map(([t, d]) => (
            <SpecCard key={t} title={t} body={d} accent={EMERALD} />
          ))}
        </div>
      </MasterPage>

      {/* 17 Pricing + onboarding */}
      <MasterPage page={17}>
        <Kicker>16 · Pricing tiers & 24-hour onboarding</Kicker>
        <h2 className="master-h2">Packages your committee can approve — then go live same day</h2>
        <div className="master-grid-3">
          {[
            ['Core', 'Billing · notices · gatekeeper · helpdesk', '₹5k–₹20k/mo band · per-flat + activation'],
            ['Intelligence', 'Auditor · elections · WhatsApp AI · SOS', 'Add-on licenses'],
            ['Growth', 'Parking · maiList · Maintain · Commute', 'Pay as you enable']
          ].map(([t, d, p]) => (
            <div key={t} className="master-price-card">
              <p className="master-price-tier">{t}</p>
              <p className="master-price-body">{d}</p>
              <p className="master-price-meta">{p}</p>
            </div>
          ))}
        </div>
        <ol className="master-steps master-tight-top">
          {[
            ['Provision', 'Create society · import flats · invite president / secretary / finance roles.'],
            ['Configure', 'Billing rules · guidebook · gate delivery providers · emergency directory.'],
            ['License', 'Enable only board-approved modules (auditor, parking, maiList, …).'],
            ['Activate & first cycle', 'Residents join · guards console · visitor approval · optional parking earn same day.']
          ].map(([t, d], i) => (
            <li key={t}>
              <span className="master-step-num">{i + 1}</span>
              <div>
                <strong>{t}</strong>
                <p>{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </MasterPage>

      {/* 18 Contact */}
      <MasterPage page={18} dark>
        <Kicker>17 · Contact & enterprise support</Kicker>
        <h2 className="master-h2 master-h2--light">Ready for a board walkthrough?</h2>
        <p className="master-lead-light">
          Request the live demo and deployment runbook from {SYNCRA_LEGAL_ENTITY} · {SYNCRA_REGISTERED_JURISDICTION}.
        </p>
        <div className="master-contact-grid">
          <div>
            <p className="master-contact-label">Website</p>
            <p className="master-contact-value">{MAI_PRODUCTION_ORIGIN.replace('https://', '')}</p>
            <p className="master-contact-label">Email</p>
            <p className="master-contact-value">{SYNCRA_CONTACT_EMAIL}</p>
            <p className="master-contact-label">WhatsApp Sales</p>
            <a
              className="master-wa"
              href={`https://wa.me/?text=${encodeURIComponent('Hi Syncra — I want a maiSociety enterprise demo.')}`}
              target="_blank"
              rel="noreferrer"
            >
              Message platform team →
            </a>
            <div className="master-sla">
              <strong>Enterprise Support SLA</strong>
              <p>
                Business-hours ticket response · priority gate/SOS incidents · dedicated onboarding desk for 50+ tower
                portfolios.
              </p>
            </div>
          </div>
          <div className="master-qr-card">
            <svg
              width={120}
              height={120}
              viewBox={`0 0 ${qrSvg.n} ${qrSvg.n}`}
              shapeRendering="crispEdges"
              dangerouslySetInnerHTML={{
                __html: `<rect width="${qrSvg.n}" height="${qrSvg.n}" fill="#fff"/>${qrSvg.html}`
              }}
            />
            <p>Scan · {MAI_PRODUCTION_ORIGIN.replace('https://', '')}</p>
          </div>
        </div>
      </MasterPage>
    </div>
  )
}
