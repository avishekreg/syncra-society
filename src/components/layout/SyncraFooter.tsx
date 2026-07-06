import React from 'react'
import { Link } from 'react-router-dom'
import { SYNCRA_LEGAL_ENTITY } from '../../lib/brandConstants'

const legalLinks = [
  { to: '/legal/terms', label: 'Terms & Conditions' },
  { to: '/legal/privacy', label: 'Privacy Policy' },
  { to: '/legal/refund', label: 'Refund and Cancellation Policy' }
] as const

type SyncraFooterProps = {
  compact?: boolean
  className?: string
}

export default function SyncraFooter({ compact = false, className = '' }: SyncraFooterProps) {
  return (
    <footer
      className={`border-t border-gray-200 bg-white text-slate-600 ${compact ? 'py-5' : 'py-8'} ${className}`}
    >
      <div
        className={`mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 ${
          compact ? 'text-center sm:text-left' : 'gap-6 sm:flex-row sm:items-center sm:justify-between'
        }`}
      >
        <p className="text-sm font-semibold text-syncra-primary">Developed by {SYNCRA_LEGAL_ENTITY}</p>
        <nav aria-label="Legal policies" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {legalLinks.map((link) => (
            <Link key={link.to} to={link.to} className="font-medium text-slate-600 transition hover:text-syncra-blue">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
