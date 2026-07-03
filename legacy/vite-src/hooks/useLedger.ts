import { useState, useEffect } from 'react'
import { SocietyLedgerEntry } from '../types/db'
import { supabaseRestUrl, getSupabaseRestHeaders } from '../api/supabaseClient'

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

    fetch(supabaseRestUrl(`society_ledger?society_id=eq.${societyId}&order=date.desc`), {
      headers: getSupabaseRestHeaders()
    })
      .then(async (res) => {
        if (!mounted) return
        if (!res.ok) {
          throw new Error(`Ledger fetch failed with status ${res.status}`)
        }
        const data = await res.json()
        if (!mounted) return
        setEntries(Array.isArray(data) ? data : DEFAULT_LEDGER_ENTRIES)
      })
      .catch(() => {
        if (!mounted) return
        setEntries(DEFAULT_LEDGER_ENTRIES)
      })

    return () => {
      mounted = false
    }
  }, [societyId])

  return { entries }
}
