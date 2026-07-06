import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Command, CornerDownLeft, Search, Sparkles } from 'lucide-react'
import type { CommandBarAction } from '../../../lib/syncraCommandBar'
import { cc } from './commandCenterStyles'

type Props = {
  onSubmit: (query: string) => void
  lastAction: CommandBarAction | null
  busy?: boolean
}

const QUICK_PROMPTS = [
  'Generate link for Regency Crest',
  'Show global webhook errors',
  'Show MRR overview',
  'Refresh platform data'
]

export default function SyncraCommandBar({ onSubmit, lastAction, busy = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        setFocused(true)
      }
      if (event.key === 'Escape') {
        inputRef.current?.blur()
        setFocused(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || busy) return
    onSubmit(trimmed)
  }

  const statusTone = useMemo(() => {
    if (!lastAction) return 'text-slate-500'
    if (lastAction.type === 'unknown') return 'text-syncra-action-alt'
    if (lastAction.type === 'webhook_status' && lastAction.reachable === false) return 'text-amber-700'
    return 'text-syncra-blue'
  }, [lastAction])

  return (
    <section className={`${cc.card} ${focused ? 'ring-2 ring-syncra-accent/20' : ''}`}>
      <div className={cc.cardInner}>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-syncra-blue" aria-hidden="true" />
            <p className={cc.eyebrowPrimary}>Ask Syncra AI</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <kbd className={cc.kbd}>
              <Command className="inline h-3 w-3" aria-hidden="true" />K
            </kbd>
            <span>command bar</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder='Try "Generate link for Regency Crest" or "Show global webhook errors"'
            className={`${cc.input} pl-11 pr-28 font-medium text-slate-900`}
            aria-label="Ask Syncra AI command bar"
          />
          <button
            type="submit"
            disabled={busy || !query.trim()}
            className={`absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 ${cc.btnPrimary} !min-h-9 px-3 py-2 text-xs`}
          >
            Run
            <CornerDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setQuery(prompt)
                onSubmit(prompt)
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm transition hover:border-syncra-accent/40 hover:text-syncra-blue"
            >
              {prompt}
            </button>
          ))}
        </div>

        {lastAction ? (
          <p className={`mt-3 text-sm ${statusTone}`} role="status">
            {lastAction.message}
          </p>
        ) : null}
      </div>
    </section>
  )
}
