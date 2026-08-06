import React, { useId, useMemo } from 'react'
import QRCode from 'qrcode'
import { getExecDeckCopy, type BrochureLocale } from '../../lib/brochureI18n'
import { MAI_PRODUCTION_ORIGIN, SYNCRA_LEGAL_ENTITY } from '../../lib/brandConstants'

type Props = { locale?: BrochureLocale }

const NAVY = '#0f172a'
const BLUE = '#2563eb'
const SLATE = '#f8fafc'
const EMERALD = '#10b981'

/** Crisp SVG mark — print-safe, no external assets. */
function MaiLogoMark({ size = 28 }: { size?: number }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`s${uid}`} x1="6" y1="26" x2="26" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="0.55" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id={`a${uid}`} x1="14" y1="8" x2="22" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB347" />
          <stop offset="1" stopColor="#E67E00" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#fff" />
      <path
        d="M10 22.5V12.5L16 9.5L22 12.5V22.5"
        stroke={`url(#s${uid})`}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 22.5V15.2L16 13.9L18.5 15.2V22.5"
        stroke={`url(#s${uid})`}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="18.8" r="1.35" fill="#0052CC" />
      <path d="M21.5 10.5L23.5 8.5L25 10.5L23 12.5Z" fill={`url(#a${uid})`} />
    </svg>
  )
}

function MaiWordmark({ onDark }: { onDark?: boolean }) {
  return (
    <span className="exec-wordmark" style={{ color: onDark ? '#fff' : NAVY }}>
      <span style={{ color: onDark ? '#7dd3fc' : BLUE }}>m</span>
      <span style={{ color: '#E67E00' }}>AI</span>
      <span style={{ color: onDark ? '#e2e8f0' : NAVY }}>Society</span>
    </span>
  )
}

function ExecQr({ url, size = 96 }: { url: string; size?: number }) {
  const modules = useMemo(() => QRCode.create(url, { errorCorrectionLevel: 'M' }).modules, [url])
  const n = modules.size
  const cells: React.ReactNode[] = []
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      if (modules.get(x, y)) {
        cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={NAVY} />)
      }
    }
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${n} ${n}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code for ${url}`}
    >
      <rect width={n} height={n} fill="#fff" />
      {cells}
    </svg>
  )
}

function PageShell({
  brand,
  pitchTag,
  page,
  total,
  pageLabel,
  children
}: {
  brand: string
  pitchTag: string
  page: number
  total: number
  pageLabel: string
  children: React.ReactNode
}) {
  return (
    <article className="brochure-page exec-a4" data-brochure-page>
      <header className="exec-hdr">
        <div className="exec-hdr-brand">
          <MaiLogoMark size={30} />
          <div>
            <MaiWordmark onDark />
            <p className="exec-hdr-sub">by Syncra Systems</p>
          </div>
        </div>
        <span className="exec-pill">{pitchTag}</span>
      </header>
      <div className="exec-body">{children}</div>
      <footer className="exec-ftr">
        <span>{brand}</span>
        <span>
          {pageLabel} {page}/{total}
        </span>
      </footer>
    </article>
  )
}

/** Dense, print-safe 4-page Quick Exec Deck. */
export default function QuickExecDeck({ locale = 'en' }: Props) {
  const copy = getExecDeckCopy(locale)
  const byline =
    copy.brandBanner.includes('by Syncra') || copy.brandBanner.includes('·')
      ? copy.brandBanner
      : `${copy.brandBanner}`

  return (
    <div className="brochure-document exec-deck-document" data-brochure-deck="exec-4" lang={locale}>
      {/* PAGE 1 */}
      <PageShell brand={byline} pitchTag={copy.pitchTag} page={1} total={4} pageLabel={copy.pageLabel}>
        <section className="exec-hero">
          <p className="exec-kicker">{copy.cover.eyebrow}</p>
          <h1 className="exec-h1">{copy.cover.title}</h1>
          <p className="exec-lead">{copy.cover.subtitle}</p>
          <div className="exec-metrics">
            {copy.cover.metrics.map((m) => (
              <div key={m} className="exec-metric">
                {m}
              </div>
            ))}
          </div>
        </section>

        <section className="exec-block">
          <p className="exec-kicker exec-kicker--green">{copy.cover.failTag}</p>
          <h2 className="exec-h2">{copy.cover.failTitle}</h2>
          <div className="exec-fail-grid">
            {copy.cover.failCards.map((card) => (
              <div key={card.title} className="exec-fail-card">
                <span className="exec-fail-icon">{card.icon}</span>
                <p className="exec-fail-title">{card.title}</p>
                <p className="exec-fail-body">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="exec-bottom-split">
          <div className="exec-overview">
            <p className="exec-kicker">{copy.cover.overviewTag}</p>
            <h2 className="exec-h2">{copy.cover.overviewTitle}</h2>
            <p className="exec-body-text">{copy.cover.overviewBody}</p>
            <p className="exec-hq">{SYNCRA_LEGAL_ENTITY} · Kolkata HQ</p>
          </div>
          <div className="exec-arch">
            <p className="exec-arch-title">{copy.cover.architectureTitle}</p>
            <ul>
              {copy.cover.architectureItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      </PageShell>

      {/* PAGE 2 */}
      <PageShell brand={byline} pitchTag={copy.pitchTag} page={2} total={4} pageLabel={copy.pageLabel}>
        <p className="exec-kicker">{copy.matrix.eyebrow}</p>
        <h2 className="exec-h2 exec-h2--lg">{copy.matrix.title}</h2>
        <p className="exec-body-text">{copy.matrix.lead}</p>
        <table className="exec-table">
          <thead>
            <tr>
              {copy.matrix.headers.map((h, i) => (
                <th key={h} className={i === 2 ? 'exec-th-accent' : undefined}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.matrix.rows.map((row, idx) => (
              <tr key={row[0]} className={idx % 2 === 0 ? 'exec-tr-even' : 'exec-tr-odd'}>
                <td className="exec-td-key">{row[0]}</td>
                <td>{row[1]}</td>
                <td className="exec-td-win">{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageShell>

      {/* PAGE 3 */}
      <PageShell brand={byline} pitchTag={copy.pitchTag} page={3} total={4} pageLabel={copy.pageLabel}>
        <p className="exec-kicker">{copy.modules.eyebrow}</p>
        <h2 className="exec-h2 exec-h2--lg">{copy.modules.title}</h2>
        <p className="exec-body-text">{copy.modules.lead}</p>
        <div className="exec-mod-grid">
          {copy.modules.cards.map((card) => (
            <article key={card.title} className="exec-mod-card">
              <div className="exec-mod-head">
                <span>{card.icon}</span>
                <h3>{card.title}</h3>
              </div>
              <ul>
                {card.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </PageShell>

      {/* PAGE 4 */}
      <PageShell brand={byline} pitchTag={copy.pitchTag} page={4} total={4} pageLabel={copy.pageLabel}>
        <p className="exec-kicker exec-kicker--green">{copy.close.eyebrow}</p>
        <h2 className="exec-h2 exec-h2--lg">{copy.close.title}</h2>
        <div className="exec-close-grid">
          <section className="exec-close-col">
            <h3 className="exec-col-title">{copy.close.monetizationTitle}</h3>
            {copy.close.monetizationItems.map((item) => (
              <div key={item.title} className="exec-roi-card">
                <p className="exec-roi-title">{item.title}</p>
                <p>{item.body}</p>
              </div>
            ))}
          </section>

          <section className="exec-close-col">
            <h3 className="exec-col-title">{copy.close.roadmapTitle}</h3>
            <ol className="exec-steps">
              {copy.close.roadmap.map((step) => (
                <li key={step.step}>
                  <span className="exec-step-num">{step.step}</span>
                  <div>
                    <p className="exec-roi-title">{step.title}</p>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="exec-close-col exec-close-cta">
            <div className="exec-cta-box">
              <h3>{copy.close.ctaTitle}</h3>
              <p>{copy.close.ctaBody}</p>
            </div>
            <div className="exec-contact-row">
              <div>
                <h3 className="exec-col-title">{copy.close.contactTitle}</h3>
                {copy.close.contactLines.map((line) => (
                  <p key={line} className="exec-contact-line">
                    {line}
                  </p>
                ))}
                <a className="exec-wa" href={copy.close.whatsappUrl} target="_blank" rel="noreferrer">
                  {copy.close.whatsappLabel}
                </a>
              </div>
              <div className="exec-qr-wrap">
                <ExecQr url={MAI_PRODUCTION_ORIGIN} size={88} />
                <p>{copy.close.qrCaption}</p>
              </div>
            </div>
          </section>
        </div>
      </PageShell>
    </div>
  )
}
