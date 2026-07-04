import React, { useEffect, useState } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { listNotices, recordNoticeView, getNoticeViewStats, formatNoticeTimestamp } from '../api/notices'
import type { Notice } from '../types/db'
import { ui } from '../lib/ui'

type NoticeWithViews = Notice & {
  uniqueResidents: number
  totalViews: number
}

export default function NoticesList() {
  const { currentSocietyId, user } = useAuth()
  const [notices, setNotices] = useState<NoticeWithViews[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void fetchList()
  }, [currentSocietyId, user?.id, user?.flatNumber])

  async function fetchList() {
    if (!currentSocietyId) {
      setNotices([])
      return
    }
    setLoading(true)
    try {
      const data = await listNotices(currentSocietyId)
      const enriched = (data ?? []).map((notice) => {
        if (user?.id || user?.flatNumber) {
          recordNoticeView({
            societyId: currentSocietyId,
            noticeId: notice.id,
            userId: user?.id,
            flatNumber: user?.flatNumber
          })
        }
        const stats = getNoticeViewStats(currentSocietyId, notice.id)
        return {
          ...notice,
          uniqueResidents: stats.uniqueResidents,
          totalViews: stats.totalViews
        }
      })
      setNotices(enriched)
    } catch {
      setNotices([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className={ui.heading}>Notice Board</h2>
      {loading && <p className={ui.body}>Loading notices…</p>}
      {!loading && currentSocietyId && notices.length === 0 && (
        <p className={ui.body}>No notices published yet.</p>
      )}
      <ul className="space-y-4">
        {notices.map((notice) => (
          <li key={notice.id} className={ui.innerItem}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-syncra-primary">{notice.title}</div>
                <div className={`mt-2 ${ui.body}`}>{notice.body}</div>
              </div>
              <time className="shrink-0 text-xs font-medium text-slate-500">
                {formatNoticeTimestamp(notice.created_at)}
              </time>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3 text-xs text-slate-500">
              <span className="rounded-full border border-syncra-accent/30 bg-syncra-accent/10 px-2.5 py-1 font-semibold text-syncra-blue">
                Seen by {notice.uniqueResidents} resident{notice.uniqueResidents === 1 ? '' : 's'}
              </span>
              <span>{notice.totalViews} total view{notice.totalViews === 1 ? '' : 's'}</span>
              {notice.attachment_url && (
                <a
                  href={notice.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-syncra-blue hover:text-syncra-accent"
                >
                  View attachment
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
