import React from 'react'
import { ui } from '../../lib/ui'

/** Single A4 brochure sheet — keeps content from splitting across printed pages. */
export function BrochurePage({
  children,
  className = '',
  tone = 'plain'
}: {
  children: React.ReactNode
  className?: string
  tone?: 'plain' | 'mist' | 'navy' | 'surface'
}) {
  const tones = {
    plain: 'bg-white',
    mist: 'bg-white',
    navy: 'bg-syncra-primary text-white',
    surface: 'bg-syncra-surface-alt'
  } as const

  return (
    <article className={`brochure-page relative ${tones[tone]} ${className}`} data-brochure-page>
      <div className="brochure-page-inner relative z-[1] flex h-full flex-col">{children}</div>
    </article>
  )
}

export function BrochureEyebrow({ children, onDark }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <p className={onDark ? 'text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200/90' : ui.eyebrow}>
      {children}
    </p>
  )
}

export function BrochureTitle({
  children,
  onDark,
  size = 'lg'
}: {
  children: React.ReactNode
  onDark?: boolean
  size?: 'md' | 'lg' | 'xl'
}) {
  const sizes = {
    md: 'text-2xl leading-snug sm:text-[1.75rem]',
    lg: 'text-[1.75rem] leading-snug sm:text-3xl',
    xl: 'text-3xl leading-tight sm:text-4xl'
  }
  return (
    <h2 className={`mt-2 font-semibold tracking-tight ${sizes[size]} ${onDark ? 'text-white' : 'text-syncra-primary'}`}>
      {children}
    </h2>
  )
}

export function BrochureLead({ children, onDark }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <p className={`mt-3 max-w-3xl text-[13px] leading-relaxed sm:text-sm ${onDark ? 'text-slate-200/90' : 'text-slate-600'}`}>
      {children}
    </p>
  )
}

export function FeatureBlock({
  icon,
  title,
  howItWorks,
  benefit
}: {
  icon: React.ReactNode
  title: string
  howItWorks: string
  benefit: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-syncra-blue/10 text-syncra-blue">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-syncra-primary">{title}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">How it works: </span>
            {howItWorks}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            <span className="font-semibold text-syncra-blue">Why it helps: </span>
            {benefit}
          </p>
        </div>
      </div>
    </div>
  )
}

export function SimpleCard({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-syncra-blue">{title}</p>
      <div className="mt-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  )
}

export function FlowSteps({ steps, onDark }: { steps: string[]; onDark?: boolean }) {
  return (
    <ol className="mt-5 space-y-3">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-3">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
              onDark ? 'bg-white/15 text-cyan-100' : 'bg-syncra-blue text-white'
            }`}
          >
            {index + 1}
          </span>
          <p className={`pt-1 text-sm leading-relaxed ${onDark ? 'text-slate-100' : 'text-slate-700'}`}>{step}</p>
        </li>
      ))}
    </ol>
  )
}

export function ComparisonTable({
  headers,
  rows
}: {
  headers: [string, string, string]
  rows: Array<[string, string, string]>
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-left text-[12px] sm:text-sm">
        <thead>
          <tr className="bg-syncra-primary text-white">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row[0]} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <td className="px-3 py-2.5 font-medium text-syncra-primary">{row[0]}</td>
              <td className="px-3 py-2.5 text-slate-600">{row[1]}</td>
              <td className="px-3 py-2.5 text-syncra-blue">{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function BrochureFooterMeta({ page, total, onDark }: { page: number; total: number; onDark?: boolean }) {
  return (
    <div
      className={`mt-auto flex items-center justify-between border-t pt-3 text-[10px] font-medium uppercase tracking-[0.14em] ${
        onDark ? 'border-white/20 text-slate-300' : 'border-slate-200 text-slate-400'
      }`}
    >
      <span>mAI Society · Product Brochure</span>
      <span>
        {page} / {total}
      </span>
    </div>
  )
}

/** Clean product preview — no blur orbs or floating glow overlays. */
export function BrochureProductPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="ml-2 truncate text-[10px] font-medium text-slate-500">maisociety.vercel.app</span>
      </div>
      <div className="grid grid-cols-[4.25rem_1fr]">
        <aside className="border-r border-slate-100 bg-slate-50/80 p-2">
          <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-md bg-syncra-blue text-[9px] font-bold text-white">
            m
          </div>
          {['Home', 'Bills', 'Gate', 'Help'].map((item, i) => (
            <div
              key={item}
              className={`mb-1 rounded-md px-1.5 py-1 text-[9px] font-medium ${
                i === 0 ? 'bg-syncra-blue/10 text-syncra-blue' : 'text-slate-500'
              }`}
            >
              {item}
            </div>
          ))}
        </aside>
        <div className="p-3">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-syncra-accent">Society dashboard</p>
          <p className="mt-0.5 text-sm font-semibold text-syncra-primary">Windsor Castle Society</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              ['Flats', '148'],
              ['Dues collected', '₹4.2L'],
              ['Open tickets', '3']
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-2">
                <p className="text-[8px] uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-syncra-primary">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-slate-100 px-2.5 py-2">
            <p className="text-[9px] font-semibold text-slate-500">Recent activity</p>
            <ul className="mt-1 space-y-1 text-[10px] text-slate-600">
              <li>Visitor approved for Flat B-402</li>
              <li>Maintenance notice sent on WhatsApp</li>
              <li>Plumbing complaint assigned</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
