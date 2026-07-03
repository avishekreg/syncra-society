import React from 'react'
import Sidebar from '../components/layout/Sidebar'

export default function DashboardLayout({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <Sidebar>
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-10">
        {title && (
          <header className="mb-8 md:mb-10">
            <h1 className="text-2xl font-semibold tracking-tight text-syncra-primary md:text-3xl">{title}</h1>
            <div className="mt-3 h-px w-16 bg-gradient-to-r from-syncra-accent to-transparent" />
          </header>
        )}
        <div>{children}</div>
      </div>
    </Sidebar>
  )
}
