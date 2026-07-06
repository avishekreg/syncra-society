import React, { useEffect, useMemo, useState } from 'react'
import type { Society } from '../../../types/db'
import { subscribeToVisitorLogInserts } from '../../../api/visitorLogsRealtime'
import { cc } from './commandCenterStyles'

type Props = {
  societies: Society[]
  visitorLogs24h: number
  loading?: boolean
}

type NodeKind = 'core' | 'society' | 'gatekeeper' | 'whatsapp'

type GraphNode = {
  id: string
  label: string
  sublabel?: string
  x: number
  y: number
  kind: NodeKind
  societyId?: string
}

const VIEW_W = 820
const VIEW_H = 440
const CX = VIEW_W / 2
const CY = VIEW_H / 2

const LABEL_NAVY = '#1A365D'
const SUBLABEL_SLATE = '#64748B'

function truncate(value: string, max = 14) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function formatTierSublabel(slab?: string | null) {
  const tier = (slab ?? 'tier2').toLowerCase()
  if (tier === 'tier1' || tier === 'basic') return 'Tier 1 plan'
  if (tier === 'tier3' || tier === 'enterprise') return 'Tier 3 plan'
  return 'Tier 2 plan'
}

function polar(cx: number, cy: number, radius: number, index: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius
  }
}

function buildNodes(societies: Society[]): GraphNode[] {
  const visible = societies.slice(0, 6)
  const nodes: GraphNode[] = [
    {
      id: 'core',
      label: 'Syncra Core',
      sublabel: 'Global Core Platform',
      x: CX,
      y: CY,
      kind: 'core'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Inbound',
      sublabel: 'n8n webhook bridge',
      x: 96,
      y: CY,
      kind: 'whatsapp'
    },
    {
      id: 'gatekeeper',
      label: 'Gatekeeper Console',
      sublabel: 'Visitor logs · realtime',
      x: VIEW_W - 96,
      y: CY,
      kind: 'gatekeeper'
    }
  ]

  visible.forEach((society, index) => {
    const pos = polar(CX, CY, 118, index, visible.length)
    nodes.push({
      id: `society-${society.id}`,
      label: truncate(society.name),
      sublabel: formatTierSublabel(society.pricing_slab_id),
      x: pos.x,
      y: pos.y,
      kind: 'society',
      societyId: society.id
    })
  })

  if (societies.length > visible.length) {
    nodes.push({
      id: 'society-more',
      label: `+${societies.length - visible.length} more societies`,
      sublabel: 'Registered on platform',
      x: CX,
      y: CY + 152,
      kind: 'society'
    })
  }

  return nodes
}

function nodeRadius(kind: NodeKind) {
  if (kind === 'core') return 30
  if (kind === 'society') return 20
  return 24
}

function nodeFill(kind: NodeKind, pulsing: boolean) {
  if (kind === 'core') return pulsing ? '#BEE9F8' : '#D6EFFF'
  if (kind === 'gatekeeper') return pulsing ? '#FFE4C4' : '#E8EEF6'
  if (kind === 'whatsapp') return pulsing ? '#BBF7D0' : '#DCFCE7'
  return pulsing ? '#E0F2FE' : '#F1F5F9'
}

function nodeStroke(kind: NodeKind, pulsing: boolean) {
  if (pulsing) return '#FF8C00'
  if (kind === 'core') return '#0052CC'
  if (kind === 'gatekeeper') return '#1A365D'
  if (kind === 'whatsapp') return '#059669'
  return '#94A3B8'
}

export default function PlatformTopologyMap({ societies, visitorLogs24h, loading }: Props) {
  const [pulseIds, setPulseIds] = useState<Set<string>>(new Set())
  const [liveEvents, setLiveEvents] = useState(0)

  const nodes = useMemo(() => buildNodes(societies), [societies])
  const core = nodes.find((node) => node.id === 'core')!
  const whatsapp = nodes.find((node) => node.id === 'whatsapp')!
  const gatekeeper = nodes.find((node) => node.id === 'gatekeeper')!
  const societyNodes = nodes.filter((node) => node.kind === 'society' && node.societyId)

  useEffect(() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>()

    function pulse(id: string) {
      setPulseIds((current) => new Set(current).add(id))
      const existing = timers.get(id)
      if (existing) clearTimeout(existing)
      timers.set(
        id,
        setTimeout(() => {
          setPulseIds((current) => {
            const next = new Set(current)
            next.delete(id)
            return next
          })
          timers.delete(id)
        }, 2200)
      )
    }

    const unsubscribe = subscribeToVisitorLogInserts(({ societyId }) => {
      setLiveEvents((count) => count + 1)
      pulse('gatekeeper')
      pulse('core')
      pulse(`society-${societyId}`)
    })

    return () => {
      unsubscribe()
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const edges = useMemo(() => {
    const links: Array<{ from: GraphNode; to: GraphNode; id: string; hot?: boolean }> = [
      { from: core, to: whatsapp, id: 'core-whatsapp' },
      { from: core, to: gatekeeper, id: 'core-gatekeeper' }
    ]

    for (const society of societyNodes) {
      links.push({ from: core, to: society, id: `core-${society.id}`, hot: pulseIds.has(society.id) })
      links.push({
        from: society,
        to: gatekeeper,
        id: `gk-${society.id}`,
        hot: pulseIds.has(society.id) || pulseIds.has('gatekeeper')
      })
    }

    return links
  }, [core, whatsapp, gatekeeper, societyNodes, pulseIds])

  return (
    <section id="topology" className={cc.card}>
      <div className={cc.cardInner}>
        <header className={`${cc.cardHeader} flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between`}>
          <div>
            <p className={cc.eyebrow}>Live topology</p>
            <h2 className={`mt-1 ${cc.headingSm}`}>Platform network graph</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={cc.metricBadge}>
              <strong className="font-semibold text-syncra-primary">{societies.length}</strong> societies
            </span>
            <span className={cc.metricBadge}>
              <strong className="font-semibold text-syncra-primary">{visitorLogs24h}</strong> gatekeeper / 24h
            </span>
            {liveEvents > 0 ? (
              <span className={cc.metricBadgeActive}>
                <strong className="font-semibold text-syncra-action">{liveEvents}</strong> live inserts
              </span>
            ) : null}
          </div>
        </header>

        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
          {loading ? (
            <div className="flex h-[300px] items-center justify-center sm:h-[380px]">
              <p className={cc.body}>Mapping society network…</p>
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="h-auto w-full min-h-[300px] sm:min-h-[380px]"
              role="img"
              aria-label="Platform topology map showing Syncra Core, societies, gatekeeper, and WhatsApp webhook"
            >
              <defs>
                <linearGradient id="syncra-edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.25" />
                  <stop offset="50%" stopColor="#0052CC" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#00B4D8" stopOpacity="0.25" />
                </linearGradient>
              </defs>

              {edges.map((edge) => {
                const hot = edge.hot || pulseIds.has(edge.from.id) || pulseIds.has(edge.to.id)
                return (
                  <line
                    key={edge.id}
                    x1={edge.from.x}
                    y1={edge.from.y}
                    x2={edge.to.x}
                    y2={edge.to.y}
                    stroke={hot ? '#FF8C00' : 'url(#syncra-edge-gradient)'}
                    strokeWidth={hot ? 2.5 : 1.5}
                    strokeOpacity={hot ? 0.9 : 0.65}
                    className={hot ? 'syncra-path-flow' : undefined}
                  />
                )
              })}

              {nodes.map((node) => {
                const pulsing = pulseIds.has(node.id)
                const r = nodeRadius(node.kind)
                const labelY = node.y + r + 14
                const sublabelY = node.y + r + 28

                return (
                  <g key={node.id}>
                    {pulsing ? (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={r + 8}
                        fill="none"
                        stroke="#00B4D8"
                        strokeOpacity={0.4}
                        className="syncra-node-pulse-ring"
                      />
                    ) : null}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={r}
                      fill={nodeFill(node.kind, pulsing)}
                      stroke={nodeStroke(node.kind, pulsing)}
                      strokeWidth={pulsing ? 2.5 : 1.5}
                    />
                    <text
                      x={node.x}
                      y={labelY}
                      textAnchor="middle"
                      fill={LABEL_NAVY}
                      style={{ fontSize: node.kind === 'core' ? 12 : 11, fontWeight: 600 }}
                    >
                      {node.label}
                    </text>
                    {node.sublabel ? (
                      <text
                        x={node.x}
                        y={sublabelY}
                        textAnchor="middle"
                        fill={SUBLABEL_SLATE}
                        style={{ fontSize: 10, fontWeight: 500 }}
                      >
                        {node.sublabel}
                      </text>
                    ) : null}
                  </g>
                )
              })}
            </svg>
          )}
        </div>
      </div>
    </section>
  )
}
