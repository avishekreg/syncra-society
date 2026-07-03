export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchN8nEvent, formatVisitorMessage } from '@/lib/n8n'
import { requireFlatAddon } from '@/lib/features/addon-guard'
import { addonErrorResponse } from '@/lib/auth/admin-guard'

const bodySchema = z.object({
  flat_id: z.string().uuid(),
  visitor_name: z.string().min(1),
  phone_number: z.string().min(5),
  purpose: z.string().min(1),
  entry_time: z.string().datetime().optional()
})

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('visitors')
    .select('*, flats(flat_number, owner_name, owner_phone, society_id, societies(name, active_addons))')
    .order('entry_time', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.parse(await request.json())
    const supabase = createAdminClient()

    await requireFlatAddon(parsed.flat_id, 'whatsapp_automation')

    const { data: flat, error: flatError } = await supabase
      .from('flats')
      .select('flat_number, owner_name, owner_phone')
      .eq('id', parsed.flat_id)
      .single()

    if (flatError || !flat) {
      return NextResponse.json({ error: 'Flat not found' }, { status: 404 })
    }

    const { data: visitor, error } = await supabase
      .from('visitors')
      .insert({
        flat_id: parsed.flat_id,
        visitor_name: parsed.visitor_name,
        phone_number: parsed.phone_number,
        purpose: parsed.purpose,
        entry_time: parsed.entry_time ?? new Date().toISOString()
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const message = formatVisitorMessage(
      parsed.visitor_name,
      parsed.purpose,
      flat.flat_number,
      flat.owner_name
    )

    let n8n = { ok: true }
    try {
      await dispatchN8nEvent({
        event_type: 'visitor',
        phone_number: flat.owner_phone,
        message
      })
    } catch (err) {
      n8n = { ok: false, error: err instanceof Error ? err.message : 'n8n dispatch failed' } as never
    }

    return NextResponse.json({ visitor, n8n }, { status: 201 })
  } catch (err) {
    const addonRes = addonErrorResponse(err)
    if (addonRes) return addonRes
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create visitor entry' }, { status: 500 })
  }
}
