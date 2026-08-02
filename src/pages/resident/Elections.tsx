import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import {
  castEncryptedVote,
  checkFlatVotedForElection,
  getElectionTurnout,
  getOpenElections,
  getPublishedElections,
  hydrateElections,
  type Election,
  type ElectionTurnout
} from '../../api/elections'
import { requestPushPermission } from '../../lib/pushNotifications'
import { ui } from '../../lib/ui'

export default function ResidentElectionsPage() {
  const { currentSocietyId, user } = useAuth()
  const flat = user?.flatNumber ?? ''
  const [openElections, setOpenElections] = useState<Election[]>([])
  const [published, setPublished] = useState<Election[]>([])
  const [turnouts, setTurnouts] = useState<Record<string, ElectionTurnout | null>>({})
  const [votedMap, setVotedMap] = useState<Record<string, Record<string, boolean>>>({})
  const [message, setMessage] = useState('')

  async function refresh() {
    if (!currentSocietyId) return
    await hydrateElections(currentSocietyId)
    const open = getOpenElections(currentSocietyId)
    const done = getPublishedElections(currentSocietyId)
    setOpenElections(open)
    setPublished(done)

    const nextTurnouts: Record<string, ElectionTurnout | null> = {}
    for (const election of [...open, ...done]) {
      nextTurnouts[election.id] = getElectionTurnout(currentSocietyId, election.id)
    }
    setTurnouts(nextTurnouts)

    if (flat) {
      const map: Record<string, Record<string, boolean>> = {}
      for (const election of open) {
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
  }

  useEffect(() => {
    void refresh()
    void requestPushPermission()
  }, [currentSocietyId, flat])

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
          Your ballot choice is encrypted and never linked to your flat. During voting you only see turnout. Full
          results appear for everyone after the committee publishes the official bulletin.
        </p>
      </section>

      {message && <div className={`${ui.innerItem} text-sm text-slate-700`}>{message}</div>}

      {openElections.length === 0 && (
        <section className={ui.card}>
          <p className={ui.body}>No elections are open for voting.</p>
        </section>
      )}

      {openElections.map((election) => {
        const turnout = turnouts[election.id]
        return (
          <section key={election.id} className={ui.card}>
            <h3 className="text-lg font-semibold text-syncra-primary">{election.title}</h3>
            <p className={`mt-2 ${ui.body}`}>{election.description}</p>
            {turnout && (
              <p className="mt-3 text-sm font-medium text-syncra-blue">
                Turnout: {turnout.votedFlatCount}/{turnout.eligibleFlatCount || '—'} flats ({turnout.turnoutPercent}%)
              </p>
            )}
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
      })}

      {published.length > 0 && (
        <section className={ui.card}>
          <h3 className={ui.heading}>Published results</h3>
          <ul className="mt-4 space-y-3">
            {published.map((election) => (
              <li key={election.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-syncra-primary">{election.title}</p>
                  <p className="text-xs text-slate-500">
                    Published {election.publishedAt ? new Date(election.publishedAt).toLocaleString('en-IN') : ''}
                  </p>
                </div>
                <Link to={`/resident/elections/${election.id}/results`} className={ui.btnSecondary}>
                  View bulletin
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
