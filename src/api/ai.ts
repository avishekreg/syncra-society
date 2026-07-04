import {
  resolveHuggingFaceToken,
  resolveNoticeEnhancerModel,
  resolveVoiceModel
} from '../lib/n8nConfig'
import { SMART_AI_UNAVAILABLE_MESSAGE } from '../lib/clientCopy'

const HF_INFERENCE_BASE = 'https://api-inference.huggingface.co/models'

export class AiServiceError extends Error {
  code: 'missing_token' | 'transcription_failed' | 'classification_failed' | 'network'

  constructor(message: string, code: AiServiceError['code']) {
    super(message)
    this.code = code
  }
}

export const HELPDESK_CATEGORIES = ['Plumbing', 'Electrical', 'Security', 'Cleanliness'] as const
export const HELPDESK_SEVERITIES = ['Low', 'Medium', 'High'] as const

export type HelpdeskCategory = (typeof HELPDESK_CATEGORIES)[number]
export type HelpdeskSeverity = (typeof HELPDESK_SEVERITIES)[number]

export type HelpdeskClassification = {
  category: HelpdeskCategory
  severity: HelpdeskSeverity
}

type HfJsonResponse = Record<string, unknown> | Array<Record<string, unknown>>

async function hfFetch(modelId: string, init: RequestInit, retries = 2): Promise<Response> {
  const token = resolveHuggingFaceToken()
  if (!token) {
    throw new AiServiceError(SMART_AI_UNAVAILABLE_MESSAGE, 'missing_token')
  }

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof Blob)) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${HF_INFERENCE_BASE}/${modelId}`, { ...init, headers })

  if (res.status === 503 && retries > 0) {
    const waitMs = Number(res.headers.get('estimated_time') ?? 3) * 1000
    await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 8000)))
    return hfFetch(modelId, init, retries - 1)
  }

  return res
}

function extractGeneratedText(payload: HfJsonResponse): string {
  if (Array.isArray(payload)) {
    const first = payload[0]
    if (typeof first?.generated_text === 'string') return first.generated_text
    if (typeof first?.translation_text === 'string') return first.translation_text
  }
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    if (typeof payload.generated_text === 'string') return payload.generated_text
    if (typeof payload.text === 'string') return payload.text
  }
  return ''
}

function normalizeCategory(raw: string): HelpdeskCategory {
  const value = raw.trim().toLowerCase()
  const match = HELPDESK_CATEGORIES.find((item) => item.toLowerCase() === value)
  if (match) return match
  if (value.includes('plumb') || value.includes('water') || value.includes('pipe')) return 'Plumbing'
  if (value.includes('electric') || value.includes('power') || value.includes('light')) return 'Electrical'
  if (value.includes('security') || value.includes('guard') || value.includes('theft')) return 'Security'
  return 'Cleanliness'
}

function normalizeSeverity(raw: string): HelpdeskSeverity {
  const value = raw.trim().toLowerCase()
  const match = HELPDESK_SEVERITIES.find((item) => item.toLowerCase() === value)
  if (match) return match
  if (value.includes('high') || value.includes('urgent') || value.includes('critical')) return 'High'
  if (value.includes('low') || value.includes('minor')) return 'Low'
  return 'Medium'
}

function parseClassificationJson(text: string): HelpdeskClassification | null {
  const jsonMatch = text.match(/\{[\s\S]*?\}/)
  if (!jsonMatch) return null
  try {
    const parsed = JSON.parse(jsonMatch[0]) as { category?: string; severity?: string }
    if (!parsed.category || !parsed.severity) return null
    return {
      category: normalizeCategory(parsed.category),
      severity: normalizeSeverity(parsed.severity)
    }
  } catch {
    return null
  }
}

/** Transcribe resident audio via Hugging Face Whisper (Master Settings model). */
export async function transcribeAudioBlob(audio: Blob): Promise<string> {
  const model = resolveVoiceModel()
  const res = await hfFetch(model, { method: 'POST', body: audio })

  if (!res.ok) {
    await res.text().catch(() => res.statusText)
    throw new AiServiceError(SMART_AI_UNAVAILABLE_MESSAGE, 'transcription_failed')
  }

  const payload = (await res.json()) as HfJsonResponse
  const text = extractGeneratedText(payload).trim()
  if (!text) {
    throw new AiServiceError(SMART_AI_UNAVAILABLE_MESSAGE, 'transcription_failed')
  }
  return text
}

/** Auto-select category and severity using Llama-3 from Master Settings. */
export async function classifyHelpdeskTicket(description: string): Promise<HelpdeskClassification> {
  const model = resolveNoticeEnhancerModel()
  const prompt = [
    'You are a housing society helpdesk triage assistant.',
    'Return ONLY valid JSON with keys "category" and "severity".',
    `category must be one of: ${HELPDESK_CATEGORIES.join(', ')}.`,
    `severity must be one of: ${HELPDESK_SEVERITIES.join(', ')}.`,
    `Ticket description: """${description.slice(0, 1200)}"""`,
    'JSON:'
  ].join('\n')

  const res = await hfFetch(model, {
    method: 'POST',
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 80,
        return_full_text: false,
        temperature: 0.1
      }
    })
  })

  if (!res.ok) {
    await res.text().catch(() => res.statusText)
    throw new AiServiceError(SMART_AI_UNAVAILABLE_MESSAGE, 'classification_failed')
  }

  const payload = (await res.json()) as HfJsonResponse
  const generated = extractGeneratedText(payload)
  const parsed = parseClassificationJson(generated)
  if (parsed) return parsed

  return {
    category: normalizeCategory(generated),
    severity: normalizeSeverity(generated)
  }
}

/** Full voice pipeline: transcribe then classify. */
export async function processVoiceTicket(audio: Blob): Promise<{
  transcript: string
  classification: HelpdeskClassification
}> {
  const transcript = await transcribeAudioBlob(audio)
  const classification = await classifyHelpdeskTicket(transcript)
  return { transcript, classification }
}
