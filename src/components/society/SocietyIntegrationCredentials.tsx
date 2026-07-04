import React, { useEffect, useState } from 'react'
import { Copy } from 'lucide-react'
import { useResolvedSocietyUuid } from '../../hooks/useResolvedSocietyUuid'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { isSocietyUuid } from '../../lib/resolveSocietyContext'
import Toast from '../ui/Toast'
import { ui } from '../../lib/ui'

type Props = {
  className?: string
}

export default function SocietyIntegrationCredentials({ className = '' }: Props) {
  const { uuid, loading, displayName } = useResolvedSocietyUuid()
  const { copy, toast, dismissToast } = useCopyToClipboard()
  const copyReady = Boolean(uuid && isSocietyUuid(uuid))

  return (
    <>
      <section
        className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_24px_80px_-20px_rgba(26,54,93,0.12),0_8px_24px_-8px_rgba(0,82,204,0.1)] md:p-8 ${className}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-syncra-accent/10 blur-2xl"
        />

        <div className="relative">
          <p className={ui.eyebrow}>Syncra Integration Credentials</p>
          <h2 className={`mt-2 ${ui.heading}`}>Society Identifiers</h2>
          <p className={`mt-2 max-w-2xl ${ui.body}`}>
            Use this unique Society ID when connecting third-party integrations such as the Syncra Automated
            Message Gateway, webhooks, or external billing tools.
          </p>

          {displayName && (
            <p className="mt-4 text-sm font-medium text-syncra-primary">
              Active society: <span className="text-slate-700">{displayName}</span>
            </p>
          )}

          <div className="mt-6">
            <span className={ui.label}>Society ID (UUID)</span>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-syncra-surface-alt px-4 py-3.5 font-mono text-sm leading-relaxed text-slate-800 shadow-inner">
                {loading ? (
                  <span className="font-sans text-slate-500">Resolving society UUID from database…</span>
                ) : copyReady ? (
                  uuid
                ) : (
                  <span className="font-sans text-slate-500">
                    No PostgreSQL society UUID available — sign in with a live society or complete onboarding.
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={!copyReady}
                onClick={() => void copy(uuid!, 'Society UUID copied to clipboard')}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-syncra-accent/40 bg-syncra-accent/10 px-5 py-3 text-sm font-semibold text-syncra-blue shadow-sm transition hover:bg-syncra-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy ID
              </button>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            This identifier maps to{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">public.societies.id</code>{' '}
            and is required for per-society automation routing and{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">complaints_and_suggestions</code>{' '}
            inserts.
          </p>
        </div>
      </section>

      <Toast message={toast} onDismiss={dismissToast} />
    </>
  )
}
