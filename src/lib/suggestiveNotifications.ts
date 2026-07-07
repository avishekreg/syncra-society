import type { SocietyBillingRules, UserAndFlat } from '../types/db'
import { computeBillForResident } from './billingPolicyEngine'

export type SuggestiveNotification = {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  actionLabel?: string
  actionPath?: string
}

function isValidWhatsAppNumber(value: string | null | undefined): boolean {
  if (!value) return false
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10
}

export function buildSuggestiveNotifications(input: {
  profile: Pick<UserAndFlat, 'flat_number' | 'name' | 'phone' | 'whatsapp_number' | 'email' | 'opening_outstanding_balance'>
  rules: SocietyBillingRules
  reference?: Date
}): SuggestiveNotification[] {
  const notifications: SuggestiveNotification[] = []
  const { profile, rules } = input

  if (!isValidWhatsAppNumber(profile.whatsapp_number)) {
    notifications.push({
      id: 'missing-whatsapp',
      severity: 'warning',
      title: 'Add your WhatsApp number',
      message:
        'Payment reminders and gatekeeper alerts are sent via WhatsApp. Add a verified WhatsApp number in your profile to avoid missing society notices.',
      actionLabel: 'Update profile',
      actionPath: '/profile'
    })
  }

  if (!profile.email?.trim()) {
    notifications.push({
      id: 'missing-email',
      severity: 'info',
      title: 'Complete your email',
      message: 'Add an email address so society admins can reach you for billing and helpdesk updates.',
      actionLabel: 'Update profile',
      actionPath: '/profile'
    })
  }

  const bill = computeBillForResident(profile, rules, input.reference)

  if (bill.status === 'due_soon' && bill.baseOutstanding > 0) {
    notifications.push({
      id: 'due-soon',
      severity: 'info',
      title: `Maintenance due by the ${rules.maintenance_due_date}th`,
      message: `Flat ${profile.flat_number}: ₹${bill.baseOutstanding.toLocaleString('en-IN')} is due soon. Pay before the grace period to avoid a ₹${Number(rules.late_fee_flat_amount).toLocaleString('en-IN')} late fee.`,
      actionLabel: 'View account',
      actionPath: '/resident'
    })
  }

  if (bill.status === 'grace' && bill.baseOutstanding > 0) {
    notifications.push({
      id: 'grace-period',
      severity: 'warning',
      title: 'Grace period active — late fee approaching',
      message: `You are past the ${rules.maintenance_due_date}th due date. Grace ends ${bill.graceEndsAt.toLocaleDateString('en-IN')}. Pay ₹${bill.baseOutstanding.toLocaleString('en-IN')} now to avoid penalties.`,
      actionLabel: 'Pay maintenance',
      actionPath: '/resident'
    })
  }

  if (bill.status === 'overdue' && bill.totalDue > 0) {
    notifications.push({
      id: 'overdue-bill',
      severity: 'critical',
      title: 'Overdue maintenance — late fee applied',
      message: `Flat ${profile.flat_number}: total due ₹${bill.totalDue.toLocaleString('en-IN')} including late fee ₹${bill.lateFeeApplied.toLocaleString('en-IN')}. Immediate payment recommended.`,
      actionLabel: 'Resolve now',
      actionPath: '/resident'
    })
  }

  return notifications
}
