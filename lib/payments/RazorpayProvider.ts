import crypto from 'node:crypto'
import Razorpay from 'razorpay'
import type {
  CreateOrderInput,
  CreateOrderResult,
  IPaymentGateway,
  VerifyWebhookInput,
  VerifiedWebhookEvent
} from './IPaymentGateway'

export class RazorpayProvider implements IPaymentGateway {
  readonly provider = 'RAZORPAY'

  constructor(
    private readonly keyId: string,
    private readonly keySecret: string,
    private readonly webhookSecret = ''
  ) {}

  private client() {
    return new Razorpay({ key_id: this.keyId, key_secret: this.keySecret })
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const order = await this.client().orders.create({
      amount: input.amountPaise,
      currency: input.currency ?? 'INR',
      receipt: input.receipt,
      notes: input.notes
    })

    return {
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      publicKey: this.keyId,
      provider: this.provider,
      raw: order
    }
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
    const body = `${orderId}|${paymentId}`
    const expected = crypto.createHmac('sha256', this.keySecret).update(body).digest('hex')
    return expected === signature
  }

  async verifyWebhookSignature(input: VerifyWebhookInput): Promise<VerifiedWebhookEvent | null> {
    const signature = input.signature ?? input.headers?.['x-razorpay-signature']
    if (this.webhookSecret && signature) {
      const expected = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(input.rawBody)
        .digest('hex')
      if (expected !== signature) return null
    }

    const event = JSON.parse(input.rawBody.toString('utf8')) as {
      event?: string
      payload?: {
        payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string; status?: string; notes?: Record<string, string> } }
        order?: { entity?: { id?: string; amount?: number; notes?: Record<string, string> } }
      }
    }

    const eventType = event.event ?? 'unknown'
    const paymentEntity = event.payload?.payment?.entity
    const orderEntity = event.payload?.order?.entity

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const notes = paymentEntity?.notes ?? orderEntity?.notes ?? {}
      const societyId = notes.societyId ?? notes.society_id
      const purchasedModule = notes.purchasedModule ?? notes.purchased_module
      return {
        provider: this.provider,
        eventType,
        orderId: paymentEntity?.order_id ?? orderEntity?.id,
        paymentId: paymentEntity?.id,
        paymentRecordId: notes.payment_record_id,
        amount: paymentEntity?.amount ? paymentEntity.amount / 100 : undefined,
        currency: paymentEntity?.currency ?? 'INR',
        status: 'paid',
        societyId,
        purchasedModule,
        metadata: notes,
        raw: event
      }
    }

    return {
      provider: this.provider,
      eventType,
      status: 'unknown',
      raw: event
    }
  }
}
