import type { Society } from '../types/db'
import { buildSocietyRegistrationUrl } from './platformControlTower'
import { SUPER_ADMIN_NAV } from './superAdminNav'

export type CommandBarAction =
  | {
      type: 'generate_link'
      societyId: string
      societyName: string
      url: string
      message: string
    }
  | { type: 'navigate'; path: string; message: string }
  | { type: 'scroll'; target: 'topology' | 'onboarding' | 'ledger' | 'revenue'; message: string }
  | { type: 'refresh'; message: string }
  | {
      type: 'webhook_status'
      message: string
      configured?: boolean
      reachable?: boolean
    }
  | { type: 'help'; message: string; suggestions: string[] }
  | { type: 'unknown'; message: string }

function normalize(input: string) {
  return input.trim().toLowerCase()
}

function findSocietyByName(query: string, societies: Society[]): Society | undefined {
  const q = normalize(query)
  if (!q) return undefined

  const exact = societies.find((s) => normalize(s.name) === q)
  if (exact) return exact

  const contains = societies.find((s) => normalize(s.name).includes(q) || q.includes(normalize(s.name)))
  if (contains) return contains

  const tokens = q.split(/\s+/).filter(Boolean)
  return societies.find((s) => {
    const name = normalize(s.name)
    return tokens.every((token) => name.includes(token))
  })
}

function extractSocietyNameFromLinkCommand(raw: string): string | null {
  const patterns = [
    /(?:generate|create|build|get|make)\s+(?:a\s+)?(?:registration|signup|sign-up|invite|onboarding)?\s*link\s+(?:for|to)\s+(.+)/i,
    /link\s+for\s+(.+)/i,
    /invite\s+(.+)/i
  ]

  for (const pattern of patterns) {
    const match = raw.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

export function parseSyncraCommand(raw: string, societies: Society[]): CommandBarAction {
  const input = raw.trim()
  if (!input) {
    return {
      type: 'help',
      message: 'Type a command or pick a suggestion below.',
      suggestions: [
        'Generate link for Regency Crest',
        'Show global webhook errors',
        'Open audit logs',
        'Refresh platform data'
      ]
    }
  }

  const lower = normalize(input)

  if (/^(help|\?|commands?)$/.test(lower)) {
    return {
      type: 'help',
      message: 'Natural language commands for the Syncra control tower.',
      suggestions: [
        'Generate link for [Society Name]',
        'Show global webhook errors',
        'Show MRR overview',
        'Open society onboarding',
        'Refresh platform data'
      ]
    }
  }

  if (/refresh|reload|sync/.test(lower)) {
    return { type: 'refresh', message: 'Refreshing platform telemetry…' }
  }

  if (/webhook|n8n|whatsapp.*error|automation.*status/.test(lower)) {
    return {
      type: 'webhook_status',
      message: 'Checking global n8n / WhatsApp webhook health…'
    }
  }

  if (/audit|activity trail|platform logs/.test(lower)) {
    const audit = SUPER_ADMIN_NAV.find((item) => item.path.includes('audit-logs'))
    return {
      type: 'navigate',
      path: audit?.path ?? '/super-admin/audit-logs',
      message: 'Opening platform audit logs…'
    }
  }

  if (/onboard|societ(y|ies)/.test(lower) && /open|show|go|navigate/.test(lower)) {
    return {
      type: 'navigate',
      path: '/super-admin/societies',
      message: 'Opening society onboarding…'
    }
  }

  if (/mrr|revenue|billing|subscription|commercial|financial/.test(lower)) {
    return { type: 'scroll', target: 'revenue', message: 'Scrolling to commercial health…' }
  }

  if (/ledger|registration|recent societ/.test(lower)) {
    return { type: 'scroll', target: 'ledger', message: 'Scrolling to platform ledger…' }
  }

  if (/topology|network|graph|map|gatekeeper traffic/.test(lower)) {
    return { type: 'scroll', target: 'topology', message: 'Scrolling to platform topology…' }
  }

  if (/invite|registration link|signup link|sign-up link|generate link|copy link/.test(lower)) {
    const societyQuery = extractSocietyNameFromLinkCommand(input)
    if (!societyQuery) {
      return {
        type: 'scroll',
        target: 'onboarding',
        message: 'Opening onboarding control — select a society to generate a link.'
      }
    }

    const society = findSocietyByName(societyQuery, societies)
    if (!society) {
      return {
        type: 'unknown',
        message: `No onboarded society matched "${societyQuery}". Check Society Onboarding for the exact name.`
      }
    }

    const url = buildSocietyRegistrationUrl(society.id)
    return {
      type: 'generate_link',
      societyId: society.id,
      societyName: society.name,
      url,
      message: `Registration link ready for ${society.name}.`
    }
  }

  const fuzzySociety = findSocietyByName(input, societies)
  if (fuzzySociety) {
    const url = buildSocietyRegistrationUrl(fuzzySociety.id)
    return {
      type: 'generate_link',
      societyId: fuzzySociety.id,
      societyName: fuzzySociety.name,
      url,
      message: `Registration link ready for ${fuzzySociety.name}.`
    }
  }

  return {
    type: 'unknown',
    message: `Could not interpret "${input}". Try "Generate link for [Society]" or "Show global webhook errors".`
  }
}
