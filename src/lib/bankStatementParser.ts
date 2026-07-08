export type BankTransaction = {
  reference: string
  date: string
  amount: number
  description: string
  type: 'credit' | 'debit'
}

export type ParsedBankStatement = {
  transactions: BankTransaction[]
  skippedDuplicates: BankTransaction[]
  imported: BankTransaction[]
}

export type ExistingLedgerFingerprint = {
  reference: string
  date: string
  amount: number
}

const PROCESSED_PREFIX = 'syncra-bank-processed'

function processedKey(societyId: string) {
  return `${PROCESSED_PREFIX}:${societyId}`
}

export function readProcessedFingerprints(societyId: string): ExistingLedgerFingerprint[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(processedKey(societyId))
    return raw ? (JSON.parse(raw) as ExistingLedgerFingerprint[]) : []
  } catch {
    return []
  }
}

export function appendProcessedFingerprints(societyId: string, rows: ExistingLedgerFingerprint[]) {
  const existing = readProcessedFingerprints(societyId)
  const merged = [...existing]
  for (const row of rows) {
    if (!merged.some((e) => fingerprintMatch(e, row))) merged.push(row)
  }
  localStorage.setItem(processedKey(societyId), JSON.stringify(merged))
}

function normalizeRef(ref: string) {
  return ref.trim().toUpperCase().replace(/\s+/g, '')
}

function normalizeDate(date: string) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date.trim()
  return d.toISOString().slice(0, 10)
}

function fingerprintMatch(a: ExistingLedgerFingerprint, b: ExistingLedgerFingerprint) {
  return (
    normalizeRef(a.reference) === normalizeRef(b.reference) &&
    normalizeDate(a.date) === normalizeDate(b.date) &&
    Math.abs(a.amount - b.amount) < 0.01
  )
}

/** Idempotent reconciliation — skips rows already recorded (ref + date + amount). */
export function reconcileBankTransactions(
  incoming: BankTransaction[],
  existing: ExistingLedgerFingerprint[],
  cutoffDay = 16
): ParsedBankStatement {
  const skippedDuplicates: BankTransaction[] = []
  const imported: BankTransaction[] = []

  for (const tx of incoming) {
    const fingerprint = { reference: tx.reference, date: tx.date, amount: tx.amount }
    const day = new Date(tx.date).getDate()

    const exactDuplicate = existing.some((e) => fingerprintMatch(e, fingerprint))
    const periodDuplicate =
      !Number.isNaN(day) &&
      day <= cutoffDay &&
      existing.some((e) => {
        const existingDay = new Date(e.date).getDate()
        return (
          existingDay <= cutoffDay &&
          normalizeRef(e.reference) === normalizeRef(tx.reference) &&
          Math.abs(e.amount - tx.amount) < 0.01
        )
      })

    if (exactDuplicate || periodDuplicate) {
      skippedDuplicates.push(tx)
      continue
    }

    imported.push(tx)
  }

  return { transactions: incoming, skippedDuplicates, imported }
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
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

/** Parse CSV bank exports — expects ref, date, amount, description columns (flexible header match). */
export async function parseBankStatementFile(file: File): Promise<BankTransaction[]> {
  const text = await file.text()
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
  const refIdx = header.findIndex((h) => /ref|utr|txn|transaction/.test(h))
  const dateIdx = header.findIndex((h) => /date/.test(h))
  const amountIdx = header.findIndex((h) => /amount|credit|debit|value/.test(h))
  const descIdx = header.findIndex((h) => /desc|narration|particular/.test(h))

  const transactions: BankTransaction[] = []
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i])
    const reference = cells[refIdx >= 0 ? refIdx : 0] ?? `ROW-${i}`
    const date = cells[dateIdx >= 0 ? dateIdx : 1] ?? new Date().toISOString().slice(0, 10)
    const rawAmount = cells[amountIdx >= 0 ? amountIdx : 2] ?? '0'
    const amount = Math.abs(Number(String(rawAmount).replace(/[^0-9.-]/g, '')))
    const description = cells[descIdx >= 0 ? descIdx : 3] ?? 'Bank statement import'
    if (!amount) continue
    transactions.push({
      reference,
      date,
      amount,
      description,
      type: Number(rawAmount) < 0 ? 'debit' : 'credit'
    })
  }
  return transactions
}

export function ledgerToFingerprints(
  entries: Array<{ date: string; amount: number; description?: string | null }>
): ExistingLedgerFingerprint[] {
  return entries.map((e) => ({
    reference: (e.description ?? '').slice(0, 40) || `LEDGER-${e.date}-${e.amount}`,
    date: e.date,
    amount: Number(e.amount)
  }))
}
