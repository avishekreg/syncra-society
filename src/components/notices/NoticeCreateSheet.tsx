import React, { useEffect, useId, useRef } from 'react'
import { ui } from '../../lib/ui'

type Props = {
  open: boolean
  title: string
  body: string
  file: File | null
  saving: boolean
  status: string | null
  onTitleChange: (value: string) => void
  onBodyChange: (value: string) => void
  onFileChange: (file: File | null) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent) => void
}

export default function NoticeCreateSheet({
  open,
  title,
  body,
  file,
  saving,
  status,
  onTitleChange,
  onBodyChange,
  onFileChange,
  onClose,
  onSubmit
}: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>('input, textarea, button')?.focus()
  }, [open])

  if (!open) return null

  return (
    <div className={ui.overlay} role="presentation" onClick={onClose}>
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="ml-auto flex h-full w-full max-w-full flex-col sm:max-w-lg border-l border-slate-200 bg-white shadow-card-hover"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className={ui.eyebrow}>New announcement</p>
            <h2 id={titleId} className={`mt-1 ${ui.heading}`}>
              Publish notice
            </h2>
            <p className={`mt-1 text-sm ${ui.body}`}>Residents receive this via the notice board and WhatsApp relay.</p>
          </div>
          <button type="button" onClick={onClose} className={ui.btnGhost} aria-label="Close">
            Close
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="space-y-4">
            <label className="block">
              <span className={`mb-2 block ${ui.label}`}>Title</span>
              <input
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
                className={ui.input}
                placeholder="AGM scheduled for 15 Jul"
                required
              />
            </label>
            <label className="block">
              <span className={`mb-2 block ${ui.label}`}>Message</span>
              <textarea
                value={body}
                onChange={(event) => onBodyChange(event.target.value)}
                className={`min-h-[10rem] resize-y ${ui.input}`}
                placeholder="Write the full notice body…"
                required
              />
            </label>
            <label className="block">
              <span className={`mb-2 block ${ui.label}`}>Attachment (optional)</span>
              <input
                type="file"
                onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
                className={ui.input}
              />
              {file && <p className="mt-1 text-xs text-slate-500">{file.name}</p>}
            </label>
            {status && <p className="text-sm text-emerald-600">{status}</p>}
          </div>

          <div className="mt-auto flex gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={onClose} className={`flex-1 ${ui.btnGhost}`}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={`flex-1 ${ui.btnPrimary}`}>
              {saving ? 'Publishing…' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}
