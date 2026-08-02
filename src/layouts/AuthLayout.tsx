import React from 'react'
import SyncraFooter from '../components/layout/SyncraFooter'
import MaiSocietyWordmark from '../components/brand/MaiSocietyWordmark'

export default function AuthLayout({
  children,
  title,
  compact = false
}: {
  children: React.ReactNode
  title?: string
  compact?: boolean
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,180,216,0.08),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(0,82,204,0.06),_transparent_24%)]" />
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-6 sm:py-10">
        <div className={`w-full space-y-4 ${compact ? 'max-w-lg' : ''}`}>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-card sm:px-6 sm:py-7 md:px-8 md:py-8">
            <header className="mb-5 sm:mb-6">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <MaiSocietyWordmark size="xl" className="font-bold" />
                <span className="inline-flex items-center rounded-full border border-syncra-accent/25 bg-syncra-accent/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-syncra-blue">
                  Verified Access
                </span>
              </div>
              {title ? (
                <h1 className="mt-2 text-base font-medium text-slate-500 sm:text-lg">
                  {title}
                </h1>
              ) : null}
            </header>
            <div>{children}</div>
          </div>
        </div>
      </div>
      <SyncraFooter showAppBadges={false} />
    </div>
  )
}
