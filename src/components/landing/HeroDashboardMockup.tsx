import React from 'react'

function MockStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        accent ? 'border-syncra-accent/30 bg-cyan-50/80' : 'border-slate-200/80 bg-white/90'
      }`}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${accent ? 'text-syncra-blue' : 'text-syncra-primary'}`}>
        {value}
      </p>
    </div>
  )
}

export default function HeroDashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl overflow-hidden lg:mx-0 lg:max-w-none">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-syncra-accent/20 via-syncra-blue/10 to-transparent blur-2xl sm:-inset-6"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 top-8 h-28 w-28 rounded-full bg-syncra-action/10 blur-2xl"
      />

      <div className="relative animate-[float_6s_ease-in-out_infinite] rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-[0_24px_80px_-20px_rgba(26,54,93,0.35),0_8px_24px_-8px_rgba(0,82,204,0.18)] backdrop-blur-sm">
        <div className="flex items-center gap-2 rounded-t-xl border-b border-slate-100 bg-syncra-surface-alt/80 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-syncra-action/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="ml-2 flex flex-1 items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="truncate text-[11px] font-medium text-slate-500">app.syncrasociety.com/dashboard</span>
          </div>
        </div>

        <div className="grid min-h-[280px] grid-cols-[4.5rem_1fr] overflow-hidden rounded-b-xl bg-gradient-to-br from-white to-syncra-surface-alt/60 sm:min-h-[320px] sm:grid-cols-[5.5rem_1fr]">
          <aside className="border-r border-slate-100 bg-syncra-primary/[0.03] p-2 sm:p-3">
            <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-syncra-blue text-[10px] font-bold text-white sm:h-9 sm:w-9">
              S
            </div>
            <div className="space-y-2">
              {['Home', 'Ledger', 'Notices', 'Gate'].map((item, index) => (
                <div
                  key={item}
                  className={`rounded-lg px-2 py-1.5 text-[9px] font-semibold sm:text-[10px] ${
                    index === 0
                      ? 'bg-syncra-accent/15 text-syncra-blue'
                      : 'text-slate-400'
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
          </aside>

          <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-accent sm:text-[11px]">
                  RWA Command Center
                </p>
                <p className="mt-0.5 text-sm font-semibold text-syncra-primary sm:text-base">Windsor Castle Society</p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 sm:text-[10px]">
                Secure · Live
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
              <MockStat label="Flats" value="148" />
              <MockStat label="Dues Collected" value="₹4.2L" accent />
              <MockStat label="Open Tickets" value="3" />
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-[11px]">
                  Recent Activity
                </p>
                <span className="text-[9px] font-medium text-syncra-blue">No ads · Encrypted</span>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { tone: 'bg-syncra-accent/15', text: 'Notice relay dispatched via WhatsApp' },
                  { tone: 'bg-syncra-action/10', text: 'Voice ticket categorized — Plumbing · High' },
                  { tone: 'bg-emerald-50', text: 'Visitor approved at Gate 2 · Flat B-402' }
                ].map((row) => (
                  <div key={row.text} className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.tone}`} />
                    <p className="truncate text-[10px] text-slate-600 sm:text-[11px]">{row.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
