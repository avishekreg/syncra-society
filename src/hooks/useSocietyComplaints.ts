import { useCallback, useEffect, useRef, useState } from 'react'
import type { Complaint } from '../types/db'
import { listComplaintsForSociety } from '../api/complaints'
import { subscribeToComplaints } from '../api/complaintsRealtime'

function mergeComplaint(prev: Complaint[], incoming: Complaint) {
  if (prev.some((item) => item.id === incoming.id)) return prev
  return [incoming, ...prev]
}

export function useSocietyComplaints(
  societyId: string | null,
  alternateSocietyIds: string[] = []
) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const societyIdsRef = useRef<string[]>([])

  societyIdsRef.current = Array.from(
    new Set([societyId, ...alternateSocietyIds].filter((id): id is string => Boolean(id)))
  )

  const refresh = useCallback(async () => {
    const ids = societyIdsRef.current
    const queryId = ids.find((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ) ?? ids[0]

    if (!queryId) {
      setComplaints([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const rows = await listComplaintsForSociety(queryId)
      setComplaints(rows ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load complaints')
      setComplaints([])
    } finally {
      setLoading(false)
    }
  }, [societyId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const ids = societyIdsRef.current
    const primary = ids[0]
    if (!primary) {
      setLive(false)
      return
    }

    const alternates = ids.slice(1)
    setLive(true)

    const unsubscribe = subscribeToComplaints(
      primary,
      (complaint) => {
        setComplaints((prev) => mergeComplaint(prev, complaint))
      },
      alternates
    )

    return () => {
      setLive(false)
      unsubscribe()
    }
  }, [societyId, alternateSocietyIds])

  return { complaints, loading, error, live, refresh }
}
