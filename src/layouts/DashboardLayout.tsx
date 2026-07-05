import React from 'react'
import Sidebar from '../components/layout/Sidebar'
import { ui } from '../lib/ui'

export default function DashboardLayout({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <Sidebar title={title}>
      <div className={ui.pageShell}>
        {title && (
          <header className="mb-4 hidden md:mb-8 md:block lg:mb-10">
            <h1 className={ui.headingLg}>{title}</h1>
            <div className="mt-3 h-px w-12 bg-gradient-to-r from-syncra-accent to-transparent sm:w-16" />
          </header>
        )}
        <div className="min-w-0">{children}</div>
      </div>
    </Sidebar>
  )
}
