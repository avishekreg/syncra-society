import { useCallback, useEffect, useState } from 'react'
import type { Complaint } from '../types/db'
import { createComplaint, listComplaintsForUser } from '../api/complaints'
import { subscribeToComplaints } from '../api/complaintsRealtime'

function mergeComplaint(prev: Complaint[], incoming: Complaint) {
  if (prev.some((item) => item.id === incoming.id)) return prev
  return [incoming, ...prev]
}

export function useComplaints(societyId: string | null, userId: string | null) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!societyId || !userId) {
      setComplaints([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await listComplaintsForUser(societyId, userId)
      setComplaints(data ?? [])
    } catch (err: any) {
      setError(err.message || 'Failed to load tickets')
      setComplaints([])
    } finally {
      setLoading(false)
    }
  }, [societyId, userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!societyId || !userId) return

    const unsubscribe = subscribeToComplaints(societyId, (complaint) => {
      if (complaint.raised_by_user_id !== userId) return
      setComplaints((prev) => mergeComplaint(prev, complaint))
    })

    return unsubscribe
  }, [societyId, userId])

  async function submitComplaint(subject: string, description: string) {
    if (!societyId || !userId) throw new Error('Sign in required')
    const created = await createComplaint({
      society_id: societyId,
      raised_by_user_id: userId,
      subject,
      description
    })
    setComplaints((prev) => [created, ...prev])
    return created
  }

  return { complaints, loading, error, refresh, submitComplaint }
}

export function formatComplaintStatus(status: Complaint['status']) {
  switch (status) {
    case 'open':
      return 'Pending'
    case 'in_progress':
      return 'In Progress'
    case 'resolved':
      return 'Resolved'
    case 'closed':
      return 'Closed'
    default:
      return status
  }
}
