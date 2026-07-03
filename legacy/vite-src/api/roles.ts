import { CustomRole } from '../types/db'
import { restGet, restPost, restPatch, restDelete } from './supabaseClient'

export async function listRoles(societyId: string): Promise<CustomRole[]> {
  return restGet<CustomRole[]>(`custom_roles?society_id=eq.${societyId}&order=name.asc`)
}

export async function getRole(id: string): Promise<CustomRole | null> {
  const res = await restGet<CustomRole[]>(`custom_roles?id=eq.${id}`)
  return res?.[0] ?? null
}

export async function createRole(payload: Partial<CustomRole>) {
  return restPost('custom_roles', payload)
}

export async function updateRole(id: string, patch: Partial<CustomRole>) {
  return restPatch(`custom_roles?id=eq.${id}`, patch)
}

export async function deleteRole(id: string) {
  return restDelete(`custom_roles?id=eq.${id}`)
}
