export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const societyId = searchParams.get('society_id')
  const userId = searchParams.get('user_id')

  if (!societyId) {
    return NextResponse.json({ error: 'society_id is required' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    let query = supabase
      .from('complaints_and_suggestions')
      .select('*')
      .eq('society_id', societyId)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('raised_by_user_id', userId)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load complaints' },
      { status: 500 }
    )
  }
}

const createSchema = z.object({
  society_id: z.string().min(1),
  raised_by_user_id: z.string().min(1),
  subject: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional()
})

export async function POST(request: Request) {
  try {
    const parsed = createSchema.parse(await request.json())
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('complaints_and_suggestions')
      .insert({
        ...parsed,
        status: parsed.status ?? 'open',
        created_at: now,
        updated_at: now
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 })
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create complaint' },
      { status: 500 }
    )
  }
}
