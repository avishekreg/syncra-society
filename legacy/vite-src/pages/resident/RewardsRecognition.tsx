import React, { useMemo } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { calculateResidentScore, getPublishedWeights, SCORING_SPEC_VERSION } from '../../lib/governanceScoring'
import { ui } from '../../lib/ui'

export default function RewardsRecognition() {
  const { currentSocietyId, user, showcaseData } = useAuth()
  const flatNumber = user?.flatNumber ?? ''
  const weights = getPublishedWeights()

  const myUnit = useMemo(
    () => showcaseData?.units.find((u) => u.flat_number === flatNumber) ?? null,
    [showcaseData, flatNumber]
  )

  const score = useMemo(() => {
    if (!currentSocietyId || !flatNumber) return null
    return calculateResidentScore(
      currentSocietyId,
      flatNumber,
      myUnit?.balance_status as 'paid' | 'due' | 'defaulter' | undefined
    )
  }, [currentSocietyId, flatNumber, myUnit])

  if (!score) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Complete flat mapping to view your recognition score.</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Rewards & recognition v{SCORING_SPEC_VERSION}</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Your community score</h2>
        <p className={`mt-2 ${ui.body}`}>
          Earn points through timely payments, visitor approvals, surveys, and elections. All rules are published below.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-5xl font-semibold text-syncra-primary">{score.totalPoints}</p>
            <p className="text-sm text-slate-500">community points</p>
          </div>
          <div className={`${ui.innerItem}`}>
            <p className="text-lg font-semibold text-syncra-primary">{score.badge}</p>
            <p className="text-xs uppercase tracking-wider text-syncra-accent">{score.level} tier</p>
          </div>
        </div>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Your score breakdown</h3>
        {score.breakdown.length === 0 ? (
          <p className={`mt-3 ${ui.body}`}>Participate in society activities to earn points.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {score.breakdown.map((item) => (
              <li key={item.key} className={`flex justify-between ${ui.innerItem} text-sm`}>
                <span>{item.label} {item.count > 1 ? `(×${item.count})` : ''}</span>
                <strong className={item.points >= 0 ? 'text-emerald-600' : 'text-syncra-action-alt'}>
                  {item.points > 0 ? '+' : ''}{item.points}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Published rules (transparent)</h3>
        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          {Object.entries(weights.resident).map(([key, val]) => (
            <li key={key}>
              {val.label}: <strong>{val.points > 0 ? '+' : ''}{val.points} pts</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
