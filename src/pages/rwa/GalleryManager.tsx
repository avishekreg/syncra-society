import React, { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { addGalleryPhoto, deleteGalleryPhoto, listGalleryPhotos } from '../../api/gallery'
import { ui } from '../../lib/ui'
import { formatActivityTimestamp } from '../../lib/activityLog'

export default function GalleryManager() {
  const { currentSocietyId, user } = useAuth()
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [refresh, setRefresh] = useState(0)

  const photos = currentSocietyId ? listGalleryPhotos(currentSocietyId) : []

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault()
    if (!currentSocietyId || !file || !user) return
    await addGalleryPhoto({
      societyId: currentSocietyId,
      title,
      caption,
      file,
      uploadedBy: user.email
    })
    setTitle('')
    setCaption('')
    setFile(null)
    setRefresh((n) => n + 1)
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Photo gallery</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Upload memorable moments</h2>
        <form onSubmit={(e) => void handleUpload(e)} className="mt-6 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={ui.input} placeholder="Photo title" required />
          <input value={caption} onChange={(e) => setCaption(e.target.value)} className={ui.input} placeholder="Caption (optional)" />
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={ui.input} required />
          <button type="submit" className={ui.btnPrimary}>Upload Photo</button>
        </form>
      </section>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <article key={`${photo.id}-${refresh}`} className={ui.card}>
            <img src={photo.imageDataUrl} alt={photo.title} className="h-40 w-full rounded-xl object-cover" />
            <h3 className="mt-3 font-semibold text-syncra-primary">{photo.title}</h3>
            <p className="mt-1 text-xs text-slate-500">{formatActivityTimestamp(photo.uploadedAt)}</p>
            {currentSocietyId && (
              <button type="button" onClick={() => { deleteGalleryPhoto(currentSocietyId, photo.id); setRefresh((n) => n + 1) }} className="mt-3 text-xs text-syncra-action-alt">
                Remove
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
