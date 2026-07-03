import { createAdminClient } from '@/lib/supabase/admin'
import type { PremiumAddon } from '@/types/database'

export class AddonForbiddenError extends Error {
  status = 403
  addon: PremiumAddon

  constructor(addon: PremiumAddon) {
    super(`Premium module '${addon}' is not active for this society.`)
    this.addon = addon
  }
}

export async function getSocietyAddons(societyId: string): Promise<string[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('societies')
    .select('active_addons')
    .eq('id', societyId)
    .single()

  if (error || !data) return []
  return data.active_addons ?? []
}

export async function societyHasAddon(societyId: string, addon: PremiumAddon): Promise<boolean> {
  const addons = await getSocietyAddons(societyId)
  return addons.includes(addon)
}

export async function requireSocietyAddon(societyId: string, addon: PremiumAddon) {
  const allowed = await societyHasAddon(societyId, addon)
  if (!allowed) throw new AddonForbiddenError(addon)
}

export async function getSocietyIdForFlat(flatId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('flats').select('society_id').eq('id', flatId).single()
  return data?.society_id ?? null
}

export async function requireFlatAddon(flatId: string, addon: PremiumAddon) {
  const societyId = await getSocietyIdForFlat(flatId)
  if (!societyId) throw new Error('Flat not found')
  await requireSocietyAddon(societyId, addon)
  return societyId
}
