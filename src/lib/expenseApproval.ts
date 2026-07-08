export type ExpenseCategory = 'fixed' | 'incidental'

export type ExpenseApprovalStatus = 'auto_posted' | 'pending' | 'approved' | 'rejected'

export type SocietyExpenseEntry = {
  id: string
  societyId: string
  category: ExpenseCategory
  type: 'credit' | 'debit'
  amount: number
  description: string
  date: string
  status: ExpenseApprovalStatus
  invoiceUrl?: string | null
  submittedBy?: string
  reviewedBy?: string
  reviewedAt?: string
}

const STORAGE_PREFIX = 'syncra-society-expenses'

function storageKey(societyId: string) {
  return `${STORAGE_PREFIX}:${societyId}`
}

export const FIXED_EXPENSE_HINTS = ['guard salary', 'electricity', 'water bill', 'maintenance staff', 'security']
export const INCIDENTAL_EXPENSE_HINTS = ['repair', 'vendor', 'purchase', 'renovation', 'special', 'adhoc']

export function classifyExpense(description: string): ExpenseCategory {
  const lower = description.toLowerCase()
  if (FIXED_EXPENSE_HINTS.some((hint) => lower.includes(hint))) return 'fixed'
  if (INCIDENTAL_EXPENSE_HINTS.some((hint) => lower.includes(hint))) return 'incidental'
  return 'incidental'
}

export function listSocietyExpenses(societyId: string | null | undefined): SocietyExpenseEntry[] {
  if (!societyId || typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(societyId))
    return raw ? (JSON.parse(raw) as SocietyExpenseEntry[]) : []
  } catch {
    return []
  }
}

function persist(societyId: string, rows: SocietyExpenseEntry[]) {
  localStorage.setItem(storageKey(societyId), JSON.stringify(rows))
}

export function submitExpense(
  societyId: string,
  payload: {
    type: 'credit' | 'debit'
    amount: number
    description: string
    category?: ExpenseCategory
    invoiceUrl?: string | null
    submittedBy?: string
  }
): SocietyExpenseEntry {
  const category = payload.category ?? classifyExpense(payload.description)
  const status: ExpenseApprovalStatus = category === 'fixed' ? 'auto_posted' : 'pending'
  const entry: SocietyExpenseEntry = {
    id: `exp-${Date.now()}`,
    societyId,
    category,
    type: payload.type,
    amount: payload.amount,
    description: payload.description,
    date: new Date().toISOString(),
    status,
    invoiceUrl: payload.invoiceUrl ?? null,
    submittedBy: payload.submittedBy
  }
  const rows = listSocietyExpenses(societyId)
  persist(societyId, [entry, ...rows])
  return entry
}

export function reviewExpense(
  societyId: string,
  expenseId: string,
  decision: 'approved' | 'rejected',
  reviewerEmail: string
): SocietyExpenseEntry | null {
  const rows = listSocietyExpenses(societyId)
  let updated: SocietyExpenseEntry | null = null
  const next = rows.map((row) => {
    if (row.id !== expenseId || row.status !== 'pending') return row
    updated = {
      ...row,
      status: decision,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerEmail
    }
    return updated
  })
  persist(societyId, next)
  return updated
}

export function pendingIncidentalExpenses(societyId: string | null | undefined) {
  return listSocietyExpenses(societyId).filter((e) => e.category === 'incidental' && e.status === 'pending')
}

export function cashbookReadyExpenses(societyId: string | null | undefined) {
  return listSocietyExpenses(societyId).filter((e) => e.status === 'auto_posted' || e.status === 'approved')
}
