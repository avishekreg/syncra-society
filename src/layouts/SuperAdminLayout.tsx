import React from 'react'
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar'
import { ui } from '../lib/ui'

export default function SuperAdminLayout({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <SuperAdminSidebar title={title}>
      <div className={ui.pageShell}>
        {title ? (
          <header className="mb-6 sm:mb-8 md:mb-10">
            <h1 className={ui.headingLg}>{title}</h1>
            <div className="mt-3 h-px w-12 bg-gradient-to-r from-syncra-accent to-transparent sm:w-16" />
          </header>
        ) : null}
        <div className="min-w-0">{children}</div>
      </div>
    </SuperAdminSidebar>
  )
}
