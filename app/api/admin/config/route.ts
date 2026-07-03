import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifySuperAdmin } from '@/lib/auth/admin-guard'
import { getAllSystemConfigs, upsertSystemConfig } from '@/lib/config/system-config'

export async function GET(request: Request) {
  const denied = verifySuperAdmin(request)
  if (denied) return denied

  try {
    const configs = await getAllSystemConfigs()
    return NextResponse.json(configs)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to load configs' }, { status: 500 })
  }
}

const updateSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  description: z.string().optional()
})

export async function PUT(request: Request) {
  const denied = verifySuperAdmin(request)
  if (denied) return denied

  try {
    const body = updateSchema.parse(await request.json())
    const saved = await upsertSystemConfig(body.key, body.value, body.description)
    return NextResponse.json(saved)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Update failed' }, { status: 500 })
  }
}
