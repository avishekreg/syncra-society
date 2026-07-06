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
type NodeHealth = 'healthy' | 'active' | 'quiet' | 'watch'

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
const VIEW_H = 460
const CX = VIEW_W / 2
const CY = VIEW_H / 2

const LABEL_NAVY = '#1A365D'
const SUBLABEL_SLATE = '#64748B'
const NODE_BOX = 52
const NODE_HALF = NODE_BOX / 2
const ICON_SCALE = 1.15

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
    const pos = polar(CX, CY, 122, index, visible.length)
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
      y: CY + 158,
      kind: 'society'
    })
  }

  return nodes
}

function healthStyle(health: NodeHealth) {
  switch (health) {
    case 'active':
      return { ring: '#34D399', ringSoft: 'rgba(52, 211, 153, 0.22)', badge: '#059669' }
    case 'watch':
      return { ring: '#FBBF24', ringSoft: 'rgba(251, 191, 36, 0.2)', badge: '#D97706' }
    case 'quiet':
      return { ring: '#CBD5E1', ringSoft: 'rgba(148, 163, 184, 0.14)', badge: '#94A3B8' }
    default:
      return { ring: '#86EFAC', ringSoft: 'rgba(134, 239, 172, 0.2)', badge: '#16A34A' }
  }
}

function resolveNodeHealth(
  node: GraphNode,
  pulsing: boolean,
  visitorLogs24h: number,
  liveEvents: number
): NodeHealth {
  if (pulsing) return 'active'
  if (node.kind === 'core' || node.kind === 'whatsapp') return 'healthy'
  if (node.kind === 'gatekeeper') {
    if (visitorLogs24h === 0 && liveEvents === 0) return 'watch'
    return 'healthy'
  }
  if (node.kind === 'society') {
    if (!node.societyId) return 'quiet'
    return 'quiet'
  }
  return 'healthy'
}

function edgeEndpoints(from: GraphNode, to: GraphNode) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const pad = NODE_HALF + 4
  return {
    x1: from.x + ux * pad,
    y1: from.y + uy * pad,
    x2: to.x - ux * pad,
    y2: to.y - uy * pad,
    cx: (from.x + to.x) / 2 - uy * 18,
    cy: (from.y + to.y) / 2 + ux * 18
  }
}

function CoreClusterIcon() {
  return (
    <g fill="none" stroke="#0052CC" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="5" width="16" height="6" rx="1.2" fill="#EEF6FF" />
      <circle cx="7" cy="8" r="0.9" fill="#0052CC" stroke="none" />
      <circle cx="10" cy="8" r="0.9" fill="#00B4D8" stroke="none" />
      <rect x="4" y="13" width="16" height="6" rx="1.2" fill="#F8FAFC" />
      <circle cx="7" cy="16" r="0.9" fill="#0052CC" stroke="none" />
      <circle cx="10" cy="16" r="0.9" fill="#00B4D8" stroke="none" />
      <ellipse cx="18" cy="17" rx="3.5" ry="4.5" fill="#E0F2FE" />
      <path d="M18 13.5v7" />
      <path d="M15.2 15.2h5.6" />
      <path d="M15.2 18.8h5.6" />
    </g>
  )
}

function WhatsAppBridgeIcon() {
  return (
    <g fill="none" stroke="#059669" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M5 17c2.5-1.2 4.2-3.4 4.8-6.1-.6-.3-1.3-.5-2.1-.5-2.8 0-5 2.2-5 5 0 1 .3 1.9.8 2.6"
        fill="#ECFDF5"
      />
      <path d="M9.8 10.9c0-2.8 2.2-5 5-5 2.8 0 5 2.2 5 5 0 2.8-2.2 5-5 5-.9 0-1.7-.2-2.4-.6" />
      <path d="M14.8 15.4l1.6 2.8 2.8-1.6" stroke="#047857" />
      <path d="M12.5 8.5h5" stroke="#10B981" strokeWidth="1.1" />
      <path d="M12.5 11h3.5" stroke="#10B981" strokeWidth="1.1" />
    </g>
  )
}

function GatekeeperShieldIcon() {
  return (
    <g fill="none" stroke="#1A365D" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5 5 6.5v5.2c0 4.1 3 7.9 7 8.8 4-.9 7-4.7 7-8.8V6.5L12 3.5z" fill="#F1F5F9" />
      <rect x="8.5" y="10" width="7" height="5.5" rx="1" fill="#FFFFFF" stroke="#0052CC" />
      <path d="M10 12.5h4" stroke="#0052CC" strokeWidth="1.1" />
      <path d="M10 14.2h2.8" stroke="#64748B" strokeWidth="1.1" />
      <path d="M12 6.8v1.6" stroke="#FF8C00" />
    </g>
  )
}

function SocietyBuildingIcon({ compact = false }: { compact?: boolean }) {
  return (
    <g fill="none" stroke="#0052CC" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <rect x={compact ? 6 : 5} y="8" width={compact ? 12 : 14} height="12" rx="1" fill="#F8FAFC" />
      <path d={`M${compact ? 12 : 12} 5.5 L${compact ? 18 : 19} 8 H${compact ? 6 : 5} Z`} fill="#E0F2FE" />
      <rect x={compact ? 8.5 : 8} y="10.5" width="2.2" height="2.2" rx="0.3" fill="#CBD5E1" stroke="none" />
      <rect x={compact ? 12.8 : 12.5} y="10.5" width="2.2" height="2.2" rx="0.3" fill="#CBD5E1" stroke="none" />
      <rect x={compact ? 8.5 : 8} y="14.2" width="2.2" height="2.2" rx="0.3" fill="#CBD5E1" stroke="none" />
      <rect x={compact ? 12.8 : 12.5} y="14.2" width="2.2" height="2.2" rx="0.3" fill="#CBD5E1" stroke="none" />
      <path d={`M${compact ? 11.5 : 11} 20v-2.5h${compact ? 1 : 2}v2.5`} fill="#1A365D" stroke="none" />
    </g>
  )
}

function NodeIcon({ kind }: { kind: NodeKind }) {
  const content =
    kind === 'core' ? (
      <CoreClusterIcon />
    ) : kind === 'whatsapp' ? (
      <WhatsAppBridgeIcon />
    ) : kind === 'gatekeeper' ? (
      <GatekeeperShieldIcon />
    ) : (
      <SocietyBuildingIcon compact={kind === 'society'} />
    )

  return (
    <g transform={`translate(${-12 * ICON_SCALE}, ${-12 * ICON_SCALE}) scale(${ICON_SCALE})`}>{content}</g>
  )
}

function TopologyNode({
  node,
  health,
  pulsing
}: {
  node: GraphNode
  health: NodeHealth
  pulsing: boolean
}) {
  const palette = healthStyle(health)
  const labelY = node.y + NODE_HALF + 16
  const sublabelY = node.y + NODE_HALF + 30

  return (
    <g>
      <circle
        cx={node.x}
        cy={node.y}
        r={NODE_HALF + 10}
        fill={palette.ringSoft}
        stroke={palette.ring}
        strokeWidth={pulsing ? 2 : 1.5}
        opacity={health === 'quiet' ? 0.75 : 0.95}
      />
      {health === 'active' || pulsing ? (
        <circle
          cx={node.x}
          cy={node.y}
          r={NODE_HALF + 14}
          fill="none"
          stroke={palette.ring}
          strokeWidth={1.5}
          opacity={0.55}
          className="syncra-topology-health-pulse"
        />
      ) : null}

      <rect
        x={node.x - NODE_HALF}
        y={node.y - NODE_HALF}
        width={NODE_BOX}
        height={NODE_BOX}
        rx={12}
        fill="#FFFFFF"
        stroke="#E2E8F0"
        strokeWidth={1.25}
        filter="url(#syncra-node-shadow)"
      />
      <rect
        x={node.x - NODE_HALF + 1}
        y={node.y - NODE_HALF + 1}
        width={NODE_BOX - 2}
        height={NODE_BOX - 2}
        rx={11}
        fill="url(#syncra-node-surface)"
        stroke="none"
      />

      <g transform={`translate(${node.x}, ${node.y})`}>
        <NodeIcon kind={node.kind} />
      </g>

      <circle
        cx={node.x + NODE_HALF - 6}
        cy={node.y - NODE_HALF + 6}
        r={4}
        fill={palette.badge}
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />

      <text
        x={node.x}
        y={labelY}
        textAnchor="middle"
        fill={LABEL_NAVY}
        style={{ fontSize: node.kind === 'core' ? 12 : 11, fontWeight: 600, letterSpacing: '-0.01em' }}
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
}

function AnimatedEdge({
  from,
  to,
  hot
}: {
  from: GraphNode
  to: GraphNode
  hot?: boolean
}) {
  const { x1, y1, x2, y2, cx, cy } = edgeEndpoints(from, to)
  const path = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d={path}
        fill="none"
        stroke={hot ? 'url(#syncra-edge-hot)' : 'url(#syncra-edge-flow)'}
        strokeWidth={hot ? 2.4 : 1.8}
        strokeLinecap="round"
        className={hot ? 'syncra-topology-flow-hot' : 'syncra-topology-flow'}
        opacity={hot ? 0.95 : 0.75}
      />
      {hot ? (
        <circle r={3.5} fill="#FF8C00" opacity={0.9}>
          <animateMotion dur="1.4s" repeatCount="indefinite" path={path} />
        </circle>
      ) : null}
      <title>{`${from.label} → ${to.label}`}</title>
    </g>
  )
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
        }, 2400)
      )
    }

    const unsubscribe = subscribeToVisitorLogInserts(({ societyId }) => {
      setLiveEvents((count) => count + 1)
      pulse('gatekeeper')
      pulse('core')
      pulse('whatsapp')
      pulse(`society-${societyId}`)
    })

    return () => {
      unsubscribe()
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const edges = useMemo(() => {
    const links: Array<{ from: GraphNode; to: GraphNode; id: string; hot?: boolean }> = [
      { from: whatsapp, to: core, id: 'whatsapp-core', hot: pulseIds.has('whatsapp') || pulseIds.has('core') },
      { from: core, to: gatekeeper, id: 'core-gatekeeper', hot: pulseIds.has('gatekeeper') || pulseIds.has('core') }
    ]

    for (const society of societyNodes) {
      links.push({
        from: core,
        to: society,
        id: `core-${society.id}`,
        hot: pulseIds.has(society.id) || pulseIds.has('core')
      })
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
            <h2 className={`mt-1 ${cc.headingSm}`}>Infrastructure telemetry view</h2>
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

        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-b from-white to-slate-50/80 shadow-sm">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgb(226 232 240) 1px, transparent 0)',
              backgroundSize: '22px 22px'
            }}
          />

          {loading ? (
            <div className="relative flex h-[320px] items-center justify-center sm:h-[400px]">
              <p className={cc.body}>Mapping infrastructure telemetry…</p>
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="relative h-auto w-full min-h-[320px] sm:min-h-[400px]"
              role="img"
              aria-label="Infrastructure telemetry map showing Syncra Core, societies, gatekeeper, and WhatsApp webhook"
            >
              <defs>
                <linearGradient id="syncra-edge-flow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.35" />
                  <stop offset="45%" stopColor="#0052CC" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#00B4D8" stopOpacity="0.35" />
                </linearGradient>
                <linearGradient id="syncra-edge-hot" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF8C00" stopOpacity="0.55" />
                  <stop offset="50%" stopColor="#0052CC" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#00B4D8" stopOpacity="0.65" />
                </linearGradient>
                <linearGradient id="syncra-node-surface" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#F8FAFC" />
                </linearGradient>
                <filter id="syncra-node-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1A365D" floodOpacity="0.08" />
                </filter>
              </defs>

              {edges.map((edge) => (
                <AnimatedEdge key={edge.id} from={edge.from} to={edge.to} hot={edge.hot} />
              ))}

              {nodes.map((node) => {
                const pulsing = pulseIds.has(node.id)
                const health = resolveNodeHealth(node, pulsing, visitorLogs24h, liveEvents)
                return (
                  <TopologyNode key={node.id} node={node} health={health} pulsing={pulsing} />
                )
              })}
            </svg>
          )}

          <div className="relative flex flex-wrap items-center gap-4 border-t border-gray-200 bg-white/90 px-4 py-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-300 bg-emerald-50" />
              Healthy
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-400 bg-emerald-100" />
              Live traffic
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-amber-300 bg-amber-50" />
              Watch / idle
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-300 bg-slate-50" />
              Quiet load
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
