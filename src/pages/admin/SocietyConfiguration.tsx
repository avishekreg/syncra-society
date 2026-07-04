import React from 'react'
import SocietyIntegrationCredentials from '../../components/society/SocietyIntegrationCredentials'
import { ui } from '../../lib/ui'

export default function SocietyConfiguration() {
  return (
    <div className="space-y-6">
      <header>
        <p className={ui.eyebrow}>President console</p>
        <h1 className={`mt-2 ${ui.headingLg}`}>Society configuration</h1>
        <p className={`mt-2 max-w-2xl ${ui.body}`}>
          Integration identifiers and credentials for connecting external services to your registered society.
        </p>
      </header>

      <SocietyIntegrationCredentials />
    </div>
  )
}
