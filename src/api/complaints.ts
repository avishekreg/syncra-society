import type { Complaint } from '../types/db'
import { restGet, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { fetchApiJson } from './safeFetch'
import { logActivity } from '../lib/activityLog'

const LOCAL_KEY = 'syncra-local-complaints'

function readLocal(): Complaint[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeLocal(items: Complaint[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items))
}

function shouldFallback(err: unknown) {
  return shouldUseLocalFallback(err)
}

async function listComplaintsViaApi(
  societyId: string,
  userId?: string
): Promise<Complaint[] | null> {
  const params = new URLSearchParams({ society_id: societyId })
  if (userId) params.set('user_id', userId)
  return fetchApiJson<Complaint[]>(`/api/complaints?${params.toString()}`)
}

async function createComplaintViaApi(payload: {
  society_id: string
  raised_by_user_id: string
  subject: string
  description?: string
  status?: Complaint['status']
}): Promise<Complaint | null> {
  return fetchApiJson<Complaint>('/api/complaints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export async function listComplaintsForUser(societyId: string, userId: string): Promise<Complaint[]> {
  const fromApi = await listComplaintsViaApi(societyId, userId)
  if (fromApi) return fromApi

  try {
    return await restGet<Complaint[]>(
      `complaints_and_suggestions?society_id=eq.${societyId}&raised_by_user_id=eq.${userId}&order=created_at.desc`
    )
  } catch (err) {
    if (shouldFallback(err)) {
      return readLocal().filter((c) => c.society_id === societyId && c.raised_by_user_id === userId)
    }
    throw err
  }
}

export async function listComplaintsForSociety(societyId: string): Promise<Complaint[]> {
  try {
    const fromApi = await listComplaintsViaApi(societyId)
    if (fromApi) return fromApi

    return await restGet<Complaint[]>(
      `complaints_and_suggestions?society_id=eq.${societyId}&order=created_at.desc`
    )
  } catch (err) {
    if (shouldFallback(err)) {
      const local = readLocal().filter((c) => c.society_id === societyId)
      if (local.length) return local
      return []
    }
    throw err
  }
}

export async function createComplaint(payload: {
  society_id: string
  raised_by_user_id: string
  subject: string
  description?: string
  status?: Complaint['status']
}): Promise<Complaint> {
  const body = {
    ...payload,
    status: payload.status ?? 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const fromApi = await createComplaintViaApi(body)
  if (fromApi) {
    logActivity({
      societyId: payload.society_id,
      userId: payload.raised_by_user_id,
      category: 'helpdesk',
      action: 'ticket_opened',
      summary: `Helpdesk ticket opened: ${payload.subject}`,
      metadata: { ticketId: fromApi.id }
    })
    return fromApi
  }

  try {
    const created = await restPost<Complaint>('complaints_and_suggestions', body)
    logActivity({
      societyId: payload.society_id,
      userId: payload.raised_by_user_id,
      category: 'helpdesk',
      action: 'ticket_opened',
      summary: `Helpdesk ticket opened: ${payload.subject}`,
      metadata: { ticketId: created.id }
    })
    return created
  } catch (err) {
    if (shouldFallback(err)) {
      const created: Complaint = {
        id: `local-complaint-${Math.random().toString(36).slice(2, 9)}`,
        ...body
      }
      writeLocal([created, ...readLocal()])
      logActivity({
        societyId: payload.society_id,
        userId: payload.raised_by_user_id,
        category: 'helpdesk',
        action: 'ticket_opened',
        summary: `Helpdesk ticket opened: ${payload.subject}`,
        metadata: { ticketId: created.id }
      })
      return created
    }
    throw err
  }
}
