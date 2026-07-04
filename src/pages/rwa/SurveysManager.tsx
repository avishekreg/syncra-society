import React, { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { usePlatformConfig } from '../../providers/PlatformConfigProvider'
import { createSurvey, listSurveys, closeSurvey, getSurveyResults } from '../../api/surveys'
import { ui } from '../../lib/ui'

type QuestionDraft = {
  prompt: string
  options: string
}

const FALLBACK_QUESTIONS: QuestionDraft[] = [
  { prompt: 'Should we approve the rooftop solar proposal?', options: 'Yes\nNo\nAbstain' },
  { prompt: 'Preferred vendor for annual painting?', options: 'Vendor A\nVendor B\nNeed more quotes' }
]

export default function SurveysManager() {
  const { currentSocietyId } = useAuth()
  const { config } = usePlatformConfig()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<QuestionDraft[]>(FALLBACK_QUESTIONS)
  const [refresh, setRefresh] = useState(0)

  const surveyConfig = config.surveyEngine

  const surveys = currentSocietyId ? listSurveys(currentSocietyId) : []

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addQuestion() {
    if (questions.length >= surveyConfig.maxQuestionsPerSurvey) return
    setQuestions((current) => [...current, { prompt: '', options: 'Yes\nNo\nAbstain' }])
  }

  function removeQuestion(index: number) {
    setQuestions((current) => current.filter((_, i) => i !== index))
  }

  function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!currentSocietyId) return
    try {
      createSurvey({
        societyId: currentSocietyId,
        title,
        description,
        questions: questions.map((question) => ({
          prompt: question.prompt,
          options: question.options.split('\n').map((option) => option.trim()).filter(Boolean)
        }))
      })
      setTitle('')
      setDescription('')
      setQuestions(FALLBACK_QUESTIONS)
      setRefresh((n) => n + 1)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Unable to create survey')
    }
  }

  if (!surveyConfig.enabled) {
    return (
      <div className={ui.card}>
        <p className={ui.eyebrow}>Surveys</p>
        <h2 className={`mt-3 ${ui.heading}`}>Survey engine disabled</h2>
        <p className={`mt-3 ${ui.body}`}>
          The platform super admin has disabled the survey module globally. Enable it under Super Admin → Global
          Platform Settings.
        </p>
      </div>
    )
  }

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>Community surveys</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Launch a multi-question survey</h2>
        <form onSubmit={handleCreate} className="mt-6 space-y-6">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={ui.input} placeholder="Survey title" required />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={ui.input} rows={2} placeholder="Description" required />

          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <p className={ui.label}>
                Questions ({questions.length}/{surveyConfig.maxQuestionsPerSurvey} max ·{' '}
                {surveyConfig.maxOptionsPerQuestion} options each)
              </p>
              <button
                type="button"
                onClick={addQuestion}
                disabled={questions.length >= surveyConfig.maxQuestionsPerSurvey}
                className={ui.btnGhost}
              >
                Add question
              </button>
            </div>
            {questions.map((question, index) => (
              <div key={`question-${index}`} className={`${ui.innerItem} space-y-3`}>
                <div className="flex items-start justify-between gap-3">
                  <input
                    value={question.prompt}
                    onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
                    className={ui.input}
                    placeholder={`Question ${index + 1}`}
                    required
                  />
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(index)} className={ui.btnGhost}>
                      Remove
                    </button>
                  )}
                </div>
                <textarea
                  value={question.options}
                  onChange={(e) => updateQuestion(index, { options: e.target.value })}
                  className={ui.input}
                  rows={3}
                  placeholder="One option per line"
                  required
                />
              </div>
            ))}
          </div>

          <button type="submit" className={ui.btnPrimary}>
            Publish Survey
          </button>
        </form>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Active & past surveys</h3>
        <ul className="mt-6 space-y-4">
          {surveys.map((survey) => {
            const results = currentSocietyId ? getSurveyResults(currentSocietyId, survey.id) : null
            return (
              <li key={`${survey.id}-${refresh}`} className={ui.innerItem}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-syncra-primary">{survey.title}</p>
                    <p className={`mt-1 text-sm ${ui.body}`}>{survey.description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Status: {survey.status} · {survey.questions.length} questions · {results?.totalResponses ?? 0}{' '}
                      responses · {new Date(survey.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  {survey.status === 'active' && currentSocietyId && (
                    <button
                      type="button"
                      onClick={() => {
                        closeSurvey(currentSocietyId, survey.id)
                        setRefresh((n) => n + 1)
                      }}
                      className={ui.btnGhost}
                    >
                      Close
                    </button>
                  )}
                </div>
                {results && (
                  <div className="mt-4 space-y-4">
                    {results.questionResults.map(({ question, counts }) => (
                      <div key={question.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-syncra-primary">{question.prompt}</p>
                        <ul className="mt-2 space-y-1 text-sm text-slate-600">
                          {question.options.map((option) => (
                            <li key={option.id}>
                              {option.label}: {counts[option.id] ?? 0}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
