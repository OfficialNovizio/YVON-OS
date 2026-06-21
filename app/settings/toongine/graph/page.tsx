'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Card, StatusBadge } from '@/components/ui'
import { ArrowLeft, Search, Filter, X, Maximize2, Minimize2 } from 'lucide-react'

interface GraphNode {
  id: string; label: string; size: number; color: string
  visibility: string; workspace: string; connections: string[]
}
interface GraphEdge { source: string; target: string; weight: number }

interface NodePosition { id: string; x: number; y: number }

const FILTERS = ['all', 'private', 'team', 'workspace', 'cross-workspace'] as const
type Filter = typeof FILTERS[number]

function nodeRadius(size: number) { return Math.max(7, Math.min(size / 3.5, 22)) }

export default function GraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [positions, setPositions] = useState<NodePosition[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [selNode, setSelNode] = useState<GraphNode | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [search, setSearch] = useState('')
  const animRef = useRef<number | null>(null)
  const posRef = useRef<NodePosition[]>([])

  useEffect(() => {
    fetch('/api/knowledge-graph')
      .then(r => r.json())
      .then(d => {
        setNodes(d.nodes || [])
        setEdges(d.edges || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Filter nodes
  const filtered = filter === 'all'
    ? nodes
    : nodes.filter(n => n.visibility === filter)
  const visibleIds = new Set(filtered.map(n => n.id))
  const visibleEdges = edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target))

  // Search filter
  const searched = search
    ? filtered.filter(n => n.label.toLowerCase().includes(search.toLowerCase()))
    : filtered

  // Force-directed layout
  useEffect(() => {
    if (filtered.length === 0) { setPositions([]); return }

    const W = 700; const H = 450; const cx = W / 2; const cy = H / 2
    const init = filtered.map((n, i) => {
      const angle = (2 * Math.PI * i) / filtered.length
      const r = Math.min(W, H) * 0.3
      return { id: n.id, x: cx + Math.cos(angle) * r + (Math.random() - 0.5) * 20, y: cy + Math.sin(angle) * r + (Math.random() - 0.5) * 20 }
    })
    posRef.current = init; setPositions([...init])

    const rep = 4000; const att = 0.008; const minD = 35
    let tick = 0; const maxT = 120

    function step() {
      if (tick >= maxT) { animRef.current = null; return }
      const p = posRef.current.map(x => ({ ...x }))
      const len = p.length
      for (let i = 0; i < len; i++) for (let j = i + 1; j < len; j++) {
        const dx = p[j].x - p[i].x, dy = p[j].y - p[i].y
        const d = Math.max(Math.sqrt(dx * dx + dy * dy), minD)
        const f = rep / (d * d); const fx = (dx / d) * f; const fy = (dy / d) * f
        p[i].x -= fx; p[i].y -= fy; p[j].x += fx; p[j].y += fy
      }
      for (const e of visibleEdges) {
        const si = p.findIndex(x => x.id === e.source), ti = p.findIndex(x => x.id === e.target)
        if (si === -1 || ti === -1) continue
        const dx = p[ti].x - p[si].x, dy = p[ti].y - p[si].y
        const d = Math.sqrt(dx * dx + dy * dy); if (!d) continue
        const f = d * att * e.weight; const fx = (dx / d) * f; const fy = (dy / d) * f
        p[si].x += fx; p[si].y += fy; p[ti].x -= fx; p[ti].y -= fy
      }
      for (const n of p) { n.x += (cx - n.x) * 0.006; n.y += (cy - n.y) * 0.006 }
      const m = 30
      for (const n of p) { n.x = Math.max(m, Math.min(W - m, n.x)); n.y = Math.max(m, Math.min(H - m, n.y)) }
      posRef.current = p; tick++
      if (tick % 4 === 0 || tick >= maxT) setPositions([...p])
      animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [filtered, visibleEdges])

  const getPos = useCallback((id: string) => positions.find(p => p.id === id) ?? null, [positions])

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="p-6"><Link href="/settings/toongine" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface"><ArrowLeft size={14} /> Back</Link></div>
        <div className="flex-1 flex items-center justify-center text-on-surface-variant">Loading graph data…</div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${fullscreen ? 'fixed inset-0 z-50 bg-[#060b14]' : 'min-h-screen'}`}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-white/[0.06] shrink-0">
        <Link href="/settings/toongine" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface shrink-0">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-on-surface">Knowledge Graph</h1>
          <p className="text-[11px] text-on-surface-variant">
            {filtered.length} nodes · {visibleEdges.length} edges · interactive force layout
          </p>
        </div>
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="w-40 rounded-lg border border-white/10 bg-white/[0.03] pl-8 pr-3 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
        </div>
        {/* Filters */}
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded text-[10px] font-medium transition ${
                filter === f ? 'bg-white/10 text-on-surface' : 'text-on-surface-variant hover:bg-white/5'
              }`}>{f}</button>
          ))}
        </div>
        <button onClick={() => setFullscreen(!fullscreen)} className="p-1.5 rounded-lg hover:bg-white/5 text-on-surface-variant">
          {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Main: Graph + Sidebar */}
      <div className="flex-1 flex min-h-0">
        {/* Graph */}
        <div className="flex-1 min-w-0 p-4">
          <Card className="h-full min-h-[500px] overflow-hidden p-0">
            {searched.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <span className="text-[48px] text-on-surface-variant/20 mb-3 block">⊘</span>
                  <p className="text-sm text-on-surface-variant">No nodes match filters</p>
                </div>
              </div>
            ) : (
              <svg viewBox="0 0 700 450" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
                {visibleEdges.map(e => {
                  const sp = getPos(e.source), tp = getPos(e.target)
                  if (!sp || !tp) return null
                  return <line key={`${e.source}-${e.target}`} x1={sp.x} y1={sp.y} x2={tp.x} y2={tp.y}
                    stroke="rgb(255 255 255 / 0.06)" strokeWidth={Math.max(0.5, e.weight * 1.5)} />
                })}
                {searched.map(n => {
                  const pos = getPos(n.id); if (!pos) return null
                  const r = nodeRadius(n.size); const isSel = selNode?.id === n.id
                  return (
                    <g key={n.id} className="cursor-pointer" onClick={() => setSelNode(isSel ? null : n)}>
                      {isSel && <circle cx={pos.x} cy={pos.y} r={r + 6} fill="none" stroke="rgb(255 255 255 / 0.25)" strokeWidth={2} />}
                      <circle cx={pos.x} cy={pos.y} r={r} fill={`${n.color}30`} stroke={n.color} strokeWidth={isSel ? 2 : 1} className="transition-all duration-200" />
                      <text x={pos.x} y={pos.y + r + 13} textAnchor="middle" fill={isSel ? 'rgb(255 255 255 / 0.9)' : 'rgb(255 255 255 / 0.45)'} fontSize={10} fontFamily="Inter, system-ui, sans-serif" className="pointer-events-none">{n.label}</text>
                    </g>
                  )
                })}
              </svg>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0 border-l border-white/[0.06] p-4 overflow-y-auto space-y-4">
          <Card className="p-3">
            <h3 className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Stats</h3>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between"><span className="text-on-surface-variant">Nodes</span><span className="text-on-surface font-mono">{filtered.length}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Edges</span><span className="text-on-surface font-mono">{visibleEdges.length}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Density</span><span className="text-on-surface font-mono">{filtered.length ? (visibleEdges.length / filtered.length).toFixed(1) : '—'}</span></div>
            </div>
          </Card>

          {selNode && (
            <Card className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] text-on-surface font-semibold">{selNode.label}</h3>
                <button onClick={() => setSelNode(null)}><X size={12} className="text-on-surface-variant" /></button>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-on-surface-variant">Workspace</span><span className="text-on-surface">{selNode.workspace}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Visibility</span><StatusBadge tone="muted">{selNode.visibility}</StatusBadge></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Size</span><span className="text-on-surface font-mono">{selNode.size}</span></div>
              </div>
              <div className="mt-2">
                <p className="text-[10px] text-on-surface-variant/60 mb-1">Connected to {selNode.connections.length} topics</p>
                <div className="flex flex-wrap gap-1">
                  {selNode.connections.slice(0, 6).map(c => (
                    <span key={c} className="px-1.5 py-0.5 rounded text-[9px] bg-white/[0.04] text-on-surface-variant">{c}</span>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Legend */}
          <Card className="p-3">
            <h3 className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Legend</h3>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#6366f1]" /> <span className="text-on-surface-variant">YVON OS</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#e94560]" /> <span className="text-on-surface-variant">Novizio</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#3b82f6]" /> <span className="text-on-surface-variant">Hourbour</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
