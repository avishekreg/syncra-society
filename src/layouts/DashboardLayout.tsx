import React from 'react'
import Sidebar from '../components/layout/Sidebar'
import SyncraFooter from '../components/layout/SyncraFooter'
import { ui } from '../lib/ui'

export default function DashboardLayout({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <Sidebar title={title}>
      <div className={`flex min-h-full flex-col ${ui.pageShell}`}>
        {title && (
          <header className="mb-6 sm:mb-8 md:mb-10">
            <h1 className={ui.headingLg}>{title}</h1>
            <div className="mt-3 h-px w-12 bg-gradient-to-r from-syncra-accent to-transparent sm:w-16" />
          </header>
        )}
        <div className="min-w-0 flex-1">{children}</div>
        <SyncraFooter compact className="mt-10 rounded-2xl border border-gray-200 shadow-sm" />
      </div>
    </Sidebar>
  )
}
