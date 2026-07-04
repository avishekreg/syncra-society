import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { getOpenElections, castEncryptedVote, checkFlatVotedForElection } from '../../api/elections'
import { ui } from '../../lib/ui'

export default function ResidentElectionsPage() {
  const { currentSocietyId, user } = useAuth()
  const flat = user?.flatNumber ?? ''
  const elections = currentSocietyId ? getOpenElections(currentSocietyId) : []
  const [votedMap, setVotedMap] = useState<Record<string, Record<string, boolean>>>({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!currentSocietyId || !flat) return
    void (async () => {
      const map: Record<string, Record<string, boolean>> = {}
      for (const election of elections) {
        map[election.id] = await checkFlatVotedForElection(
          election.id,
          currentSocietyId,
          flat,
          election.pepper,
          election.positions.map((position) => position.id)
        )
      }
      setVotedMap(map)
    })()
  }, [currentSocietyId, flat, elections.length])

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
      setMessage('Your vote has been cast and encrypted. It cannot be changed or traced back to you.')
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Unable to cast vote')
    }
  }

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>Society elections</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Cast your vote securely</h2>
        <p className={`mt-2 ${ui.body}`}>
          Vote once per contested position. Ballots are RSA-encrypted and stored without voter identity.
        </p>
      </section>

      {message && <div className={`${ui.innerItem} text-sm text-slate-700`}>{message}</div>}

      {elections.length === 0 && (
        <section className={ui.card}>
          <p className={ui.body}>No elections are open for voting.</p>
        </section>
      )}

      {elections.map((election) => (
        <section key={election.id} className={ui.card}>
          <h3 className="text-lg font-semibold text-syncra-primary">{election.title}</h3>
          <p className={`mt-2 ${ui.body}`}>{election.description}</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
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
                      Flat {flat} has voted for {position.title}.
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
      ))}
    </div>
  )
}
