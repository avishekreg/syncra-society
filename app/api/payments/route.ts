import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchN8nEvent, formatPaymentMessage } from '@/lib/n8n'
import { requireFlatAddon } from '@/lib/features/addon-guard'
import { addonErrorResponse } from '@/lib/auth/admin-guard'

const bodySchema = z.object({
  flat_id: z.string().uuid(),
  amount: z.number().positive(),
  status: z.enum(['paid', 'pending']),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*, flats(flat_number, owner_name, owner_phone, society_id)')
    .order('due_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.parse(await request.json())
    const supabase = createAdminClient()

    const { data: flat, error: flatError } = await supabase
      .from('flats')
      .select('flat_number, owner_name, owner_phone, society_id')
      .eq('id', parsed.flat_id)
      .single()

    if (flatError || !flat) {
      return NextResponse.json({ error: 'Flat not found' }, { status: 404 })
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        flat_id: parsed.flat_id,
        amount: parsed.amount,
        status: parsed.status,
        due_date: parsed.due_date
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let n8n: { ok: boolean; error?: string; skipped?: boolean } = { ok: true, skipped: true }

    if (parsed.status === 'paid') {
      try {
        await requireFlatAddon(parsed.flat_id, 'whatsapp_automation')
        const message = formatPaymentMessage(
          parsed.amount,
          parsed.status,
          flat.flat_number,
          flat.owner_name,
          parsed.due_date
        )
        await dispatchN8nEvent({
          event_type: 'payment',
          phone_number: flat.owner_phone,
          message
        })
        n8n = { ok: true }
      } catch (err) {
        const addonRes = addonErrorResponse(err)
        if (addonRes) {
          const body = await addonRes.json()
          n8n = { ok: false, error: body.error, skipped: true }
        }
      }
    }

    return NextResponse.json({ payment, n8n }, { status: 201 })
  } catch (err) {
    const addonRes = addonErrorResponse(err)
    if (addonRes) return addonRes
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
