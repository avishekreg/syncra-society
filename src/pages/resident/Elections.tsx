import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { getOpenElections, castEncryptedVote, checkFlatVoted } from '../../api/elections'
import { ui } from '../../lib/ui'

export default function ResidentElectionsPage() {
  const { currentSocietyId, user } = useAuth()
  const flat = user?.flatNumber ?? ''
  const elections = currentSocietyId ? getOpenElections(currentSocietyId) : []
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!currentSocietyId || !flat) return
    void (async () => {
      const map: Record<string, boolean> = {}
      for (const election of elections) {
        map[election.id] = await checkFlatVoted(election.id, currentSocietyId, flat, election.pepper)
      }
      setVotedMap(map)
    })()
  }, [currentSocietyId, flat, elections.length])

  async function handleVote(electionId: string, candidateId: string, pepper: string) {
    if (!currentSocietyId || !flat) return
    setMessage('')
    try {
      await castEncryptedVote({
        societyId: currentSocietyId,
        electionId,
        flatNumber: flat,
        candidateId
      })
      setVotedMap((prev) => ({ ...prev, [electionId]: true }))
      setMessage('Your vote has been cast and encrypted. It cannot be changed or traced back to you.')
    } catch (err: any) {
      setMessage(err.message ?? 'Unable to cast vote')
    }
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Society elections</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Cast your vote securely</h2>
        <p className={`mt-2 ${ui.body}`}>
          Votes are RSA-encrypted and stored without voter identity. One vote per flat — irreversible once submitted.
        </p>
      </section>

      {message && (
        <div className={`${ui.innerItem} text-sm text-slate-700`}>{message}</div>
      )}

      {elections.length === 0 && (
        <section className={ui.card}>
          <p className={ui.body}>No elections are open for voting.</p>
        </section>
      )}

      {elections.map((election) => (
        <section key={election.id} className={ui.card}>
          <h3 className="text-lg font-semibold text-syncra-primary">{election.title}</h3>
          <p className={`mt-2 ${ui.body}`}>{election.description}</p>
          {votedMap[election.id] ? (
            <p className="mt-4 text-sm font-medium text-emerald-600">
              Flat {flat} has voted. Your choice is encrypted and anonymous.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {election.candidates.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => void handleVote(election.id, c.id, election.pepper)}
                  className={`block w-full text-left ${ui.btnSecondary}`}
                >
                  {c.name}
                  {c.role ? ` — ${c.role}` : ''}
                </button>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
