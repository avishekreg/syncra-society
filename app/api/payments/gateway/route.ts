import { NextResponse } from 'next/server'
import { getPublicPaymentConfig } from '@/lib/payments/PaymentFactory'

export async function GET() {
  try {
    const config = await getPublicPaymentConfig()
    return NextResponse.json(config)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to load gateway config' }, { status: 500 })
  }
}
