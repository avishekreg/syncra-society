import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Complaint } from '../types/db'
import supabase from './supabaseSdk'

const COMPLAINTS_TABLE = 'complaints_and_suggestions'

function normalizeComplaintRow(row: Record<string, unknown>): Complaint {
  return {
    id: String(row.id),
    society_id: String(row.society_id),
    raised_by_user_id: String(row.raised_by_user_id),
    subject: String(row.subject),
    description: row.description != null ? String(row.description) : null,
    status: (row.status as Complaint['status']) ?? 'open',
    created_at: row.created_at != null ? String(row.created_at) : undefined,
    updated_at: row.updated_at != null ? String(row.updated_at) : undefined
  }
}

function matchesSociety(row: Record<string, unknown>, societyIds: string[]) {
  const rowSocietyId = String(row.society_id ?? '')
  return societyIds.some((id) => id && rowSocietyId === id)
}

export type ComplaintsInsertHandler = (complaint: Complaint) => void

/**
 * Subscribe to new rows in `complaints_and_suggestions` for a society (WhatsApp / n8n / portal).
 * Returns an unsubscribe function — call it on component unmount.
 */
export function subscribeToComplaints(
  societyId: string,
  onInsert: ComplaintsInsertHandler,
  alternateSocietyIds: string[] = []
): () => void {
  const societyIds = Array.from(
    new Set([societyId, ...alternateSocietyIds].filter(Boolean))
  )

  if (!societyId || societyIds.length === 0) {
    return () => undefined
  }

  const primaryUuid = societyIds.find((id) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )

  const channelName = `complaints-insert-${primaryUuid ?? societyId}`.replace(/[^a-zA-Z0-9-_]/g, '-')

  const filter = primaryUuid ? `society_id=eq.${primaryUuid}` : undefined

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: COMPLAINTS_TABLE,
        ...(filter ? { filter } : {})
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>
        if (!matchesSociety(row, societyIds)) return
        onInsert(normalizeComplaintRow(row))
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
