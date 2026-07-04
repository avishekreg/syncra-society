export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('societies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

const createSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  total_flats: z.number().int().positive().optional(),
  pricing_slab_id: z.string().optional()
})

export async function POST(request: Request) {
  try {
    const parsed = createSchema.parse(await request.json())
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('societies')
      .insert({
        name: parsed.name,
        address: parsed.address,
        subscription_tier: 'basic',
        total_flats: parsed.total_flats ?? null,
        pricing_slab_id: parsed.pricing_slab_id ?? 'tier2'
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create society' }, { status: 500 })
  }
}
