import { logActivity } from '../lib/activityLog'

export type GalleryPhoto = {
  id: string
  societyId: string
  title: string
  caption: string
  imageDataUrl: string
  uploadedBy: string
  uploadedAt: string
}

function galleryKey(societyId: string) {
  return `syncra-gallery-${societyId}`
}

function loadPhotos(societyId: string): GalleryPhoto[] {
  try {
    const raw = localStorage.getItem(galleryKey(societyId))
    return raw ? (JSON.parse(raw) as GalleryPhoto[]) : []
  } catch {
    return []
  }
}

function savePhotos(societyId: string, photos: GalleryPhoto[]) {
  localStorage.setItem(galleryKey(societyId), JSON.stringify(photos.slice(0, 100)))
}

export function listGalleryPhotos(societyId: string) {
  return loadPhotos(societyId).sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  )
}

export async function addGalleryPhoto(input: {
  societyId: string
  title: string
  caption: string
  file: File
  uploadedBy: string
}) {
  const imageDataUrl = await readFileAsDataUrl(input.file)
  const photo: GalleryPhoto = {
    id: `photo-${Date.now()}`,
    societyId: input.societyId,
    title: input.title,
    caption: input.caption,
    imageDataUrl,
    uploadedBy: input.uploadedBy,
    uploadedAt: new Date().toISOString()
  }
  const photos = loadPhotos(input.societyId)
  photos.unshift(photo)
  savePhotos(input.societyId, photos)
  logActivity({
    societyId: input.societyId,
    category: 'gallery',
    action: 'photo_uploaded',
    summary: `Photo added to gallery: ${photo.title}`,
    metadata: { photoId: photo.id }
  })
  return photo
}

export function deleteGalleryPhoto(societyId: string, photoId: string) {
  savePhotos(
    societyId,
    loadPhotos(societyId).filter((p) => p.id !== photoId)
  )
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Unable to read image file'))
    reader.readAsDataURL(file)
  })
}
