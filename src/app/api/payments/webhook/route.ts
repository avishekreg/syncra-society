export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPaymentGateway } from '@/lib/payments/PaymentFactory'
import { dispatchN8nEvent, formatPaymentMessage } from '@/lib/n8n'
import { requireFlatAddon } from '@/lib/features/addon-guard'

export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer())
  const signature = request.headers.get('x-razorpay-signature') ?? undefined

  try {
    const gateway = await createPaymentGateway()
    const event = await gateway.verifyWebhookSignature({
      rawBody,
      signature,
      headers: { 'x-razorpay-signature': signature }
    })

    if (!event || event.status !== 'paid') {
      return NextResponse.json({ received: true, processed: false })
    }

    const supabase = createAdminClient()
    let paymentId = event.paymentRecordId

    if (!paymentId && event.orderId) {
      const { data } = await supabase
        .from('payments')
        .select('id')
        .eq('gateway_order_id', event.orderId)
        .single()
      paymentId = data?.id
    }

    if (!paymentId) {
      return NextResponse.json({ received: true, processed: false, reason: 'payment record not found' })
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        gateway_payment_id: event.paymentId ?? null
      })
      .eq('id', paymentId)
      .select('*, flats(flat_number, owner_name, owner_phone, society_id)')
      .single()

    if (error || !payment) {
      return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 })
    }

    const flat = payment.flats as {
      flat_number: string
      owner_name: string
      owner_phone: string
      society_id: string
    } | null

    if (flat?.society_id) {
      try {
        await requireFlatAddon(payment.flat_id, 'whatsapp_automation')
        const message = formatPaymentMessage(
          Number(payment.amount),
          'paid',
          flat.flat_number,
          flat.owner_name,
          payment.due_date
        )
        await dispatchN8nEvent({
          event_type: 'payment',
          phone_number: flat.owner_phone,
          message
        })
      } catch {
        // WhatsApp addon not active — payment still marked paid
      }
    }

    return NextResponse.json({ received: true, processed: true, paymentId })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
