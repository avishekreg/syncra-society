export type CreateOrderInput = {
  amountPaise: number
  currency?: string
  receipt: string
  notes?: Record<string, string>
  customerEmail?: string
}

export type CreateOrderResult = {
  orderId: string
  amount: number
  currency: string
  publicKey: string
  provider: string
  raw?: unknown
}

export type VerifyWebhookInput = {
  rawBody: Buffer
  signature?: string
  headers?: Record<string, string | undefined>
}

export type VerifiedWebhookEvent = {
  provider: string
  eventType: string
  orderId?: string
  paymentId?: string
  paymentRecordId?: string
  amount?: number
  currency?: string
  status: 'paid' | 'pending' | 'failed' | 'unknown'
  raw: unknown
}

export interface IPaymentGateway {
  readonly provider: string
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>
  verifyWebhookSignature(input: VerifyWebhookInput): Promise<VerifiedWebhookEvent | null>
}
