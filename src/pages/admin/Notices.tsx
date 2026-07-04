import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  listNotices,
  createNotice,
  deleteNotice,
  getNoticeViewStats,
  formatNoticeTimestamp
} from '../../api/notices'
import type { Notice } from '../../types/db'
import NoticeCreateSheet from '../../components/notices/NoticeCreateSheet'
import { ui } from '../../lib/ui'

type NoticeRow = Notice & {
  uniqueResidents: number
  totalViews: number
}

export default function AdminNotices() {
  const { currentSocietyId } = useAuth()
  const [notices, setNotices] = useState<NoticeRow[]>([])
  const [loading, setLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)

  async function fetchList() {
    if (!currentSocietyId) {
      setNotices([])
      return
    }
    setLoading(true)
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

  useEffect(() => {
    void fetchList()
  }, [currentSocietyId])

  function resetForm() {
    setTitle('')
    setBody('')
    setFile(null)
    setStatus(null)
  }

  function openSheet() {
    resetForm()
    setSheetOpen(true)
  }

  function closeSheet() {
    setSheetOpen(false)
    resetForm()
  }

  async function handlePublish(event: React.FormEvent) {
    event.preventDefault()
    if (!currentSocietyId) return
    if (!title.trim() || !body.trim()) return

    setSaving(true)
    setStatus(null)
    try {
      await createNotice(
        { society_id: currentSocietyId, title: title.trim(), body: body.trim() },
        file ?? undefined
      )
      setStatus('Notice published successfully.')
      await fetchList()
      window.setTimeout(() => {
        closeSheet()
      }, 600)
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : 'Unable to publish notice')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id?: string) {
    if (!id || !currentSocietyId) return
    await deleteNotice(id, currentSocietyId)
    await fetchList()
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={ui.eyebrow}>Community announcements</p>
          <h1 className={`mt-2 ${ui.headingLg}`}>Published notices</h1>
          <p className={`mt-2 ${ui.body}`}>Manage society-wide broadcasts. Creation opens in a focused slide-over panel.</p>
        </div>
        <button type="button" onClick={openSheet} className={ui.btnPrimary}>
          + New Notice
        </button>
      </header>

      <section className={`overflow-hidden ${ui.card}`}>
        {loading ? (
          <p className={ui.body}>Loading notices…</p>
        ) : notices.length === 0 ? (
          <p className={ui.body}>No notices published yet. Use &ldquo;+ New Notice&rdquo; to broadcast your first announcement.</p>
        ) : (
          <div className="w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <table className="min-w-[640px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Published</th>
                  <th className="px-4 py-3 font-semibold">Residents seen</th>
                  <th className="px-4 py-3 font-semibold">Total views</th>
                  <th className="px-4 py-3 font-semibold">Attachment</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((notice) => (
                  <tr key={notice.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-4 align-top">
                      <p className="font-medium text-syncra-primary">{notice.title}</p>
                      <p className="mt-1 line-clamp-2 max-w-md text-xs text-slate-500">{notice.body}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 align-top text-slate-600">
                      {formatNoticeTimestamp(notice.created_at)}
                    </td>
                    <td className="px-4 py-4 align-top tabular-nums text-slate-700">{notice.uniqueResidents}</td>
                    <td className="px-4 py-4 align-top tabular-nums text-slate-700">{notice.totalViews}</td>
                    <td className="px-4 py-4 align-top">
                      {notice.attachment_url ? (
                        <a
                          href={notice.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-syncra-blue hover:text-syncra-accent"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-right">
                      <button
                        type="button"
                        onClick={() => void handleDelete(notice.id)}
                        className="text-xs font-medium text-syncra-action-alt hover:text-[#e04545]"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <NoticeCreateSheet
        open={sheetOpen}
        title={title}
        body={body}
        file={file}
        saving={saving}
        status={status}
        onTitleChange={setTitle}
        onBodyChange={setBody}
        onFileChange={setFile}
        onClose={closeSheet}
        onSubmit={(event) => void handlePublish(event)}
      />
    </div>
  )
}
