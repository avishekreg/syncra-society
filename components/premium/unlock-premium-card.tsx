import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PREMIUM_ADDON_LABELS, type PremiumAddon } from '@/types/database'

type Props = {
  addon: PremiumAddon
  societyName?: string
}

export function UnlockPremiumCard({ addon, societyName }: Props) {
  const label = PREMIUM_ADDON_LABELS[addon] ?? addon

  return (
    <div className="syncra-panel border-dashed border-neutral-300 bg-neutral-50/80 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white">
          <Lock className="h-4 w-4 text-neutral-500" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-neutral-900">Premium module required</p>
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
            {societyName ? `${societyName} is not provisioned for` : 'This society is not provisioned for'}{' '}
            <span className="font-medium text-neutral-800">{label}</span>. Enable the module in Platform
            Configuration to activate live automation.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-4 border-neutral-200">
            <Link to="/admin/config">Open Platform Configuration</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function hasAddon(activeAddons: string[] | undefined, addon: PremiumAddon) {
  return (activeAddons ?? []).includes(addon)
}
