import React from 'react'
import { MAI_BRAND_BLUE, MAI_BRAND_ORANGE } from '../../lib/brandConstants'

type Props = {
  /** Inline compact wordmark or stacked with Society on second line */
  layout?: 'inline' | 'stacked'
  variant?: 'light' | 'dark'
  className?: string
  /** Hide “Society” subtitle when layout is stacked */
  showSociety?: boolean
}

/**
 * Styled mAI Society wordmark:
 * m — lowercase black · AI — uppercase orange · Society — brand blue
 */
export default function MaiSocietyWordmark({
  layout = 'stacked',
  variant = 'light',
  className = '',
  showSociety = true
}: Props) {
  const isDark = variant === 'dark'
  const mColor = isDark ? 'text-white' : 'text-black'
  const aiColor = isDark ? 'text-[#FFB347]' : 'text-[#E67E00]'
  const societyColor = isDark ? 'text-cyan-300/90' : 'text-syncra-blue'

  const mai = (
    <span className="font-bold tracking-tight">
      <span className={mColor} style={{ color: isDark ? undefined : '#0f172a' }}>
        m
      </span>
      <span className={aiColor} style={{ color: MAI_BRAND_ORANGE }}>
        AI
      </span>
    </span>
  )

  if (layout === 'inline') {
    return (
      <span className={`inline-flex items-baseline gap-0 font-bold tracking-tight ${className}`}>
        {mai}
        {showSociety ? (
          <span className={`ml-1 ${societyColor}`} style={{ color: isDark ? undefined : MAI_BRAND_BLUE }}>
            Society
          </span>
        ) : null}
      </span>
    )
  }

  return (
    <div className={`flex min-w-0 flex-col justify-center leading-none ${className}`}>
      <span className="text-[14px]">{mai}</span>
      {showSociety ? (
        <>
          <span
            aria-hidden="true"
            className={isDark ? 'my-[3px] block h-px w-full bg-white/15' : 'my-[3px] block h-px w-full bg-slate-200'}
          />
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${societyColor}`}
            style={{ color: isDark ? undefined : MAI_BRAND_BLUE }}
          >
            Society
          </span>
        </>
      ) : null}
    </div>
  )
}
