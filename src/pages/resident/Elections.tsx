import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import {
  castEncryptedVote,
  checkFlatVotedForElection,
  getElectionTurnout,
  getElectionViewState,
  getResidentVisibleElections,
  hydrateElections,
  type Election,
  type ElectionTurnout
} from '../../api/elections'
import { ElectionCountdown, ElectionTurnoutBar } from '../../components/elections/ElectionLiveWidgets'
import { requestPushPermission } from '../../lib/pushNotifications'
import { ui } from '../../lib/ui'

export default function ResidentElectionsPage() {
  const { currentSocietyId, user } = useAuth()
  const flat = user?.flatNumber ?? ''
  const [elections, setElections] = useState<Election[]>([])
  const [turnouts, setTurnouts] = useState<Record<string, ElectionTurnout | null>>({})
  const [votedMap, setVotedMap] = useState<Record<string, Record<string, boolean>>>({})
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    if (!currentSocietyId) return
    await hydrateElections(currentSocietyId)
    const list = getResidentVisibleElections(currentSocietyId)
    setElections(list)

    const nextTurnouts: Record<string, ElectionTurnout | null> = {}
    for (const election of list) {
      nextTurnouts[election.id] = getElectionTurnout(currentSocietyId, election.id)
    }
    setTurnouts(nextTurnouts)

    if (flat) {
      const map: Record<string, Record<string, boolean>> = {}
      for (const election of list.filter((e) => e.status === 'open')) {
        map[election.id] = await checkFlatVotedForElection(
          election.id,
          currentSocietyId,
          flat,
          election.pepper,
          election.positions.map((position) => position.id)
        )
      }
      setVotedMap(map)
    }
  }, [currentSocietyId, flat])

  useEffect(() => {
    void refresh()
    void requestPushPermission()
    const id = window.setInterval(() => void refresh(), 15000)
    return () => window.clearInterval(id)
  }, [refresh])

  async function handleVote(electionId: string, positionId: string, candidateId: string) {
    if (!currentSocietyId || !flat) return
    setMessage('')
    try {
      await castEncryptedVote({
        societyId: currentSocietyId,
        electionId,
        positionId,
        flatNumber: flat,
        candidateId
      })
      setVotedMap((prev) => ({
        ...prev,
        [electionId]: { ...(prev[electionId] ?? {}), [positionId]: true }
      }))
      setMessage('Your flat’s vote was cast. It cannot be changed. Your choice is anonymous.')
      await refresh()
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Unable to cast vote')
    }
  }

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>Society elections</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Vote securely — one flat, one vote</h2>
        <p className={`mt-2 ${ui.body}`}>
          Live turnout is public. Candidate results stay hidden until the scheduled reveal. Who voted for whom is never
          visible to anyone.
        </p>
      </section>

      {message && <div className={`${ui.innerItem} text-sm text-slate-700`}>{message}</div>}

      {elections.length === 0 && (
        <section className={ui.card}>
          <p className={ui.body}>No elections are available right now.</p>
        </section>
      )}

      {elections.map((election) => {
        const view = getElectionViewState(election)
        const turnout = turnouts[election.id]
        const turnoutPct = turnout?.turnoutPercent ?? 0

        if (view === 'VOTING_ACTIVE') {
          return (
            <section key={election.id} className={ui.card}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    Voting active
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-syncra-primary">{election.title}</h3>
                  <p className={`mt-2 ${ui.body}`}>{election.description}</p>
                </div>
                <ElectionCountdown
                  targetIso={election.closesAt}
                  prefix="Voting closes in"
                  onComplete={() => void refresh()}
                />
              </div>

              <div className="mt-5">
                <ElectionTurnoutBar
                  percent={turnoutPct}
                  voted={turnout?.votedFlatCount ?? 0}
                  eligible={turnout?.eligibleFlatCount ?? election.eligibleFlatCount}
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {election.positions.map((position) => {
                  const voted = votedMap[election.id]?.[position.id]
                  return (
                    <div key={position.id} className={`${ui.innerItem} space-y-3`}>
                      <div>
                        <p className="text-sm font-semibold text-syncra-primary">{position.title}</p>
                        <p className="mt-1 text-xs text-slate-500">Select one candidate for this role</p>
                      </div>
                      {voted ? (
                        <p className="text-sm font-medium text-emerald-600">
                          Your flat has already cast its vote for {position.title}.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {position.candidates.map((candidate) => (
                            <button
                              key={candidate.id}
                              type="button"
                              onClick={() => void handleVote(election.id, position.id, candidate.id)}
                              className={`block w-full text-left ${ui.btnSecondary}`}
                            >
                              {candidate.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        }

        if (view === 'VOTING_CLOSED_PENDING_RESULT') {
          const revealLabel = election.resultsRevealAt
            ? new Date(election.resultsRevealAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })
            : 'soon'
          return (
            <section key={election.id} className={ui.card}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600">
                Voting closed — results pending
              </p>
              <h3 className="mt-1 text-lg font-semibold text-syncra-primary">{election.title}</h3>
              <p className="mt-3 text-sm text-slate-700">
                Voting has closed! Turnout reached <strong>{turnoutPct}%</strong>. Results will be announced on{' '}
                <strong>{revealLabel}</strong>.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <ElectionTurnoutBar
                  percent={turnoutPct}
                  voted={turnout?.votedFlatCount ?? 0}
                  eligible={turnout?.eligibleFlatCount ?? election.eligibleFlatCount}
                />
                <ElectionCountdown
                  targetIso={election.resultsRevealAt}
                  prefix="Results announce in"
                  onComplete={() => void refresh()}
                />
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Candidate vote counts stay hidden until the scheduled reveal. Ballot anonymity is preserved.
              </p>
            </section>
          )
        }

        // RESULT_PUBLISHED
        return (
          <section key={election.id} className={ui.card}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-blue">
              Results published
            </p>
            <h3 className="mt-1 text-lg font-semibold text-syncra-primary">{election.title}</h3>
            <p className={`mt-2 ${ui.body}`}>{election.description}</p>
            <div className="mt-4">
              <ElectionTurnoutBar
                percent={turnoutPct}
                voted={turnout?.votedFlatCount ?? 0}
                eligible={turnout?.eligibleFlatCount ?? election.eligibleFlatCount}
              />
            </div>
            <div className="mt-5">
              <Link to={`/resident/elections/${election.id}/results`} className={ui.btnPrimary}>
                View full results & winner
              </Link>
            </div>
          </section>
        )
      })}
    </div>
  )
}
