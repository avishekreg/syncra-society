import React, { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { ExecutiveSummaryResult } from '../../../lib/platformExecutiveAi'
import { cc, insightPillClass } from './commandCenterStyles'

type Props = {
  summary: ExecutiveSummaryResult | null
  loading: boolean
}

export default function AiExecutiveSummary({ summary, loading }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!summary) return
    setVisible(false)
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [summary])

  return (
    <section className={cc.card}>
      <div className={cc.cardInner}>
        <header className={`${cc.cardHeader} flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between`}>
          <div className="flex items-start gap-3">
            <div className={cc.aiIconWrap}>
              <span className="absolute inset-0 rounded-xl syncra-ai-ring" aria-hidden="true" />
              <Sparkles className="relative h-5 w-5 text-syncra-blue" aria-hidden="true" />
            </div>
            <div>
              <p className={cc.eyebrowPrimary}>Syncra AI executive summary</p>
              <h2 className={`mt-1 ${cc.headingSm}`}>
                {loading ? 'Synthesizing platform intelligence…' : summary?.headline ?? 'Awaiting telemetry'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-syncra-accent opacity-40" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-syncra-accent" />
            </span>
            <span className={cc.pillInfo}>
              {loading ? 'Analyzing…' : summary?.source === 'ai' ? 'LLM live' : summary?.source === 'n8n' ? 'n8n AI' : 'Rules engine'}
            </span>
          </div>
        </header>

        <p
          className={`max-w-4xl ${cc.body} transition-opacity duration-500 ${visible || loading ? 'opacity-100' : 'opacity-0'}`}
        >
          {loading
            ? 'Correlating gatekeeper throughput, subscription health, and fleet-wide anomalies…'
            : summary?.narrative ?? 'Connect societies and billing data to activate the executive briefing.'}
        </p>

        {!loading && summary?.insights.length ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.insights.map((insight) => (
              <article key={insight.id} className={cc.insightCard}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{insight.label}</p>
                  <span className={insightPillClass(insight.severity)}>{insight.severity}</span>
                </div>
                <p className="mt-2 text-sm leading-snug text-slate-700">{insight.detail}</p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
