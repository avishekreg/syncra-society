import React, { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { createSurvey, listSurveys, closeSurvey, getSurveyResults } from '../../api/surveys'
import { ui } from '../../lib/ui'

export default function SurveysManager() {
  const { currentSocietyId } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState('Yes\nNo\nAbstain')
  const [refresh, setRefresh] = useState(0)

  const surveys = currentSocietyId ? listSurveys(currentSocietyId) : []

  function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!currentSocietyId) return
    createSurvey({
      societyId: currentSocietyId,
      title,
      description,
      options: options.split('\n').map((o) => o.trim()).filter(Boolean)
    })
    setTitle('')
    setDescription('')
    setOptions('Yes\nNo\nAbstain')
    setRefresh((n) => n + 1)
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Community surveys</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Launch a society survey</h2>
        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={ui.input} placeholder="Survey title" required />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={ui.input} rows={2} placeholder="Description" required />
          <textarea value={options} onChange={(e) => setOptions(e.target.value)} className={ui.input} rows={4} placeholder="One option per line" required />
          <button type="submit" className={ui.btnPrimary}>Publish Survey</button>
        </form>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Active & past surveys</h3>
        <ul className="mt-4 space-y-4">
          {surveys.map((survey) => {
            const results = currentSocietyId ? getSurveyResults(currentSocietyId, survey.id) : null
            return (
              <li key={`${survey.id}-${refresh}`} className={ui.innerItem}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-syncra-primary">{survey.title}</p>
                    <p className={`mt-1 text-sm ${ui.body}`}>{survey.description}</p>
                    <p className="mt-2 text-xs text-slate-500">Status: {survey.status} · {results?.totalResponses ?? 0} responses</p>
                  </div>
                  {survey.status === 'active' && currentSocietyId && (
                    <button type="button" onClick={() => { closeSurvey(currentSocietyId, survey.id); setRefresh((n) => n + 1) }} className={ui.btnGhost}>
                      Close
                    </button>
                  )}
                </div>
                {results && (
                  <ul className="mt-3 space-y-1 text-sm text-slate-600">
                    {survey.options.map((opt) => (
                      <li key={opt.id}>{opt.label}: {results.counts[opt.id] ?? 0}</li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
