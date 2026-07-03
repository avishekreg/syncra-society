export type SubscriptionTier = 'basic' | 'premium' | 'enterprise'

export type PremiumAddon = 'whatsapp_automation' | 'payment_gateway' | 'advanced_analytics' | 'elections'

export type Society = {
  id: string
  name: string
  address: string | null
  subscription_tier: SubscriptionTier
  active_addons: string[]
  created_at: string
}

export type Flat = {
  id: string
  society_id: string
  flat_number: string
  owner_name: string
  owner_phone: string
  created_at?: string
}

export type Notice = {
  id: string
  society_id: string
  title: string
  content: string
  created_at: string
}

export type Visitor = {
  id: string
  flat_id: string
  visitor_name: string
  phone_number: string
  purpose: string
  entry_time: string
}

export type Payment = {
  id: string
  flat_id: string
  amount: number
  status: 'paid' | 'pending'
  due_date: string
  gateway_order_id?: string | null
  gateway_payment_id?: string | null
  created_at?: string
}

export type SystemConfig = {
  key: string
  value: string
  description: string | null
  updated_at: string
}

export type PaymentGatewayProvider = 'RAZORPAY' | 'STRIPE' | 'CHILE_LOCAL'

export type FlatWithSociety = Flat & {
  societies: Pick<Society, 'name' | 'active_addons'> | null
}

export type VisitorWithFlat = Visitor & {
  flats: Pick<Flat, 'flat_number' | 'owner_name' | 'owner_phone' | 'society_id'> | null
}

export type PaymentWithFlat = Payment & {
  flats: Pick<Flat, 'flat_number' | 'owner_name' | 'owner_phone' | 'society_id'> | null
}

export type N8nWebhookPayload = {
  event_type: 'notice' | 'visitor' | 'payment'
  phone_number: string
  message: string
}

export const PREMIUM_ADDON_LABELS: Record<PremiumAddon, string> = {
  whatsapp_automation: 'WhatsApp Automation',
  payment_gateway: 'Global Payment Gateway',
  advanced_analytics: 'Advanced Analytics',
  elections: 'Encrypted Elections'
}
