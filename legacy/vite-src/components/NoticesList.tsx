import React, { useEffect, useState } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { listNotices } from '../api/notices'
import type { Notice } from '../types/db'
import { ui } from '../lib/ui'

export default function NoticesList() {
  const { currentSocietyId } = useAuth()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchList()
  }, [currentSocietyId])

  async function fetchList() {
    if (!currentSocietyId) {
      setNotices([])
      return
    }
    setLoading(true)
    try {
      const data = await listNotices(currentSocietyId)
      setNotices(data ?? [])
    } catch {
      setNotices([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <h2 className={`${ui.heading} mb-4`}>Notice Board</h2>
      {loading && <p className={ui.body}>Loading notices…</p>}
      {!loading && currentSocietyId && notices.length === 0 && (
        <p className={ui.body}>No notices published yet.</p>
      )}
      <ul className="space-y-2">
        {notices.map((n) => (
          <li key={n.id} className={ui.innerItem}>
            <div className="font-medium text-syncra-primary">{n.title}</div>
            <div className={`mt-1 ${ui.body}`}>{n.body}</div>
            {n.created_at && (
              <div className="mt-2 text-xs text-slate-400">{new Date(n.created_at).toLocaleDateString()}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
