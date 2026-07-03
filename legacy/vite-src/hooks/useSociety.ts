import { useState, useEffect } from 'react'
import { Society } from '../types/db'
import { supabaseRestUrl, getSupabaseRestHeaders } from '../api/supabaseClient'

export function useSociety(societyId: string | null) {
  const [society, setSociety] = useState<Society | null>(null)

  useEffect(() => {
    if (!societyId) return
    let mounted = true
    fetch(supabaseRestUrl(`societies?id=eq.${societyId}`), {
      headers: getSupabaseRestHeaders()
    })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        setSociety(data?.[0] ?? null)
      })

    return () => {
      mounted = false
    }
  }, [societyId])

  return { society }
}
