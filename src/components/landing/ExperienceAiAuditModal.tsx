import React, { useEffect, useState } from 'react'
import { ui } from '../../lib/ui'

type ExperienceAiAuditModalProps = {
  open: boolean
  onClose: () => void
}

const SAMPLE_SCORES = [
  { label: 'Collections', value: 86, hint: 'Paid invoices / billed flats' },
  { label: 'Utility promptness', value: 74, hint: 'On-time utility remittances' },
  { label: 'Complaint SLA', value: 91, hint: 'Resolved within policy window' }
]

const CHAT_SCRIPT = [
  { from: 'resident' as const, text: 'What is the late fee after the due date?' },
  {
    from: 'bot' as const,
    text: 'Per your society guidebook: ₹100/day after the 10th, capped at ₹1,000 per cycle.'
  },
  { from: 'resident' as const, text: 'Is the tennis court open this Sunday?' },
  {
    from: 'bot' as const,
    text: 'Yes — 7am–9pm. Booking opens 48 hours ahead in mAI Society → Amenities.'
  }
]

export default function ExperienceAiAuditModal({ open, onClose }: ExperienceAiAuditModalProps) {
  const [chatStep, setChatStep] = useState(0)
  const healthIndex = Math.round(
    SAMPLE_SCORES[0].value * 0.45 + SAMPLE_SCORES[1].value * 0.25 + SAMPLE_SCORES[2].value * 0.3
  )

  useEffect(() => {
    if (!open) {
      setChatStep(0)
      return
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    if (chatStep >= CHAT_SCRIPT.length) return
    const timer = window.setTimeout(() => setChatStep((step) => step + 1), 900)
    return () => window.clearTimeout(timer)
  }, [open, chatStep])

  if (!open) return null

  return (
    <div className={ui.overlay} role="presentation" onClick={onClose}>
      <div
        className={`${ui.modal} max-w-2xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-audit-demo-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={ui.eyebrowPrimary}>Interactive preview</p>
            <h2 id="ai-audit-demo-title" className={`mt-2 ${ui.headingLg}`}>
              Experience AI Audit
            </h2>
            <p className={`mt-2 ${ui.body}`}>
              Sample Society Health Index and WhatsApp bot replies — no signup required.
            </p>
          </div>
          <button type="button" className={ui.btnGhost} onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-syncra-surface-alt p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Society Health Index
            </p>
            <p className="mt-3 text-5xl font-semibold tracking-tight text-syncra-primary">{healthIndex}</p>
            <p className="mt-1 text-sm text-slate-500">Demo society · this month</p>
            <div className="mt-6 space-y-4">
              {SAMPLE_SCORES.map((score) => (
                <div key={score.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{score.label}</span>
                    <span className="font-semibold text-syncra-blue">{score.value}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-syncra-blue transition-all duration-700"
                      style={{ width: `${score.value}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{score.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              WhatsApp AI bot
            </p>
            <div className="mt-4 flex-1 space-y-3">
              {CHAT_SCRIPT.slice(0, chatStep).map((line, index) => (
                <div
                  key={`${line.from}-${index}`}
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    line.from === 'resident'
                      ? 'ml-auto bg-syncra-blue text-white'
                      : 'mr-auto border border-slate-200 bg-syncra-surface-alt text-slate-700'
                  }`}
                >
                  {line.text}
                </div>
              ))}
              {chatStep < CHAT_SCRIPT.length ? (
                <p className="text-xs text-slate-400">Typing…</p>
              ) : (
                <p className="text-xs font-medium text-emerald-700">Demo complete — activate after signup.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
