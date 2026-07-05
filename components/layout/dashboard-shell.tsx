'use client'

import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { AppSidebar } from '@/components/layout/app-sidebar'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 lg:flex-row">
      <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-neutral-900">Syncra Society</p>
        <div className="w-11" aria-hidden="true" />
      </header>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={[
          'fixed inset-y-0 left-0 z-50 lg:static lg:z-auto lg:h-screen',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'transition-transform duration-200 ease-out lg:transition-none'
        ].join(' ')}
      >
        <AppSidebar onNavigate={() => setMobileOpen(false)} showCloseButton={mobileOpen} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 hidden border-b border-neutral-200 bg-white/90 px-6 py-4 backdrop-blur-sm lg:block lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-neutral-500">Syncra Society · Administrative Console</p>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Production
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  )
}
