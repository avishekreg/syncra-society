import React from 'react'
import { SYNCRA_CONTACT_EMAIL, SYNCRA_LEGAL_ENTITY } from '../../lib/brandConstants'

/** Enterprise CTA — rendered between landing main content and footer. */
export default function FooterEnterpriseCta() {
  return (
    <div className="flex w-full justify-center my-8">
      <div className="mx-auto inline-block rounded-full border border-gray-100 bg-gray-50 px-6 py-2.5 text-center text-sm">
        Need a custom township rollout?{' '}
        <a
          href={`mailto:${SYNCRA_CONTACT_EMAIL}`}
          className="cursor-pointer font-semibold text-blue-600"
        >
          Contact {SYNCRA_LEGAL_ENTITY}
        </a>{' '}
        for enterprise onboarding.
      </div>
    </div>
  )
}
