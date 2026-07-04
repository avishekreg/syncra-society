import { logActivity } from '../lib/activityLog'

export type SurveyOption = { id: string; label: string }

export type SurveyQuestion = {
  id: string
  prompt: string
  options: SurveyOption[]
}

export type Survey = {
  id: string
  societyId: string
  title: string
  description: string
  questions: SurveyQuestion[]
  /** @deprecated Legacy single-question options — migrated on read */
  options?: SurveyOption[]
  status: 'draft' | 'active' | 'closed'
  createdAt: string
  closesAt?: string | null
}

export type SurveyAnswer = {
  questionId: string
  optionId: string
}

export type SurveyResponse = {
  id: string
  surveyId: string
  userId: string
  flatNumber: string
  answers: SurveyAnswer[]
  /** @deprecated Legacy single answer */
  optionId?: string
  respondedAt: string
}

function surveysKey(societyId: string) {
  return `syncra-surveys-${societyId}`
}

function responsesKey(surveyId: string) {
  return `syncra-survey-responses-${surveyId}`
}

function normalizeSurvey(raw: Survey): Survey {
  if (raw.questions?.length) return raw

  const legacyOptions = raw.options ?? []
  return {
    ...raw,
    questions: [
      {
        id: 'q-1',
        prompt: raw.title,
        options: legacyOptions
      }
    ]
  }
}

function loadSurveys(societyId: string): Survey[] {
  try {
    const raw = localStorage.getItem(surveysKey(societyId))
    const parsed = raw ? (JSON.parse(raw) as Survey[]) : []
    return parsed.map(normalizeSurvey)
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
    const parsed = raw ? (JSON.parse(raw) as SurveyResponse[]) : []
    return parsed.map((response) => ({
      ...response,
      answers:
        response.answers ??
        (response.optionId ? [{ questionId: 'q-1', optionId: response.optionId }] : [])
    }))
  } catch {
    return []
  }
}

function saveResponses(surveyId: string, responses: SurveyResponse[]) {
  localStorage.setItem(responsesKey(surveyId), JSON.stringify(responses))
}

function buildQuestionId(index: number) {
  return `q-${index + 1}`
}

function buildOptionId(questionIndex: number, optionIndex: number) {
  return `opt-${questionIndex + 1}-${optionIndex + 1}`
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
  questions: { prompt: string; options: string[] }[]
  closesAt?: string | null
}) {
  const questions: SurveyQuestion[] = input.questions
    .filter((question) => question.prompt.trim())
    .map((question, questionIndex) => ({
      id: buildQuestionId(questionIndex),
      prompt: question.prompt.trim(),
      options: question.options
        .map((label) => label.trim())
        .filter(Boolean)
        .map((label, optionIndex) => ({
          id: buildOptionId(questionIndex, optionIndex),
          label
        }))
    }))
    .filter((question) => question.options.length > 0)

  if (questions.length === 0) {
    throw new Error('Add at least one question with answer options.')
  }

  const survey: Survey = {
    id: `survey-${Date.now()}`,
    societyId: input.societyId,
    title: input.title,
    description: input.description,
    questions,
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
    summary: `Survey launched: ${survey.title} (${questions.length} questions)`,
    metadata: { surveyId: survey.id, questionCount: questions.length }
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
  answers: SurveyAnswer[]
}) {
  const surveys = loadSurveys(input.societyId)
  const survey = surveys.find((s) => s.id === input.surveyId)
  if (!survey || survey.status !== 'active') throw new Error('Survey is not open for responses.')

  const responses = loadResponses(input.surveyId)
  if (responses.some((r) => r.flatNumber === input.flatNumber)) {
    throw new Error('This flat has already submitted a response.')
  }

  for (const question of survey.questions) {
    const answer = input.answers.find((item) => item.questionId === question.id)
    if (!answer) throw new Error(`Please answer: ${question.prompt}`)
    if (!question.options.some((option) => option.id === answer.optionId)) {
      throw new Error(`Invalid option for question: ${question.prompt}`)
    }
  }

  const response: SurveyResponse = {
    id: `resp-${Date.now()}`,
    surveyId: input.surveyId,
    userId: input.userId,
    flatNumber: input.flatNumber,
    answers: input.answers,
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
    metadata: { surveyId: input.surveyId, answers: input.answers }
  })

  return response
}

export function getSurveyResults(societyId: string, surveyId: string) {
  const survey = loadSurveys(societyId).find((s) => s.id === surveyId)
  if (!survey) return null

  const responses = loadResponses(surveyId)
  const questionResults = survey.questions.map((question) => {
    const counts: Record<string, number> = {}
    for (const option of question.options) counts[option.id] = 0
    for (const response of responses) {
      const answer = response.answers.find((item) => item.questionId === question.id)
      if (answer) counts[answer.optionId] = (counts[answer.optionId] ?? 0) + 1
    }
    return { question, counts }
  })

  return { survey, totalResponses: responses.length, questionResults }
}

export function hasFlatResponded(surveyId: string, flatNumber: string) {
  return loadResponses(surveyId).some((r) => r.flatNumber === flatNumber)
}
