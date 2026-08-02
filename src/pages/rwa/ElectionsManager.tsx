import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { usePlatformConfig } from '../../providers/PlatformConfigProvider'
import {
  closeElection,
  createElection,
  getElectionTurnout,
  getPublishedBulletin,
  hydrateElections,
  openElection,
  publishElectionResults,
  type Election,
  type ElectionTurnout,
  type PublishedBulletin
} from '../../api/elections'
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
  const [eligibleFlatCount, setEligibleFlatCount] = useState('')
  const [positions, setPositions] = useState<PositionDraft[]>(templatePositions)
  const [elections, setElections] = useState<Election[]>([])
  const [turnouts, setTurnouts] = useState<Record<string, ElectionTurnout | null>>({})
  const [bulletins, setBulletins] = useState<Record<string, PublishedBulletin | null>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  async function refresh() {
    if (!currentSocietyId) return
    const list = await hydrateElections(currentSocietyId)
    setElections(list)
    const nextTurnouts: Record<string, ElectionTurnout | null> = {}
    const nextBulletins: Record<string, PublishedBulletin | null> = {}
    for (const election of list) {
      nextTurnouts[election.id] = getElectionTurnout(currentSocietyId, election.id)
      if (election.status === 'published') {
        nextBulletins[election.id] = getPublishedBulletin(election.id)
      }
    }
    setTurnouts(nextTurnouts)
    setBulletins(nextBulletins)
  }

  useEffect(() => {
    setPositions(templatePositions)
  }, [templatePositions])

  useEffect(() => {
    void refresh()
  }, [currentSocietyId])

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
    setMessage('')
    try {
      await createElection({
        societyId: currentSocietyId,
        title,
        description,
        openImmediately: true,
        eligibleFlatCount: eligibleFlatCount ? Number(eligibleFlatCount) : undefined,
        positions: positions.map((position) => ({
          title: position.title,
          candidates: position.candidates
            .split('\n')
            .map((name) => name.trim())
            .filter(Boolean)
        }))
      })
      setTitle('')
      setDescription('')
      setEligibleFlatCount('')
      setPositions(templatePositions)
      setMessage('Election opened. Candidate tallies stay hidden until you publish results.')
      await refresh()
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Unable to create election')
    }
  }

  async function runAction(electionId: string, action: 'open' | 'close' | 'publish') {
    if (!currentSocietyId) return
    setBusyId(electionId)
    setMessage('')
    try {
      if (action === 'open') await openElection(currentSocietyId, electionId)
      if (action === 'close') await closeElection(currentSocietyId, electionId)
      if (action === 'publish') {
        await publishElectionResults(currentSocietyId, electionId)
        setMessage('Results published. Private key destroyed. Residents can view the bulletin.')
      }
      await refresh()
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  if (!electionConfig.enabled) {
    return (
      <div className={ui.card}>
        <p className={ui.eyebrow}>Elections</p>
        <h2 className={`mt-3 ${ui.heading}`}>Election module disabled</h2>
        <p className={`mt-3 ${ui.body}`}>
          The platform super admin has disabled elections globally. Enable it under Super Admin → System Settings.
        </p>
      </div>
    )
  }

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>Society elections</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Encrypted multi-position elections</h2>
        <p className={`mt-2 ${ui.body}`}>
          Lifecycle: Draft → Open → Closed → Published. During Open, only turnout is visible. Candidate counts appear
          only after publish. One flat = one vote per position. Who voted for whom is never stored together.
        </p>
        <form onSubmit={(e) => void handleCreate(e)} className="mt-6 space-y-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={ui.input}
            placeholder="Election title"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={ui.input}
            rows={2}
            placeholder="Description"
            required
          />
          <input
            value={eligibleFlatCount}
            onChange={(e) => setEligibleFlatCount(e.target.value)}
            className={ui.input}
            type="number"
            min={1}
            placeholder="Eligible flats (for turnout %)"
          />

          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
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

      {message && <div className={`${ui.innerItem} text-sm text-slate-700`}>{message}</div>}

      <section className={ui.card}>
        <h3 className={ui.heading}>Elections</h3>
        <ul className="mt-6 space-y-4">
          {elections.map((election) => {
            const turnout = turnouts[election.id]
            const bulletin = bulletins[election.id]
            return (
              <li key={election.id} className={ui.innerItem}>
                <p className="font-semibold text-syncra-primary">{election.title}</p>
                <p className={`mt-1 text-sm ${ui.body}`}>{election.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Status: <span className="font-semibold uppercase">{election.status}</span> ·{' '}
                  {election.positions.length} positions · {new Date(election.createdAt).toLocaleString('en-IN')}
                </p>

                {turnout && election.status !== 'draft' && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    <p className="font-semibold text-syncra-blue">
                      Turnout: {turnout.votedFlatCount}/{turnout.eligibleFlatCount || '—'} flats (
                      {turnout.turnoutPercent}%)
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Candidate vote counts stay hidden until results are published.
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                      {turnout.byPosition.map((row) => (
                        <li key={row.positionId}>
                          {row.title}: {row.votedFlatCount} flats · {row.turnoutPercent}%
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {election.status === 'draft' && (
                    <button
                      type="button"
                      disabled={busyId === election.id}
                      onClick={() => void runAction(election.id, 'open')}
                      className={ui.btnSecondary}
                    >
                      Open Voting
                    </button>
                  )}
                  {election.status === 'open' && (
                    <button
                      type="button"
                      disabled={busyId === election.id}
                      onClick={() => void runAction(election.id, 'close')}
                      className={ui.btnSecondary}
                    >
                      Close Voting
                    </button>
                  )}
                  {election.status === 'closed' && (
                    <button
                      type="button"
                      disabled={busyId === election.id}
                      onClick={() => void runAction(election.id, 'publish')}
                      className={ui.btnPrimary}
                    >
                      Publish Results Bulletin
                    </button>
                  )}
                  {election.status === 'published' && (
                    <Link
                      to={`/resident/elections/${election.id}/results`}
                      className={ui.btnGhost}
                    >
                      View / print bulletin
                    </Link>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
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

                {bulletin && (
                  <div className="mt-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <p className="text-sm font-semibold text-emerald-800">Published bulletin</p>
                    {bulletin.positionResults.map((row) => (
                      <div key={row.positionId}>
                        <p className="text-sm font-medium text-syncra-primary">
                          {row.title} · {row.totalVotes} votes · turnout {row.turnoutPercent}%
                          {row.isTie ? ' · TIE' : ''}
                        </p>
                        <ul className="mt-1 space-y-1 text-sm text-slate-600">
                          {row.candidates.map((c) => (
                            <li key={c.candidateId}>
                              {c.name}: {c.votes} ({c.percent}%)
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
          {elections.length === 0 && <li className={ui.body}>No elections yet.</li>}
        </ul>
      </section>
    </div>
  )
}
