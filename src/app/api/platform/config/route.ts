export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifySuperAdmin } from '@/lib/auth/admin-guard'
import { createAdminClient } from '@/lib/supabase/admin'

const GLOBAL_ROW_ID = 'global'

export async function GET(request: Request) {
  const denied = verifySuperAdmin(request)
  if (denied) return denied

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('platform_settings')
      .select('payload, updated_at')
      .eq('id', GLOBAL_ROW_ID)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data?.payload) {
      return NextResponse.json({ payload: null }, { status: 200 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load platform settings' },
      { status: 500 }
    )
  }
}

const upsertSchema = z.object({
  payload: z.record(z.unknown()),
  updated_at: z.string().optional()
})

export async function PUT(request: Request) {
  const denied = verifySuperAdmin(request)
  if (denied) return denied

  try {
    const body = upsertSchema.parse(await request.json())
    const supabase = createAdminClient()
    const row = {
      id: GLOBAL_ROW_ID,
      payload: body.payload,
      updated_at: body.updated_at ?? new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('platform_settings')
      .upsert(row, { onConflict: 'id' })
      .select('payload, updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 })
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save platform settings' },
      { status: 500 }
    )
  }
}
