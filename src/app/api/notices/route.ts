export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

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

/** Persists notices only. WhatsApp/n8n dispatch is owned by the Vite portal (src/api/notices.ts). */
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

    return NextResponse.json({ notice }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 })
  }
}
