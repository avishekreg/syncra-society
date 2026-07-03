import type { DemoUnit } from '../types/db'
import { restPatch, restPost } from './supabaseClient'

export const SOCIETY_IMPORT_TEMPLATE_HEADERS = [
  'Block_Name',
  'Flat_Number',
  'Owner_Full_Name',
  'Owner_Email',
  'Owner_Mobile',
  'Super_Built_up_Area_Sq_Ft',
  'Opening_Outstanding_Balance',
  'Society_Starting_Bank_Balance'
] as const

export type SocietyImportRow = {
  blockName: string
  flatNumber: string
  ownerFullName: string
  ownerEmail: string
  ownerMobile: string
  areaSqFt: number
  openingOutstandingBalance: number
  societyStartingBankBalance: number
}

export type SocietyImportResult = {
  units: DemoUnit[]
  societyStartingBankBalance: number
  importedCount: number
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  cells.push(current.trim())
  return cells
}

function normalizeHeader(h: string) {
  return h.trim().replace(/\s+/g, '_')
}

export function parseSocietyCsv(text: string): SocietyImportRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map(normalizeHeader)
  const idx = (name: string) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase())

  const required = ['Block_Name', 'Flat_Number', 'Owner_Full_Name', 'Owner_Email']
  for (const col of required) {
    if (idx(col) === -1) {
      throw new Error(`Missing required column: ${col}`)
    }
  }

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line)
    const get = (col: string) => cells[idx(col)] ?? ''
    return {
      blockName: get('Block_Name'),
      flatNumber: get('Flat_Number'),
      ownerFullName: get('Owner_Full_Name'),
      ownerEmail: get('Owner_Email'),
      ownerMobile: get('Owner_Mobile'),
      areaSqFt: Number(get('Super_Built_up_Area_Sq_Ft')) || 0,
      openingOutstandingBalance: Number(get('Opening_Outstanding_Balance')) || 0,
      societyStartingBankBalance: Number(get('Society_Starting_Bank_Balance')) || 0
    }
  }).filter((row) => row.blockName && row.flatNumber && row.ownerFullName)
}

export function rowsToDemoUnits(rows: SocietyImportRow[]): SocietyImportResult {
  let societyStartingBankBalance = 0
  const units: DemoUnit[] = rows.map((row) => {
    if (row.societyStartingBankBalance > 0) {
      societyStartingBankBalance = row.societyStartingBankBalance
    }
    const flatKey = `${row.blockName}-${row.flatNumber}`
    const due = row.openingOutstandingBalance
    return {
      flat_number: flatKey,
      owner_name: row.ownerFullName,
      owner_email: row.ownerEmail,
      owner_mobile: row.ownerMobile,
      balance_status: due > 0 ? 'due' as const : 'paid' as const,
      balance_due: due,
      last_payment: due > 0 ? 'Legacy opening balance' : 'No outstanding dues',
      payment_history: due > 0 ? [] : [{ date: new Date().toLocaleDateString('en-IN'), amount: 0, method: 'Opening balance clear' }]
    }
  })

  return { units, societyStartingBankBalance, importedCount: units.length }
}

export function downloadSocietyImportTemplate() {
  const sample = [
    SOCIETY_IMPORT_TEMPLATE_HEADERS.join(','),
    'Block A,101,Anita Rao,anita@example.com,9876543210,1230,4500,250000',
    'Block A,102,Ravi Menon,ravi@example.com,9876501234,1180,0,250000',
    'Block B,201,Priya Joshi,priya@example.com,9123456780,1450,8200,250000'
  ].join('\n')

  const blob = new Blob([sample], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'syncra-society-import-template.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function persistSocietyImport(
  societyId: string,
  result: SocietyImportResult
): Promise<void> {
  if (result.societyStartingBankBalance > 0) {
    try {
      await restPatch(`societies?id=eq.${societyId}`, {
        opening_bank_balance: result.societyStartingBankBalance
      })
      await restPost('society_ledger', {
        society_id: societyId,
        date: new Date().toISOString(),
        type: 'credit',
        amount: result.societyStartingBankBalance,
        description: 'Society starting bank balance (Day 1 migration)'
      })
    } catch {
      // local/demo mode — caller updates showcase state
    }
  }

  for (const unit of result.units) {
    if (unit.balance_due <= 0) continue
    try {
      await restPost('user_and_flats', {
        society_id: societyId,
        flat_number: unit.flat_number,
        name: unit.owner_name,
        email: unit.owner_email,
        phone: unit.owner_mobile,
        opening_outstanding_balance: unit.balance_due,
        role: 'resident'
      })
      await restPost('society_ledger', {
        society_id: societyId,
        date: new Date().toISOString(),
        type: 'debit',
        amount: unit.balance_due,
        description: `Opening outstanding balance — Flat ${unit.flat_number}`
      })
    } catch {
      // continue — demo fallback handled by caller
    }
  }
}
