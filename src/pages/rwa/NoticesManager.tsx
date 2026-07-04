import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { listNotices, createNotice, deleteNotice, getNoticeViewStats, formatNoticeTimestamp } from '../../api/notices'
import type { Notice } from '../../types/db'
import { ui } from '../../lib/ui'

type Props = {
  embedded?: boolean
}

type NoticeWithViews = Notice & {
  uniqueResidents: number
  totalViews: number
}

export default function NoticesManager({ embedded = false }: Props) {
  const { currentSocietyId } = useAuth()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [notices, setNotices] = useState<NoticeWithViews[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    void fetchList()
  }, [currentSocietyId])

  async function fetchList() {
    if (!currentSocietyId) {
      setNotices([])
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const data = await listNotices(currentSocietyId)
      setNotices(
        (data ?? []).map((notice) => {
          const stats = getNoticeViewStats(currentSocietyId, notice.id)
          return {
            ...notice,
            uniqueResidents: stats.uniqueResidents,
            totalViews: stats.totalViews
          }
        })
      )
    } catch {
      setNotices([])
    } finally {
      setLoading(false)
    }
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!currentSocietyId) return alert('Select a society first')
    if (!title.trim()) return alert('Title is required')
    if (!body.trim()) return alert('Body is required')

    try {
      await createNotice({ society_id: currentSocietyId, title: title.trim(), body: body.trim() }, file ?? undefined)
      setTitle('')
      setBody('')
      setFile(null)
      setStatus('Notice posted successfully.')
      await fetchList()
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : 'Unable to post notice')
    }
  }

  async function handleDelete(id?: string) {
    if (!id || !currentSocietyId) return
    await deleteNotice(id, currentSocietyId)
    await fetchList()
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {!embedded && <h2 className={ui.heading}>Notice Board</h2>}

      {loading && <p className={ui.body}>Loading notices…</p>}
      {status && <p className="text-sm text-emerald-600">{status}</p>}

      <form onSubmit={(e) => void handlePost(e)} className={`space-y-4 ${ui.innerItem}`}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={ui.input} />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message"
          rows={4}
          className={`resize-none ${ui.input}`}
        />
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={ui.input} />
        <div className="flex justify-end">
          <button type="submit" className={ui.btnPrimary}>
            Post
          </button>
        </div>
      </form>

      <ul className="space-y-4">
        {notices.map((notice) => (
          <li key={notice.id} className={`${ui.innerItem} space-y-3`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-syncra-primary">{notice.title}</div>
                <div className={`mt-2 ${ui.body}`}>{notice.body}</div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <time className="text-xs font-medium text-slate-500">{formatNoticeTimestamp(notice.created_at)}</time>
                {notice.attachment_url && (
                  <a
                    href={notice.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-syncra-blue hover:text-syncra-accent"
                  >
                    File
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => void handleDelete(notice.id)}
                  className="text-xs text-syncra-action-alt hover:text-[#e04545]"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3 text-xs text-slate-500">
              <span className="rounded-full border border-syncra-accent/30 bg-syncra-accent/10 px-2.5 py-1 font-semibold text-syncra-blue">
                Seen by {notice.uniqueResidents} resident{notice.uniqueResidents === 1 ? '' : 's'}
              </span>
              <span>{notice.totalViews} total views</span>
            </div>
          </li>
        ))}
        {!loading && notices.length === 0 && <li className={`text-sm ${ui.body}`}>No notices yet.</li>}
      </ul>
    </div>
  )
}
