import type { SocietyBillingRules, UserAndFlat } from '../types/db'

export type BillComputation = {
  flatNumber: string
  residentName: string
  baseOutstanding: number
  daysPastDue: number
  lateFeeApplied: number
  interestApplied: number
  totalDue: number
  dueDate: Date
  graceEndsAt: Date
  status: 'paid' | 'due_soon' | 'due' | 'grace' | 'overdue'
}

export function getMaintenanceDueDateForMonth(rules: SocietyBillingRules, reference = new Date()): Date {
  const year = reference.getFullYear()
  const month = reference.getMonth()
  const day = Math.min(Math.max(rules.maintenance_due_date, 1), 28)
  return new Date(year, month, day, 23, 59, 59, 999)
}

export function computeBillForResident(
  profile: Pick<UserAndFlat, 'flat_number' | 'name' | 'opening_outstanding_balance'>,
  rules: SocietyBillingRules,
  reference = new Date()
): BillComputation {
  const baseOutstanding = Number(profile.opening_outstanding_balance ?? 0)
  const dueDate = getMaintenanceDueDateForMonth(rules, reference)
  const graceEndsAt = new Date(dueDate)
  graceEndsAt.setDate(graceEndsAt.getDate() + rules.late_fee_grace_period_days)

  const msPerDay = 24 * 60 * 60 * 1000
  const daysPastDue =
    reference.getTime() > graceEndsAt.getTime()
      ? Math.floor((reference.getTime() - graceEndsAt.getTime()) / msPerDay)
      : 0

  let status: BillComputation['status'] = 'paid'
  if (baseOutstanding <= 0) {
    status = 'paid'
  } else if (reference.getTime() > graceEndsAt.getTime()) {
    status = 'overdue'
  } else if (reference.getTime() > dueDate.getTime()) {
    status = 'grace'
  } else {
    const daysUntilDue = Math.ceil((dueDate.getTime() - reference.getTime()) / msPerDay)
    status = daysUntilDue <= 3 ? 'due_soon' : 'due'
  }

  const lateFeeApplied =
    baseOutstanding > 0 && reference.getTime() > graceEndsAt.getTime()
      ? Number(rules.late_fee_flat_amount ?? 0)
      : 0

  const monthsOverdue = daysPastDue > 0 ? Math.max(1, Math.ceil(daysPastDue / 30)) : 0
  const interestApplied =
    baseOutstanding > 0 && monthsOverdue > 0
      ? Math.round(baseOutstanding * (Number(rules.interest_rate_percentage) / 100) * monthsOverdue * 100) / 100
      : 0

  const totalDue = Math.round((baseOutstanding + lateFeeApplied + interestApplied) * 100) / 100

  return {
    flatNumber: profile.flat_number,
    residentName: profile.name,
    baseOutstanding,
    daysPastDue,
    lateFeeApplied,
    interestApplied,
    totalDue,
    dueDate,
    graceEndsAt,
    status
  }
}

export function buildPaymentReminderMessage(input: {
  societyName: string
  bill: BillComputation
  rules: SocietyBillingRules
}): string {
  const { societyName, bill, rules } = input
  const dueDay = rules.maintenance_due_date

  if (bill.status === 'overdue') {
    return `*${societyName}* — Maintenance Overdue\n\nFlat ${bill.flatNumber}: ₹${bill.totalDue.toLocaleString('en-IN')} due (incl. late fee ₹${bill.lateFeeApplied.toLocaleString('en-IN')}). Due date was the ${dueDay}th. Please pay via the Syncra Society portal to avoid further penalties.`
  }

  if (bill.status === 'grace') {
    return `*${societyName}* — Payment Grace Period\n\nFlat ${bill.flatNumber}: ₹${bill.baseOutstanding.toLocaleString('en-IN')} is past the ${dueDay}th due date. Grace period ends ${bill.graceEndsAt.toLocaleDateString('en-IN')}. Late fee of ₹${Number(rules.late_fee_flat_amount).toLocaleString('en-IN')} applies after that.`
  }

  return `*${societyName}* — Maintenance Reminder\n\nFlat ${bill.flatNumber}: ₹${bill.baseOutstanding.toLocaleString('en-IN')} is due by the ${dueDay}th of this month. Pay on time via the Syncra Society portal.`
}
