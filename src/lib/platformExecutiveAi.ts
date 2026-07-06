import { resolveNoticeEnhancerModel, resolveHuggingFaceToken, resolveClientN8nWebhookUrl } from './n8nConfig'
import { SMART_AI_UNAVAILABLE_MESSAGE } from './clientCopy'
import type { PlatformControlTowerData } from './platformControlTower'
import { formatInr } from './platformControlTower'

export type ExecutiveInsight = {
  id: string
  label: string
  detail: string
  severity: 'info' | 'watch' | 'critical'
}

export type ExecutiveSummaryResult = {
  headline: string
  narrative: string
  insights: ExecutiveInsight[]
  source: 'ai' | 'n8n' | 'rules'
  generatedAt: string
}

const HF_INFERENCE_BASE = 'https://api-inference.huggingface.co/models'

function buildRuleBasedSummary(data: PlatformControlTowerData): ExecutiveSummaryResult {
  const { societies, visitorLogs24h, financial } = data
  const pending = financial.pendingInvoices
  const trials = financial.trialSocieties
  const mrr = financial.totalMrrInr

  const gatekeeperTone =
    visitorLogs24h >= 50 ? 'elevated' : visitorLogs24h >= 15 ? 'steady' : 'quiet'

  const insights: ExecutiveInsight[] = [
    {
      id: 'fleet',
      label: 'Society fleet',
      detail: `${societies.length} societies · ${data.totalFlats.toLocaleString('en-IN')} units onboarded`,
      severity: 'info'
    },
    {
      id: 'gatekeeper',
      label: 'Gatekeeper throughput',
      detail: `${visitorLogs24h} visitor events in the last 24h — traffic is ${gatekeeperTone}`,
      severity: visitorLogs24h >= 50 ? 'watch' : 'info'
    },
    {
      id: 'revenue',
      label: 'Platform MRR',
      detail: `${formatInr(mrr)} across ${financial.activeSubscriptions} active subscriptions`,
      severity: mrr === 0 && societies.length > 0 ? 'watch' : 'info'
    }
  ]

  if (pending > 0) {
    insights.push({
      id: 'billing',
      label: 'Subscription alerts',
      detail: `${pending} societ${pending === 1 ? 'y has' : 'ies have'} pending activation or invoice flags`,
      severity: 'critical'
    })
  }

  if (trials > 0) {
    insights.push({
      id: 'trials',
      label: 'Trial conversion',
      detail: `${trials} trial societ${trials === 1 ? 'y' : 'ies'} awaiting paid activation`,
      severity: 'watch'
    })
  }

  const headline =
    pending > 0
      ? 'Billing attention required across the platform fleet'
      : visitorLogs24h >= 50
        ? 'Gatekeeper traffic spike detected platform-wide'
        : 'Platform operating within normal bounds'

  const narrative = [
    `Syncra is monitoring ${societies.length} onboarded societies with ${formatInr(mrr)} MRR.`,
    `Gatekeeper consoles processed ${visitorLogs24h} visitor log events in the last 24 hours (${gatekeeperTone} load).`,
    pending > 0
      ? `${pending} subscription or invoice flag(s) need Super Admin review.`
      : trials > 0
        ? `${trials} society(ies) remain on trial — consider activation outreach.`
        : 'No critical billing anomalies detected in the current billing snapshot.'
  ].join(' ')

  return {
    headline,
    narrative,
    insights: insights.slice(0, 4),
    source: 'rules',
    generatedAt: new Date().toISOString()
  }
}

function extractGeneratedText(payload: unknown): string {
  if (Array.isArray(payload)) {
    const first = payload[0] as Record<string, unknown> | undefined
    if (typeof first?.generated_text === 'string') return first.generated_text
  }
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const row = payload as Record<string, unknown>
    if (typeof row.generated_text === 'string') return row.generated_text
    if (typeof row.text === 'string') return row.text
  }
  return ''
}

async function tryN8nExecutiveSummary(data: PlatformControlTowerData): Promise<ExecutiveSummaryResult | null> {
  const context = {
    societies: data.societies.length,
    totalFlats: data.totalFlats,
    visitorLogs24h: data.visitorLogs24h,
    mrrInr: data.financial.totalMrrInr,
    pendingInvoices: data.financial.pendingInvoices,
    trialSocieties: data.financial.trialSocieties,
    activeSubscriptions: data.financial.activeSubscriptions
  }

  const webhookUrl = resolveClientN8nWebhookUrl('platform')

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: `exec-${Date.now()}`,
        type: 'platform.executive_summary',
        societyId: 'platform',
        societyName: 'Syncra Platform',
        summary: 'Generate Super Admin executive summary',
        occurredAt: new Date().toISOString(),
        metadata: context
      })
    })

    if (!res.ok) return null

    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return null

    const headline = typeof body.headline === 'string' ? body.headline : null
    const narrative = typeof body.narrative === 'string' ? body.narrative : null
    if (!headline || !narrative) return null

    const rawInsights = Array.isArray(body.insights) ? body.insights : []
    const insights: ExecutiveInsight[] = rawInsights
      .slice(0, 4)
      .map((item, index) => {
        const row = item as Record<string, unknown>
        return {
          id: String(row.id ?? `n8n-${index}`),
          label: String(row.label ?? 'Insight'),
          detail: String(row.detail ?? ''),
          severity: (['info', 'watch', 'critical'].includes(String(row.severity))
            ? row.severity
            : 'info') as ExecutiveInsight['severity']
        }
      })
      .filter((item) => item.detail)

    return {
      headline,
      narrative,
      insights: insights.length ? insights : buildRuleBasedSummary(data).insights,
      source: 'n8n',
      generatedAt: new Date().toISOString()
    }
  } catch {
    return null
  }
}

async function tryLlmExecutiveSummary(data: PlatformControlTowerData): Promise<ExecutiveSummaryResult | null> {
  const token = resolveHuggingFaceToken()
  if (!token) return null

  const model = resolveNoticeEnhancerModel()
  const prompt = [
    'You are Syncra AI, the executive intelligence layer for a housing society management platform.',
    'Write a concise platform briefing for the Super Admin.',
    'Return ONLY valid JSON with keys: headline (string), narrative (string), insights (array of {label, detail, severity}).',
    'severity must be info, watch, or critical.',
    `Platform snapshot: ${JSON.stringify({
      societies: data.societies.length,
      totalFlats: data.totalFlats,
      visitorLogs24h: data.visitorLogs24h,
      mrrInr: data.financial.totalMrrInr,
      pendingInvoices: data.financial.pendingInvoices,
      trialSocieties: data.financial.trialSocieties,
      activeSubscriptions: data.financial.activeSubscriptions
    })}`,
    'JSON:'
  ].join('\n')

  try {
    const res = await fetch(`${HF_INFERENCE_BASE}/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 220, return_full_text: false, temperature: 0.2 }
      })
    })

    if (!res.ok) return null

    const payload = await res.json()
    const generated = extractGeneratedText(payload)
    const jsonMatch = generated.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as {
      headline?: string
      narrative?: string
      insights?: Array<{ label?: string; detail?: string; severity?: string }>
    }

    if (!parsed.headline || !parsed.narrative) return null

    const insights: ExecutiveInsight[] = (parsed.insights ?? [])
      .slice(0, 4)
      .map((item, index) => ({
        id: `ai-${index}`,
        label: String(item.label ?? 'Insight'),
        detail: String(item.detail ?? ''),
        severity: (['info', 'watch', 'critical'].includes(String(item.severity))
          ? item.severity
          : 'info') as ExecutiveInsight['severity']
      }))
      .filter((item) => item.detail)

    return {
      headline: parsed.headline,
      narrative: parsed.narrative,
      insights: insights.length ? insights : buildRuleBasedSummary(data).insights,
      source: 'ai',
      generatedAt: new Date().toISOString()
    }
  } catch {
    return null
  }
}

/** AI / n8n / rules executive briefing for the Super Admin control tower. */
export async function generateExecutiveSummary(
  data: PlatformControlTowerData
): Promise<ExecutiveSummaryResult> {
  const n8nSummary = await tryN8nExecutiveSummary(data)
  if (n8nSummary) return n8nSummary

  const llmSummary = await tryLlmExecutiveSummary(data)
  if (llmSummary) return llmSummary

  const rules = buildRuleBasedSummary(data)
  if (!resolveHuggingFaceToken()) {
    rules.narrative = `${rules.narrative} ${SMART_AI_UNAVAILABLE_MESSAGE}`
  }
  return rules
}
