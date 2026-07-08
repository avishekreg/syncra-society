import React from 'react'
import { ChevronDown } from 'lucide-react'
import { ui } from '../../lib/ui'

export type StaffViewMode = 'staff' | 'resident'

type Props = {
  mode: StaffViewMode
  onChange: (mode: StaffViewMode) => void
  staffLabel?: string
  residentLabel?: string
  flatNumber?: string | null
}

export default function StaffViewSwitcher({
  mode,
  onChange,
  staffLabel = 'Staff View',
  residentLabel = 'My Flat View',
  flatNumber
}: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onChange('staff')}
          className={[
            'rounded-lg px-4 py-2 text-sm font-semibold transition',
            mode === 'staff'
              ? 'bg-syncra-accent/15 text-syncra-blue'
              : 'text-slate-600 hover:bg-syncra-surface-alt'
          ].join(' ')}
        >
          {staffLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange('resident')}
          className={[
            'rounded-lg px-4 py-2 text-sm font-semibold transition',
            mode === 'resident'
              ? 'bg-syncra-accent/15 text-syncra-blue'
              : 'text-slate-600 hover:bg-syncra-surface-alt'
          ].join(' ')}
        >
          {residentLabel}
        </button>
      </div>

      <label className="relative inline-flex min-w-[11rem] items-center">
        <span className="sr-only">Switch workspace view</span>
        <select
          value={mode}
          onChange={(event) => onChange(event.target.value as StaffViewMode)}
          className={`${ui.input} appearance-none pr-9 text-sm font-medium`}
        >
          <option value="staff">{staffLabel}</option>
          <option value="resident">{residentLabel}</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" aria-hidden="true" />
      </label>

      {flatNumber ? (
        <p className="text-xs font-medium text-slate-500">
          Resident profile · Flat <span className="text-syncra-primary">{flatNumber}</span>
        </p>
      ) : null}
    </div>
  )
}
