import React, { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { listSurveys, submitSurveyResponse, hasFlatResponded } from '../../api/surveys'
import { ui } from '../../lib/ui'

export default function ResidentSurveysPage() {
  const { currentSocietyId, user } = useAuth()
  const [refresh, setRefresh] = useState(0)
  const [draftAnswers, setDraftAnswers] = useState<Record<string, Record<string, string>>>({})
  const [message, setMessage] = useState('')
  const surveys = currentSocietyId ? listSurveys(currentSocietyId, true) : []
  const flat = user?.flatNumber ?? ''

  function setAnswer(surveyId: string, questionId: string, optionId: string) {
    setDraftAnswers((current) => ({
      ...current,
      [surveyId]: { ...(current[surveyId] ?? {}), [questionId]: optionId }
    }))
  }

  async function handleSubmit(surveyId: string, questionIds: string[]) {
    if (!currentSocietyId || !user?.id || !flat) return alert('Flat mapping required.')
    setMessage('')
    try {
      const answers = questionIds.map((questionId) => ({
        questionId,
        optionId: draftAnswers[surveyId]?.[questionId] ?? ''
      }))
      submitSurveyResponse({
        societyId: currentSocietyId,
        surveyId,
        userId: user.id,
        flatNumber: flat,
        answers
      })
      setRefresh((n) => n + 1)
      setMessage('Your responses have been recorded. Thank you for participating.')
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Unable to submit survey')
    }
  }

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>Community surveys</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Share your opinion</h2>
        <p className={`mt-2 ${ui.body}`}>One response per flat across all questions. Results are aggregated anonymously.</p>
      </section>

      {message && <div className={`${ui.innerItem} text-sm text-slate-700`}>{message}</div>}

      {surveys.length === 0 && (
        <section className={ui.card}>
          <p className={ui.body}>No active surveys right now.</p>
        </section>
      )}

      {surveys.map((survey) => {
        const responded = hasFlatResponded(survey.id, flat)
        const questionIds = survey.questions.map((question) => question.id)
        const allAnswered = questionIds.every((questionId) => draftAnswers[survey.id]?.[questionId])

        return (
          <section key={`${survey.id}-${refresh}`} className={ui.card}>
            <h3 className="text-lg font-semibold text-syncra-primary">{survey.title}</h3>
            <p className={`mt-2 ${ui.body}`}>{survey.description}</p>
            {responded ? (
              <p className="mt-4 text-sm font-medium text-emerald-600">Your flat has already responded. Thank you!</p>
            ) : (
              <div className="mt-6 space-y-6">
                {survey.questions.map((question, index) => (
                  <div key={question.id} className={`${ui.innerItem} space-y-3`}>
                    <p className="text-sm font-semibold text-syncra-primary">
                      {index + 1}. {question.prompt}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {question.options.map((option) => {
                        const selected = draftAnswers[survey.id]?.[question.id] === option.id
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setAnswer(survey.id, question.id, option.id)}
                            className={
                              selected
                                ? 'rounded-xl border border-syncra-accent/40 bg-syncra-accent/15 px-4 py-2 text-sm font-semibold text-syncra-blue'
                                : ui.btnSecondary
                            }
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={!allAnswered}
                  onClick={() => void handleSubmit(survey.id, questionIds)}
                  className={`${ui.btnPrimary} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  Submit all answers
                </button>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
