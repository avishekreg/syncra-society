import React from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { listGalleryPhotos } from '../../api/gallery'
import { ui } from '../../lib/ui'
import { formatActivityTimestamp } from '../../lib/activityLog'

export default function ResidentGalleryPage() {
  const { currentSocietyId } = useAuth()
  const photos = currentSocietyId ? listGalleryPhotos(currentSocietyId) : []

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Photo gallery</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Memorable moments</h2>
        <p className={`mt-2 ${ui.body}`}>Celebrations, events, and community highlights from your society.</p>
      </section>

      {photos.length === 0 ? (
        <section className={ui.card}>
          <p className={ui.body}>No photos uploaded yet.</p>
        </section>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <article key={photo.id} className={ui.card}>
              <img src={photo.imageDataUrl} alt={photo.title} className="h-48 w-full rounded-xl object-cover" />
              <h3 className="mt-4 font-semibold text-syncra-primary">{photo.title}</h3>
              {photo.caption && <p className={`mt-2 text-sm ${ui.body}`}>{photo.caption}</p>}
              <p className="mt-2 text-xs text-slate-500">{formatActivityTimestamp(photo.uploadedAt)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
