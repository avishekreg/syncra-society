/**
 * Syncra Society Governance Scoring — v1.0.0
 * Published, fixed weights. No black-box AI for point allocation.
 * Scores are derived only from auditable activity log events + payment status.
 */

import { listActivities, type ActivityCategory, type ActivityEntry } from './activityLog'

export const SCORING_SPEC_VERSION = '1.0.0'
export const SCORING_SPEC_PUBLISHED = '2026-07-03'

/** Published resident weights — visible in UI */
export const RESIDENT_WEIGHTS = {
  payment_on_time: { points: 15, label: 'Maintenance paid on time' },
  payment_late: { points: -10, label: 'Payment overdue (1–30 days)' },
  payment_defaulter: { points: -25, label: 'Defaulter status (>30 days)' },
  visitor_approved: { points: 5, label: 'Visitor approved within 15 minutes' },
  survey_response: { points: 8, label: 'Survey participation (once per survey)' },
  election_vote: { points: 10, label: 'Election vote cast' },
  helpdesk_resolved: { points: 3, label: 'Helpdesk ticket resolved' },
  helpdesk_open_penalty: { points: -2, label: 'Open ticket >7 days (per ticket, max -6)' },
  community_streak_bonus: { points: 5, label: '3+ positive actions in 30 days' }
} as const

/** Published RWA admin weights */
export const ADMIN_WEIGHTS = {
  notice_published: { points: 5, label: 'Notice published' },
  survey_created: { points: 5, label: 'Survey launched' },
  election_conducted: { points: 12, label: 'Election opened' },
  helpdesk_resolved: { points: 10, label: 'Resident ticket resolved' },
  gallery_upload: { points: 3, label: 'Gallery photo added' },
  slow_helpdesk_penalty: { points: -8, label: 'Avg resolution >14 days' },
  silence_penalty: { points: -10, label: 'No notice in 30 days' }
} as const

/** Society health thresholds for governance advisory */
export const SOCIETY_HEALTH_THRESHOLDS = {
  defaulter_rate_review: 0.2,
  defaulter_rate_critical: 0.35,
  helpdesk_avg_days_review: 7,
  helpdesk_avg_days_critical: 14,
  notice_silence_days_review: 21,
  notice_silence_days_critical: 45,
  participation_rate_review: 0.35,
  participation_rate_critical: 0.2,
  admin_score_review: 40,
  admin_score_critical: 25
} as const

export type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'platinum'

export type ScoreBreakdownItem = {
  key: string
  label: string
  points: number
  count: number
}

export type ResidentScore = {
  flatNumber: string
  totalPoints: number
  level: BadgeLevel
  badge: string
  breakdown: ScoreBreakdownItem[]
  streakDays: number
}

export type AdminScore = {
  totalPoints: number
  level: BadgeLevel
  badge: string
  breakdown: ScoreBreakdownItem[]
}

export type GovernanceAdvisory = {
  level: 'healthy' | 'review' | 'critical'
  headline: string
  reasons: string[]
  suggestReElectionReview: boolean
  societyWellnessIndex: number
}

export type SocietyScoreSnapshot = {
  specVersion: string
  calculatedAt: string
  residentScores: ResidentScore[]
  adminScore: AdminScore
  advisory: GovernanceAdvisory
}

function badgeForPoints(points: number): { level: BadgeLevel; badge: string } {
  if (points >= 80) return { level: 'platinum', badge: 'Platinum Contributor' }
  if (points >= 55) return { level: 'gold', badge: 'Gold Contributor' }
  if (points >= 30) return { level: 'silver', badge: 'Silver Contributor' }
  return { level: 'bronze', badge: 'Bronze Member' }
}

function adminBadgeForPoints(points: number): { level: BadgeLevel; badge: string } {
  if (points >= 70) return { level: 'platinum', badge: 'Exemplary Governance' }
  if (points >= 50) return { level: 'gold', badge: 'Strong Leadership' }
  if (points >= 30) return { level: 'silver', badge: 'Active Management' }
  return { level: 'bronze', badge: 'Needs Improvement' }
}

function addBreakdown(map: Map<string, ScoreBreakdownItem>, key: string, label: string, points: number) {
  const existing = map.get(key)
  if (existing) {
    existing.count += 1
    existing.points += points
  } else {
    map.set(key, { key, label, points, count: 1 })
  }
}

function actionPoints(entry: ActivityEntry, role: 'resident' | 'admin'): number {
  const a = entry.action
  if (role === 'resident') {
    if (a === 'maintenance_paid') return RESIDENT_WEIGHTS.payment_on_time.points
    if (a === 'payment_late') return RESIDENT_WEIGHTS.payment_late.points
    if (a === 'payment_defaulter') return RESIDENT_WEIGHTS.payment_defaulter.points
    if (a === 'visitor_approved') return RESIDENT_WEIGHTS.visitor_approved.points
    if (a === 'survey_response') return RESIDENT_WEIGHTS.survey_response.points
    if (a === 'vote_cast') return RESIDENT_WEIGHTS.election_vote.points
    if (a === 'ticket_resolved') return RESIDENT_WEIGHTS.helpdesk_resolved.points
  } else {
    if (a === 'notice_published') return ADMIN_WEIGHTS.notice_published.points
    if (a === 'survey_created') return ADMIN_WEIGHTS.survey_created.points
    if (a === 'election_created') return ADMIN_WEIGHTS.election_conducted.points
    if (a === 'ticket_resolved') return ADMIN_WEIGHTS.helpdesk_resolved.points
    if (a === 'photo_uploaded') return ADMIN_WEIGHTS.gallery_upload.points
  }
  return 0
}

function labelForAction(action: string, role: 'resident' | 'admin') {
  const weights = role === 'resident' ? RESIDENT_WEIGHTS : ADMIN_WEIGHTS
  const map: Record<string, keyof typeof weights> = {
    maintenance_paid: 'payment_on_time',
    payment_late: 'payment_late',
    payment_defaulter: 'payment_defaulter',
    visitor_approved: 'visitor_approved',
    survey_response: 'survey_response',
    vote_cast: 'election_vote',
    ticket_resolved: 'helpdesk_resolved',
    notice_published: 'notice_published',
    survey_created: 'survey_created',
    election_created: 'election_conducted',
    photo_uploaded: 'gallery_upload'
  }
  const key = map[action]
  return key ? weights[key as keyof typeof weights].label : action
}

export function calculateResidentScore(
  societyId: string,
  flatNumber: string,
  paymentStatus?: 'paid' | 'due' | 'defaulter'
): ResidentScore {
  const entries = listActivities(societyId, { flatNumber })
  const breakdown = new Map<string, ScoreBreakdownItem>()

  for (const entry of entries) {
    const pts = actionPoints(entry, 'resident')
    if (pts !== 0) addBreakdown(breakdown, entry.action, labelForAction(entry.action, 'resident'), pts)
  }

  if (paymentStatus === 'due') {
    addBreakdown(breakdown, 'payment_late', RESIDENT_WEIGHTS.payment_late.label, RESIDENT_WEIGHTS.payment_late.points)
  } else if (paymentStatus === 'defaulter') {
    addBreakdown(
      breakdown,
      'payment_defaulter',
      RESIDENT_WEIGHTS.payment_defaulter.label,
      RESIDENT_WEIGHTS.payment_defaulter.points
    )
  }

  const positiveRecent = entries.filter((e) => {
    const days = (Date.now() - new Date(e.occurredAt).getTime()) / (24 * 60 * 60 * 1000)
    return days <= 30 && actionPoints(e, 'resident') > 0
  }).length

  if (positiveRecent >= 3) {
    addBreakdown(
      breakdown,
      'community_streak',
      RESIDENT_WEIGHTS.community_streak_bonus.label,
      RESIDENT_WEIGHTS.community_streak_bonus.points
    )
  }

  const openTickets = entries.filter((e) => e.action === 'ticket_opened').length
  const resolved = entries.filter((e) => e.action === 'ticket_resolved').length
  const staleOpen = Math.max(0, openTickets - resolved)
  if (staleOpen > 0) {
    const penalty = Math.min(6, staleOpen * Math.abs(RESIDENT_WEIGHTS.helpdesk_open_penalty.points))
    addBreakdown(breakdown, 'helpdesk_stale', RESIDENT_WEIGHTS.helpdesk_open_penalty.label, -penalty)
  }

  const totalPoints = Math.max(0, [...breakdown.values()].reduce((s, i) => s + i.points, 0))
  const { level, badge } = badgeForPoints(totalPoints)

  return {
    flatNumber,
    totalPoints,
    level,
    badge,
    breakdown: [...breakdown.values()],
    streakDays: positiveRecent >= 3 ? 30 : positiveRecent
  }
}

export function calculateAdminScore(societyId: string): AdminScore {
  const entries = listActivities(societyId)
  const breakdown = new Map<string, ScoreBreakdownItem>()

  for (const entry of entries) {
    const pts = actionPoints(entry, 'admin')
    if (pts !== 0) addBreakdown(breakdown, entry.action, labelForAction(entry.action, 'admin'), pts)
  }

  const lastNotice = entries.find((e) => e.action === 'notice_published')
  if (lastNotice) {
    const daysSince = (Date.now() - new Date(lastNotice.occurredAt).getTime()) / (24 * 60 * 60 * 1000)
    if (daysSince > SOCIETY_HEALTH_THRESHOLDS.notice_silence_days_critical) {
      addBreakdown(breakdown, 'silence', ADMIN_WEIGHTS.silence_penalty.label, ADMIN_WEIGHTS.silence_penalty.points)
    }
  } else {
    addBreakdown(breakdown, 'silence', ADMIN_WEIGHTS.silence_penalty.label, ADMIN_WEIGHTS.silence_penalty.points)
  }

  const totalPoints = Math.max(0, [...breakdown.values()].reduce((s, i) => s + i.points, 0))
  const { level, badge } = adminBadgeForPoints(totalPoints)

  return { totalPoints, level, badge, breakdown: [...breakdown.values()] }
}

export function calculateGovernanceAdvisory(
  societyId: string,
  adminScore: AdminScore,
  opts?: { totalFlats?: number; defaulterCount?: number; participationRate?: number }
): GovernanceAdvisory {
  const entries = listActivities(societyId)
  const reasons: string[] = []
  let penalty = 0

  const defaulterRate =
    opts?.defaulterCount && opts?.totalFlats ? opts.defaulterCount / opts.totalFlats : 0
  if (defaulterRate >= SOCIETY_HEALTH_THRESHOLDS.defaulter_rate_critical) {
    reasons.push(`${Math.round(defaulterRate * 100)}% flats in defaulter status`)
    penalty += 25
  } else if (defaulterRate >= SOCIETY_HEALTH_THRESHOLDS.defaulter_rate_review) {
    reasons.push(`${Math.round(defaulterRate * 100)}% flats overdue on maintenance`)
    penalty += 12
  }

  const lastNotice = entries.find((e) => e.category === 'notice')
  if (lastNotice) {
    const days = (Date.now() - new Date(lastNotice.occurredAt).getTime()) / (24 * 60 * 60 * 1000)
    if (days > SOCIETY_HEALTH_THRESHOLDS.notice_silence_days_critical) {
      reasons.push(`No society notice in ${Math.floor(days)} days`)
      penalty += 15
    } else if (days > SOCIETY_HEALTH_THRESHOLDS.notice_silence_days_review) {
      reasons.push(`Limited communication — last notice ${Math.floor(days)} days ago`)
      penalty += 8
    }
  } else {
    reasons.push('No notices published in activity history')
    penalty += 15
  }

  const participation = opts?.participationRate ?? estimateParticipation(entries)
  if (participation < SOCIETY_HEALTH_THRESHOLDS.participation_rate_critical) {
    reasons.push(`Low community participation (${Math.round(participation * 100)}%)`)
    penalty += 15
  } else if (participation < SOCIETY_HEALTH_THRESHOLDS.participation_rate_review) {
    reasons.push(`Participation below target (${Math.round(participation * 100)}%)`)
    penalty += 8
  }

  if (adminScore.totalPoints < SOCIETY_HEALTH_THRESHOLDS.admin_score_critical) {
    reasons.push('RWA governance activity score is critically low')
    penalty += 20
  } else if (adminScore.totalPoints < SOCIETY_HEALTH_THRESHOLDS.admin_score_review) {
    reasons.push('RWA governance activity could be stronger')
    penalty += 10
  }

  const societyWellnessIndex = Math.max(0, Math.min(100, 100 - penalty + Math.min(adminScore.totalPoints / 2, 20)))

  let level: GovernanceAdvisory['level'] = 'healthy'
  if (penalty >= 35 || societyWellnessIndex < 45) level = 'critical'
  else if (penalty >= 18 || societyWellnessIndex < 65) level = 'review'

  const suggestReElectionReview =
    level === 'critical' &&
    reasons.length >= 2 &&
    (defaulterRate >= SOCIETY_HEALTH_THRESHOLDS.defaulter_rate_review ||
      adminScore.totalPoints < SOCIETY_HEALTH_THRESHOLDS.admin_score_review)

  const headline =
    level === 'healthy'
      ? 'Society governance is healthy'
      : level === 'review'
        ? 'Governance review recommended at next AGM'
        : 'Critical governance signals — schedule committee review'

  return {
    level,
    headline,
    reasons,
    suggestReElectionReview,
    societyWellnessIndex: Math.round(societyWellnessIndex)
  }
}

function estimateParticipation(entries: ActivityEntry[]) {
  const participatory: ActivityCategory[] = ['survey', 'election', 'visitor']
  const count = entries.filter((e) => participatory.includes(e.category)).length
  return Math.min(1, count / 10)
}

export function buildSocietyScoreSnapshot(
  societyId: string,
  flats: Array<{ flatNumber: string; paymentStatus?: 'paid' | 'due' | 'defaulter' }>,
  opts?: { totalFlats?: number; defaulterCount?: number }
): SocietyScoreSnapshot {
  const adminScore = calculateAdminScore(societyId)
  const residentScores = flats.map((f) =>
    calculateResidentScore(societyId, f.flatNumber, f.paymentStatus)
  )
  const participationRate =
    residentScores.filter((r) => r.totalPoints > 20).length / Math.max(1, flats.length)

  return {
    specVersion: SCORING_SPEC_VERSION,
    calculatedAt: new Date().toISOString(),
    residentScores: residentScores.sort((a, b) => b.totalPoints - a.totalPoints),
    adminScore,
    advisory: calculateGovernanceAdvisory(societyId, adminScore, {
      ...opts,
      participationRate
    })
  }
}

export function getPublishedWeights() {
  return {
    version: SCORING_SPEC_VERSION,
    published: SCORING_SPEC_PUBLISHED,
    resident: RESIDENT_WEIGHTS,
    admin: ADMIN_WEIGHTS,
    thresholds: SOCIETY_HEALTH_THRESHOLDS
  }
}
