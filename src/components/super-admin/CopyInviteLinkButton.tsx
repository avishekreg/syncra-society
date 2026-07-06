import React, { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { ui } from '../../lib/ui'

type Props = {
  url: string
  disabled?: boolean
}

export default function CopyInviteLinkButton({ url, disabled = false }: Props) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  async function handleCopy() {
    if (!url || disabled) return
    try {
      await navigator.clipboard.writeText(url)
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
    <button
      type="button"
      onClick={() => void handleCopy()}
      disabled={disabled || !url}
      className={`inline-flex min-h-11 items-center gap-2 ${ui.btnSecondary} disabled:opacity-50`}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      {copied ? 'Copied' : 'Copy link'}
    </button>
  )
}
