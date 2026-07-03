import React, { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { createElection, listElections, closeElection, tallyElection } from '../../api/elections'
import { ui } from '../../lib/ui'

export default function ElectionsManager() {
  const { currentSocietyId } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [candidates, setCandidates] = useState('Candidate A\nCandidate B')
  const [refresh, setRefresh] = useState(0)
  const [tally, setTally] = useState<Record<string, Awaited<ReturnType<typeof tallyElection>>>>({})

  const elections = currentSocietyId ? listElections(currentSocietyId) : []

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!currentSocietyId) return
    await createElection({
      societyId: currentSocietyId,
      title,
      description,
      candidates: candidates.split('\n').map((c) => c.trim()).filter(Boolean)
    })
    setTitle('')
    setDescription('')
    setCandidates('Candidate A\nCandidate B')
    setRefresh((n) => n + 1)
  }

  async function handleTally(electionId: string) {
    if (!currentSocietyId) return
    const result = await tallyElection(currentSocietyId, electionId)
    if (result) setTally((prev) => ({ ...prev, [electionId]: result }))
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Society elections</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Run encrypted elections</h2>
        <p className={`mt-2 ${ui.body}`}>
          Votes are RSA-encrypted at cast time. One vote per flat via irreversible HMAC seal. Tally only after closing.
        </p>
        <form onSubmit={(e) => void handleCreate(e)} className="mt-6 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={ui.input} placeholder="Election title" required />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={ui.input} rows={2} placeholder="Description" required />
          <textarea value={candidates} onChange={(e) => setCandidates(e.target.value)} className={ui.input} rows={4} placeholder="One candidate per line" required />
          <button type="submit" className={ui.btnPrimary}>Open Election</button>
        </form>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Elections</h3>
        <ul className="mt-4 space-y-4">
          {elections.map((election) => {
            const results = tally[election.id]
            return (
              <li key={`${election.id}-${refresh}`} className={ui.innerItem}>
                <p className="font-semibold text-syncra-primary">{election.title}</p>
                <p className={`mt-1 text-sm ${ui.body}`}>{election.description}</p>
                <p className="mt-2 text-xs text-slate-500">Status: {election.status}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {election.status === 'open' && currentSocietyId && (
                    <button type="button" onClick={() => { closeElection(currentSocietyId, election.id); setRefresh((n) => n + 1) }} className={ui.btnSecondary}>
                      Close Voting
                    </button>
                  )}
                  <button type="button" onClick={() => void handleTally(election.id)} className={ui.btnGhost}>
                    Tally Results
                  </button>
                </div>
                {results && (
                  <ul className="mt-3 space-y-1 text-sm text-slate-600">
                    <li>Total encrypted votes: {results.totalVotes}</li>
                    {results.election.candidates.map((c) => (
                      <li key={c.id}>{c.name}: {results.counts[c.id] ?? 0}</li>
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
