import { ui } from '../../../lib/ui'

/** Light-theme tokens for Super Admin command center — aligned with global `ui` design language. */
export const cc = {
  sectionGap: ui.sectionGap,
  card: ui.card,
  cardInner: 'p-0',
  cardHeader: ui.cardHeader,
  eyebrow: ui.eyebrow,
  eyebrowPrimary: ui.eyebrowPrimary,
  heading: ui.heading,
  headingSm: 'text-lg font-semibold tracking-tight text-syncra-primary sm:text-xl',
  body: ui.body,
  label: ui.label,
  statValue: ui.statValue,
  input: ui.input,
  select: ui.input,
  btnPrimary: ui.btnPrimary,
  btnSecondary: ui.btnSecondary,
  btnGhost: ui.btnGhost,
  innerItem: ui.innerItem,
  statTile: ui.statTile,
  table: ui.table,
  tableHead: 'border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500',
  tableRow: 'border-b border-slate-100 last:border-0',
  pillInfo:
    'rounded-full border border-syncra-accent/30 bg-syncra-accent/10 px-2.5 py-0.5 text-xs font-semibold text-syncra-blue',
  pillWatch:
    'rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800',
  pillCritical:
    'rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700',
  pillOk:
    'rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700',
  pillTrial:
    'rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700',
  metricBadge:
    'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm',
  metricBadgeActive:
    'rounded-full border border-syncra-action/30 bg-orange-50 px-3 py-1 text-xs text-slate-600 shadow-sm',
  kbd: 'rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500',
  aiIconWrap:
    'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-syncra-accent/30 bg-syncra-accent/10',
  insightCard: `${ui.innerItem} transition hover:border-syncra-accent/30`
} as const

export function insightPillClass(severity: 'info' | 'watch' | 'critical') {
  if (severity === 'critical') return cc.pillCritical
  if (severity === 'watch') return cc.pillWatch
  return cc.pillInfo
}
