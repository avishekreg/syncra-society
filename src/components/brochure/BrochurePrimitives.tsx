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
    mist: 'bg-gradient-to-br from-white via-white to-cyan-50/40',
    navy: 'bg-gradient-to-br from-syncra-primary via-[#143052] to-[#0B1F3A] text-white',
    surface: 'bg-gradient-to-b from-syncra-surface-alt to-white'
  } as const

  return (
    <article
      className={`brochure-page relative overflow-hidden ${tones[tone]} ${className}`}
      data-brochure-page
    >
      {tone !== 'navy' ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,180,216,0.07),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(0,82,204,0.05),transparent_40%)]"
        />
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(0,180,216,0.22),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(230,126,0,0.12),transparent_45%)]"
        />
      )}
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
    md: 'text-2xl leading-snug sm:text-3xl',
    lg: 'text-3xl leading-snug sm:text-4xl',
    xl: 'text-4xl leading-tight sm:text-5xl'
  }
  return (
    <h2
      className={`mt-3 font-semibold tracking-tight ${sizes[size]} ${
        onDark ? 'text-white' : 'text-syncra-primary'
      }`}
    >
      {children}
    </h2>
  )
}

export function BrochureLead({ children, onDark }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <p className={`mt-3 max-w-2xl text-sm leading-relaxed sm:text-base ${onDark ? 'text-slate-200/90' : ui.body}`}>
      {children}
    </p>
  )
}

export function IconCard({
  icon,
  title,
  description,
  accent = 'cyan'
}: {
  icon: React.ReactNode
  title: string
  description: string
  accent?: 'cyan' | 'blue' | 'orange' | 'emerald'
}) {
  const accents = {
    cyan: 'border-t-syncra-accent bg-white',
    blue: 'border-t-syncra-blue bg-white',
    orange: 'border-t-syncra-action bg-white',
    emerald: 'border-t-emerald-600 bg-white'
  }
  return (
    <div
      className={`flex h-full flex-col rounded-2xl border border-slate-200 border-t-4 p-4 shadow-card sm:p-5 ${accents[accent]}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-syncra-accent/10 text-syncra-blue">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-syncra-primary sm:text-base">{title}</h3>
      <p className={`mt-1.5 flex-1 text-xs leading-relaxed text-slate-600 sm:text-sm`}>{description}</p>
    </div>
  )
}

export function FlowSteps({ steps, onDark }: { steps: string[]; onDark?: boolean }) {
  return (
    <ol className="mt-6 flex flex-col gap-0">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-4">
          <div className="flex w-10 shrink-0 flex-col items-center">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
                onDark ? 'bg-white/15 text-cyan-100 ring-1 ring-white/20' : 'bg-syncra-blue text-white'
              }`}
            >
              {index + 1}
            </span>
            {index < steps.length - 1 ? (
              <span className={`mt-1 w-px flex-1 ${onDark ? 'bg-white/20' : 'bg-slate-200'}`} />
            ) : null}
          </div>
          <div className={`pb-5 pt-2 ${index === steps.length - 1 ? 'pb-0' : ''}`}>
            <p className={`text-sm font-semibold ${onDark ? 'text-white' : 'text-syncra-primary'}`}>{step}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function HorizontalFlow({ items }: { items: string[] }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      {items.map((item, index) => (
        <React.Fragment key={item}>
          <span className="rounded-xl border border-syncra-accent/30 bg-white/90 px-3 py-2 text-xs font-semibold text-syncra-primary shadow-sm sm:text-sm">
            {item}
          </span>
          {index < items.length - 1 ? (
            <span className="text-syncra-accent" aria-hidden="true">
              →
            </span>
          ) : null}
        </React.Fragment>
      ))}
    </div>
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
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 shadow-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-syncra-primary text-white">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row[0]} className={i % 2 === 0 ? 'bg-white' : 'bg-syncra-surface-alt/80'}>
              <td className="px-4 py-3 font-medium text-syncra-primary">{row[0]}</td>
              <td className="px-4 py-3 text-slate-600">{row[1]}</td>
              <td className="px-4 py-3 font-medium text-syncra-blue">{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PillList({ items, onDark }: { items: string[]; onDark?: boolean }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
            onDark
              ? 'border-white/20 bg-white/10 text-cyan-50'
              : 'border-slate-200 bg-syncra-surface-alt text-slate-700'
          }`}
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

export function StatGrid({
  items
}: {
  items: Array<{ label: string; value: string; hint?: string }>
}) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-syncra-accent">{item.label}</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-syncra-primary sm:text-2xl">{item.value}</p>
          {item.hint ? <p className="mt-1 text-xs text-slate-500">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  )
}

export function BrochureFooterMeta({ page, total }: { page: number; total: number }) {
  return (
    <div className="mt-auto flex items-center justify-between border-t border-slate-200/80 pt-4 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
      <span>mAI Society · Investor Brochure</span>
      <span>
        {page} / {total}
      </span>
    </div>
  )
}
