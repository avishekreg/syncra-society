import React from 'react'

export default function AuthLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,180,216,0.08),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(0,82,204,0.06),_transparent_24%)]" />
      <div className="relative mx-auto flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card md:p-10">
            <div className="mb-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-syncra-surface p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-syncra-accent">Syncra Society</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-syncra-primary md:text-3xl">
                  {title || 'Secure access to your society dashboard'}
                </h1>
              </div>
              <div className="rounded-full border border-syncra-accent/30 bg-syncra-accent/10 px-4 py-2 text-sm font-medium text-syncra-blue">
                Premium Access
              </div>
            </div>
            <div>{children}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-syncra-surface-alt p-6 text-sm text-slate-600 shadow-card md:p-8">
            <p className="font-semibold text-syncra-primary">Premium society operations.</p>
            <p className="mt-3 leading-7">
              Access notices, manage contracts, and keep ledgers in sync with a secure Supabase-backed platform built
              for premium communities.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
