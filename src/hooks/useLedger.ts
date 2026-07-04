import { useState, useEffect } from 'react'
import { SocietyLedgerEntry } from '../types/db'
import { restGet } from '../api/supabaseClient'
import { fetchApiJson } from '../api/safeFetch'
import { shouldUseLocalFallback } from '../api/apiErrors'

const DEFAULT_LEDGER_ENTRIES: SocietyLedgerEntry[] = [
  {
    id: 'demo-ledger-1',
    society_id: 'syncra-windsor-castle',
    date: '30 Jun 2026',
    type: 'credit',
    amount: 4100,
    description: 'Resident maintenance collection - Flat 402',
    invoice_url: null
  },
  {
    id: 'demo-ledger-2',
    society_id: 'syncra-windsor-castle',
    date: '28 Jun 2026',
    type: 'credit',
    amount: 3500,
    description: 'Resident maintenance collection - Flat 101',
    invoice_url: null
  },
  {
    id: 'demo-ledger-3',
    society_id: 'syncra-windsor-castle',
    date: '25 Jun 2026',
    type: 'debit',
    amount: 2800,
    description: 'Diesel for Generator',
    invoice_url: null
  }
]

export function useLedger(societyId: string | null) {
  const [entries, setEntries] = useState<SocietyLedgerEntry[] | null>(null)

  useEffect(() => {
    let mounted = true

    if (!societyId) {
      if (mounted) setEntries([])
      return
    }

    void (async () => {
      const fromApi = await fetchApiJson<SocietyLedgerEntry[]>(
        `/api/ledger?society_id=${encodeURIComponent(societyId)}`
      )
      if (!mounted) return
      if (fromApi) {
        setEntries(fromApi.length ? fromApi : DEFAULT_LEDGER_ENTRIES)
        return
      }

      try {
        const data = await restGet<SocietyLedgerEntry[]>(
          `society_ledger?society_id=eq.${societyId}&order=created_at.desc`
        )
        if (!mounted) return
        setEntries(Array.isArray(data) && data.length ? data : DEFAULT_LEDGER_ENTRIES)
      } catch (err) {
        if (!mounted) return
        if (shouldUseLocalFallback(err)) {
          setEntries(DEFAULT_LEDGER_ENTRIES)
          return
        }
        setEntries(DEFAULT_LEDGER_ENTRIES)
      }
    })()

    return () => {
      mounted = false
    }
  }, [societyId])

  return { entries }
}
