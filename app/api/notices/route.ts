import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchN8nBroadcast, formatNoticeMessage } from '@/lib/n8n'
import { requireSocietyAddon } from '@/lib/features/addon-guard'
import { addonErrorResponse } from '@/lib/auth/admin-guard'

const bodySchema = z.object({
  society_id: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().min(1)
})

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('notices')
    .select('*, societies(name, active_addons, subscription_tier)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.parse(await request.json())
    const supabase = createAdminClient()

    const { data: notice, error } = await supabase
      .from('notices')
      .insert({
        society_id: parsed.society_id,
        title: parsed.title,
        content: parsed.content
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let n8n: { ok: boolean; error?: string; skipped?: boolean } = { ok: true, skipped: true }

    try {
      await requireSocietyAddon(parsed.society_id, 'whatsapp_automation')

      const { data: society } = await supabase
        .from('societies')
        .select('name')
        .eq('id', parsed.society_id)
        .single()

      const { data: flats } = await supabase
        .from('flats')
        .select('owner_phone')
        .eq('society_id', parsed.society_id)

      const phones = (flats ?? []).map((f) => f.owner_phone)
      const message = formatNoticeMessage(parsed.title, parsed.content, society?.name ?? undefined)
      await dispatchN8nBroadcast(phones, { event_type: 'notice', message })
      n8n = { ok: true }
    } catch (err) {
      const addonRes = addonErrorResponse(err)
      if (addonRes) {
        const body = await addonRes.json()
        n8n = { ok: false, error: body.error, skipped: true }
      } else if (err instanceof Error) {
        n8n = { ok: false, error: err.message }
      }
    }

    return NextResponse.json({ notice, n8n }, { status: 201 })
  } catch (err) {
    const addonRes = addonErrorResponse(err)
    if (addonRes) return addonRes
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 })
  }
}
