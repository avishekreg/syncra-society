import React, { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { isSocietyUuid } from '../../lib/resolveSocietyContext'

type Props = {
  societyId: string
  /** When true, show a shortened UUID in compact table cells. */
  compact?: boolean
  label?: string
}

function truncateId(id: string) {
  if (id.length <= 16) return id
  return `${id.slice(0, 8)}…${id.slice(-6)}`
}

export default function CopySocietyIdButton({ societyId, compact = false, label = 'Copy ID' }: Props) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isUuid = isSocietyUuid(societyId)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  async function handleCopy() {
    if (!societyId || !isUuid) return

    try {
      await navigator.clipboard.writeText(societyId)
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setCopied(false)
        timerRef.current = null
      }, 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code
        className={`max-w-full truncate sm:max-w-[14rem] rounded-lg border px-2.5 py-1.5 font-mono text-xs ${
          isUuid
            ? 'border-slate-200 bg-syncra-surface-alt text-slate-800'
            : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}
        title={isUuid ? societyId : 'Not a valid PostgreSQL UUID — sync from Supabase'}
      >
        {isUuid ? (compact ? truncateId(societyId) : societyId) : 'Invalid UUID'}
      </code>
      <button
        type="button"
        onClick={() => void handleCopy()}
        disabled={!isUuid}
        aria-label={label}
        title={copied ? 'Copied' : isUuid ? label : 'UUID required for database integrations'}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-syncra-accent/40 hover:bg-syncra-accent/5 hover:text-syncra-blue disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  )
}
