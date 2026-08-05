import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { createEnergyTrade, estimateEnergyCredits, listEnergyTrades } from '../../api/energyTradingService'
import { castRecallBallot, createRecallMotion, listRecallMotions } from '../../api/recallService'
import { fileCommunityDispute, listCommunityDisputes, signDisputeSettlement } from '../../api/mediationService'
import { listActiveGuardianAlerts } from '../../api/guardianMeshService'
import type {
  CommunityDispute,
  DisputeIssueType,
  GuardianMotionAlert,
  P2pEnergyTrade,
  RecallMotion
} from '../../types/db'
import { ui } from '../../lib/ui'

type Tab = 'energy' | 'nyaya' | 'recall' | 'guardian'

export default function ResidentIntelligencePage() {
  const { currentSocietyId, user } = useAuth()
  const [tab, setTab] = useState<Tab>('nyaya')
  const [trades, setTrades] = useState<P2pEnergyTrade[]>([])
  const [disputes, setDisputes] = useState<CommunityDispute[]>([])
  const [motions, setMotions] = useState<RecallMotion[]>([])
  const [guardian, setGuardian] = useState<GuardianMotionAlert[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // forms
  const [buyerFlat, setBuyerFlat] = useState('')
  const [kwh, setKwh] = useState(5)
  const [respondentFlat, setRespondentFlat] = useState('')
  const [issueType, setIssueType] = useState<DisputeIssueType>('NOISE')
  const [description, setDescription] = useState('')
  const [role, setRole] = useState('Secretary')
  const [reason, setReason] = useState('')
  const [votesNeeded, setVotesNeeded] = useState(10)

  async function refresh() {
    if (!currentSocietyId) return
    const [t, d, m, g] = await Promise.all([
      listEnergyTrades(currentSocietyId),
      listCommunityDisputes(currentSocietyId),
      listRecallMotions(currentSocietyId),
      listActiveGuardianAlerts(currentSocietyId)
    ])
    setTrades(t)
    setDisputes(d)
    setMotions(m)
    setGuardian(g)
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [currentSocietyId])

  if (!currentSocietyId || !user?.flatNumber || !user.id) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Link your flat to open the intelligence suite.</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Autonomous intelligence</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Society intelligence & governance</h2>
        <p className={`mt-2 ${ui.body}`}>
          maiEnergy, mAI Nyaya mediation, cryptographic recall votes, and guardian mesh — tools competitors don’t ship.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/resident/find-asset" className={ui.btnSecondary}>
            mAI Find Asset
          </Link>
          {(
            [
              ['nyaya', 'mAI Nyaya'],
              ['energy', 'maiEnergy'],
              ['recall', 'mAI Vote Recall'],
              ['guardian', 'mAI Guardian']
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                tab === id ? 'bg-syncra-blue text-white' : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      {tab === 'energy' ? (
        <section className={ui.card}>
          <h3 className={ui.heading}>P2P energy trade</h3>
          <p className={`mt-2 text-sm ${ui.body}`}>Sell surplus rooftop / battery credits to neighbors (~₹{estimateEnergyCredits(1)}/kWh).</p>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault()
              void createEnergyTrade({
                societyId: currentSocietyId,
                sellerFlatNumber: user.flatNumber!,
                buyerFlatNumber: buyerFlat,
                energyKwh: kwh
              })
                .then(() => {
                  setMessage('Energy trade completed.')
                  setBuyerFlat('')
                  return refresh()
                })
                .catch((err) => setError(err instanceof Error ? err.message : 'Trade failed'))
            }}
          >
            <input className={ui.input} placeholder="Buyer flat" value={buyerFlat} onChange={(e) => setBuyerFlat(e.target.value)} required />
            <input className={ui.input} type="number" min={0.1} step={0.1} value={kwh} onChange={(e) => setKwh(Number(e.target.value) || 1)} />
            <button type="submit" className={ui.btnPrimary}>
              Transfer {estimateEnergyCredits(kwh)} credits
            </button>
          </form>
          <ul className="mt-4 space-y-2">
            {trades.slice(0, 8).map((t) => (
              <li key={t.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                Flat {t.seller_flat_number} → {t.buyer_flat_number}: {t.energy_kwh} kWh · ₹{t.credits_transferred}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'nyaya' ? (
        <section className="space-y-4">
          <div className={ui.card}>
            <h3 className={ui.heading}>File dispute</h3>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                void fileCommunityDispute({
                  societyId: currentSocietyId,
                  plaintiffFlatNumber: user.flatNumber!,
                  respondentFlatNumber: respondentFlat,
                  issueType,
                  description,
                  createdByUserId: user.id
                })
                  .then(() => {
                    setMessage('Dispute filed with AI mediation draft.')
                    setDescription('')
                    return refresh()
                  })
                  .catch((err) => setError(err instanceof Error ? err.message : 'File failed'))
              }}
            >
              <input className={ui.input} placeholder="Respondent flat" value={respondentFlat} onChange={(e) => setRespondentFlat(e.target.value)} required />
              <select className={ui.input} value={issueType} onChange={(e) => setIssueType(e.target.value as DisputeIssueType)}>
                {(['PARKING', 'SEEPAGE', 'PETS', 'NOISE'] as DisputeIssueType[]).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <textarea className={`${ui.input} sm:col-span-2 min-h-[96px]`} value={description} onChange={(e) => setDescription(e.target.value)} required />
              <button type="submit" className={ui.btnPrimary}>
                Submit to mAI Nyaya
              </button>
            </form>
          </div>
          {disputes.map((d) => (
            <article key={d.id} className={ui.card}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {d.issue_type} · Flat {d.plaintiff_flat_number} vs {d.respondent_flat_number}
              </p>
              <p className="mt-2 font-medium text-syncra-primary">{d.description}</p>
              <p className={`mt-2 text-sm ${ui.body}`}>{d.ai_mediation_summary}</p>
              <p className="mt-2 text-sm font-semibold">Suggested fine: ₹{d.suggested_fine_amount ?? 0} · {d.status}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={ui.btnSecondary} onClick={() => void signDisputeSettlement(d.id, 'plaintiff').then(refresh)}>
                  Sign as plaintiff
                </button>
                <button type="button" className={ui.btnGhost} onClick={() => void signDisputeSettlement(d.id, 'respondent').then(refresh)}>
                  Sign as respondent
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {tab === 'recall' ? (
        <section className="space-y-4">
          <div className={ui.card}>
            <h3 className={ui.heading}>Open recall motion</h3>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                void createRecallMotion({
                  societyId: currentSocietyId,
                  targetOfficialRole: role,
                  reason,
                  votesRequiredCount: votesNeeded,
                  createdByUserId: user.id
                })
                  .then(() => {
                    setMessage('Recall motion opened.')
                    setReason('')
                    return refresh()
                  })
                  .catch((err) => setError(err instanceof Error ? err.message : 'Failed'))
              }}
            >
              <input className={ui.input} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Target role" required />
              <input className={ui.input} type="number" min={3} value={votesNeeded} onChange={(e) => setVotesNeeded(Number(e.target.value) || 3)} />
              <textarea className={`${ui.input} sm:col-span-2 min-h-[80px]`} value={reason} onChange={(e) => setReason(e.target.value)} required />
              <button type="submit" className={ui.btnPrimary}>
                Create motion
              </button>
            </form>
          </div>
          {motions.map((m) => (
            <article key={m.id} className={ui.card}>
              <h4 className="font-semibold text-syncra-primary">Recall {m.target_official_role}</h4>
              <p className={`mt-2 text-sm ${ui.body}`}>{m.reason}</p>
              <p className="mt-2 text-sm font-semibold">
                Votes {m.current_votes_count}/{m.votes_required_count} · {m.status}
              </p>
              {m.status === 'ACTIVE' ? (
                <button
                  type="button"
                  className={`mt-3 ${ui.btnSecondary}`}
                  onClick={() =>
                    void castRecallBallot({
                      motionId: m.id,
                      societyId: currentSocietyId,
                      flatNumber: user.flatNumber!
                    })
                      .then(() => {
                        setMessage('Secret ballot recorded for your flat.')
                        return refresh()
                      })
                      .catch((err) => setError(err instanceof Error ? err.message : 'Ballot failed'))
                  }
                >
                  Cast 1-Flat-1-Vote
                </button>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {tab === 'guardian' ? (
        <section className={ui.card}>
          <h3 className={ui.heading}>Guardian mesh alerts</h3>
          <p className={`mt-2 text-sm ${ui.body}`}>Kid/senior geofence and vehicle unauthorized-motion events for your society.</p>
          <ul className="mt-4 space-y-2">
            {guardian.length === 0 ? <li className={ui.body}>No active guardian alerts.</li> : null}
            {guardian.map((g) => (
              <li key={g.id} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                <strong>{g.subject_type}</strong> {g.subject_label} · {g.event_type}
                {g.flat_number ? ` · Flat ${g.flat_number}` : ''} · {g.location_label || 'Campus'}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
