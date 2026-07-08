export type PendingPaymentStatus = 'pending' | 'approved' | 'rejected'

export type PendingOfflinePayment = {
  id: string
  societyId: string
  flatNumber: string
  residentName: string
  amount: number
  paymentDate: string
  referenceNumber: string
  method: 'bank_transfer' | 'cash' | 'cheque'
  notes?: string
  status: PendingPaymentStatus
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
}

const STORAGE_PREFIX = 'syncra-pending-payments'

function storageKey(societyId: string) {
  return `${STORAGE_PREFIX}:${societyId}`
}

export function listPendingPayments(societyId: string | null | undefined): PendingOfflinePayment[] {
  if (!societyId || typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(societyId))
    if (!raw) return seedDemoPendingPayments(societyId)
    return JSON.parse(raw) as PendingOfflinePayment[]
  } catch {
    return []
  }
}

function persist(societyId: string, rows: PendingOfflinePayment[]) {
  localStorage.setItem(storageKey(societyId), JSON.stringify(rows))
}

function seedDemoPendingPayments(societyId: string): PendingOfflinePayment[] {
  const seeded: PendingOfflinePayment[] = [
    {
      id: `pp-${societyId}-402`,
      societyId,
      flatNumber: '402',
      residentName: 'Demo Resident',
      amount: 4500,
      paymentDate: new Date().toISOString().slice(0, 10),
      referenceNumber: 'NEFT-20260708-402',
      method: 'bank_transfer',
      notes: 'Offline NEFT to society account',
      status: 'pending',
      submittedAt: new Date().toISOString()
    },
    {
      id: `pp-${societyId}-305`,
      societyId,
      flatNumber: '305',
      residentName: 'Flat 305 Owner',
      amount: 5200,
      paymentDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      referenceNumber: 'CHQ-88421',
      method: 'cheque',
      status: 'pending',
      submittedAt: new Date().toISOString()
    }
  ]
  persist(societyId, seeded)
  return seeded
}

export function submitOfflinePayment(
  societyId: string,
  payload: Omit<PendingOfflinePayment, 'id' | 'societyId' | 'status' | 'submittedAt'>
): PendingOfflinePayment {
  const rows = listPendingPayments(societyId)
  const entry: PendingOfflinePayment = {
    ...payload,
    id: `pp-${Date.now()}`,
    societyId,
    status: 'pending',
    submittedAt: new Date().toISOString()
  }
  persist(societyId, [entry, ...rows])
  return entry
}

export function reviewPendingPayment(
  societyId: string,
  paymentId: string,
  decision: 'approved' | 'rejected',
  reviewerEmail: string
): PendingOfflinePayment | null {
  const rows = listPendingPayments(societyId)
  let updated: PendingOfflinePayment | null = null
  const next = rows.map((row) => {
    if (row.id !== paymentId) return row
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

export function pendingVerificationQueue(societyId: string | null | undefined) {
  return listPendingPayments(societyId).filter((p) => p.status === 'pending')
}
