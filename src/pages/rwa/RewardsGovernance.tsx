import React, { useMemo } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  buildSocietyScoreSnapshot,
  getPublishedWeights,
  SCORING_SPEC_VERSION
} from '../../lib/governanceScoring'
import { ui } from '../../lib/ui'

export default function RewardsGovernance() {
  const { currentSocietyId, showcaseData } = useAuth()
  const weights = getPublishedWeights()

  const snapshot = useMemo(() => {
    if (!currentSocietyId) return null
    const units = showcaseData?.units ?? []
    const flats = units.map((u) => ({
      flatNumber: u.flat_number,
      paymentStatus: u.balance_status as 'paid' | 'due' | 'defaulter'
    }))
    const defaulterCount = units.filter((u) => u.balance_status === 'defaulter').length
    return buildSocietyScoreSnapshot(currentSocietyId, flats, {
      totalFlats: units.length || showcaseData?.society.totalFlats,
      defaulterCount
    })
  }, [currentSocietyId, showcaseData])

  if (!snapshot) {
    return <p className={ui.body}>Select a society to view governance scores.</p>
  }

  const advisory = snapshot.advisory

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Governance scoring v{SCORING_SPEC_VERSION}</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Rewards & governance health</h2>
        <p className={`mt-2 ${ui.body}`}>
          Transparent, published weights — no black-box AI. Points derive only from auditable activity log events.
        </p>
      </section>

      <section className={ui.card}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={ui.eyebrow}>Society wellness index</p>
            <p className="mt-2 text-5xl font-semibold text-syncra-primary">{advisory.societyWellnessIndex}/100</p>
            <p className={`mt-2 text-lg font-medium ${advisory.level === 'healthy' ? 'text-emerald-600' : advisory.level === 'review' ? 'text-syncra-action' : 'text-syncra-action-alt'}`}>
              {advisory.headline}
            </p>
          </div>
          <div className={`${ui.innerItem} text-sm`}>
            <p className="font-semibold text-syncra-primary">RWA score: {snapshot.adminScore.totalPoints} pts</p>
            <p className="mt-1">{snapshot.adminScore.badge}</p>
          </div>
        </div>
        {advisory.reasons.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm text-slate-600">
            {advisory.reasons.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        )}
        {advisory.suggestReElectionReview && (
          <div className="mt-4 rounded-xl border border-syncra-action/30 bg-orange-50 px-4 py-3 text-sm text-syncra-primary">
            <strong>Governance advisory:</strong> Multiple critical signals detected. Consider scheduling an AGM
            committee review or election process per your society bylaws. This is a data summary, not an automated decision.
          </div>
        )}
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Resident recognition leaderboard</h3>
        <ul className="mt-4 space-y-3">
          {snapshot.residentScores.slice(0, 10).map((r, index) => (
            <li key={r.flatNumber} className={`flex items-center justify-between ${ui.innerItem}`}>
              <div>
                <span className="text-sm font-semibold text-syncra-primary">#{index + 1} Flat {r.flatNumber}</span>
                <span className="ml-3 text-xs text-slate-500">{r.badge}</span>
              </div>
              <span className="font-semibold text-syncra-blue">{r.totalPoints} pts</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Published scoring weights (v{weights.version})</h3>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-syncra-primary">Resident actions</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {Object.entries(weights.resident).map(([key, val]) => (
                <li key={key}>
                  {val.label}: <strong>{val.points > 0 ? '+' : ''}{val.points}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-syncra-primary">RWA admin actions</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {Object.entries(weights.admin).map(([key, val]) => (
                <li key={key}>
                  {val.label}: <strong>{val.points > 0 ? '+' : ''}{val.points}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
