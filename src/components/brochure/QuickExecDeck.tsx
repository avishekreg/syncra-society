import React from 'react'
import { getExecDeckCopy, type BrochureLocale } from '../../lib/brochureI18n'
import { MAI_PRODUCTION_ORIGIN, SYNCRA_LEGAL_ENTITY } from '../../lib/brandConstants'

type Props = {
  locale?: BrochureLocale
}

const NAVY = '#0f172a'
const BLUE = '#2563eb'
const SLATE = '#f8fafc'
const EMERALD = '#10b981'

function ExecPageChrome({
  brand,
  page,
  total,
  pageLabel,
  children,
  variant = 'light'
}: {
  brand: string
  page: number
  total: number
  pageLabel: string
  children: React.ReactNode
  variant?: 'light' | 'dark'
}) {
  const dark = variant === 'dark'
  return (
    <article
      className={`brochure-page exec-deck-page relative overflow-hidden ${dark ? 'exec-deck-page--dark' : 'exec-deck-page--light'}`}
      data-brochure-page
      style={{ backgroundColor: dark ? NAVY : '#ffffff' }}
    >
      {/* Brand header banner */}
      <header
        className="exec-deck-banner flex items-center justify-between gap-3 px-5 py-2.5 sm:px-7"
        style={{
          background: dark
            ? 'linear-gradient(90deg, rgba(37,99,235,0.35), rgba(15,23,42,0.2))'
            : `linear-gradient(90deg, ${NAVY} 0%, ${BLUE} 100%)`
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-black tracking-tight text-white shadow-lg"
            style={{
              background: `radial-gradient(circle at 30% 30%, #60a5fa, ${BLUE} 55%, ${NAVY})`,
              boxShadow: '0 0 18px rgba(37,99,235,0.55)'
            }}
          >
            mAI
          </span>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white sm:text-[11px]">{brand}</p>
        </div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-100/90 sm:text-[10px]">
          Enterprise SaaS · RWA
        </p>
      </header>

      <div className="brochure-page-inner exec-deck-inner relative z-[1] flex flex-col">{children}</div>

      <footer
        className="exec-deck-footer mt-auto flex items-center justify-between border-t px-5 py-2.5 sm:px-7"
        style={{
          borderColor: dark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
          backgroundColor: dark ? 'rgba(15,23,42,0.85)' : SLATE
        }}
      >
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.14em] sm:text-[10px]"
          style={{ color: dark ? '#94a3b8' : '#64748b' }}
        >
          {brand}
        </span>
        <span
          className="text-[9px] font-bold uppercase tracking-[0.16em] sm:text-[10px]"
          style={{ color: dark ? '#cbd5e1' : NAVY }}
        >
          {pageLabel} {page} / {total}
        </span>
      </footer>
    </article>
  )
}

function SectionTag({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'emerald' | 'light' }) {
  const styles =
    tone === 'emerald'
      ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#047857' }
      : tone === 'light'
        ? { backgroundColor: 'rgba(255,255,255,0.12)', color: '#bfdbfe' }
        : { backgroundColor: 'rgba(37,99,235,0.1)', color: BLUE }
  return (
    <p
      className="inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em]"
      style={styles}
    >
      {children}
    </p>
  )
}

/** Trademark-safe 4-page Quick Exec Deck — full-bleed branded pitch. */
export default function QuickExecDeck({ locale = 'en' }: Props) {
  const copy = getExecDeckCopy(locale)
  const total = 4
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=8&data=${encodeURIComponent(MAI_PRODUCTION_ORIGIN)}`

  return (
    <div className="brochure-document exec-deck-document" data-brochure-deck="exec-4" lang={locale}>
      {/* ── PAGE 1: Cover & Executive Summary ── */}
      <ExecPageChrome brand={copy.brandBanner} page={1} total={total} pageLabel={copy.pageLabel} variant="dark">
        <div className="flex flex-1 flex-col">
          <div
            className="-mx-1 rounded-2xl px-4 py-6 sm:px-5 sm:py-7"
            style={{
              background: `linear-gradient(145deg, ${NAVY} 0%, #1e3a8a 42%, ${BLUE} 100%)`,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 20px 50px rgba(37,99,235,0.25)'
            }}
          >
            <SectionTag tone="light">{copy.cover.eyebrow}</SectionTag>
            <h1 className="mt-3 text-[1.65rem] font-black leading-[1.15] tracking-tight text-white sm:text-[2.05rem]">
              {copy.cover.title}
            </h1>
            <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-blue-100/95 sm:text-sm">{copy.cover.subtitle}</p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {copy.cover.valueProps.map((prop) => (
                <div
                  key={prop}
                  className="rounded-xl border border-white/15 bg-white/10 px-2.5 py-3 text-center backdrop-blur-sm"
                >
                  <p className="text-[10px] font-bold leading-snug text-white sm:text-[11px]">{prop}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mt-5 flex flex-1 flex-col rounded-2xl border p-4 sm:p-5"
            style={{ backgroundColor: SLATE, borderColor: '#e2e8f0' }}
          >
            <SectionTag tone="emerald">{copy.cover.summaryTag}</SectionTag>
            <h2 className="mt-2 text-lg font-bold leading-snug sm:text-xl" style={{ color: NAVY }}>
              {copy.cover.summaryTitle}
            </h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600 sm:text-[13px]">{copy.cover.summaryBody}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
              <span
                className="rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: EMERALD }}
              >
                Zero hardware
              </span>
              <span className="text-[11px] font-medium text-slate-500">{SYNCRA_LEGAL_ENTITY} · Kolkata HQ</span>
            </div>
          </div>
        </div>
      </ExecPageChrome>

      {/* ── PAGE 2: Competitive Edge Matrix ── */}
      <ExecPageChrome brand={copy.brandBanner} page={2} total={total} pageLabel={copy.pageLabel}>
        <SectionTag>{copy.matrix.eyebrow}</SectionTag>
        <h2 className="mt-2 text-[1.45rem] font-black leading-tight sm:text-[1.7rem]" style={{ color: NAVY }}>
          {copy.matrix.title}
        </h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600 sm:text-sm">{copy.matrix.lead}</p>

        <div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <table className="exec-matrix w-full border-collapse text-left">
            <thead>
              <tr style={{ backgroundColor: NAVY }}>
                {copy.matrix.headers.map((h, i) => (
                  <th
                    key={h}
                    className={`px-3 py-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white sm:px-3.5 sm:text-[10px] ${
                      i === 2 ? 'bg-blue-600' : ''
                    }`}
                    style={i === 2 ? { backgroundColor: BLUE } : undefined}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {copy.matrix.rows.map((row, idx) => (
                <tr
                  key={row[0]}
                  style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : SLATE }}
                  className="border-b border-slate-100"
                >
                  <td className="px-3 py-2.5 text-[11px] font-bold sm:px-3.5 sm:text-[12px]" style={{ color: NAVY }}>
                    {row[0]}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] leading-snug text-slate-600 sm:px-3.5 sm:text-[12px]">{row[1]}</td>
                  <td
                    className="px-3 py-2.5 text-[11px] font-semibold leading-snug sm:px-3.5 sm:text-[12px]"
                    style={{ color: BLUE, backgroundColor: 'rgba(37,99,235,0.06)' }}
                  >
                    {row[2]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ExecPageChrome>

      {/* ── PAGE 3: 6 Core AI Modules ── */}
      <ExecPageChrome brand={copy.brandBanner} page={3} total={total} pageLabel={copy.pageLabel}>
        <SectionTag>{copy.modules.eyebrow}</SectionTag>
        <h2 className="mt-2 text-[1.45rem] font-black leading-tight sm:text-[1.7rem]" style={{ color: NAVY }}>
          {copy.modules.title}
        </h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600 sm:text-sm">{copy.modules.lead}</p>

        <div className="mt-4 grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          {copy.modules.cards.map((card) => (
            <div
              key={card.title}
              className="flex flex-col rounded-2xl border border-slate-200 p-3.5 shadow-sm sm:p-4"
              style={{ backgroundColor: SLATE }}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: 'rgba(37,99,235,0.12)' }}
                >
                  {card.icon}
                </span>
                <h3 className="pt-1 text-[12.5px] font-bold leading-snug sm:text-[13px]" style={{ color: NAVY }}>
                  {card.title}
                </h3>
              </div>
              <ul className="mt-2.5 space-y-1.5 border-t border-slate-200/80 pt-2.5">
                {card.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-[11px] leading-snug text-slate-600 sm:text-[11.5px]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: EMERALD }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ExecPageChrome>

      {/* ── PAGE 4: Commercials, ROI & CTA ── */}
      <ExecPageChrome brand={copy.brandBanner} page={4} total={total} pageLabel={copy.pageLabel}>
        <SectionTag tone="emerald">{copy.close.eyebrow}</SectionTag>
        <h2 className="mt-2 text-[1.4rem] font-black leading-tight sm:text-[1.65rem]" style={{ color: NAVY }}>
          {copy.close.title}
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: BLUE }}>
              {copy.close.earnTitle}
            </h3>
            <div className="mt-2 space-y-2">
              {copy.close.earnItems.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="text-[12px] font-bold" style={{ color: NAVY }}>
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: BLUE }}>
              {copy.close.roadmapTitle}
            </h3>
            <ol className="mt-2 space-y-2">
              {copy.close.roadmap.map((step) => (
                <li
                  key={step.step}
                  className="flex gap-2.5 rounded-xl border border-slate-200 p-3"
                  style={{ backgroundColor: SLATE }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-black text-white"
                    style={{ backgroundColor: NAVY }}
                  >
                    {step.step}
                  </span>
                  <div>
                    <p className="text-[12px] font-bold" style={{ color: NAVY }}>
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div
          className="mt-4 rounded-2xl px-4 py-4 text-white sm:px-5"
          style={{
            background: `linear-gradient(120deg, ${NAVY} 0%, ${BLUE} 100%)`,
            boxShadow: '0 12px 32px rgba(37,99,235,0.28)'
          }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-200">Call to action</p>
          <h3 className="mt-1 text-base font-black leading-snug sm:text-lg">{copy.close.ctaTitle}</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-blue-50 sm:text-[13px]">{copy.close.ctaBody}</p>
        </div>

        <div className="mt-4 grid flex-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="rounded-2xl border border-slate-200 p-3.5" style={{ backgroundColor: SLATE }}>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: NAVY }}>
              {copy.close.contactTitle}
            </h3>
            <ul className="mt-2 space-y-1 text-[12px] text-slate-700">
              {copy.close.contactLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <a
              href={copy.close.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold text-white"
              style={{ backgroundColor: EMERALD }}
            >
              {copy.close.whatsappLabel} →
            </a>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <img
              src={qrUrl}
              alt="QR code to maiSociety"
              width={112}
              height={112}
              className="h-28 w-28 rounded-lg"
              crossOrigin="anonymous"
            />
            <p className="mt-2 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {copy.close.qrCaption}
            </p>
          </div>
        </div>
      </ExecPageChrome>
    </div>
  )
}
