export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireFlatAddon } from '@/lib/features/addon-guard'
import { addonErrorResponse } from '@/lib/auth/admin-guard'
import { createPaymentGateway } from '@/lib/payments/PaymentFactory'

const bodySchema = z.object({
  flat_id: z.string().uuid(),
  amount: z.number().positive(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.parse(await request.json())
    await requireFlatAddon(parsed.flat_id, 'payment_gateway')

    const supabase = createAdminClient()
    const amountPaise = Math.round(parsed.amount * 100)

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        flat_id: parsed.flat_id,
        amount: parsed.amount,
        status: 'pending',
        due_date: parsed.due_date
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const gateway = await createPaymentGateway()
    const order = await gateway.createOrder({
      amountPaise,
      receipt: `syncra_${payment.id}`,
      notes: {
        payment_record_id: payment.id,
        flat_id: parsed.flat_id
      }
    })

    await supabase
      .from('payments')
      .update({ gateway_order_id: order.orderId })
      .eq('id', payment.id)

    return NextResponse.json({ payment, order }, { status: 201 })
  } catch (err) {
    const addonRes = addonErrorResponse(err)
    if (addonRes) return addonRes
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Order creation failed' }, { status: 500 })
  }
}
