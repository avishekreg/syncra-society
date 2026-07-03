'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Society, SystemConfig } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            <CardTitle>Super Admin Access</CardTitle>
          </div>
          <CardDescription>Enter your SUPER_ADMIN_SECRET to manage zero-code platform configuration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key">Admin Key</Label>
            <Input
              id="key"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="SUPER_ADMIN_SECRET"
            />
          </div>
          <Button disabled={!adminKey || loading} onClick={() => void loadConfigs(adminKey)}>
            {loading ? 'Verifying…' : 'Unlock Dashboard'}
          </Button>
          {status && <p className="text-sm text-destructive">{status}</p>}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Super Admin Configuration</h1>
        <p className="mt-2 text-muted-foreground">
          Edit runtime values in <code className="text-xs">system_configs</code> — gateways, n8n webhooks, and
          Twilio routing update instantly without Vercel redeploy.
        </p>
      </div>

      {status && (
        <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm">{status}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>All platform secrets and routing targets</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.key}>
                  <TableCell className="font-mono text-xs">{config.key}</TableCell>
                  <TableCell>
                    {config.key.includes('SECRET') ? (
                      <Input
                        type="password"
                        value={drafts[config.key] ?? ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [config.key]: e.target.value }))}
                      />
                    ) : config.key === 'N8N_WEBHOOK_URL' ? (
                      <Input
                        value={drafts[config.key] ?? ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [config.key]: e.target.value }))}
                      />
                    ) : config.key === 'ACTIVE_PAYMENT_GATEWAY' ? (
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{config.description}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => void saveConfig(config.key)}>
                      <Save className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Society Premium Modules</CardTitle>
          <CardDescription>Toggle feature addons per society — controls 403 gating on API routes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {societies.map((society) => (
            <div key={society.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{society.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Tier: {society.subscription_tier}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(society.active_addons ?? []).map((addon) => (
                    <Badge key={addon} variant="success">
                      {addon}
                    </Badge>
                  ))}
                  {(society.active_addons ?? []).length === 0 && (
                    <Badge variant="secondary">basic only</Badge>
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
                      variant={enabled ? 'destructive' : 'default'}
                      onClick={() => void toggleAddon(society.id, addon, !enabled)}
                    >
                      {enabled ? 'Disable' : 'Enable'} {addon}
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
