import { Lock, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PREMIUM_ADDON_LABELS, type PremiumAddon } from '@/types/database'
import Link from 'next/link'

type Props = {
  addon: PremiumAddon
  societyName?: string
}

export function UnlockPremiumCard({ addon, societyName }: Props) {
  const label = PREMIUM_ADDON_LABELS[addon] ?? addon

  return (
    <Card className="border-dashed border-primary/40 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <Lock className="h-5 w-5" />
          <Sparkles className="h-4 w-4" />
        </div>
        <CardTitle>Unlock Premium Module</CardTitle>
        <CardDescription>
          {societyName ? `${societyName} does not have` : 'This society does not have'}{' '}
          <strong>{label}</strong> enabled. Upgrade to activate WhatsApp alerts, payment routing, and
          automation without redeploying code.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/admin/config">Contact Super Admin to Enable</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function hasAddon(activeAddons: string[] | undefined, addon: PremiumAddon) {
  return (activeAddons ?? []).includes(addon)
}
