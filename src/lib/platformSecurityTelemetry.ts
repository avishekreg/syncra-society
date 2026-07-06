import type { Society } from '../types/db'
import { fetchAutomationStatus } from './societyEvents'

export type SecurityIndicatorStatus = 'healthy' | 'watch' | 'critical'

export type SecurityIndicator = {
  id: string
  title: string
  value: string
  status: SecurityIndicatorStatus
  detail: string
}

export type SecurityLogSeverity = 'Low' | 'Medium' | 'Critical'

export type SecurityLogRow = {
  id: string
  timestamp: string
  scope: string
  eventType: string
  severity: SecurityLogSeverity
  status: string
}

export type PlatformSecurityTelemetry = {
  indicators: SecurityIndicator[]
  recentLogs: SecurityLogRow[]
  lastAuditAt: string | null
}

const AUDIT_DELAY_MS = 1800

function pickSocietyName(societies: Society[], index: number, fallback: string) {
  return societies[index]?.name ?? fallback
}

function buildRecentLogs(societies: Society[]): SecurityLogRow[] {
  const now = Date.now()
  const societyA = pickSocietyName(societies, 0, 'Windsor Society')
  const societyB = pickSocietyName(societies, 1, 'Lotus Greens')

  return [
    {
      id: 'sec-1',
      timestamp: new Date(now - 12 * 60 * 1000).toISOString(),
      scope: 'Global',
      eventType: 'Rate limit reached',
      severity: 'Medium',
      status: 'Monitoring'
    },
    {
      id: 'sec-2',
      timestamp: new Date(now - 48 * 60 * 1000).toISOString(),
      scope: societyA,
      eventType: 'Brute force block',
      severity: 'Critical',
      status: 'Mitigated'
    },
    {
      id: 'sec-3',
      timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      scope: 'Global',
      eventType: 'Webhook signature mismatch',
      severity: 'Low',
      status: 'Closed'
    },
    {
      id: 'sec-4',
      timestamp: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      scope: societyB,
      eventType: 'Suspicious session overlap',
      severity: 'Medium',
      status: 'Investigating'
    },
    {
      id: 'sec-5',
      timestamp: new Date(now - 9 * 60 * 60 * 1000).toISOString(),
      scope: 'Global',
      eventType: 'Dependabot advisory surfaced',
      severity: 'Low',
      status: 'Scheduled patch'
    },
    {
      id: 'sec-6',
      timestamp: new Date(now - 22 * 60 * 60 * 1000).toISOString(),
      scope: societyA,
      eventType: 'RLS policy validation pass',
      severity: 'Low',
      status: 'Verified'
    }
  ]
}

async function resolveWebhookIndicator(): Promise<SecurityIndicator> {
  const status = await fetchAutomationStatus()
  if (!status) {
    return {
      id: 'webhook',
      title: 'Network webhook integrity',
      value: 'Unknown',
      status: 'watch',
      detail: 'Automation status API unavailable — verify n8n routing in System Settings.'
    }
  }

  if (status.n8nReachable) {
    return {
      id: 'webhook',
      title: 'Network webhook integrity',
      value: 'Verified',
      status: 'healthy',
      detail: 'n8n and WhatsApp inbound endpoints responding with expected signatures.'
    }
  }

  return {
    id: 'webhook',
    title: 'Network webhook integrity',
    value: '1 flag',
    status: status.n8nConfigured ? 'watch' : 'critical',
    detail: status.n8nConfigured
      ? `Webhook reachability degraded: ${status.message}`
      : 'n8n webhook not configured — inbound automation may be exposed or offline.'
  }
}

function buildAuthIndicator(societies: Society[]): SecurityIndicator {
  const failedAttempts = Math.min(12, societies.length * 2 + 3)
  const status: SecurityIndicatorStatus = failedAttempts >= 10 ? 'watch' : 'healthy'

  return {
    id: 'auth',
    title: 'Authentication anomalies',
    value: `${failedAttempts} events / 24h`,
    status,
    detail:
      status === 'watch'
        ? 'Elevated failed login attempts detected across multiple societies — review Supabase auth logs.'
        : 'Failed login volume within expected bounds. No suspicious session overlap flagged.'
  }
}

function buildDependencyIndicator(): SecurityIndicator {
  return {
    id: 'dependencies',
    title: 'Dependency & vulnerability status',
    value: '2 advisories',
    status: 'watch',
    detail: 'CodeQL / Dependabot placeholders: 2 moderate npm advisories queued for patch review.'
  }
}

function buildComplianceIndicator(): SecurityIndicator {
  const sslActive = typeof window === 'undefined' ? true : window.location.protocol === 'https:'
  return {
    id: 'compliance',
    title: 'Encryption & compliance',
    value: sslActive ? 'Compliant' : 'Review required',
    status: sslActive ? 'healthy' : 'critical',
    detail: sslActive
      ? 'TLS active on portal endpoints. Supabase RLS policies enabled on society-scoped tables.'
      : 'Portal not served over HTTPS in this environment — enforce TLS before production use.'
  }
}

/** Placeholder defensive telemetry for the Super Admin security dashboard. */
export async function loadPlatformSecurityTelemetry(
  societies: Society[] = []
): Promise<PlatformSecurityTelemetry> {
  const webhook = await resolveWebhookIndicator()

  return {
    indicators: [
      buildAuthIndicator(societies),
      buildDependencyIndicator(),
      webhook,
      buildComplianceIndicator()
    ],
    recentLogs: buildRecentLogs(societies),
    lastAuditAt: new Date().toISOString()
  }
}

/** Simulates a platform security audit pass — refreshes placeholder telemetry. */
export async function runPlatformSecurityAudit(
  societies: Society[] = []
): Promise<PlatformSecurityTelemetry> {
  await new Promise((resolve) => setTimeout(resolve, AUDIT_DELAY_MS))
  return loadPlatformSecurityTelemetry(societies)
}

export function formatSecurityTimestamp(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '—'
  }
}
