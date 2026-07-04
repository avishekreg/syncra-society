import type { Notice } from '../types/db'
import { restGet, restPost, restDelete } from './supabaseClient'
import { isRemoteSocietyId } from './societies'
import { uploadDocument } from '../utils/upload'
import { logActivity } from '../lib/activityLog'
import { resolveClientN8nWebhookUrl } from '../lib/n8nConfig'
import { isWhatsAppAlertsActive } from '../lib/societyModuleConfig'
import { listRegisteredSocieties } from '../lib/societyRegistry'
import {
  resolveNoticeReceiverPhones,
  resolveSocietySenderWhatsapp
} from '../lib/whatsappRouting'

export type NoticeViewReceipt = {
  noticeId: string
  userId?: string | null
  flatNumber?: string | null
  viewedAt: string
}

export function formatNoticeTimestamp(iso?: string | null) {
  if (!iso) return 'Date unavailable'
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

function noticesKey(societyId: string) {
  return `syncra-notices-${societyId}`
}

function noticeViewsKey(societyId: string) {
  return `syncra-notice-views-${societyId}`
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

function loadViewReceipts(societyId: string): NoticeViewReceipt[] {
  try {
    const raw = localStorage.getItem(noticeViewsKey(societyId))
    return raw ? (JSON.parse(raw) as NoticeViewReceipt[]) : []
  } catch {
    return []
  }
}

function saveViewReceipts(societyId: string, receipts: NoticeViewReceipt[]) {
  localStorage.setItem(noticeViewsKey(societyId), JSON.stringify(receipts.slice(0, 2000)))
}

function sortNotices(notices: Notice[]) {
  return [...notices].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  )
}

export function getNoticeViewStats(societyId: string, noticeId: string) {
  const receipts = loadViewReceipts(societyId).filter((receipt) => receipt.noticeId === noticeId)
  const uniqueFlats = new Set(receipts.map((receipt) => receipt.flatNumber).filter(Boolean))
  return {
    totalViews: receipts.length,
    uniqueResidents: uniqueFlats.size,
    receipts
  }
}

export function recordNoticeView(input: {
  societyId: string
  noticeId: string
  userId?: string | null
  flatNumber?: string | null
}) {
  const receipts = loadViewReceipts(input.societyId)
  const alreadySeen = receipts.some(
    (receipt) =>
      receipt.noticeId === input.noticeId &&
      ((input.userId && receipt.userId === input.userId) ||
        (input.flatNumber && receipt.flatNumber === input.flatNumber))
  )
  if (alreadySeen) return getNoticeViewStats(input.societyId, input.noticeId)

  receipts.unshift({
    noticeId: input.noticeId,
    userId: input.userId ?? null,
    flatNumber: input.flatNumber ?? null,
    viewedAt: new Date().toISOString()
  })
  saveViewReceipts(input.societyId, receipts)

  logActivity({
    societyId: input.societyId,
    userId: input.userId ?? null,
    flatNumber: input.flatNumber ?? null,
    category: 'notice',
    action: 'notice_viewed',
    summary: `Notice viewed${input.flatNumber ? ` by Flat ${input.flatNumber}` : ''}`,
    metadata: { noticeId: input.noticeId }
  })

  return getNoticeViewStats(input.societyId, input.noticeId)
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

function societyNameForId(societyId: string) {
  return listRegisteredSocieties().find((society) => society.id === societyId)?.name ?? 'Society'
}

function buildNoticeMessageBody(notice: Notice, societyName: string) {
  const timestamp = formatNoticeTimestamp(notice.created_at)
  return `📢 ${societyName}\n\n${notice.title}\n\n${notice.body}\n\nPublished: ${timestamp}`
}

/** Sole notice webhook dispatcher — POSTs to n8n only when whatsapp_alerts is active. */
async function postNoticePublishedToN8n(notice: Notice) {
  const whatsappActive = await isWhatsAppAlertsActive(notice.society_id)
  if (!whatsappActive) {
    console.info(
      `[notices] whatsapp_alerts inactive for society ${notice.society_id} — skipping n8n dispatch`
    )
    return
  }

  const societyName = societyNameForId(notice.society_id)
  const messageBody = buildNoticeMessageBody(notice, societyName)
  const publishedAt = notice.created_at ?? new Date().toISOString()
  const senderWhatsapp = await resolveSocietySenderWhatsapp(notice.society_id)
  const receiverPhones = await resolveNoticeReceiverPhones(notice.society_id)
  const targets = receiverPhones.length > 0 ? receiverPhones : ['']

  await Promise.all(
    targets.map(async (receiverWhatsapp) => {
      const payload = {
        eventId: receiverWhatsapp
          ? `notice-${notice.id}-${receiverWhatsapp.replace(/\D/g, '')}`
          : `notice-${notice.id}`,
        type: 'notice.published' as const,
        societyId: notice.society_id,
        societyName,
        flatNumber: null,
        summary: `New notice: ${notice.title}`,
        occurredAt: publishedAt,
        title: notice.title,
        message: messageBody,
        message_body: messageBody,
        body: notice.body,
        sender_whatsapp: senderWhatsapp,
        receiver_whatsapp: receiverWhatsapp,
        metadata: {
          noticeId: notice.id,
          title: notice.title,
          body: notice.body,
          message: messageBody,
          message_body: messageBody,
          publishedAt,
          sender_whatsapp: senderWhatsapp,
          receiver_whatsapp: receiverWhatsapp
        }
      }

      const webhookUrl = resolveClientN8nWebhookUrl(notice.society_id)
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.warn(
          `[notices] n8n webhook failed (${res.status})`,
          text || res.statusText,
          webhookUrl
        )
      }
    })
  )
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

  const saveLocal = async () => {
    const local = loadLocalNotices(body.society_id)
    local.unshift(body)
    saveLocalNotices(body.society_id, local)
    logActivity({
      societyId: body.society_id,
      category: 'notice',
      action: 'notice_published',
      summary: `Notice published: ${body.title}`,
      metadata: { noticeId: body.id, publishedAt: body.created_at }
    })
    await postNoticePublishedToN8n(body)
    return body
  }

  if (!isRemoteSocietyId(body.society_id)) {
    return saveLocal()
  }

  try {
    const created = await restPost<Notice>('notices', body)
    const notice = created ?? body
    logActivity({
      societyId: body.society_id,
      category: 'notice',
      action: 'notice_published',
      summary: `Notice published: ${body.title}`,
      metadata: { noticeId: notice.id, publishedAt: notice.created_at ?? body.created_at }
    })
    await postNoticePublishedToN8n(notice)
    return notice
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
