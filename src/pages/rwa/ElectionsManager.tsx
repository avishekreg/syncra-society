import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { usePlatformConfig } from '../../providers/PlatformConfigProvider'
import { createElection, listElections, closeElection, tallyElection } from '../../api/elections'
import { ui } from '../../lib/ui'

type PositionDraft = {
  title: string
  candidates: string
}

export default function ElectionsManager() {
  const { currentSocietyId } = useAuth()
  const { config } = usePlatformConfig()
  const electionConfig = config.electionModule

  const templatePositions = useMemo<PositionDraft[]>(
    () =>
      electionConfig.defaultPositionTemplates.map((title) => ({
        title,
        candidates: 'Candidate A\nCandidate B'
      })),
    [electionConfig.defaultPositionTemplates]
  )

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [positions, setPositions] = useState<PositionDraft[]>(templatePositions)
  const [refresh, setRefresh] = useState(0)
  const [tally, setTally] = useState<Record<string, Awaited<ReturnType<typeof tallyElection>>>>({})

  useEffect(() => {
    setPositions(templatePositions)
  }, [templatePositions])

  const elections = currentSocietyId ? listElections(currentSocietyId) : []

  function updatePosition(index: number, patch: Partial<PositionDraft>) {
    setPositions((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addPosition() {
    if (positions.length >= electionConfig.maxPositionsPerElection) return
    setPositions((current) => [...current, { title: '', candidates: '' }])
  }

  function removePosition(index: number) {
    setPositions((current) => current.filter((_, i) => i !== index))
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!currentSocietyId) return
    try {
      await createElection({
        societyId: currentSocietyId,
        title,
        description,
        positions: positions.map((position) => ({
          title: position.title,
          candidates: position.candidates.split('\n').map((name) => name.trim()).filter(Boolean)
        }))
      })
      setTitle('')
      setDescription('')
      setPositions(templatePositions)
      setRefresh((n) => n + 1)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Unable to create election')
    }
  }

  async function handleTally(electionId: string) {
    if (!currentSocietyId) return
    const result = await tallyElection(currentSocietyId, electionId)
    if (result) setTally((prev) => ({ ...prev, [electionId]: result }))
  }

  if (!electionConfig.enabled) {
    return (
      <div className={ui.card}>
        <p className={ui.eyebrow}>Elections</p>
        <h2 className={`mt-3 ${ui.heading}`}>Election module disabled</h2>
        <p className={`mt-3 ${ui.body}`}>
          The platform super admin has disabled elections globally. Enable it under Super Admin → Global Platform
          Settings.
        </p>
      </div>
    )
  }

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>Society elections</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Run encrypted multi-position elections</h2>
        <p className={`mt-2 ${ui.body}`}>
          Define contested management roles separately. Votes are RSA-encrypted with one irreversible ballot per flat
          per position.
        </p>
        <form onSubmit={(e) => void handleCreate(e)} className="mt-6 space-y-6">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={ui.input} placeholder="Election title" required />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={ui.input} rows={2} placeholder="Description" required />

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className={ui.label}>
                Contested positions ({positions.length}/{electionConfig.maxPositionsPerElection} max ·{' '}
                {electionConfig.maxCandidatesPerPosition} candidates each)
              </p>
              <button
                type="button"
                onClick={addPosition}
                disabled={positions.length >= electionConfig.maxPositionsPerElection}
                className={ui.btnGhost}
              >
                Add position
              </button>
            </div>
            {positions.map((position, index) => (
              <div key={`position-${index}`} className={`${ui.innerItem} space-y-3`}>
                <div className="flex items-start justify-between gap-3">
                  <input
                    value={position.title}
                    onChange={(e) => updatePosition(index, { title: e.target.value })}
                    className={ui.input}
                    placeholder="Position title (e.g. President)"
                    required
                  />
                  {positions.length > 1 && (
                    <button type="button" onClick={() => removePosition(index)} className={ui.btnGhost}>
                      Remove
                    </button>
                  )}
                </div>
                <textarea
                  value={position.candidates}
                  onChange={(e) => updatePosition(index, { candidates: e.target.value })}
                  className={ui.input}
                  rows={3}
                  placeholder="One candidate per line"
                  required
                />
              </div>
            ))}
          </div>

          <button type="submit" className={ui.btnPrimary}>
            Open Election
          </button>
        </form>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Elections</h3>
        <ul className="mt-6 space-y-4">
          {elections.map((election) => {
            const results = tally[election.id]
            return (
              <li key={`${election.id}-${refresh}`} className={ui.innerItem}>
                <p className="font-semibold text-syncra-primary">{election.title}</p>
                <p className={`mt-1 text-sm ${ui.body}`}>{election.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Status: {election.status} · {election.positions.length} positions ·{' '}
                  {new Date(election.createdAt).toLocaleString('en-IN')}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {election.status === 'open' && currentSocietyId && (
                    <button
                      type="button"
                      onClick={() => {
                        closeElection(currentSocietyId, election.id)
                        setRefresh((n) => n + 1)
                      }}
                      className={ui.btnSecondary}
                    >
                      Close Voting
                    </button>
                  )}
                  <button type="button" onClick={() => void handleTally(election.id)} className={ui.btnGhost}>
                    Tally Results
                  </button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {election.positions.map((position) => (
                    <div key={position.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-syncra-primary">{position.title}</p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-600">
                        {position.candidates.map((candidate) => (
                          <li key={candidate.id}>{candidate.name}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {results && (
                  <div className="mt-4 space-y-4">
                    {results.positionResults.map(({ position, totalVotes, counts }) => (
                      <div key={position.id} className="rounded-xl border border-syncra-accent/20 bg-syncra-surface-alt p-4">
                        <p className="text-sm font-semibold text-syncra-blue">
                          {position.title} · {totalVotes} encrypted votes
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-slate-600">
                          {position.candidates.map((candidate) => (
                            <li key={candidate.id}>
                              {candidate.name}: {counts[candidate.id] ?? 0}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
