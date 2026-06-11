'use client'

import { useRef, useState, type PointerEvent as RPointerEvent, type WheelEvent as RWheelEvent } from 'react'
import { PageHeader } from '@/components/ui'
import { MessageSquare, RotateCcw, Maximize2 } from 'lucide-react'

/* Isometric projection */
const TW = 29
const TH = 14.5
const OX = 500
const OY = 140
const PLAT = 16
const VW = 1000
const VH = 620

type P = { x: number; y: number }
const pt = (gx: number, gy: number, gz = 0): P => ({ x: OX + (gx - gy) * TW, y: OY + (gx + gy) * TH - gz })
const poly = (pts: P[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

type Status = 'working' | 'standup' | 'moving' | 'idle'

const STATUS: Record<Status, { color: string; label: string }> = {
  working: { color: '#4ade80', label: 'Working' },
  standup: { color: '#c08bff', label: 'In standup' },
  moving: { color: '#5ee0ff', label: 'Moving' },
  idle: { color: '#8b919f', label: 'Idle' },
}

type Room = { id: string; name: string; accent: string; x0: number; y0: number; x1: number; y1: number; table?: boolean }
const ROOMS: Room[] = [
  { id: 'personal', name: 'Personal HQ', accent: '#abc7ff', x0: 0, y0: 0, x1: 3, y1: 3 },
  { id: 'masters', name: 'Masters Studio', accent: '#9db5e7', x0: 3.6, y0: 0, x1: 6.6, y1: 3 },
  { id: 'bydesign', name: 'By Design', accent: '#5ee0ff', x0: 7.2, y0: 0, x1: 10.2, y1: 3 },
  { id: 'kanela', name: 'Kanela', accent: '#5fd0b4', x0: 0, y0: 3.8, x1: 3, y1: 6.8 },
  { id: 'commons', name: 'Commons', accent: '#aec7f9', x0: 3.6, y0: 3.8, x1: 6.6, y1: 6.8, table: true },
  { id: 'valhalla', name: 'Valhalla', accent: '#c08bff', x0: 7.2, y0: 3.8, x1: 10.2, y1: 6.8 },
]

type Agent = { id: string; name: string; role: string; room: string; status: Status; gx: number; gy: number; task: string }
const AGENTS: Agent[] = [
  { id: 'henry', name: 'Henry', role: 'Chief of Staff', room: 'personal', status: 'standup', gx: 0.8, gy: 0.8, task: 'Running the morning standup' },
  { id: 'nexus', name: 'Nexus', role: 'CTO', room: 'personal', status: 'working', gx: 2.2, gy: 0.8, task: 'Coding voice-memo intake' },
  { id: 'steve', name: 'Steve', role: 'QA', room: 'personal', status: 'working', gx: 0.9, gy: 2.2, task: 'Reviewing PR #142' },
  { id: 'knox', name: 'Knox', role: 'Security', room: 'personal', status: 'moving', gx: 2.3, gy: 2.2, task: 'Rotating a leaked key' },
  { id: 'wolf', name: 'Wolf', role: 'Finance', room: 'personal', status: 'idle', gx: 1.6, gy: 3.0, task: 'Idle, after hours' },

  { id: 'william', name: 'William', role: 'Copywriting', room: 'masters', status: 'working', gx: 4.4, gy: 0.8, task: 'Drafting newsletter #13' },
  { id: 'leonardo', name: 'Leonardo', role: 'Image gen', room: 'masters', status: 'working', gx: 5.8, gy: 0.8, task: 'Rendering 8 post concepts' },
  { id: 'isaac', name: 'Isaac', role: 'Trends', room: 'masters', status: 'standup', gx: 4.5, gy: 2.2, task: 'Sharing TikTok signals' },
  { id: 'ivy', name: 'Ivy', role: 'Research', room: 'masters', status: 'moving', gx: 5.9, gy: 2.2, task: 'Walking to Commons' },

  { id: 'viola', name: 'Viola', role: 'By Design lead', room: 'bydesign', status: 'working', gx: 8.0, gy: 0.8, task: 'Tuning onboarding flow' },
  { id: 'hana', name: 'Hana', role: 'Design', room: 'bydesign', status: 'moving', gx: 9.4, gy: 0.8, task: 'Heading to a review' },
  { id: 'atlas', name: 'Atlas', role: 'Infra', room: 'bydesign', status: 'idle', gx: 8.7, gy: 2.3, task: 'Idle' },

  { id: 'aria', name: 'Aria', role: 'Canela lead', room: 'kanela', status: 'working', gx: 0.9, gy: 4.6, task: 'Building the shop promo' },
  { id: 'nyx', name: 'Nyx', role: 'Merch', room: 'kanela', status: 'standup', gx: 2.2, gy: 4.6, task: 'Standup update' },
  { id: 'lucia', name: 'Lucia', role: 'Support', room: 'kanela', status: 'idle', gx: 1.5, gy: 6.0, task: 'Idle' },

  { id: 'fenrir', name: 'Fenrir', role: 'Valhalla lead', room: 'valhalla', status: 'moving', gx: 8.0, gy: 4.6, task: 'Walking the floor' },
  { id: 'saga', name: 'Saga', role: 'A&R', room: 'valhalla', status: 'idle', gx: 9.4, gy: 5.8, task: 'Idle' },
]

const TABS: { id: string | null; label: string }[] = [
  { id: null, label: 'Whole floor' },
  { id: 'personal', label: 'Personal HQ' },
  { id: 'masters', label: 'Masters' },
  { id: 'kanela', label: 'Kanela' },
  { id: 'bydesign', label: 'By Design' },
  { id: 'valhalla', label: 'Valhalla' },
]

function RoomShape({ r, dim }: { r: Room; dim: boolean }) {
  const i = 0.12
  const A = pt(r.x0 + i, r.y0 + i, PLAT)
  const B = pt(r.x1 - i, r.y0 + i, PLAT)
  const C = pt(r.x1 - i, r.y1 - i, PLAT)
  const D = pt(r.x0 + i, r.y1 - i, PLAT)
  const C0 = pt(r.x1 - i, r.y1 - i, 0)
  const B0 = pt(r.x1 - i, r.y0 + i, 0)
  const D0 = pt(r.x0 + i, r.y1 - i, 0)
  const center = pt((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, PLAT)
  const label = pt((r.x0 + r.x1) / 2, r.y1 - i - 0.05, PLAT)
  return (
    <g style={{ opacity: dim ? 0.25 : 1, transition: 'opacity 200ms ease' }}>
      <polygon points={poly([B, C, C0, B0])} fill="#0c0c0f" opacity={0.85} />
      <polygon points={poly([D, C, C0, D0])} fill="#161620" opacity={0.9} />
      <polygon points={poly([A, B, C, D])} fill={r.accent} fillOpacity={0.14} stroke={r.accent} strokeOpacity={0.55} strokeWidth={1} />
      {r.table && <ellipse cx={center.x} cy={center.y} rx={34} ry={17} fill="#ffffff" fillOpacity={0.06} stroke={r.accent} strokeOpacity={0.4} />}
      <text x={label.x} y={label.y} textAnchor="middle" fontSize={9} letterSpacing={1.5} fill={r.accent} fillOpacity={0.7} fontWeight={700}>
        {r.name.toUpperCase()}
      </text>
    </g>
  )
}

function Desk({ gx, gy, dim }: { gx: number; gy: number; dim: boolean }) {
  const s = 0.42
  const h = 9
  const t1 = pt(gx - s, gy - s, PLAT + h)
  const t2 = pt(gx + s, gy - s, PLAT + h)
  const t3 = pt(gx + s, gy + s, PLAT + h)
  const t4 = pt(gx - s, gy + s, PLAT + h)
  const f3 = pt(gx + s, gy + s, PLAT)
  const f2 = pt(gx + s, gy - s, PLAT)
  const f4 = pt(gx - s, gy + s, PLAT)
  return (
    <g style={{ opacity: dim ? 0.25 : 1, transition: 'opacity 200ms ease' }}>
      <polygon points={poly([t2, t3, f3, f2])} fill="#1d1d22" />
      <polygon points={poly([t4, t3, f3, f4])} fill="#26262d" />
      <polygon points={poly([t1, t2, t3, t4])} fill="#34343d" stroke="#000" strokeOpacity={0.3} strokeWidth={0.4} />
    </g>
  )
}

export default function OfficePage() {
  const [active, setActive] = useState<string | null>(null)
  const [selected, setSelected] = useState<Agent | null>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const [grabbing, setGrabbing] = useState(false)

  const counts = {
    working: AGENTS.filter((a) => a.status === 'working').length,
    standup: AGENTS.filter((a) => a.status === 'standup').length,
    moving: AGENTS.filter((a) => a.status === 'moving').length,
  }

  const onWheel = (e: RWheelEvent) => {
    setScale((s) => Math.min(2, Math.max(0.6, s - e.deltaY * 0.0012)))
  }
  const onDown = (e: RPointerEvent) => {
    drag.current = { x: pan.x, y: pan.y, px: e.clientX, py: e.clientY }
    setGrabbing(true)
  }
  const onMove = (e: RPointerEvent) => {
    if (!drag.current) return
    setPan({ x: drag.current.x + (e.clientX - drag.current.px), y: drag.current.y + (e.clientY - drag.current.py) })
  }
  const onUp = () => {
    drag.current = null
    setGrabbing(false)
  }
  const reset = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }

  const sorted = [...AGENTS].sort((a, b) => a.gx + a.gy - (b.gx + b.gy))

  return (
    <div>
      <PageHeader
        title="The Office"
        subtitle="Your agents, live on the floor. A room per workspace, a shared commons, and they coordinate across teams. Real state, never faked."
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const on = active === t.id
          return (
            <button
              key={t.label}
              onClick={() => setActive(t.id)}
              className="rounded-full border px-3 py-1.5 text-[12px] font-semibold transition"
              style={
                on
                  ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' }
                  : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }
              }
            >
              {t.label}
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-2 text-[12px]">
          <span className="flex items-center gap-1.5 rounded-full border border-white/8 px-2.5 py-1">
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS.working.color }} /> {counts.working} working
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-white/8 px-2.5 py-1">
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS.standup.color }} /> {counts.standup} in standup
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-white/8 px-2.5 py-1">
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS.moving.color }} /> {counts.moving} moving
          </span>
        </div>
      </div>

      <div
        className={`glass-card relative h-[600px] select-none overflow-hidden ${grabbing ? 'office-grabbing' : 'office-grab'}`}
        onWheel={onWheel}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onClick={() => setSelected(null)}
        style={{ background: 'radial-gradient(120% 90% at 50% -10%, rgba(40,55,100,0.35), transparent 55%), linear-gradient(180deg, #0c0d12, #08080b)' }}
      >
        <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-lg bg-black/40 px-3 py-1.5 text-[11px] text-on-surface-variant backdrop-blur">
          drag to pan, scroll to zoom, click an agent
        </div>
        <div className="absolute right-4 top-4 z-20 flex gap-1.5">
          <button onClick={(e) => { e.stopPropagation(); reset() }} className="btn-ghost !p-2" title="Reset view">
            <RotateCcw size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setScale((s) => Math.min(2, s + 0.2)) }} className="btn-ghost !p-2" title="Zoom in">
            <Maximize2 size={14} />
          </button>
        </div>

        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: VW,
            height: VH,
            transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center',
          }}
        >
          <svg viewBox={`0 0 ${VW} ${VH}`} width={VW} height={VH} className="absolute inset-0">
            {ROOMS.map((r) => (
              <RoomShape key={r.id} r={r} dim={active != null && active !== r.id} />
            ))}
            {AGENTS.map((a) => (
              <Desk key={a.id} gx={a.gx} gy={a.gy - 0.55} dim={active != null && active !== a.room} />
            ))}
          </svg>

          <div className="absolute inset-0">
            {sorted.map((a) => {
              const p = pt(a.gx, a.gy, PLAT)
              const dim = active != null && active !== a.room
              const st = STATUS[a.status]
              return (
                <button
                  key={a.id}
                  onClick={(e) => { e.stopPropagation(); setSelected(a) }}
                  className="office-agent absolute"
                  style={{
                    left: `${(p.x / VW) * 100}%`,
                    top: `${(p.y / VH) * 100}%`,
                    transform: 'translate(-50%, -100%)',
                    zIndex: Math.round(p.y),
                    opacity: dim ? 0.3 : 1,
                    transition: 'opacity 200ms ease',
                  }}
                >
                  <div className="flex flex-col items-center">
                    <span
                      className="mb-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: 'rgba(10,10,14,0.8)', borderColor: 'rgba(255,255,255,0.1)', color: '#e2e2e2' }}
                    >
                      {a.name}
                    </span>
                    <div className={a.status === 'moving' ? 'office-bob' : ''}>
                      <div className="mx-auto h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />
                      <div className="mx-auto -mt-px h-1.5 w-[2px]" style={{ background: 'rgba(255,255,255,0.25)' }} />
                      <div
                        className="relative flex h-6 w-8 items-center justify-center gap-1 rounded-[7px] border-2"
                        style={{ background: '#15151b', borderColor: st.color, boxShadow: `0 0 10px -2px ${st.color}` }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />
                      </div>
                      <div
                        className="mx-auto -mt-0.5 h-3 w-6 rounded-b-[6px] rounded-t-sm"
                        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </div>
                    <div className="mt-0.5 h-1.5 w-7 rounded-full bg-black/50 blur-[2px]" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {selected && (
          <div
            className="absolute bottom-4 left-4 z-30 w-72 rounded-2xl border border-white/10 bg-surface-container/95 p-4 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-black/80" style={{ background: STATUS[selected.status].color }}>
                {selected.name.slice(0, 2)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface">{selected.name}</p>
                <p className="text-[11px] text-on-surface-variant">{selected.role}</p>
              </div>
              <span className="ml-auto flex items-center gap-1.5 rounded-full border border-white/10 px-2 py-0.5 text-[10px]" style={{ color: STATUS[selected.status].color }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS[selected.status].color }} />
                {STATUS[selected.status].label}
              </span>
            </div>
            <p className="mt-3 text-[12px] text-on-surface-variant">
              <span className="text-on-surface">Now:</span> {selected.task}
            </p>
            <p className="mt-1 text-[11px] text-on-surface-variant/70">Room: {ROOMS.find((r) => r.id === selected.room)?.name}</p>
            <div className="mt-3 flex gap-2">
              <button className="btn-accent !py-1.5 !text-xs">
                <MessageSquare size={13} /> Spark a chat
              </button>
              <button className="btn-ghost !py-1.5 !text-xs">Send back</button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-[12px] text-on-surface-variant/70">
        {AGENTS.length} agents on the floor across {ROOMS.length} rooms. Status mirrors the Task Board live activity: green is shipping work, violet is in standup, cyan is walking between rooms.
      </p>
    </div>
  )
}
