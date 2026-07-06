import React from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import FinanceRouteLayout from '../layouts/FinanceRouteLayout'
import RoleGuard from './RoleGuard'
import FinanceLedgerPage from '../pages/finance/LedgerPage'
import FinanceDownloadCenterPage from '../pages/finance/DownloadCenterPage'
import FinanceBankUploadPage from '../pages/finance/BankUploadPage'
import FinanceCashflowPage from '../pages/finance/CashflowPage'

export default function FinanceRouter() {
  return (
    <Routes>
      <Route
        element={
          <RoleGuard allow={['super_admin', 'president', 'accountant']}>
            <FinanceRouteLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="/finance/ledger" replace />} />
        <Route path="ledger" element={<FinanceLedgerPage />} />
        <Route path="downloads" element={<FinanceDownloadCenterPage />} />
        <Route path="bank-upload" element={<FinanceBankUploadPage />} />
        <Route path="cashflow" element={<FinanceCashflowPage />} />
        <Route path="*" element={<Navigate to="/finance/ledger" replace />} />
      </Route>
    </Routes>
  )
}
