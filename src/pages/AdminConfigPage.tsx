import { useCallback, useEffect, useState } from 'react'
import type { Society, SystemConfig } from '@/types/database'
import { PageHeader } from '../../components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Shield, Save } from 'lucide-react'

const ADMIN_KEY_STORAGE = 'syncra-super-admin-key'

export default function AdminConfigPage() {
  const [adminKey, setAdminKey] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [societies, setSocieties] = useState<Society[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const headers = useCallback(
    () => ({
      'Content-Type': 'application/json',
      'x-super-admin-key': adminKey
    }),
    [adminKey]
  )

  async function loadConfigs(key: string) {
    setLoading(true)
    setStatus('')
    const res = await fetch('/api/admin/config', {
      headers: { 'x-super-admin-key': key }
    })
    setLoading(false)
    if (!res.ok) {
      setStatus('Invalid admin key or server error')
      setAuthenticated(false)
      return
    }
    const data = (await res.json()) as SystemConfig[]
    setConfigs(data)
    setDrafts(Object.fromEntries(data.map((c) => [c.key, c.value])))
    setAuthenticated(true)
    sessionStorage.setItem(ADMIN_KEY_STORAGE, key)

    const sRes = await fetch('/api/societies')
    setSocieties((await sRes.json()) as Society[])
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_KEY_STORAGE)
    if (saved) {
      setAdminKey(saved)
      void loadConfigs(saved)
    }
  }, [])

  async function saveConfig(key: string) {
    setStatus('')
    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ key, value: drafts[key] ?? '' })
    })
    if (!res.ok) {
      setStatus(`Failed to save ${key}`)
      return
    }
    setStatus(`${key} saved — live immediately, no redeploy required`)
    void loadConfigs(adminKey)
  }

  async function toggleAddon(societyId: string, addon: string, enabled: boolean) {
    const society = societies.find((s) => s.id === societyId)
    if (!society) return

    const next = enabled
      ? [...new Set([...(society.active_addons ?? []), addon])]
      : (society.active_addons ?? []).filter((a) => a !== addon)

    const res = await fetch(`/api/societies/${societyId}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ active_addons: next })
    })

    if (res.ok) {
      setStatus(`Updated addons for ${society.name}`)
      const sRes = await fetch('/api/societies')
      setSocieties((await sRes.json()) as Society[])
    }
  }

  if (!authenticated) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center">
        <section className="syncra-panel w-full p-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50">
            <Shield className="h-4 w-4 text-neutral-600" strokeWidth={1.5} />
          </div>
          <h1 className="mt-5 text-lg font-semibold tracking-tight text-neutral-900">Platform Configuration</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            Super Admin authentication required to modify runtime gateway routing, n8n webhooks, and society
            premium entitlements.
          </p>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">Administrator access key</Label>
              <Input
                id="key"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="SUPER_ADMIN_SECRET"
                className="border-neutral-200"
              />
            </div>
            <Button disabled={!adminKey || loading} onClick={() => void loadConfigs(adminKey)} className="w-full">
              {loading ? 'Verifying credentials…' : 'Unlock configuration console'}
            </Button>
            {status && <p className="text-sm text-destructive">{status}</p>}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Platform Configuration"
        title="Runtime control plane"
        description="Modify Razorpay, Stripe, n8n, and Twilio routing in production — changes propagate instantly without redeploying to Vercel."
      />

      {status && <div className="syncra-panel mb-8 px-4 py-3 text-sm text-neutral-600">{status}</div>}

      <section className="syncra-panel overflow-hidden">
        <div className="border-b border-neutral-200 px-4 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-neutral-900">System configuration registry</h2>
          <p className="text-sm text-neutral-500">Authoritative runtime parameters stored in system_configs</p>
        </div>
        <div className="overflow-x-auto p-4">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-200 hover:bg-transparent">
                <TableHead className="text-neutral-500">Key</TableHead>
                <TableHead className="text-neutral-500">Value</TableHead>
                <TableHead className="text-neutral-500">Description</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.key} className="border-neutral-100">
                  <TableCell className="font-mono text-xs text-neutral-700">{config.key}</TableCell>
                  <TableCell>
                    {config.key.includes('SECRET') ? (
                      <Input
                        type="password"
                        value={drafts[config.key] ?? ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [config.key]: e.target.value }))}
                        className="border-neutral-200"
                      />
                    ) : config.key === 'N8N_WEBHOOK_URL' ? (
                      <Input
                        value={drafts[config.key] ?? ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [config.key]: e.target.value }))}
                        className="border-neutral-200"
                      />
                    ) : config.key === 'ACTIVE_PAYMENT_GATEWAY' ? (
                      <select
                        className="syncra-input h-10"
                        value={drafts[config.key] ?? 'RAZORPAY'}
                        onChange={(e) => setDrafts((d) => ({ ...d, [config.key]: e.target.value }))}
                      >
                        <option value="RAZORPAY">RAZORPAY (India)</option>
                        <option value="STRIPE">STRIPE (UAE / Global)</option>
                        <option value="CHILE_LOCAL">CHILE_LOCAL</option>
                      </select>
                    ) : (
                      <Textarea
                        rows={2}
                        value={drafts[config.key] ?? ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [config.key]: e.target.value }))}
                        className="border-neutral-200"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-neutral-500">{config.description}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="border-neutral-200" onClick={() => void saveConfig(config.key)}>
                      <Save className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="syncra-panel mt-8 overflow-hidden">
        <div className="border-b border-neutral-200 px-4 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-neutral-900">Society premium entitlements</h2>
          <p className="text-sm text-neutral-500">Toggle feature modules per society — controls 403 gating on API routes</p>
        </div>
        <div className="space-y-4 p-4">
          {societies.map((society) => (
            <div key={society.id} className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-neutral-900">{society.name}</p>
                  <p className="text-xs text-neutral-500">Tier: {society.subscription_tier}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(society.active_addons ?? []).map((addon) => (
                    <Badge key={addon} variant="success" className="font-normal">
                      {addon}
                    </Badge>
                  ))}
                  {(society.active_addons ?? []).length === 0 && (
                    <Badge variant="secondary" className="font-normal">
                      basic only
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['whatsapp_automation', 'payment_gateway'] as const).map((addon) => {
                  const enabled = (society.active_addons ?? []).includes(addon)
                  return (
                    <Button
                      key={addon}
                      size="sm"
                      variant={enabled ? 'destructive' : 'outline'}
                      className={enabled ? undefined : 'border-neutral-200'}
                      onClick={() => void toggleAddon(society.id, addon, !enabled)}
                    >
                      {enabled ? 'Disable' : 'Enable'} {addon}
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
