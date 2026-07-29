import React from 'react'
import { MAI_BRAND_BLUE, MAI_BRAND_ORANGE } from '../../lib/brandConstants'

type Props = {
  variant?: 'light' | 'dark'
  className?: string
  /** Hide “Society” and show only mAI */
  showSociety?: boolean
}

/**
 * Single-line wordmark: mAISociety — one continuous word beside the logo icon.
 * m — smaller lowercase black · AI — uppercase orange · Society — brand blue
 */
export default function MaiSocietyWordmark({
  variant = 'light',
  className = '',
  showSociety = true
}: Props) {
  const isDark = variant === 'dark'
  const mColor = isDark ? 'text-white' : 'text-black'
  const aiColor = isDark ? 'text-[#FFB347]' : 'text-[#E67E00]'
  const societyColor = isDark ? 'text-cyan-300/90' : 'text-syncra-blue'

  const mainSize = 'text-[14px] sm:text-[15px]'
  const mSize = 'text-[11px] sm:text-[12px]'

  return (
    <span
      aria-label={showSociety ? 'mAI Society' : 'mAI'}
      className={`inline-flex items-baseline whitespace-nowrap font-bold leading-none tracking-tight ${mainSize} ${className}`}
    >
      <span
        className={`${mSize} ${mColor} relative top-[0.5px]`}
        style={{ color: isDark ? undefined : '#0f172a' }}
      >
        m
      </span>
      <span className={aiColor} style={{ color: MAI_BRAND_ORANGE }}>
        AI
      </span>
      {showSociety ? (
        <span className={societyColor} style={{ color: isDark ? undefined : MAI_BRAND_BLUE }}>
          Society
        </span>
      ) : null}
    </span>
  )
}
