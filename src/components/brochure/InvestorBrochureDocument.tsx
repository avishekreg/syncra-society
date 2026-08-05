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
  Cloud,
  Database,
  Smartphone,
  Cpu,
  Map,
  Wallet,
  Layers,
  Rocket,
  CheckCircle2
} from 'lucide-react'
import SyncraBrandLogo from '../brand/SyncraBrandLogo'
import HeroDashboardMockup from '../landing/HeroDashboardMockup'
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
  IconCard,
  FlowSteps,
  HorizontalFlow,
  ComparisonTable,
  PillList,
  StatGrid,
  BrochureFooterMeta
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
            <a
              href={MAI_PRODUCTION_ORIGIN}
              className="text-xs font-semibold text-cyan-100/90 underline-offset-2 hover:underline"
            >
              maisociety.vercel.app
            </a>
          </div>

          <div className="mt-10 max-w-3xl">
            <BrochureEyebrow onDark>Investor & Enterprise Brief</BrochureEyebrow>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-[3.25rem]">
              {MAI_PLATFORM_NAME}
            </h1>
            <p className="mt-4 text-lg font-medium text-cyan-100 sm:text-xl">
              The Autonomous AI Operating System for Residential Communities
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200/85 sm:text-base">
              Zero-hardware society intelligence — governance, security, finance, sustainability, and property
              syndication in one modular platform.
            </p>
            <PillList
              onDark
              items={['Per-society licensing', 'No IoT hardware', 'Encrypted by design', 'AI-native modules']}
            />
          </div>

          <div className="mt-8 flex-1">
            <div className="origin-top scale-[0.92] sm:scale-100">
              <HeroDashboardMockup />
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/15 pt-4 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-300/80">
            <span>{SYNCRA_LEGAL_ENTITY} · {SYNCRA_REGISTERED_JURISDICTION}</span>
            <span>
              1 / {TOTAL_PAGES}
            </span>
          </div>
        </div>
      </BrochurePage>

      {/* 2. Executive Summary */}
      <BrochurePage tone="mist">
        <BrochureEyebrow>01 · Executive Summary</BrochureEyebrow>
        <BrochureTitle>Clarity before scale.</BrochureTitle>
        <BrochureLead>
          Housing communities still run on fragmented apps, paper workflows, and expensive hardware. mAI Society
          replaces that stack with an AI operating system designed for Indian RWAs — modular, auditable, and
          hardware-free.
        </BrochureLead>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            {
              label: 'Problem',
              text: 'Opaque ledgers, weak gate ops, no AI, and vendor lock-in from sensor-heavy platforms.'
            },
            {
              label: 'Solution',
              text: 'One OS for residents, guards, and admins — WhatsApp AI, gatekeeper, finance, green, and resale.'
            },
            {
              label: 'Vision',
              text: 'Every society runs on autonomous intelligence: safer gates, clearer money, greener campuses.'
            },
            {
              label: 'Mission',
              text: 'Modularize India’s housing infrastructure with enterprise software that feels premium and private.'
            }
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-accent">{item.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-syncra-accent/30 bg-gradient-to-r from-syncra-accent/10 to-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-blue">Value proposition</p>
          <p className="mt-2 text-base font-semibold text-syncra-primary">
            Activate once. License per society. Stack AI modules without IoT CapEx.
          </p>
        </div>
        <BrochureFooterMeta page={2} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 3. Industry Problem */}
      <BrochurePage tone="surface">
        <BrochureEyebrow>02 · Industry Problem</BrochureEyebrow>
        <BrochureTitle size="md">Traditional society software is fragmented.</BrochureTitle>
        <BrochureLead>
          Most platforms optimize for notices and dues — not autonomous operations. Hardware vendors, opaque finance,
          and disconnected resident channels create cost and trust debt.
        </BrochureLead>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { t: 'Expensive hardware', d: 'Sensors, kiosks, and lock vendors inflate CapEx and SLA risk.' },
            { t: 'Poor governance', d: 'Paper elections, weak recall, and unread rulebooks.' },
            { t: 'Financial opacity', d: 'Spreadsheets hide leakage until audits fail.' },
            { t: 'Lack of AI', d: 'No predictive expense, plant, or spatial intelligence.' },
            { t: 'No sustainability', d: 'Landscape and compost stay offline and unmeasured.' },
            { t: 'No interoperability', d: 'Gate, chat, billing, and listings never share one graph.' }
          ].map((item) => (
            <div key={item.t} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="h-1 w-10 rounded-full bg-syncra-action" />
              <h3 className="mt-3 text-sm font-semibold text-syncra-primary">{item.t}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{item.d}</p>
            </div>
          ))}
        </div>
        <BrochureFooterMeta page={3} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 4. Why Legacy Cannot Evolve */}
      <BrochurePage>
        <BrochureEyebrow>03 · Platform Evolution</BrochureEyebrow>
        <BrochureTitle size="md">Why legacy platforms cannot evolve.</BrochureTitle>
        <BrochureLead>
          The gap is architectural — not marketing. Legacy stacks bolt features onto dues engines. mAI Society is built
          as an AI OS with per-society licensing and zero hardware dependency.
        </BrochureLead>
        <ComparisonTable
          headers={['Capability', 'Legacy platforms', 'mAI Society']}
          rows={[
            ['Hardware model', 'Sensors / kiosks common', 'Software-first, zero IoT required'],
            ['Intelligence layer', 'Rules & reports', 'AI modules across ops, finance, green, space'],
            ['Licensing', 'Site-wide bundles', 'Per-society modular activation'],
            ['Resident channel', 'App-only or SMS', 'App + WhatsApp AI + gate workflows'],
            ['Trust signals', 'Manual certificates', 'RWA badges, dues clearance, audit trails'],
            ['Extensibility', 'Monolith upgrades', 'Composable premium modules']
          ]}
        />
        <BrochureFooterMeta page={4} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 5. AI Operating System */}
      <BrochurePage tone="mist">
        <BrochureEyebrow>04 · AI Operating System</BrochureEyebrow>
        <BrochureTitle size="md">One ecosystem. Every role.</BrochureTitle>
        <BrochureLead>
          Residents, guards, and administrators share one society graph — extended by WhatsApp AI, cloud services, and
          an automation engine.
        </BrochureLead>
        <HorizontalFlow
          items={[
            'Resident App',
            'Guard App',
            'Admin Portal',
            'WhatsApp AI',
            'AI Services',
            'Cloud Platform',
            'Analytics',
            'Automation'
          ]}
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-accent">Experience layer</p>
            <FlowSteps steps={['Resident App', 'Guard App', 'Admin / President Console', 'WhatsApp AI Bot']} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-accent">Intelligence layer</p>
            <FlowSteps steps={['AI Services', 'Cloud Platform', 'Analytics', 'Automation Engine']} />
          </div>
        </div>
        <BrochureFooterMeta page={5} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 6. Security Intelligence */}
      <BrochurePage tone="surface">
        <BrochureEyebrow>05 · Security Intelligence</BrochureEyebrow>
        <BrochureTitle size="md">Gate operations without hardware locks.</BrochureTitle>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <IconCard icon={<Truck className="h-5 w-5" />} title="Universal Delivery" description="Pre-clear Swiggy, Zomato, Amazon, India Post, and local couriers in one tap." />
          <IconCard icon={<Shield className="h-5 w-5" />} title="QR Visitor & Staff Passes" description="Time-window staff QR passes and visitor approvals with exit trace." accent="blue" />
          <IconCard icon={<Baby className="h-5 w-5" />} title="Kid Safety" description="Parent pre-approvals and loud alerts for unaccompanied minor exits." accent="orange" />
          <IconCard icon={<Users className="h-5 w-5" />} title="Vendor Tracking" description="Daily service scoring rolls into vendor SLA compliance." />
          <IconCard icon={<Landmark className="h-5 w-5" />} title="Tenant Lifecycle" description="Lease upload, RWA digital sign-off, and police-ready tenant records." accent="blue" />
          <IconCard icon={<Siren className="h-5 w-5" />} title="Emergency SOS" description="1-tap medical & security dispatch to guards and volunteers." accent="orange" />
        </div>
        <BrochureFooterMeta page={6} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 7. Governance Intelligence */}
      <BrochurePage>
        <BrochureEyebrow>06 · Governance Intelligence</BrochureEyebrow>
        <BrochureTitle size="md">Transparent democracy for RWAs.</BrochureTitle>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <IconCard icon={<Vote className="h-5 w-5" />} title="Digital Elections" description="1-Flat-1-Vote secrecy, live turnout, scheduled result reveal." accent="blue" />
          <IconCard icon={<AlertTriangle className="h-5 w-5" />} title="Committee Recall" description="Cryptographic recall motions for committee accountability." accent="orange" />
          <IconCard icon={<BookOpen className="h-5 w-5" />} title="AI Rulebook" description="Society guidebook lookup via helpdesk and WhatsApp." />
          <IconCard icon={<MessageSquare className="h-5 w-5" />} title="WhatsApp Automation" description="24/7 resident queries for dues, notices, and bylaws." accent="blue" />
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-syncra-surface-alt/80 p-5">
          <p className="text-sm font-semibold text-syncra-primary">Transparent governance</p>
          <p className="mt-2 text-sm text-slate-600">
            Ballots stay anonymous. Ledgers stay auditable. Notices stay searchable. Committees stay accountable —
            without paper booths or private chat groups as the system of record.
          </p>
        </div>
        <BrochureFooterMeta page={7} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 8. Financial Intelligence */}
      <BrochurePage tone="mist">
        <BrochureEyebrow>07 · Financial Intelligence</BrochureEyebrow>
        <BrochureTitle size="md">See leakage before the audit.</BrochureTitle>
        <StatGrid
          items={[
            { label: 'Health index', value: '0–100', hint: 'Society Health Index' },
            { label: 'Anomaly classes', value: '4+', hint: 'Water · Power · Vendor · Repair' },
            { label: 'Ledger posture', value: 'Audit-ready', hint: 'Per-flat dues & receipts' }
          ]}
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <LineChart className="h-5 w-5" />, t: 'mAI Auditor', d: 'Predictive financial leakage & invoice anomaly scoring.' },
            { icon: <CheckCircle2 className="h-5 w-5" />, t: 'Vendor Verification', d: 'SLA ratings feed monthly compliance audits.' },
            { icon: <Cpu className="h-5 w-5" />, t: 'Expense Prediction', d: 'Forward-looking utility and repair signals.' },
            { icon: <AlertTriangle className="h-5 w-5" />, t: 'Leak & Fraud Detection', d: 'Variance alerts across categories.' },
            { icon: <Droplets className="h-5 w-5" />, t: 'Utility Analytics', d: 'Water & electricity pattern intelligence.' },
            { icon: <Wallet className="h-5 w-5" />, t: 'Collections Clarity', d: 'Tiered per-flat billing with activation fees.' }
          ].map((item) => (
            <IconCard key={item.t} icon={item.icon} title={item.t} description={item.d} />
          ))}
        </div>
        <BrochureFooterMeta page={8} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 9. Connected Community */}
      <BrochurePage tone="surface">
        <BrochureEyebrow>08 · Connected Community</BrochureEyebrow>
        <BrochureTitle size="md">Neighbors, not strangers.</BrochureTitle>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <IconCard icon={<Car className="h-5 w-5" />} title="maiCommute" description="Zero-commission in-society carpool with verified flats." accent="blue" />
          <IconCard icon={<Radio className="h-5 w-5" />} title="BLE Asset Mesh" description="Community mesh to locate lost phones, keys, and vehicles." />
          <IconCard icon={<Siren className="h-5 w-5" />} title="Emergency SOS" description="High-contrast dispatch with flat location for responders." accent="orange" />
          <IconCard icon={<ParkingSquare className="h-5 w-5" />} title="Smart Parking" description="Visitor bays from out-of-station status — zero IoT sensors." accent="blue" />
          <IconCard icon={<Users className="h-5 w-5" />} title="Neighbour Network" description="Marketplace, surveys, gallery, and shared amenities." />
          <IconCard icon={<Shield className="h-5 w-5" />} title="Guardian Mesh" description="Kid/senior geofence and unauthorized vehicle motion alerts." accent="orange" />
        </div>
        <BrochureFooterMeta page={9} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 10. Green Intelligence */}
      <BrochurePage>
        <BrochureEyebrow>09 · Green Intelligence</BrochureEyebrow>
        <BrochureTitle size="md">Landscape that reports itself.</BrochureTitle>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <IconCard icon={<Leaf className="h-5 w-5" />} title="mAI Botanist" description="AI plant doctor diagnostics and weather-aware task dispatch." accent="emerald" />
          <IconCard icon={<TreePine className="h-5 w-5" />} title="QR Trees" description="Tag botanical assets with carbon offset estimates." accent="emerald" />
          <IconCard icon={<Recycle className="h-5 w-5" />} title="Compost" description="Batch inventory and doorstep organic compost delivery." accent="emerald" />
          <IconCard icon={<Users className="h-5 w-5" />} title="Tree Adoption" description="Residents sponsor society trees by flat." accent="emerald" />
          <IconCard icon={<LineChart className="h-5 w-5" />} title="Carbon Impact" description="Species-aware offset metrics for campus greening." accent="emerald" />
          <IconCard icon={<Leaf className="h-5 w-5" />} title="Plant Swap" description="Hyperlocal cuttings, pots, seeds, and saplings exchange." accent="emerald" />
        </div>
        <BrochureFooterMeta page={10} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 11. mAI Space */}
      <BrochurePage tone="mist">
        <BrochureEyebrow>10 · mAI Space</BrochureEyebrow>
        <BrochureTitle size="md">Spatial & interior AI engine.</BrochureTitle>
        <BrochureLead>
          Residents upload a room photo, enter viewing distance, and receive TV sizing, sofa layout, acoustics, and
          walkway guidance — then connect with RWA-verified interior partners.
        </BrochureLead>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-accent">Room analysis formula</p>
          <p className="mt-2 font-mono text-sm text-syncra-primary">TV inches ≈ (viewing distance ft × 12) / 1.6</p>
          <p className="mt-1 text-xs text-slate-500">Snapped to retail sizes: 43&quot; · 55&quot; · 65&quot; · 75&quot;</p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <IconCard icon={<Ruler className="h-5 w-5" />} title="TV & sound sizing" description="Optimal display inches plus soundbar vs surround guidance." accent="blue" />
          <IconCard icon={<Sofa className="h-5 w-5" />} title="Furniture fit" description="L-shaped vs 3-seater with 30–36&quot; walkway rules." />
          <IconCard icon={<Building2 className="h-5 w-5" />} title="Lighting moods" description="Warm 2700–3000K layering for living rooms and bedrooms." accent="orange" />
          <IconCard icon={<Users className="h-5 w-5" />} title="Vendor matching" description="1-tap leads to decorators, woodcraft, electronics, lighting." accent="blue" />
        </div>
        <BrochureFooterMeta page={11} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 12. maiList */}
      <BrochurePage tone="surface">
        <BrochureEyebrow>11 · maiList</BrochureEyebrow>
        <BrochureTitle size="md">Residential property exchange.</BrochureTitle>
        <BrochureLead>
          One-click dual engine for rent and resale. Owners publish once; maiList syndicates across top portals and
          broadcasts to society investor networks — zero brokerage.
        </BrochureLead>
        <HorizontalFlow items={['List flat', 'Choose Rent / Sale', 'RWA badge', 'Syndicate', 'Broadcast', 'Inquiries']} />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <p className="text-sm font-semibold text-syncra-primary">Rent syndication</p>
            <PillList items={['MagicBricks Rent', '99acres Rent', 'Housing.com', 'NoBroker Rent']} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <p className="text-sm font-semibold text-syncra-primary">Resale syndication</p>
            <PillList items={['MagicBricks Resale', '99acres Resale', 'Housing.com', 'NoBroker Seller']} />
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
          <p className="text-sm font-semibold text-amber-900">Verified RWA Resale Certificate</p>
          <p className="mt-1 text-xs text-amber-800 sm:text-sm">
            Maintenance dues clearance · society security score · NOC status · zero brokerage marketplace
          </p>
        </div>
        <BrochureFooterMeta page={12} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 13. Technology */}
      <BrochurePage>
        <BrochureEyebrow>12 · Technology</BrochureEyebrow>
        <BrochureTitle size="md">Enterprise stack, society-scoped.</BrochureTitle>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <Smartphone className="h-5 w-5" />, t: 'Frontend', d: 'React · Vite · Tailwind · Capacitor Android shell' },
            { icon: <Cloud className="h-5 w-5" />, t: 'Backend / Cloud', d: 'Supabase · Next API routes · Vercel delivery' },
            { icon: <Database className="h-5 w-5" />, t: 'Database', d: 'Postgres with multi-tenant RLS per society' },
            { icon: <Shield className="h-5 w-5" />, t: 'Authentication', d: 'Supabase Auth · role scopes · feature licensing' },
            { icon: <Cpu className="h-5 w-5" />, t: 'AI Services', d: 'Auditor, botanist, space, mediation, recall engines' },
            { icon: <MessageSquare className="h-5 w-5" />, t: 'Notifications', d: 'Push · WhatsApp routing · in-app alerts' },
            { icon: <Radio className="h-5 w-5" />, t: 'BLE / Mesh', d: 'Asset finder & guardian presence signals' },
            { icon: <Map className="h-5 w-5" />, t: 'Maps & Ops', d: 'Gate zones, SOS location, society signal maps' },
            { icon: <LineChart className="h-5 w-5" />, t: 'Analytics', d: 'Health index, SLA, monetization lead boards' }
          ].map((item) => (
            <IconCard key={item.t} icon={item.icon} title={item.t} description={item.d} accent="blue" />
          ))}
        </div>
        <BrochureFooterMeta page={13} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 14. Revenue Model */}
      <BrochurePage tone="mist">
        <BrochureEyebrow>13 · Revenue Model</BrochureEyebrow>
        <BrochureTitle size="md">Recurring by design.</BrochureTitle>
        <FlowSteps
          steps={[
            'Platform subscription — activation + tiered per-flat rates',
            'AI / enterprise modules — WhatsApp, elections, auditor, green, space, maiList',
            'Marketplace & property — interior leads, rental/resale syndication monetization',
            'Future fintech & insurance — society-scoped financial products'
          ]}
        />
        <StatGrid
          items={[
            { label: 'Core', value: 'SaaS', hint: 'Per flat / month' },
            { label: 'Modules', value: 'Add-ons', hint: 'Licensed per society' },
            { label: 'Network', value: 'Leads', hint: 'Property · interior' }
          ]}
        />
        <BrochureFooterMeta page={14} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 15. Competitive Landscape */}
      <BrochurePage tone="surface">
        <BrochureEyebrow>14 · Competitive Landscape</BrochureEyebrow>
        <BrochureTitle size="md">Strengths that compound.</BrochureTitle>
        <BrochureLead>
          Category players excel at dues or visitors. mAI Society competes on OS breadth — AI modules, zero hardware,
          and trust-native governance — without naming rivals as the product story.
        </BrochureLead>
        <ComparisonTable
          headers={['Dimension', 'Typical category tool', 'mAI Society strength']}
          rows={[
            ['Scope', 'Billing or gate only', 'Full AI OS across ops → green → property'],
            ['Hardware', 'Often required', 'Explicitly zero-hardware'],
            ['AI depth', 'Chatbots / reports', 'Auditor, botanist, space, recall, mediation'],
            ['Licensing', 'Bundle pricing', 'Modular per-society activation'],
            ['Channels', 'App silo', 'App + guard + WhatsApp + syndication'],
            ['Trust', 'Manual paperwork', 'RWA badges, cryptographic votes, RLS']
          ]}
        />
        <BrochureFooterMeta page={15} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 16. Scalability */}
      <BrochurePage>
        <BrochureEyebrow>15 · Scalability</BrochureEyebrow>
        <BrochureTitle size="md">From one society to a housing nation.</BrochureTitle>
        <HorizontalFlow
          items={[
            'Housing Societies',
            'Townships',
            'Builders',
            'HOAs',
            'Corporate Campuses',
            'Retirement',
            'Gov Housing'
          ]}
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { phase: 'Now', text: 'Premium RWAs & mid-large societies on modular SaaS.' },
            { phase: 'Next', text: 'Builder townships and multi-society portfolios.' },
            { phase: 'Horizon', text: 'Campuses, retirement communities, government housing.' }
          ].map((item) => (
            <div key={item.phase} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-accent">{item.phase}</p>
              <p className="mt-2 text-sm text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-syncra-blue/20 bg-syncra-blue/5 p-4">
          <Rocket className="h-5 w-5 text-syncra-blue" />
          <p className="text-sm font-medium text-syncra-primary">
            Same schema. Same RLS. New society graph — expansion without re-architecture.
          </p>
        </div>
        <BrochureFooterMeta page={16} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 17. Why mAISociety Wins */}
      <BrochurePage tone="mist">
        <BrochureEyebrow>16 · Why mAI Society Wins</BrochureEyebrow>
        <BrochureTitle size="md">Six principles. One platform.</BrochureTitle>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { t: 'Zero Hardware', d: 'Software replaces sensor CapEx.' },
            { t: 'AI Native', d: 'Intelligence is a product layer, not a chatbot add-on.' },
            { t: 'Transparent', d: 'Votes, ledgers, and badges that residents can trust.' },
            { t: 'Modular', d: 'Activate only what each society needs.' },
            { t: 'Scalable', d: 'Multi-tenant by design — society to portfolio.' },
            { t: 'Future Ready', d: 'Property, green, space, and fintech adjacency.' }
          ].map((item) => (
            <div
              key={item.t}
              className="rounded-2xl border border-slate-200 border-t-4 border-t-syncra-blue bg-white p-5 shadow-card"
            >
              <Layers className="h-5 w-5 text-syncra-blue" />
              <h3 className="mt-3 text-base font-semibold text-syncra-primary">{item.t}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{item.d}</p>
            </div>
          ))}
        </div>
        <BrochureFooterMeta page={17} total={TOTAL_PAGES} />
      </BrochurePage>

      {/* 18. Contact */}
      <BrochurePage tone="navy">
        <div className="flex h-full flex-col">
          <SyncraBrandLogo to="" variant="dark" size="lg" showSubtitle />
          <div className="mt-12 max-w-xl">
            <BrochureEyebrow onDark>Contact</BrochureEyebrow>
            <BrochureTitle onDark size="xl">
              Build the society OS with us.
            </BrochureTitle>
            <BrochureLead onDark>
              {SYNCRA_LEGAL_ENTITY} · {SYNCRA_REGISTERED_JURISDICTION}
            </BrochureLead>
            <div className="mt-8 space-y-3 text-sm">
              <p>
                <span className="text-cyan-200/80">Website</span>
                <br />
                <a href={MAI_PRODUCTION_ORIGIN} className="font-semibold text-white underline-offset-2 hover:underline">
                  {MAI_PRODUCTION_ORIGIN.replace(/^https:\/\//, '')}
                </a>
              </p>
              <p>
                <span className="text-cyan-200/80">Email</span>
                <br />
                <a href={`mailto:${SYNCRA_CONTACT_EMAIL}`} className="font-semibold text-white underline-offset-2 hover:underline">
                  {SYNCRA_CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-6 pt-10">
            <div className="rounded-2xl bg-white p-3 shadow-card">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR code to mAI Society website" className="h-36 w-36" />
              ) : (
                <div className="flex h-36 w-36 items-center justify-center text-xs text-slate-400">QR</div>
              )}
              <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wider text-syncra-blue">
                Open platform
              </p>
            </div>
            <div className="text-right text-[10px] font-medium uppercase tracking-[0.16em] text-slate-300/80">
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
