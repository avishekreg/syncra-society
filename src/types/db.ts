// TypeScript interfaces matching PostgreSQL tables

export interface Society {
  id: string
  name: string
  address?: string | null
  created_at?: string
  subscription_status?: 'active' | 'trial' | 'cancelled'
  pricing_slab_id?: string | null
  total_flats?: number | null
  opening_bank_balance?: number | null
}

export interface SocietyBillingRules {
  society_id: string
  maintenance_due_date: number
  late_fee_grace_period_days: number
  late_fee_flat_amount: number
  interest_rate_percentage: number
  created_at?: string
  updated_at?: string
}

export type ActivationStatus = 'pending' | 'activation_paid' | 'active_subscription'

export interface SocietySubscription {
  id: string
  society_id: string
  activation_status: ActivationStatus
  total_flats?: number | null
  monthly_rate_per_flat?: number | null
  razorpay_order_id?: string | null
  razorpay_subscription_id?: string | null
  razorpay_plan_id?: string | null
  billing_cycle_anchor?: string | null
  active_until?: string | null
  created_at?: string
  updated_at?: string
}

export interface CustomRole {
  id: string
  society_id: string
  name: string
  permissions: string[]
}

export interface UserAndFlat {
  id: string
  user_id: string
  society_id: string
  flat_number: string
  name: string
  username?: string | null
  phone?: string | null
  whatsapp_number?: string | null
  email?: string | null
  avatar_url?: string | null
  role?: string | null
  requires_password_change?: boolean | null
  opening_outstanding_balance?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export interface SocietyLedgerEntry {
  id: string
  society_id: string
  date: string
  type: 'credit' | 'debit'
  amount: number
  description?: string | null
  invoice_url?: string | null
}

export interface DemoLedgerTransaction extends SocietyLedgerEntry {}

export interface DemoUnit {
  flat_number: string
  owner_name: string
  owner_email: string
  owner_mobile?: string
  balance_status: 'paid' | 'due' | 'defaulter'
  balance_due: number
  last_payment: string
  payment_history: Array<{ date: string; amount: number; method: string }>
}

export interface ShowcaseData {
  society: Society
  units: DemoUnit[]
  defaulters: MaintenanceDefaulter[]
  ledgerEntries: SocietyLedgerEntry[]
}

export interface MaintenanceContract {
  id: string
  society_id: string
  vendor_name: string
  start_date: string
  end_date: string
  document_url?: string | null
}

export interface MaintenanceDefaulter {
  id: string
  society_id: string
  society_name: string
  building: string
  flat_number: string
  tenant_name: string
  amount_due: number
  overdue_days: number
  penalty?: number
  status: 'unpaid' | 'paid'
  notes?: string | null
  created_at: string
}

export interface Complaint {
  id: string
  society_id: string
  raised_by_user_id: string
  subject: string
  description?: string | null
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at?: string
  updated_at?: string
}

export interface Notice {
  id: string
  society_id: string
  title: string
  body: string
  attachment_url?: string | null
  created_at?: string
}

export type VisitorLogStatus = 'pending_approval' | 'approved' | 'denied' | 'exited'

export interface VisitorLog {
  id: string
  society_id: string
  visitor_name: string
  purpose: string
  vehicle_number?: string | null
  target_building: string
  target_flat_number: string
  status: VisitorLogStatus
  requested_at: string
  actioned_at?: string | null
  actioned_by_user_id?: string | null
  exited_at?: string | null
  created_at?: string
  updated_at?: string
}

export type VisitorLogEventType = 'request_created' | 'approved' | 'denied' | 'exit_logged'

export interface VisitorLogEvent {
  id: string
  visitor_log_id: string
  event_type: VisitorLogEventType
  actor_user_id?: string | null
  notes?: string | null
  created_at: string
}
