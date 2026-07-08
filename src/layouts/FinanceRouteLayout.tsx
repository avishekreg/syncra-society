import { Outlet, useLocation } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'

const FINANCE_TITLES: Record<string, string> = {
  '/finance/ledger': 'Financial Ledger',
  '/finance/downloads': 'Download Center',
  '/finance/bank-upload': 'Bank Statement Upload',
  '/finance/cashflow': 'Cashflow Transparency',
  '/finance/billing-policy': 'Maintenance Due Date'
}

function resolveFinanceTitle(pathname: string) {
  return FINANCE_TITLES[pathname] ?? 'Financial Console'
}

/** Finance workspace shell — sidebar is the sole navigation; no duplicate tab bar. */
export default function FinanceRouteLayout() {
  const location = useLocation()
  const title = resolveFinanceTitle(location.pathname)

  return (
    <DashboardLayout title={title}>
      <Outlet />
    </DashboardLayout>
  )
}
