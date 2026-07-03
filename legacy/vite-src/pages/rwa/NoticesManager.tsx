import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { listNotices, createNotice, deleteNotice } from '../../api/notices'
import type { Notice } from '../../types/db'
import { ui } from '../../lib/ui'

type Props = {
  embedded?: boolean
}

export default function NoticesManager({ embedded = false }: Props) {
  const { currentSocietyId } = useAuth()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])
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
      setNotices(data ?? [])
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
    } catch (err: any) {
      setStatus(err.message ?? 'Unable to post notice')
    }
  }

  async function handleDelete(id?: string) {
    if (!id || !currentSocietyId) return
    await deleteNotice(id, currentSocietyId)
    await fetchList()
  }

  return (
    <div className="flex h-full flex-col">
      {!embedded && <h2 className={`mb-4 ${ui.heading}`}>Notice Board</h2>}

      {loading && <p className={`mb-3 ${ui.body}`}>Loading notices…</p>}
      {status && <p className="mb-3 text-sm text-emerald-600">{status}</p>}

      <form onSubmit={(e) => void handlePost(e)} className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-syncra-surface-alt p-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={ui.input} />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message"
          rows={3}
          className={`resize-none ${ui.input}`}
        />
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={ui.input} />
        <div className="flex justify-end">
          <button type="submit" className={ui.btnPrimary}>
            Post
          </button>
        </div>
      </form>

      <ul className="space-y-2">
        {notices.map((n) => (
          <li key={n.id} className={`flex items-start justify-between gap-3 ${ui.innerItem}`}>
            <div className="min-w-0">
              <div className="font-medium text-syncra-primary">{n.title}</div>
              <div className="mt-0.5 line-clamp-2 text-xs text-slate-600">{n.body}</div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {n.attachment_url && (
                <a href={n.attachment_url} target="_blank" rel="noreferrer" className="text-xs text-syncra-blue hover:text-syncra-accent">
                  File
                </a>
              )}
              <button type="button" onClick={() => void handleDelete(n.id)} className="text-xs text-syncra-action-alt hover:text-[#e04545]">
                Delete
              </button>
            </div>
          </li>
        ))}
        {!loading && notices.length === 0 && <li className={`text-sm ${ui.body}`}>No notices yet.</li>}
      </ul>
    </div>
  )
}
