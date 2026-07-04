export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifySuperAdmin } from '@/lib/auth/admin-guard'

const patchSchema = z.object({
  subscription_tier: z.enum(['basic', 'premium', 'enterprise']).optional(),
  active_addons: z.array(z.string()).optional()
})

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('societies').select('*').eq('id', id).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = verifySuperAdmin(request)
  if (denied) return denied

  try {
    const { id } = await params
    const body = patchSchema.parse(await request.json())
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('societies')
      .update(body)
      .eq('id', id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
