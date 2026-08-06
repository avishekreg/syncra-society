import React from 'react'
import {
  BrochureEyebrow,
  BrochureFooterMeta,
  BrochureLead,
  BrochurePage,
  BrochureTitle,
  ComparisonTable,
  FlowSteps
} from './BrochurePrimitives'
import { getExecDeckCopy, type BrochureLocale } from '../../lib/brochureI18n'
import { SYNCRA_LEGAL_ENTITY } from '../../lib/brandConstants'

type Props = {
  locale?: BrochureLocale
}

/** Trademark-safe 4-page Quick Exec Deck for RWA board sharing. */
export default function QuickExecDeck({ locale = 'en' }: Props) {
  const copy = getExecDeckCopy(locale)
  const total = 4
  const [cover, ...rest] = copy.pages

  return (
    <div className="brochure-document" data-brochure-deck="exec-4" lang={locale}>
      <BrochurePage tone="navy">
        <BrochureEyebrow onDark>{copy.eyebrow}</BrochureEyebrow>
        <BrochureTitle onDark size="xl">
          {copy.title}
        </BrochureTitle>
        <BrochureLead onDark>{copy.lead}</BrochureLead>
        <div className="mt-6">
          <FlowSteps steps={cover.bullets} onDark />
        </div>
        <p className="mt-8 text-xs text-cyan-100/80">{SYNCRA_LEGAL_ENTITY}</p>
        <BrochureFooterMeta page={1} total={total} onDark />
      </BrochurePage>

      {rest.map((page, index) => (
        <BrochurePage key={page.eyebrow} tone={index === 0 ? 'surface' : 'plain'}>
          <BrochureEyebrow>{page.eyebrow}</BrochureEyebrow>
          <BrochureTitle size="md">{page.title}</BrochureTitle>
          <BrochureLead>{page.lead}</BrochureLead>
          <div className="mt-5">
            <FlowSteps steps={page.bullets} />
          </div>
          {index === 0 ? (
            <div className="mt-5">
              <ComparisonTable headers={[...copy.comparisonHeaders]} rows={copy.comparisonRows} />
            </div>
          ) : null}
          {index === rest.length - 1 ? (
            <p className="mt-6 rounded-xl border border-syncra-accent/30 bg-syncra-accent/10 px-4 py-3 text-sm font-semibold text-syncra-blue">
              {copy.cta} · Competitive Edge vs Legacy Platforms
            </p>
          ) : null}
          <BrochureFooterMeta page={index + 2} total={total} />
        </BrochurePage>
      ))}
    </div>
  )
}
