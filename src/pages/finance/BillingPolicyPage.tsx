import React from 'react'
import MaintenanceDueDateForm from '../../components/finance/MaintenanceDueDateForm'
import { ui } from '../../lib/ui'

export default function FinanceBillingPolicyPage() {
  return (
    <div className={ui.sectionGap}>
      <MaintenanceDueDateForm />
    </div>
  )
}
