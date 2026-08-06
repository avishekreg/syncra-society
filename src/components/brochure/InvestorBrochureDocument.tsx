import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import {
  Shield,
  Baby,
  Truck,
  Users,
  Vote,
  BookOpen,
  MessageSquare,
  Landmark,
  LineChart,
  AlertTriangle,
  Droplets,
  Car,
  Radio,
  Siren,
  ParkingSquare,
  Leaf,
  TreePine,
  Recycle,
  Ruler,
  Sofa,
  Building2,
  Smartphone,
  Wallet,
  Layers,
  Rocket,
  CheckCircle2,
  Home,
  KeyRound,
  FileText
} from 'lucide-react'
import SyncraBrandLogo from '../brand/SyncraBrandLogo'
import {
  MAI_PLATFORM_NAME,
  MAI_PRODUCTION_ORIGIN,
  SYNCRA_CONTACT_EMAIL,
  SYNCRA_LEGAL_ENTITY,
  SYNCRA_REGISTERED_JURISDICTION
} from '../../lib/brandConstants'
import {
  BrochurePage,
  BrochureEyebrow,
  BrochureTitle,
  BrochureLead,
  FeatureBlock,
  SimpleCard,
  FlowSteps,
  ComparisonTable,
  BrochureFooterMeta,
  BrochureProductPreview
} from './BrochurePrimitives'

const TOTAL_PAGES = 18

export default function InvestorBrochureDocument() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    void QRCode.toDataURL(MAI_PRODUCTION_ORIGIN, {
      width: 220,
      margin: 1,
      color: { dark: '#0052CC', light: '#FFFFFF' }
    }).then(setQrDataUrl)
  }, [])

  return (
    <div id="investor-brochure-root" className="brochure-document">
      {/* 1. Cover */}
      <BrochurePage tone="navy">
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <SyncraBrandLogo to="" variant="dark" size="lg" showSubtitle />
            <a href={MAI_PRODUCTION_ORIGIN} className="text-xs font-semibold text-cyan-100/90">
              maisociety.vercel.app
            </a>
          </div>

          <div className="mt-8 max-w-2xl">
            <BrochureEyebrow onDark>Product & Sales Brochure</BrochureEyebrow>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{MAI_PLATFORM_NAME}</h1>
            <p className="mt-3 text-base font-medium text-cyan-100 sm:text-lg">
              The smart software platform for apartment societies and housing communities
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-200/90">
              One place for residents, security guards, and committee members to run daily society life — billing,
              gate entry, complaints, elections, green spaces, home interiors advice, and flat rent or sale listings —
              without buying expensive gate machines or sensors.
            </p>
          </div>

          <div className="mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">
            {[
              'Works through phone apps and WhatsApp',
              'No special hardware required at the gate',
              'Each society gets its own private setup',
              'Pay only for the modules you need'
            ].map((item) => (
              <div key={item} className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-100">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 max-w-xl">
            <BrochureProductPreview />
          </div>

          <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/15 pt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-300">
            <span>
              {SYNCRA_LEGAL_ENTITY} · {SYNCRA_REGISTERED_JURISDICTION}
            </span>
            <span>
              1 / {TOTAL_PAGES}
            </span>
          </div>
        </div>
      </BrochurePage>

      {/* 2. Executive Summary */}
      <BrochurePage>
        <BrochureEyebrow>01 · Executive Summary</BrochureEyebrow>
        <BrochureTitle size="md">What mAI Society is — in plain words</BrochureTitle>
        <BrochureLead>
          Most apartment societies juggle many tools: a billing app, a WhatsApp group, paper visitor registers, Excel
          for accounts, and separate vendors for elections or parking. Information gets lost, money is hard to track,
          and residents feel ignored. mAI Society replaces that patchwork with one connected platform.
        </BrochureLead>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SimpleCard title="The problem">
            Society work is scattered across chats, notebooks, and old software. Gates are slow. Accounts are unclear.
            Committees struggle to prove decisions were fair. Buying sensors and kiosks makes costs worse without fixing
            the basics.
          </SimpleCard>
          <SimpleCard title="Our solution">
            A single society workspace for residents, guards, and office-bearers. People use a mobile/web app and
            WhatsApp. The platform handles bills, visitors, staff entry, complaints, elections, gardens, home setup help,
            and flat listings.
          </SimpleCard>
          <SimpleCard title="Our vision">
            Every housing community can run safer gates, cleaner finances, fairer elections, and greener campuses —
            using software that feels simple, private, and modern.
          </SimpleCard>
          <SimpleCard title="Our mission">
            Help Indian RWAs and society managers digitise operations without expensive gadgets, confusing jargon, or
            locked-in hardware contracts.
          </SimpleCard>
        </div>

        <div className="mt-4 rounded-xl border border-syncra-blue/20 bg-syncra-blue/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-syncra-blue">Value in one line</p>
          <p className="mt-1.5 text-sm font-semibold text-syncra-primary">
            Start with core society ops. Add smart modules when ready. No hardware purchase required.
          </p>
        </div>
        <BrochureFooterMeta page={2} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 3. Industry Problem */}
      <BrochurePage tone="surface">
        <BrochureEyebrow>02 · Industry Problem</BrochureEyebrow>
        <BrochureTitle size="md">Why society management still feels broken</BrochureTitle>
        <BrochureLead>
          Housing software often stops at “pay maintenance” and “post a notice.” Real daily life — maids at the gate,
          Amazon deliveries, noisy disputes, unclear expenses, and empty parks — stays manual.
        </BrochureLead>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            {
              t: 'Costly gadgets',
              d: 'Many products push cameras, sensors, or kiosks. Societies pay for devices, AMC, and downtime — before they get good process.'
            },
            {
              t: 'Weak day-to-day control',
              d: 'Visitor books get forged or lost. Staff entry is verbal. Parents do not know when a child left the gate.'
            },
            {
              t: 'Money that is hard to trust',
              d: 'Expenses sit in spreadsheets. Unusual bills are spotted late. Residents ask “where did the money go?”'
            },
            {
              t: 'Governance by chat group',
              d: 'Elections, bylaws, and decisions live in WhatsApp forwards. That is not fair, searchable, or auditable.'
            },
            {
              t: 'No help for living spaces',
              d: 'Societies manage gardens and homes on paper — or not at all. Compost, trees, and interiors stay outside the app.'
            },
            {
              t: 'Tools that do not talk',
              d: 'Gate, billing, complaints, and listings sit in different systems. Staff re-type the same flat number everywhere.'
            }
          ].map((item) => (
            <SimpleCard key={item.t} title={item.t}>
              {item.d}
            </SimpleCard>
          ))}
        </div>
        <BrochureFooterMeta page={3} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 4. Legacy vs mAI */}
      <BrochurePage>
        <BrochureEyebrow>03 · Why older tools struggle to catch up</BrochureEyebrow>
        <BrochureTitle size="md">Not a feature race — a different foundation</BrochureTitle>
        <BrochureLead>
          Traditional gatekeeper apps were built mainly to collect dues. New needs (smart gates, WhatsApp help, plant
          care, flat resale) get bolted on later. mAI Society was designed as a full community operating system from day
          one.
        </BrochureLead>
        <ComparisonTable
          headers={['Topic', 'Legacy Society Apps', 'mAI Society']}
          rows={[
            ['Hardware', 'Often needs devices at the gate', 'Phone + WhatsApp first — no gadgets required'],
            ['Focus', 'Mostly billing and notices', 'Gate, money, elections, green, home, listings'],
            ['Buying model', 'One big package', 'Core plan + optional modules per society'],
            ['Resident channel', 'App only, or SMS', 'App plus WhatsApp for everyday questions'],
            ['Trust', 'Manual letters and files', 'Clear records, dues status, and fair digital voting'],
            ['Growth', 'Hard upgrades', 'Turn modules on when the society is ready']
          ]}
        />
        <BrochureFooterMeta page={4} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 5. AI Operating System */}
      <BrochurePage tone="surface">
        <BrochureEyebrow>04 · How the platform fits together</BrochureEyebrow>
        <BrochureTitle size="md">Everyone works in the same society picture</BrochureTitle>
        <BrochureLead>
          Think of mAI Society as the shared “control room” for your community. Different people see what they need —
          but the information stays consistent.
        </BrochureLead>
        <div className="mt-5 grid gap-3">
          <SimpleCard title="Resident app">
            Flat owners and tenants pay dues, approve visitors, raise complaints, book amenities, join carpools, check
            gardens, get room-setup advice, and list a flat for rent or sale.
          </SimpleCard>
          <SimpleCard title="Guard / gate app">
            Security staff see approved visitors, staff QR passes, delivery clearances, kid exit rules, and emergency
            alerts — so the gate moves faster without calling every flat.
          </SimpleCard>
          <SimpleCard title="Admin / committee portal">
            Secretary and president publish notices, track complaints, verify tenants, review money health, manage
            amenities, and turn licensed modules on for the society.
          </SimpleCard>
          <SimpleCard title="WhatsApp assistant">
            Residents ask common questions (“What is my due?”, “What is the pet rule?”) in WhatsApp. The assistant
            answers from society data and the rulebook — without waking the office at night.
          </SimpleCard>
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-syncra-blue">Behind the scenes</p>
          <p className="mt-1.5 text-sm text-slate-600">
            Smart helpers watch patterns (money leaks, plant stress, room sizing), send alerts, and keep activity
            history. Everything stays private to each society’s own workspace.
          </p>
        </div>
        <BrochureFooterMeta page={5} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 6. Security */}
      <BrochurePage>
        <BrochureEyebrow>05 · Security & Gate</BrochureEyebrow>
        <BrochureTitle size="md">Safer entry without buying gate machines</BrochureTitle>
        <BrochureLead>
          Guards get clear instructions on their phone. Residents approve people in advance. The society keeps a clean
          record of who came, for which flat, and when they left.
        </BrochureLead>
        <div className="mt-4 grid gap-2.5">
          <FeatureBlock
            icon={<Truck className="h-4 w-4" />}
            title="Delivery pre-approval"
            howItWorks="A resident marks that Swiggy, Zomato, Amazon, India Post, or a local courier is expected. The guard sees a green clearance and lets the person in without calling the flat."
            benefit="Fewer interrupted evenings and faster gate queues."
          />
          <FeatureBlock
            icon={<Shield className="h-4 w-4" />}
            title="Visitor & staff QR passes"
            howItWorks="Guests are approved digitally. Daily help (maid, driver, cleaner) get a QR pass that only works in allowed time windows. Exit can be logged so the visit is closed properly."
            benefit="No more open-ended verbal ‘she always comes’ entries."
          />
          <FeatureBlock
            icon={<Baby className="h-4 w-4" />}
            title="Kid safety at the gate"
            howItWorks="Parents set when a child may leave. If a minor tries to exit without approval, the guard gets a strong alert and parents are notified."
            benefit="Extra protection without installing special child-tracking hardware."
          />
          <FeatureBlock
            icon={<FileText className="h-4 w-4" />}
            title="Tenant onboarding"
            howItWorks="Owners upload the lease. The committee reviews and digitally signs off. The tenant gets access and the society keeps police-ready records."
            benefit="Cleaner tenant paperwork and fewer disputes about who lives where."
          />
          <FeatureBlock
            icon={<Siren className="h-4 w-4" />}
            title="Emergency SOS"
            howItWorks="A resident taps SOS for medical or security help. Guards and nearby volunteers see the flat location and can call back instantly."
            benefit="Faster response when every minute matters."
          />
        </div>
        <BrochureFooterMeta page={6} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 7. Governance */}
      <BrochurePage tone="surface">
        <BrochureEyebrow>06 · Governance</BrochureEyebrow>
        <BrochureTitle size="md">Fair decisions residents can trust</BrochureTitle>
        <BrochureLead>
          Good societies need clear rules, clean elections, and answers that do not depend on one person’s memory.
        </BrochureLead>
        <div className="mt-4 grid gap-2.5">
          <FeatureBlock
            icon={<Vote className="h-4 w-4" />}
            title="Digital elections"
            howItWorks="Each flat gets one vote. Ballots stay private. Turnout can be shown without revealing who voted for whom. Results publish when voting ends."
            benefit="Less booth drama, more confidence in the outcome."
          />
          <FeatureBlock
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Committee recall votes"
            howItWorks="If residents lose confidence in an office-bearer, they can start a formal recall motion. Votes are counted securely, flat by flat."
            benefit="Accountability without chaotic WhatsApp campaigns."
          />
          <FeatureBlock
            icon={<BookOpen className="h-4 w-4" />}
            title="Digital rulebook"
            howItWorks="Society bylaws and house rules live in the platform. Residents search them in the app or ask on WhatsApp."
            benefit="Fewer arguments about ‘what the rule actually says’."
          />
          <FeatureBlock
            icon={<MessageSquare className="h-4 w-4" />}
            title="WhatsApp help for common questions"
            howItWorks="Residents message the society WhatsApp line for dues, notices, and rule lookups. Routine answers go out automatically; hard cases go to humans."
            benefit="The secretary sleeps. Residents still get quick replies."
          />
        </div>
        <BrochureFooterMeta page={7} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 8. Finance */}
      <BrochurePage>
        <BrochureEyebrow>07 · Money & Accounts</BrochureEyebrow>
        <BrochureTitle size="md">See problems before the yearly audit panic</BrochureTitle>
        <BrochureLead>
          Residents want transparency. Committees want early warnings. mAI Society watches payment patterns and unusual
          expenses, then explains them in simple language.
        </BrochureLead>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <FeatureBlock
            icon={<LineChart className="h-4 w-4" />}
            title="Society health score"
            howItWorks="Collections, complaint speed, and utility payment habits combine into an easy 0–100 health view."
            benefit="Committees spot trouble early, not after AGM fights."
          />
          <FeatureBlock
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Unusual expense alerts"
            howItWorks="The system flags odd spikes in water, electricity, vendor invoices, or repairs and suggests what to check."
            benefit="Leakage and mistakes surface while they are still small."
          />
          <FeatureBlock
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="Vendor service scores"
            howItWorks="Residents rate housekeeping or security daily. Scores roll into a monthly performance view for the committee."
            benefit="Renewals are based on evidence, not vibes."
          />
          <FeatureBlock
            icon={<Droplets className="h-4 w-4" />}
            title="Utility pattern insights"
            howItWorks="Water and power trends are summarised so managers can ask better questions of operators and tanks."
            benefit="Less guessing when bills jump."
          />
          <FeatureBlock
            icon={<Wallet className="h-4 w-4" />}
            title="Clear flat billing"
            howItWorks="Each flat sees dues, receipts, and history. Pricing can follow society size tiers."
            benefit="Fewer ‘I already paid’ arguments."
          />
          <FeatureBlock
            icon={<Landmark className="h-4 w-4" />}
            title="Audit-ready history"
            howItWorks="Important money and approval actions leave a trail the committee can export and review."
            benefit="Auditors and residents get the same story."
          />
        </div>
        <BrochureFooterMeta page={8} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 9. Community */}
      <BrochurePage tone="surface">
        <BrochureEyebrow>08 · Community Life</BrochureEyebrow>
        <BrochureTitle size="md">Help neighbours help each other</BrochureTitle>
        <div className="mt-4 grid gap-2.5">
          <FeatureBlock
            icon={<Car className="h-4 w-4" />}
            title="In-society carpool"
            howItWorks="Residents post spare seats to offices or schools. Only verified flats in the same society can request a ride."
            benefit="Cheaper commute and fewer stranger risks — with no commission cut."
          />
          <FeatureBlock
            icon={<Radio className="h-4 w-4" />}
            title="Find lost phones, keys, or vehicles"
            howItWorks="A resident marks an item lost. Nearby neighbour phones in the society can report a last-seen hint on a simple map."
            benefit="Community help without buying trackers for every object."
          />
          <FeatureBlock
            icon={<ParkingSquare className="h-4 w-4" />}
            title="Smart visitor parking"
            howItWorks="When a flat is out of station, their bay can temporarily become a visitor slot — managed in software, not sensors."
            benefit="Less parking chaos on festival days."
          />
          <FeatureBlock
            icon={<Users className="h-4 w-4" />}
            title="Amenities & neighbour exchange"
            howItWorks="Book clubhouse or courts with conflict checks. Sell or share items inside the society marketplace."
            benefit="Facilities stay fair; clutter stays local."
          />
          <FeatureBlock
            icon={<Shield className="h-4 w-4" />}
            title="Family & vehicle alerts"
            howItWorks="Parents or carers can get alerts if a child/senior leaves a safe zone pattern, or if a parked vehicle moves unexpectedly."
            benefit="Peace of mind using the phones people already carry."
          />
        </div>
        <BrochureFooterMeta page={9} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 10. Green */}
      <BrochurePage>
        <BrochureEyebrow>09 · Green Society</BrochureEyebrow>
        <BrochureTitle size="md">Gardens you can actually manage</BrochureTitle>
        <BrochureLead>
          Landscape teams often work from memory. Residents never see impact. mAI Botanist turns trees and compost into
          simple digital records.
        </BrochureLead>
        <div className="mt-4 grid gap-2.5">
          <FeatureBlock
            icon={<Leaf className="h-4 w-4" />}
            title="Plant health helper"
            howItWorks="Upload a plant photo or describe yellow leaves / pests. The helper suggests care steps and can create a gardener task."
            benefit="Sick plants get attention before they die."
          />
          <FeatureBlock
            icon={<TreePine className="h-4 w-4" />}
            title="QR-tagged trees"
            howItWorks="Each important tree gets a code. Scan it to see species, location, health, and estimated environmental benefit."
            benefit="Residents connect with the campus they walk through every day."
          />
          <FeatureBlock
            icon={<Home className="h-4 w-4" />}
            title="Adopt a tree"
            howItWorks="A flat sponsors a society tree. The adoption shows on the plant record."
            benefit="Shared pride and easier fundraising for landscaping."
          />
          <FeatureBlock
            icon={<Recycle className="h-4 w-4" />}
            title="Compost to your door"
            howItWorks="The society publishes compost batches. Residents order kilos for balcony gardens. Admins mark delivery done."
            benefit="Organic waste becomes a resident benefit, not a smell complaint."
          />
          <FeatureBlock
            icon={<Users className="h-4 w-4" />}
            title="Plant swap"
            howItWorks="Neighbours list cuttings, pots, or seeds. Another flat claims them inside the society."
            benefit="Greener balconies without nursery markups."
          />
        </div>
        <BrochureFooterMeta page={10} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 11. mAI Space */}
      <BrochurePage tone="surface">
        <BrochureEyebrow>10 · mAI Space (Home Setup Helper)</BrochureEyebrow>
        <BrochureTitle size="md">Buy the right TV and sofa the first time</BrochureTitle>
        <BrochureLead>
          Wrong screen size and cramped sofas waste money. mAI Space gives practical room advice before the shopping
          trip — then connects residents to trusted local designers if they want help.
        </BrochureLead>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-syncra-blue">Simple TV size rule</p>
          <p className="mt-1.5 text-sm text-slate-700">
            Measure how far you sit from the wall (in feet). The helper converts that into a recommended TV size such as
            43&quot;, 55&quot;, or 65&quot; — the sizes stores actually sell.
          </p>
        </div>
        <div className="mt-3 grid gap-2.5">
          <FeatureBlock
            icon={<Ruler className="h-4 w-4" />}
            title="Screen & sound advice"
            howItWorks="Enter room type and viewing distance (optionally upload a photo). Get TV size plus whether a soundbar is enough or surround speakers will block walkways."
            benefit="Clearer movies without overwhelming a small living room."
          />
          <FeatureBlock
            icon={<Sofa className="h-4 w-4" />}
            title="Sofa & walkway planning"
            howItWorks="Guidance prefers L-shaped or 3-seater layouts and reminds you to leave walking space to the balcony or kitchen."
            benefit="Furniture that fits the flat, not just the showroom."
          />
          <FeatureBlock
            icon={<Building2 className="h-4 w-4" />}
            title="Lighting mood tips"
            howItWorks="Suggests warmer evening light behind the TV and softer bedroom lighting to reduce glare."
            benefit="Comfortable rooms without hiring a designer on day one."
          />
          <FeatureBlock
            icon={<Users className="h-4 w-4" />}
            title="Trusted interior partners"
            howItWorks="Residents send a one-tap request to society-approved interior, carpentry, electronics, or lighting partners with budget range and notes."
            benefit="Help arrives from known vendors — not random marketplace spam."
          />
        </div>
        <BrochureFooterMeta page={11} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 12. maiList */}
      <BrochurePage>
        <BrochureEyebrow>11 · maiList (Rent & Resale)</BrochureEyebrow>
        <BrochureTitle size="md">List once. Reach renters and buyers faster.</BrochureTitle>
        <BrochureLead>
          Owners usually re-type the same flat details on many property websites and still pay brokerage. maiList lets
          a resident choose Rent or Sell, fill details once, and publish across major portals plus the society’s own
          board.
        </BrochureLead>
        <FlowSteps
          steps={[
            'Open My Flat → choose “Rent out” or “Sell”.',
            'Add rent or expected sale price, parking, area, and documents if selling.',
            'For sale, the listing can show a Verified Society badge when dues are clear and NOC status is recorded.',
            'One-click publish prepares the listing for major property portals and leading zero-brokerage rent/resale networks.',
            'An alert can go to interested buyers and verified resident networks inside the society.',
            'Buyers/renters browse the marketplace, estimate loan EMI for sale flats, and contact the owner directly — zero brokerage inside the society board.'
          ]}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SimpleCard title="For rent">
            Monthly rent, deposit, furnishing, and move-in date — shared to rental portal formats.
          </SimpleCard>
          <SimpleCard title="For sale">
            Total price, price per sq.ft (auto from carpet/super area), ownership type, negotiable flag, and title upload.
          </SimpleCard>
        </div>
        <BrochureFooterMeta page={12} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 13. Technology */}
      <BrochurePage tone="surface">
        <BrochureEyebrow>12 · Technology (simple view)</BrochureEyebrow>
        <BrochureTitle size="md">Built like modern enterprise software — explained simply</BrochureTitle>
        <BrochureLead>
          You do not need to know our internal tools. Here is what matters when a society evaluates mAI Society.
        </BrochureLead>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {[
            {
              icon: <Smartphone className="h-4 w-4" />,
              t: 'Apps people already understand',
              d: 'Web and mobile experiences for residents, guards, and admins — plus WhatsApp for quick questions.'
            },
            {
              icon: <Shield className="h-4 w-4" />,
              t: 'Private per society',
              d: 'Each society’s data stays in its own secure workspace. People only see what their role allows.'
            },
            {
              icon: <KeyRound className="h-4 w-4" />,
              t: 'Secure sign-in',
              d: 'Accounts, roles (resident, guard, secretary, president), and optional module licenses.'
            },
            {
              icon: <MessageSquare className="h-4 w-4" />,
              t: 'Alerts that reach people',
              d: 'In-app alerts, push notifications, and WhatsApp messages for the moments that matter.'
            },
            {
              icon: <LineChart className="h-4 w-4" />,
              t: 'Smart helpers',
              d: 'Money anomaly checks, plant advice, room sizing, and mediation drafts — written for humans, not engineers.'
            },
            {
              icon: <Layers className="h-4 w-4" />,
              t: 'Modular growth',
              d: 'Turn on elections, WhatsApp bot, green tools, interiors, or listings when the society wants them.'
            }
          ].map((item) => (
            <FeatureBlock key={item.t} icon={item.icon} title={item.t} howItWorks={item.d} benefit="Reliable operations without training residents on technical jargon." />
          ))}
        </div>
        <BrochureFooterMeta page={13} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 14. Revenue */}
      <BrochurePage>
        <BrochureEyebrow>13 · Pricing model for societies</BrochureEyebrow>
        <BrochureTitle size="md">Clear packages your committee can approve</BrochureTitle>
        <FlowSteps
          steps={[
            'Platform subscription: one-time activation plus monthly per-flat fees based on society size.',
            'Optional modules: WhatsApp assistant, elections, auditor, green, interiors, maiList, and more — add only what you need.',
            'Partner services over time: interior consultant connections and property listing distribution when you use those modules.',
            'Future options: society-friendly financial and insurance add-ons once the community already trusts the platform.'
          ]}
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ['Core plan', 'Essential society ops'],
            ['Add-on modules', 'Pay as you grow'],
            ['Partner network', 'Optional extra value']
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-syncra-blue">{k}</p>
              <p className="mt-2 text-sm font-semibold text-syncra-primary">{v}</p>
            </div>
          ))}
        </div>
        <BrochureFooterMeta page={14} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 15. Competitive */}
      <BrochurePage tone="surface">
        <BrochureEyebrow>14 · Competitive Edge vs Legacy Platforms</BrochureEyebrow>
        <BrochureTitle size="md">How we compare when you are buying</BrochureTitle>
        <BrochureLead>
          Other market platforms are often excellent at one job (billing or visitors). When a society shortlists
          software, mAI Society wins on breadth with clarity: one society picture, optional modules, and no forced
          hardware.
        </BrochureLead>
        <ComparisonTable
          headers={['Question', 'Traditional Gatekeeper Apps', 'mAI Society']}
          rows={[
            ['Can one system cover gate + money + elections?', 'Usually no', 'Yes, in one workspace'],
            ['Do we need gadgets to start?', 'Often yes', 'No — phones are enough'],
            ['Can we add advanced help later?', 'Hard upgrades', 'Switch modules on per society'],
            ['Do residents get WhatsApp answers?', 'Rare / bolt-on', 'Built as a first-class channel'],
            ['Is trust visible (votes, dues, badges)?', 'Mostly paperwork', 'Designed into the product']
          ]}
        />
        <BrochureFooterMeta page={15} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 16. Scalability */}
      <BrochurePage>
        <BrochureEyebrow>15 · Where we grow</BrochureEyebrow>
        <BrochureTitle size="md">From one society to many community types</BrochureTitle>
        <BrochureLead>
          The same product model — private society workspace, role-based apps, modular licenses — extends beyond a
          single apartment complex.
        </BrochureLead>
        <FlowSteps
          steps={[
            'Housing societies (today’s core)',
            'Large townships and multi-tower portfolios',
            'Builder-managed communities during handover',
            'HOA-style associations',
            'Corporate residential campuses',
            'Retirement communities',
            'Government housing programs over time'
          ]}
        />
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-syncra-blue/20 bg-syncra-blue/5 p-4">
          <Rocket className="mt-0.5 h-5 w-5 shrink-0 text-syncra-blue" />
          <p className="text-sm text-slate-700">
            Expansion does not mean rebuilding the product. It means onboarding a new community onto the same proven
            operating model.
          </p>
        </div>
        <BrochureFooterMeta page={16} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 17. Why we win */}
      <BrochurePage tone="surface">
        <BrochureEyebrow>16 · Why mAI Society wins</BrochureEyebrow>
        <BrochureTitle size="md">Six promises we keep repeating — because they matter</BrochureTitle>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ['No forced hardware', 'Start with phones and process. Add devices later only if you want.'],
            ['Intelligence that helps humans', 'Alerts and suggestions are written for secretaries and residents, not engineers.'],
            ['Transparent by default', 'Votes, dues, and approvals leave a clear trail.'],
            ['Modular buying', 'Pay for elections, WhatsApp, green, interiors, or listings only when needed.'],
            ['Ready to scale', 'One society or a portfolio — same structure.'],
            ['Future ready', 'Property exchange, green ops, and home services sit on the same trust layer.']
          ].map(([t, d]) => (
            <SimpleCard key={t} title={t}>
              {d}
            </SimpleCard>
          ))}
        </div>
        <BrochureFooterMeta page={17} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 18. Contact */}
      <BrochurePage tone="navy">
        <div className="flex h-full flex-col">
          <SyncraBrandLogo to="" variant="dark" size="lg" showSubtitle />
          <div className="mt-10 max-w-xl">
            <BrochureEyebrow onDark>Contact sales</BrochureEyebrow>
            <BrochureTitle onDark size="xl">
              Ready to modernise your society operations?
            </BrochureTitle>
            <BrochureLead onDark>
              Talk to the mAI Society sales team — {SYNCRA_LEGAL_ENTITY} · {SYNCRA_REGISTERED_JURISDICTION}
            </BrochureLead>
            <div className="mt-8 space-y-4 text-sm">
              <p>
                <span className="text-cyan-200/80">Website</span>
                <br />
                <a href={MAI_PRODUCTION_ORIGIN} className="font-semibold text-white">
                  {MAI_PRODUCTION_ORIGIN.replace(/^https:\/\//, '')}
                </a>
              </p>
              <p>
                <span className="text-cyan-200/80">Email</span>
                <br />
                <a href={`mailto:${SYNCRA_CONTACT_EMAIL}`} className="font-semibold text-white">
                  {SYNCRA_CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-6 pt-8">
            <div className="rounded-xl bg-white p-3">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR code to mAI Society website" className="h-32 w-32" />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center text-xs text-slate-400">QR</div>
              )}
              <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wider text-syncra-blue">
                Open website
              </p>
            </div>
            <div className="text-right text-[10px] font-medium uppercase tracking-[0.14em] text-slate-300">
              <p>{MAI_PLATFORM_NAME}</p>
              <p className="mt-1">
                {TOTAL_PAGES} / {TOTAL_PAGES}
              </p>
            </div>
          </div>
        </div>
      </BrochurePage>
    </div>
  )
}
