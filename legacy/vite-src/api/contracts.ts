import { MaintenanceContract } from '../types/db'
import { restGet, restPost, restPatch, restDelete } from './supabaseClient'
import { uploadDocument } from '../utils/upload'

export async function listContracts(societyId: string): Promise<MaintenanceContract[]> {
  return restGet<MaintenanceContract[]>(`maintenance_contracts?society_id=eq.${societyId}&order=end_date.desc`)
}

export async function getContract(id: string): Promise<MaintenanceContract | null> {
  const res = await restGet<MaintenanceContract[]>(`maintenance_contracts?id=eq.${id}`)
  return res?.[0] ?? null
}

export async function createContract(payload: Partial<MaintenanceContract>, documentFile?: File) {
  const body: any = { ...payload }
  if (documentFile) {
    const url = await uploadDocument(documentFile)
    body.document_url = url
  }
  return restPost('maintenance_contracts', body)
}

export async function updateContract(id: string, patch: Partial<MaintenanceContract>) {
  return restPatch(`maintenance_contracts?id=eq.${id}`, patch)
}

export async function deleteContract(id: string) {
  return restDelete(`maintenance_contracts?id=eq.${id}`)
}
