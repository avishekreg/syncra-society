import React from 'react'
import SyncraFooter from '../components/layout/SyncraFooter'

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
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className={`w-full space-y-6 ${compact ? 'max-w-lg' : ''}`}>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-6 md:p-10">
            <div className="mb-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-syncra-surface p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-syncra-accent">Syncra Society</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-syncra-primary md:text-3xl">
                  {title || 'Secure access to your society dashboard'}
                </h1>
              </div>
              <div className="rounded-full border border-syncra-accent/30 bg-syncra-accent/10 px-4 py-2 text-sm font-medium text-syncra-blue">
                Verified Access
              </div>
            </div>
            <div>{children}</div>
          </div>
        </div>
      </div>
      <SyncraFooter showAppBadges={false} />
    </div>
  )
}
