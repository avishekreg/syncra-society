import { NextResponse } from 'next/server'
import { AddonForbiddenError } from '@/lib/features/addon-guard'

export function addonErrorResponse(err: unknown) {
  if (err instanceof AddonForbiddenError) {
    return NextResponse.json(
      {
        error: err.message,
        code: 'PREMIUM_MODULE_LOCKED',
        addon: err.addon,
        upgrade: true
      },
      { status: 403 }
    )
  }
  return null
}

export function verifySuperAdmin(request: Request): NextResponse | null {
  const secret = process.env.SUPER_ADMIN_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'SUPER_ADMIN_SECRET not configured' }, { status: 503 })
  }
  const header = request.headers.get('x-super-admin-key')
  if (header !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
