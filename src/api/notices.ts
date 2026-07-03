import type { Notice } from '../types/db'
import { restGet, restPost, restDelete } from './supabaseClient'
import { isRemoteSocietyId } from './societies'
import { uploadDocument } from '../utils/upload'
import { logActivity } from '../lib/activityLog'

function noticesKey(societyId: string) {
  return `syncra-notices-${societyId}`
}

function loadLocalNotices(societyId: string): Notice[] {
  try {
    const raw = localStorage.getItem(noticesKey(societyId))
    return raw ? (JSON.parse(raw) as Notice[]) : []
  } catch {
    return []
  }
}

function saveLocalNotices(societyId: string, notices: Notice[]) {
  localStorage.setItem(noticesKey(societyId), JSON.stringify(notices))
}

function sortNotices(notices: Notice[]) {
  return [...notices].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  )
}

export async function listNotices(societyId: string): Promise<Notice[]> {
  if (!isRemoteSocietyId(societyId)) {
    return sortNotices(loadLocalNotices(societyId))
  }

  const local = loadLocalNotices(societyId)

  try {
    const data = await restGet<Notice[]>(`notices?society_id=eq.${societyId}&order=created_at.desc`)
    const remote = data ?? []
    if (remote.length === 0 && local.length > 0) return sortNotices(local)
    return sortNotices(remote)
  } catch {
    return sortNotices(local)
  }
}

export async function createNotice(payload: Partial<Notice>, file?: File) {
  const body: Notice = {
    id: `notice-${Date.now()}`,
    society_id: payload.society_id!,
    title: payload.title ?? '',
    body: payload.body ?? '',
    created_at: new Date().toISOString(),
    attachment_url: null
  }

  if (file) {
    body.attachment_url = await uploadDocument(file)
  }

  const saveLocal = () => {
    const local = loadLocalNotices(body.society_id)
    local.unshift(body)
    saveLocalNotices(body.society_id, local)
    logActivity({
      societyId: body.society_id,
      category: 'notice',
      action: 'notice_published',
      summary: `Notice published: ${body.title}`,
      metadata: { noticeId: body.id }
    })
    return body
  }

  if (!isRemoteSocietyId(body.society_id)) {
    return saveLocal()
  }

  try {
    const created = await restPost<Notice>('notices', body)
    logActivity({
      societyId: body.society_id,
      category: 'notice',
      action: 'notice_published',
      summary: `Notice published: ${body.title}`,
      metadata: { noticeId: created?.id ?? body.id }
    })
    return created ?? body
  } catch {
    return saveLocal()
  }
}

export async function deleteNotice(id: string, societyId?: string) {
  if (societyId && !isRemoteSocietyId(societyId)) {
    saveLocalNotices(
      societyId,
      loadLocalNotices(societyId).filter((n) => n.id !== id)
    )
    return
  }

  try {
    await restDelete(`notices?id=eq.${id}`)
  } catch {
    if (societyId) {
      saveLocalNotices(
        societyId,
        loadLocalNotices(societyId).filter((n) => n.id !== id)
      )
    }
  }
}
