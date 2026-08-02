import React from 'react'
import { MAI_BRAND_BLUE, MAI_BRAND_ORANGE } from '../../lib/brandConstants'

type Props = {
  variant?: 'light' | 'dark'
  size?: 'default' | 'lg' | 'xl'
  className?: string
  /** Hide “Society” and show only mAI */
  showSociety?: boolean
}

const sizeStyles = {
  default: {
    main: 'text-[14px] sm:text-[15px]',
    m: 'text-[11px] sm:text-[12px]'
  },
  lg: {
    main: 'text-[18px] sm:text-[20px]',
    m: 'text-[14px] sm:text-[16px]'
  },
  xl: {
    main: 'text-3xl sm:text-4xl',
    m: 'text-[1.7rem] sm:text-[2.15rem]'
  }
} as const

/**
 * Single-line wordmark: mAISociety — one continuous word beside the logo icon.
 * m + Society — brand blue · AI — uppercase orange
 */
export default function MaiSocietyWordmark({
  variant = 'light',
  size = 'default',
  className = '',
  showSociety = true
}: Props) {
  const isDark = variant === 'dark'
  const aiColor = isDark ? 'text-[#FFB347]' : 'text-[#E67E00]'
  const societyColor = isDark ? 'text-cyan-300/90' : 'text-syncra-blue'
  const { main: mainSize, m: mSize } = sizeStyles[size]
  const isHero = size === 'xl'

  return (
    <span
      aria-label={showSociety ? 'mAI Society' : 'mAI'}
      className={`inline-flex items-baseline whitespace-nowrap font-bold leading-none tracking-tight ${mainSize} ${
        isHero ? 'tracking-[-0.02em]' : ''
      } ${className}`}
    >
      <span
        className={`${mSize} ${societyColor} relative top-[0.5px] font-bold`}
        style={{ color: isDark ? undefined : MAI_BRAND_BLUE }}
      >
        m
      </span>
      <span className={`${aiColor} font-extrabold`} style={{ color: MAI_BRAND_ORANGE }}>
        AI
      </span>
      {showSociety ? (
        <span className={`${societyColor} font-bold`} style={{ color: isDark ? undefined : MAI_BRAND_BLUE }}>
          Society
        </span>
      ) : null}
    </span>
  )
}
