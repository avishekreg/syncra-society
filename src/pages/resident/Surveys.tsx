import React, { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { listSurveys, submitSurveyResponse, hasFlatResponded } from '../../api/surveys'
import { ui } from '../../lib/ui'

export default function ResidentSurveysPage() {
  const { currentSocietyId, user } = useAuth()
  const [refresh, setRefresh] = useState(0)
  const surveys = currentSocietyId ? listSurveys(currentSocietyId, true) : []
  const flat = user?.flatNumber ?? ''

  async function handleVote(surveyId: string, optionId: string) {
    if (!currentSocietyId || !user?.id || !flat) return alert('Flat mapping required.')
    try {
      submitSurveyResponse({
        societyId: currentSocietyId,
        surveyId,
        userId: user.id,
        flatNumber: flat,
        optionId
      })
      setRefresh((n) => n + 1)
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Community surveys</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Share your opinion</h2>
        <p className={`mt-2 ${ui.body}`}>One response per flat. Results are aggregated anonymously.</p>
      </section>

      {surveys.length === 0 && (
        <section className={ui.card}>
          <p className={ui.body}>No active surveys right now.</p>
        </section>
      )}

      {surveys.map((survey) => {
        const responded = hasFlatResponded(survey.id, flat)
        return (
          <section key={`${survey.id}-${refresh}`} className={ui.card}>
            <h3 className="text-lg font-semibold text-syncra-primary">{survey.title}</h3>
            <p className={`mt-2 ${ui.body}`}>{survey.description}</p>
            {responded ? (
              <p className="mt-4 text-sm font-medium text-emerald-600">Your flat has already responded. Thank you!</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {survey.options.map((opt) => (
                  <button key={opt.id} type="button" onClick={() => void handleVote(survey.id, opt.id)} className={ui.btnSecondary}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
