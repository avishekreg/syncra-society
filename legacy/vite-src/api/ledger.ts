import { SocietyLedgerEntry } from '../types/db'
import { restGet, restPost } from './supabaseClient'

export async function listLedger(societyId: string): Promise<SocietyLedgerEntry[]> {
  return restGet<SocietyLedgerEntry[]>(`society_ledger?society_id=eq.${societyId}&order=date.desc`)
}

export async function createLedgerEntry(entry: Partial<SocietyLedgerEntry>) {
  return restPost('society_ledger', entry)
}
