import type { TenantRequest } from '../types/db'
import { restGet, restPost, supabaseRestUrl, getSupabaseRestHeaders } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { ensureSocietyFlatId } from './flatRegistry'
import { uploadDocument } from '../utils/upload'

let localMode = false
let localRequests: TenantRequest[] = []

function randomId() {
  return `local-tenant-${Math.random().toString(36).slice(2, 10)}`
}

async function callRpc<T>(fnName: string, body: Record<string, unknown>): Promise<T> {
  const url = supabaseRestUrl(`rpc/${fnName}`)
  const res = await fetch(url, {
    method: 'POST',
    headers: getSupabaseRestHeaders(),
    body: JSON.stringify(body)
  })
  const text = await res.text()
  if (!res.ok) {
    let message = res.statusText || `RPC ${fnName} failed`
    try {
      const parsed = JSON.parse(text) as { message?: string; error?: string }
      message = parsed.message ?? parsed.error ?? message
    } catch {
      if (text) message = text
    }
    throw new Error(message)
  }
  if (!text) return null as T
  return JSON.parse(text) as T
}

export async function listTenantRequestsForOwner(
  societyId: string,
  ownerId: string
): Promise<TenantRequest[]> {
  if (localMode) {
    return localRequests.filter((row) => row.society_id === societyId && row.owner_id === ownerId)
  }
  try {
    return await restGet<TenantRequest[]>(
      `tenant_requests?society_id=eq.${societyId}&owner_id=eq.${encodeURIComponent(ownerId)}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listTenantRequestsForOwner(societyId, ownerId)
  }
}

export async function listTenantRequestsForSociety(societyId: string): Promise<TenantRequest[]> {
  if (localMode) {
    return localRequests.filter((row) => row.society_id === societyId)
  }
  try {
    return await restGet<TenantRequest[]>(
      `tenant_requests?society_id=eq.${societyId}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listTenantRequestsForSociety(societyId)
  }
}

export async function listPendingTenantRequests(societyId: string): Promise<TenantRequest[]> {
  const all = await listTenantRequestsForSociety(societyId)
  return all.filter((row) => row.status === 'PENDING_APPROVAL')
}

export async function uploadLeaseAgreement(file: File): Promise<string> {
  if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Please upload a PDF rental agreement.')
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('Agreement PDF must be under 12 MB.')
  }
  return uploadDocument(file)
}

export async function submitTenantRequest(input: {
  societyId: string
  flatNumber: string
  ownerId: string
  tenantName: string
  tenantPhone: string
  tenantEmail?: string
  occupantsCount: number
  leaseStartDate: string
  leaseEndDate: string
  agreementFile?: File | null
}): Promise<TenantRequest> {
  if (!input.tenantName.trim() || !input.tenantPhone.trim()) {
    throw new Error('Tenant name and phone are required.')
  }
  if (!input.leaseStartDate || !input.leaseEndDate) {
    throw new Error('Lease start and end dates are required.')
  }
  if (input.leaseEndDate < input.leaseStartDate) {
    throw new Error('Lease end date must be on or after the start date.')
  }

  const flatId = await ensureSocietyFlatId(input.societyId, input.flatNumber)
  const agreementDocUrl = input.agreementFile ? await uploadLeaseAgreement(input.agreementFile) : null

  const payload = {
    society_id: input.societyId,
    flat_id: flatId,
    flat_number: input.flatNumber.trim(),
    owner_id: input.ownerId,
    tenant_name: input.tenantName.trim(),
    tenant_phone: input.tenantPhone.trim(),
    tenant_email: input.tenantEmail?.trim() || null,
    occupants_count: Math.max(1, input.occupantsCount || 1),
    lease_start_date: input.leaseStartDate,
    lease_end_date: input.leaseEndDate,
    agreement_doc_url: agreementDocUrl,
    status: 'PENDING_APPROVAL' as const
  }

  if (localMode) {
    const row: TenantRequest = {
      id: randomId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      approved_by: null,
      rejection_reason: null,
      tenant_user_id: null,
      ...payload
    }
    localRequests.unshift(row)
    return row
  }

  try {
    return await restPost<TenantRequest>('tenant_requests', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return submitTenantRequest(input)
  }
}

export async function approveTenantRequest(requestId: string): Promise<TenantRequest> {
  if (localMode) {
    const row = localRequests.find((item) => item.id === requestId)
    if (!row) throw new Error('Tenant request not found')
    if (row.status !== 'PENDING_APPROVAL') throw new Error('Request is not pending approval')
    row.status = 'APPROVED'
    row.approved_by = 'local-admin'
    row.tenant_user_id = row.tenant_email || `tenant:${row.id}`
    row.updated_at = new Date().toISOString()
    return row
  }

  try {
    const result = await callRpc<TenantRequest | TenantRequest[]>('approve_tenant_request', {
      request_id: requestId
    })
    return Array.isArray(result) ? result[0] : result
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return approveTenantRequest(requestId)
  }
}

export async function rejectTenantRequest(requestId: string, reason?: string): Promise<TenantRequest> {
  if (localMode) {
    const row = localRequests.find((item) => item.id === requestId)
    if (!row) throw new Error('Tenant request not found')
    row.status = 'REJECTED'
    row.approved_by = 'local-admin'
    row.rejection_reason = reason ?? null
    row.updated_at = new Date().toISOString()
    return row
  }

  try {
    const result = await callRpc<TenantRequest | TenantRequest[]>('reject_tenant_request', {
      request_id: requestId,
      p_reason: reason ?? null
    })
    return Array.isArray(result) ? result[0] : result
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return rejectTenantRequest(requestId, reason)
  }
}

export function tenantStatusBadgeClass(status: TenantRequest['status']) {
  if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-800'
  if (status === 'REJECTED') return 'bg-rose-100 text-rose-800'
  return 'bg-amber-100 text-amber-800'
}

export function tenantStatusLabel(status: TenantRequest['status']) {
  if (status === 'PENDING_APPROVAL') return 'Pending approval'
  if (status === 'APPROVED') return 'Approved'
  return 'Rejected'
}
