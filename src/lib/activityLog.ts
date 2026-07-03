export type ActivityCategory =
  | 'account'
  | 'payment'
  | 'visitor'
  | 'notice'
  | 'survey'
  | 'gallery'
  | 'election'
  | 'helpdesk'

export type ActivityEntry = {
  id: string
  societyId: string
  userId?: string | null
  flatNumber?: string | null
  category: ActivityCategory
  action: string
  summary: string
  metadata?: Record<string, unknown>
  occurredAt: string
}

function storageKey(societyId: string) {
  return `syncra-activity-${societyId}`
}

function loadEntries(societyId: string): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(societyId))
    return raw ? (JSON.parse(raw) as ActivityEntry[]) : []
  } catch {
    return []
  }
}

function saveEntries(societyId: string, entries: ActivityEntry[]) {
  localStorage.setItem(storageKey(societyId), JSON.stringify(entries.slice(0, 500)))
}

export function logActivity(input: Omit<ActivityEntry, 'id' | 'occurredAt'> & { occurredAt?: string }) {
  const entry: ActivityEntry = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    ...input
  }
  const existing = loadEntries(input.societyId)
  saveEntries(input.societyId, [entry, ...existing])

  void import('./societyEvents').then(({ dispatchFromActivity }) => {
    const societyName =
      typeof localStorage !== 'undefined'
        ? (JSON.parse(localStorage.getItem('syncra-societies') ?? '[]') as Array<{ id: string; name: string }>).find(
            (s) => s.id === input.societyId
          )?.name
        : undefined
    void dispatchFromActivity(entry, societyName ?? 'Your Society')
  })

  return entry
}

export function listActivities(
  societyId: string,
  filters?: { userId?: string | null; flatNumber?: string | null; category?: ActivityCategory }
) {
  let entries = loadEntries(societyId)
  if (filters?.userId) {
    entries = entries.filter((e) => e.userId === filters.userId)
  }
  if (filters?.flatNumber) {
    entries = entries.filter((e) => e.flatNumber === filters.flatNumber || !e.flatNumber)
  }
  if (filters?.category) {
    entries = entries.filter((e) => e.category === filters.category)
  }
  return entries.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
}

export function formatActivityTimestamp(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(iso))
}

export function seedDemoActivities(societyId: string, flatNumber?: string | null) {
  if (loadEntries(societyId).length > 0) return

  const now = Date.now()
  const samples: Omit<ActivityEntry, 'id'>[] = [
    {
      societyId,
      userId: null,
      flatNumber: flatNumber ?? '402',
      category: 'visitor',
      action: 'visitor_approved',
      summary: 'Visitor Rajesh Mehta approved for entry',
      occurredAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      metadata: { visitor: 'Rajesh Mehta', purpose: 'Delivery' }
    },
    {
      societyId,
      userId: null,
      flatNumber: flatNumber ?? '402',
      category: 'payment',
      action: 'maintenance_paid',
      summary: 'Maintenance payment of ₹3,500 recorded via UPI',
      occurredAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      metadata: { amount: 3500, method: 'UPI' }
    },
    {
      societyId,
      userId: null,
      flatNumber: null,
      category: 'notice',
      action: 'notice_published',
      summary: 'Society AGM scheduled for 15 Jul 2026',
      occurredAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  for (const sample of samples) {
    logActivity(sample)
  }
}
