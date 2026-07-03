/** Shared light corporate design tokens for Syncra Society UI. */
export const ui = {
  page: 'min-h-screen bg-white text-slate-900',
  pageMuted: 'bg-syncra-surface-alt',
  card: 'rounded-2xl border border-slate-200 bg-white p-6 shadow-card md:p-8',
  cardSurface: 'rounded-2xl border border-slate-200 bg-syncra-surface p-6 shadow-card md:p-8',
  innerItem:
    'rounded-xl border border-slate-200 bg-syncra-surface-alt p-4 transition hover:border-syncra-accent/30 hover:shadow-sm',
  eyebrow: 'text-[11px] font-semibold uppercase tracking-[0.2em] text-syncra-accent',
  eyebrowPrimary: 'text-[11px] font-semibold uppercase tracking-[0.2em] text-syncra-blue',
  heading: 'text-xl font-semibold tracking-tight text-syncra-primary md:text-2xl',
  headingLg: 'text-2xl font-semibold tracking-tight text-syncra-primary md:text-3xl',
  body: 'text-sm leading-relaxed text-slate-600',
  label: 'text-sm font-medium text-slate-700',
  input:
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-syncra-accent focus:ring-2 focus:ring-syncra-accent/15',
  btnPrimary:
    'rounded-xl bg-syncra-action px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e67e00] disabled:cursor-not-allowed disabled:opacity-70',
  btnSecondary:
    'rounded-xl border border-syncra-accent/40 bg-syncra-accent/10 px-5 py-2.5 text-sm font-semibold text-syncra-blue transition hover:bg-syncra-accent/20',
  btnGhost:
    'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-syncra-surface',
  btnDanger:
    'rounded-xl border border-syncra-action-alt/40 bg-syncra-action-alt/10 px-5 py-2.5 text-sm font-semibold text-[#e04545] transition hover:bg-syncra-action-alt/20',
  loading: 'flex min-h-[40vh] items-center justify-center p-8 text-sm text-slate-500',
  badge: 'rounded-full border border-slate-200 bg-syncra-surface-alt px-3 py-1 text-xs font-semibold text-slate-600',
  overlay: 'fixed inset-0 z-50 overflow-y-auto bg-slate-900/20 p-6 backdrop-blur-sm',
  modal: 'mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-card-hover md:p-8',
  alert:
    'fixed inset-x-4 top-6 z-40 rounded-2xl border border-syncra-action/30 bg-white p-5 shadow-card md:inset-x-auto md:right-8 md:max-w-md',
  /** Dashboard layout helpers */
  section: 'space-y-6',
  sectionGap: 'space-y-8',
  grid3: 'grid grid-cols-1 gap-6 lg:grid-cols-3',
  grid2: 'grid grid-cols-1 gap-6 lg:grid-cols-2',
  cardFill: 'flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-card md:p-6',
  cardHeader: 'mb-5 shrink-0 border-b border-slate-100 pb-4',
  cardBody: 'min-h-0 flex-1',
  statTile: 'flex h-full min-h-[8.5rem] flex-col rounded-xl border border-slate-200 bg-syncra-surface-alt p-4',
  statValue: 'mt-2 text-2xl font-semibold tabular-nums tracking-tight text-syncra-primary',
} as const
