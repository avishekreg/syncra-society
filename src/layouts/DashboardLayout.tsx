import React from 'react'
import Sidebar from '../components/layout/Sidebar'
import SyncraFooter from '../components/layout/SyncraFooter'
import { useSocietyBranding } from '../hooks/useSocietyBranding'
import { ui } from '../lib/ui'

export default function DashboardLayout({ title, children }: { title?: string; children: React.ReactNode }) {
  const { societyName } = useSocietyBranding()

  return (
    <Sidebar title={title}>
      <div className={`flex min-h-full flex-col ${ui.pageShell}`}>
        <div className="mb-4 rounded-2xl border border-syncra-accent/20 bg-gradient-to-r from-syncra-accent/10 via-white to-white px-4 py-3 sm:px-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-syncra-blue">Your society</p>
          <p className="mt-1 text-lg font-semibold text-syncra-primary sm:text-xl">{societyName}</p>
        </div>

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
