import { logActivity } from '../lib/activityLog'

export type SurveyOption = { id: string; label: string }

export type Survey = {
  id: string
  societyId: string
  title: string
  description: string
  options: SurveyOption[]
  status: 'draft' | 'active' | 'closed'
  createdAt: string
  closesAt?: string | null
}

export type SurveyResponse = {
  id: string
  surveyId: string
  userId: string
  flatNumber: string
  optionId: string
  respondedAt: string
}

function surveysKey(societyId: string) {
  return `syncra-surveys-${societyId}`
}

function responsesKey(surveyId: string) {
  return `syncra-survey-responses-${surveyId}`
}

function loadSurveys(societyId: string): Survey[] {
  try {
    const raw = localStorage.getItem(surveysKey(societyId))
    return raw ? (JSON.parse(raw) as Survey[]) : []
  } catch {
    return []
  }
}

function saveSurveys(societyId: string, surveys: Survey[]) {
  localStorage.setItem(surveysKey(societyId), JSON.stringify(surveys))
}

function loadResponses(surveyId: string): SurveyResponse[] {
  try {
    const raw = localStorage.getItem(responsesKey(surveyId))
    return raw ? (JSON.parse(raw) as SurveyResponse[]) : []
  } catch {
    return []
  }
}

function saveResponses(surveyId: string, responses: SurveyResponse[]) {
  localStorage.setItem(responsesKey(surveyId), JSON.stringify(responses))
}

export function listSurveys(societyId: string, activeOnly = false) {
  const surveys = loadSurveys(societyId)
  if (!activeOnly) return surveys
  return surveys.filter((s) => s.status === 'active')
}

export function createSurvey(input: {
  societyId: string
  title: string
  description: string
  options: string[]
  closesAt?: string | null
}) {
  const survey: Survey = {
    id: `survey-${Date.now()}`,
    societyId: input.societyId,
    title: input.title,
    description: input.description,
    options: input.options.filter(Boolean).map((label, index) => ({
      id: `opt-${index + 1}`,
      label
    })),
    status: 'active',
    createdAt: new Date().toISOString(),
    closesAt: input.closesAt ?? null
  }
  const surveys = loadSurveys(input.societyId)
  surveys.unshift(survey)
  saveSurveys(input.societyId, surveys)
  logActivity({
    societyId: input.societyId,
    category: 'survey',
    action: 'survey_created',
    summary: `Survey launched: ${survey.title}`,
    metadata: { surveyId: survey.id }
  })
  return survey
}

export function closeSurvey(societyId: string, surveyId: string) {
  const surveys = loadSurveys(societyId).map((s) =>
    s.id === surveyId ? { ...s, status: 'closed' as const } : s
  )
  saveSurveys(societyId, surveys)
}

export function submitSurveyResponse(input: {
  societyId: string
  surveyId: string
  userId: string
  flatNumber: string
  optionId: string
}) {
  const surveys = loadSurveys(input.societyId)
  const survey = surveys.find((s) => s.id === input.surveyId)
  if (!survey || survey.status !== 'active') throw new Error('Survey is not open for responses.')

  const responses = loadResponses(input.surveyId)
  if (responses.some((r) => r.flatNumber === input.flatNumber)) {
    throw new Error('This flat has already submitted a response.')
  }

  const response: SurveyResponse = {
    id: `resp-${Date.now()}`,
    surveyId: input.surveyId,
    userId: input.userId,
    flatNumber: input.flatNumber,
    optionId: input.optionId,
    respondedAt: new Date().toISOString()
  }
  responses.push(response)
  saveResponses(input.surveyId, responses)

  logActivity({
    societyId: input.societyId,
    userId: input.userId,
    flatNumber: input.flatNumber,
    category: 'survey',
    action: 'survey_response',
    summary: `Flat ${input.flatNumber} responded to survey: ${survey.title}`,
    metadata: { surveyId: input.surveyId, optionId: input.optionId }
  })

  return response
}

export function getSurveyResults(societyId: string, surveyId: string) {
  const survey = loadSurveys(societyId).find((s) => s.id === surveyId)
  if (!survey) return null
  const responses = loadResponses(surveyId)
  const counts: Record<string, number> = {}
  for (const opt of survey.options) counts[opt.id] = 0
  for (const r of responses) counts[r.optionId] = (counts[r.optionId] ?? 0) + 1
  return { survey, totalResponses: responses.length, counts }
}

export function hasFlatResponded(surveyId: string, flatNumber: string) {
  return loadResponses(surveyId).some((r) => r.flatNumber === flatNumber)
}
