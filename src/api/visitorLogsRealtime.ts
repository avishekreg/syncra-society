import type { RealtimeChannel } from '@supabase/supabase-js'
import supabase from './supabaseSdk'

export type VisitorLogInsertHandler = (payload: { societyId: string; id: string }) => void

/** Platform-wide visitor_logs INSERT stream for control-tower topology pulses. */
export function subscribeToVisitorLogInserts(onInsert: VisitorLogInsertHandler): () => void {
  const channelName = 'platform-visitor-logs-insert'

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'visitor_logs'
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>
        const societyId = String(row.society_id ?? '')
        const id = String(row.id ?? '')
        if (!societyId) return
        onInsert({ societyId, id })
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
