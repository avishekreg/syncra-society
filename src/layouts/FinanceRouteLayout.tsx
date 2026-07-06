import React from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import { ui } from '../lib/ui'

const FINANCE_TITLES: Record<string, string> = {
  '/finance/ledger': 'Financial Ledger',
  '/finance/downloads': 'Download Center',
  '/finance/bank-upload': 'Bank Statement Upload',
  '/finance/cashflow': 'Cashflow Transparency'
}

const FINANCE_TABS = [
  { to: '/finance/ledger', label: 'Financial Ledger' },
  { to: '/finance/downloads', label: 'Download Center' },
  { to: '/finance/bank-upload', label: 'Bank Statement Upload' },
  { to: '/finance/cashflow', label: 'Cashflow Transparency' }
] as const

function resolveFinanceTitle(pathname: string) {
  return FINANCE_TITLES[pathname] ?? 'Financial Console'
}

export default function FinanceRouteLayout() {
  const location = useLocation()
  const title = resolveFinanceTitle(location.pathname)

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    [
      'rounded-xl px-4 py-2.5 text-sm font-semibold transition',
      isActive
        ? 'bg-syncra-accent/10 text-syncra-blue ring-1 ring-syncra-accent/30'
        : 'text-slate-600 hover:bg-syncra-surface-alt hover:text-syncra-primary'
    ].join(' ')

  return (
    <DashboardLayout title={title}>
      <nav className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-4 sm:mb-8">
        {FINANCE_TABS.map(({ to, label }) => (
          <NavLink key={to} to={to} className={tabClass}>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className={ui.sectionGap}>
        <Outlet />
      </div>
    </DashboardLayout>
  )
}
