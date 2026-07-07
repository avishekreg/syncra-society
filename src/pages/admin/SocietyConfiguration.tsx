import React from 'react'
import SocietyIntegrationCredentials from '../../components/society/SocietyIntegrationCredentials'
import SocietyBillingRulesForm from '../../components/society/SocietyBillingRulesForm'
import { ui } from '../../lib/ui'

export default function SocietyConfiguration() {
  return (
    <div className="space-y-6">
      <header>
        <p className={ui.eyebrow}>President console</p>
        <h1 className={`mt-2 ${ui.headingLg}`}>Society configuration</h1>
        <p className={`mt-2 max-w-2xl ${ui.body}`}>
          Configure billing policy rules, integration identifiers, and automated WhatsApp payment reminders for your society.
        </p>
      </header>

      <SocietyBillingRulesForm />
      <SocietyIntegrationCredentials />
    </div>
  )
}
