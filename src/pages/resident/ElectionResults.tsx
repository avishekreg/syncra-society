import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import {
  getElection,
  getPublishedBulletinAsync,
  hydrateElections,
  type PublishedBulletin
} from '../../api/elections'
import { ui } from '../../lib/ui'

export default function ResidentElectionResultsPage() {
  const { electionId = '' } = useParams()
  const { currentSocietyId } = useAuth()
  const [bulletin, setBulletin] = useState<PublishedBulletin | null>(null)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('Election results')

  useEffect(() => {
    if (!currentSocietyId || !electionId) return
    void (async () => {
      await hydrateElections(currentSocietyId)
      const election = getElection(currentSocietyId, electionId)
      if (election) setTitle(election.title)
      if (election && election.status !== 'published') {
        setError(
          election.status === 'closed'
            ? 'Voting is closed. Results will appear when the committee publishes the official bulletin.'
            : 'Results are not available yet.'
        )
        setBulletin(null)
        return
      }
      const data = await getPublishedBulletinAsync(currentSocietyId, electionId)
      if (!data) {
        setError('Published bulletin not found.')
        return
      }
      setError('')
      setBulletin(data)
    })()
  }, [currentSocietyId, electionId])

  return (
    <div className={ui.sectionGap}>
      <div className="print:hidden">
        <Link to="/resident/elections" className="text-sm font-semibold text-syncra-blue hover:underline">
          ← Back to elections
        </Link>
      </div>

      <section className={`${ui.card} print:border-0 print:shadow-none`} id="election-bulletin">
        <p className={ui.eyebrow}>Official results bulletin</p>
        <h1 className={`mt-2 ${ui.headingLg}`}>{bulletin?.title || title}</h1>
        {bulletin?.description && <p className={`mt-2 ${ui.body}`}>{bulletin.description}</p>}

        {error && <p className="mt-4 text-sm text-amber-700">{error}</p>}

        {bulletin && (
          <>
            <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>
                Published:{' '}
                <span className="font-medium text-syncra-primary">
                  {new Date(bulletin.publishedAt).toLocaleString('en-IN')}
                </span>
              </p>
              <p>
                Eligible flats:{' '}
                <span className="font-medium text-syncra-primary">{bulletin.eligibleFlatCount || '—'}</span>
              </p>
              <p>
                Total ballots: <span className="font-medium text-syncra-primary">{bulletin.totalBallots}</span>
              </p>
              <p>
                Integrity:{' '}
                <span className="font-medium text-syncra-primary">
                  {bulletin.integrity.ballotCountMatchesSeals ? 'OK' : 'Review required'}
                </span>
              </p>
            </div>

            {bulletin.integrity.tieAlerts.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Tie alerts: {bulletin.integrity.tieAlerts.join(' · ')}
              </div>
            )}

            <div className="mt-6 space-y-3">
              {bulletin.positionResults.map((row) => {
                const winners = row.candidates.filter((c) => row.winnerCandidateIds.includes(c.candidateId))
                if (!winners.length) return null
                return (
                  <div
                    key={`banner-${row.positionId}`}
                    className="rounded-2xl border border-syncra-accent/30 bg-gradient-to-r from-syncra-accent/15 via-white to-white px-4 py-3"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-blue">
                      Winner · {row.title}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-syncra-primary">
                      {row.isTie
                        ? `Tie between ${winners.map((w) => w.name).join(' & ')}`
                        : winners[0]?.name}
                    </p>
                    {!row.isTie && winners[0] && (
                      <p className="text-sm text-slate-600">
                        {winners[0].votes} votes · {winners[0].percent}%
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-8 space-y-6">
              {bulletin.positionResults.map((row) => (
                <div key={row.positionId} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <h2 className="text-lg font-semibold text-syncra-primary">{row.title}</h2>
                    <p className="text-sm text-slate-500">
                      {row.totalVotes} votes · turnout {row.turnoutPercent}%
                      {row.isTie ? ' · TIE' : ''}
                    </p>
                  </div>
                  <table className="mt-4 w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-2 pr-3">Candidate</th>
                        <th className="py-2 pr-3">Votes</th>
                        <th className="py-2">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.candidates.map((c) => {
                        const isWinner = row.winnerCandidateIds.includes(c.candidateId)
                        return (
                          <tr key={c.candidateId} className="border-b border-slate-100">
                            <td className={`py-2 pr-3 ${isWinner ? 'font-semibold text-syncra-blue' : ''}`}>
                              {c.name}
                              {isWinner ? ' ★' : ''}
                            </td>
                            <td className="py-2 pr-3 tabular-nums">{c.votes}</td>
                            <td className="py-2 tabular-nums">{c.percent}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <p className="mt-8 text-xs leading-relaxed text-slate-500">{bulletin.secrecyStatement}</p>

            <div className="mt-6 flex flex-wrap gap-3 print:hidden">
              <button type="button" className={ui.btnPrimary} onClick={() => window.print()}>
                Print bulletin
              </button>
              <Link to="/resident/elections" className={ui.btnGhost}>
                Back
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
