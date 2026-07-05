/** Shared light corporate design tokens for Syncra Society UI — mobile-first responsive. */
export const ui = {
  page: 'min-h-screen bg-white text-slate-900',
  pageMuted: 'bg-syncra-surface-alt',
  /** Dashboard / app content shell */
  pageShell: 'mx-auto w-full min-w-0 max-w-7xl px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:py-10',
  panelPadding: 'p-4 sm:p-6',
  panelPaddingX: 'px-4 sm:px-6',
  card: 'rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-6 md:p-8',
  cardSurface: 'rounded-2xl border border-slate-200 bg-syncra-surface p-4 shadow-card sm:p-6 md:p-8',
  innerItem:
    'rounded-xl border border-slate-200 bg-syncra-surface-alt p-4 transition hover:border-syncra-accent/30 hover:shadow-sm',
  eyebrow: 'text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-accent sm:text-[11px] sm:tracking-[0.2em]',
  eyebrowPrimary:
    'text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-blue sm:text-[11px] sm:tracking-[0.2em]',
  heading: 'text-lg font-semibold tracking-tight text-syncra-primary sm:text-xl md:text-2xl',
  headingLg: 'text-xl font-semibold tracking-tight text-syncra-primary sm:text-2xl md:text-3xl',
  display: 'text-2xl font-semibold tracking-tight text-syncra-primary sm:text-3xl md:text-4xl lg:text-5xl',
  body: 'text-sm leading-relaxed text-slate-600 sm:text-base sm:leading-relaxed',
  label: 'text-sm font-medium text-slate-700',
  input:
    'w-full min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-syncra-accent focus:ring-2 focus:ring-syncra-accent/15 sm:text-sm',
  btnPrimary:
    'inline-flex min-h-11 items-center justify-center rounded-xl bg-syncra-action px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e67e00] disabled:cursor-not-allowed disabled:opacity-70',
  btnSecondary:
    'inline-flex min-h-11 items-center justify-center rounded-xl border border-syncra-accent/40 bg-syncra-accent/10 px-5 py-3 text-sm font-semibold text-syncra-blue transition hover:bg-syncra-accent/20',
  btnGhost:
    'inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-syncra-surface',
  btnDanger:
    'inline-flex min-h-11 items-center justify-center rounded-xl border border-syncra-action-alt/40 bg-syncra-action-alt/10 px-5 py-3 text-sm font-semibold text-[#e04545] transition hover:bg-syncra-action-alt/20',
  btnIcon:
    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-syncra-accent/40 hover:bg-syncra-accent/5 hover:text-syncra-blue',
  loading: 'flex min-h-[40vh] items-center justify-center p-6 text-sm text-slate-500 sm:p-8',
  badge: 'rounded-full border border-slate-200 bg-syncra-surface-alt px-3 py-1.5 text-xs font-semibold text-slate-600',
  overlay: 'fixed inset-0 z-50 overflow-y-auto bg-slate-900/20 p-4 backdrop-blur-sm sm:p-6',
  modal:
    'mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-card-hover sm:p-6 md:p-8',
  alert:
    'fixed inset-x-4 top-4 z-40 rounded-2xl border border-syncra-action/30 bg-white p-4 shadow-card sm:inset-x-auto sm:right-6 sm:top-6 sm:max-w-md sm:p-5',
  /** Horizontal scroll wrapper for data tables on mobile */
  tableWrap: 'w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]',
  table: 'min-w-[640px] w-full text-left text-sm',
  /** Stack-friendly section headers */
  sectionHeader: 'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
  sectionHeaderCenter: 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
  /** Dashboard layout helpers */
  section: 'space-y-4 sm:space-y-6',
  sectionGap: 'space-y-6 sm:space-y-8',
  grid4: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
  grid3: 'grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3',
  grid2: 'grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2',
  cardFill:
    'flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-6 md:p-6',
  cardHeader: 'mb-4 shrink-0 border-b border-slate-100 pb-4 sm:mb-5',
  cardBody: 'min-h-0 flex-1',
  statTile:
    'flex h-full min-h-[7.5rem] flex-col rounded-xl border border-slate-200 bg-syncra-surface-alt p-4 sm:min-h-[8.5rem]',
  statValue: 'mt-2 text-xl font-semibold tabular-nums tracking-tight text-syncra-primary sm:text-2xl',
  /** Mobile nav link (sidebar) */
  navLink:
    'group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200',
  navLinkActive: 'border border-syncra-accent/30 bg-syncra-accent/10 text-syncra-blue shadow-sm',
  navLinkIdle:
    'border border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-syncra-primary',
  subNavLink:
    'flex min-h-11 items-center gap-2 rounded-lg py-2.5 pl-9 pr-3.5 text-sm font-medium transition-all duration-200',
} as const
