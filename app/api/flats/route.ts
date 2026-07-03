export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const societyId = searchParams.get('society_id')

  const supabase = createAdminClient()
  let query = supabase.from('flats').select('*').order('flat_number')

  if (societyId) query = query.eq('society_id', societyId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
