'use client'

import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Server, Cpu, MemoryStick, Network, Clock, Monitor, Terminal as TerminalIcon, MonitorPlay, HardDrive } from 'lucide-react'
import { useLiveData } from '@/lib/use-live-data'

type Machine = { name: string; role: string; status: string; tone: 'blue' | 'green' | 'muted' }

type HardwareStats = {
  machines: Machine[]
  stats: { machines: number; agents: number; ramUsed: string; ramTotal: string; gateway: string; cpus: number; uptime: number; hostname: string }
}

type FleetAgent = { name: string; role: string }

type FleetMachine = {
  name: string
  role: string
  status: 'online' | 'cooling' | 'offline'
  cpu: string
  ram: string
  agents: FleetAgent[]
}

type FleetStats = {
  machinesOnline: number
  totalRam: string
  agentsRunning: number
}

const MOCK_MACHINES: Machine[] = [
  { name: 'Mac Mini 2 — Hermes', role: 'Personal layer · routing gateway', status: 'routing', tone: 'blue' },
  { name: 'Mac Mini 1 — OpenClaw', role: 'Workspace tier · production work', status: 'active', tone: 'green' },
  { name: 'Mac Mini 3 — Workshop', role: 'Skill training · makes the team better', status: 'idle', tone: 'muted' },
  { name: 'Mac Studio M5 — reserved', role: 'Future capacity', status: 'idle', tone: 'muted' },
]

const MOCK_STATS = { machines: 4, agents: 23, ramUsed: '48 GB', ramTotal: '64 GB', gateway: 'Hermes', cpus: 12, uptime: 72, hostname: 'mac-mini-2' }

// ── Fleet mock data ──────────────────────────────────────────────

const MOCK_FLEET_MACHINES: FleetMachine[] = [
  {
    name: 'Mac Mini 1',
    role: 'Workspace tier · production work',
    status: 'online',
    cpu: 'M2 Pro · 10-core',
    ram: '32 GB',
    agents: [
      { name: 'Dev', role: 'Lead Developer' },
      { name: 'Raj', role: 'Backend Engineer' },
      { name: 'Mia', role: 'Frontend Engineer' },
      { name: 'Quinn', role: 'QA Engineer' },
    ],
  },
  {
    name: 'Mac Mini 2',
    role: 'Personal layer · routing gateway',
    status: 'online',
    cpu: 'M2 · 8-core',
    ram: '16 GB',
    agents: [
      { name: 'Marcus', role: 'CEO' },
      { name: 'Diana', role: 'COO' },
      { name: 'Felix', role: 'Finance Officer' },
    ],
  },
  {
    name: 'Mac Mini 3',
    role: 'Skill training · workshop runner',
    status: 'cooling',
    cpu: 'M2 · 8-core',
    ram: '16 GB',
    agents: [
      { name: 'Workshop', role: 'Training pipeline' },
    ],
  },
  {
    name: 'Mac Studio M5',
    role: 'Future capacity · reserved',
    status: 'offline',
    cpu: 'M2 Ultra · 24-core',
    ram: '64 GB',
    agents: [],
  },
]

const MOCK_FLEET_STATS: FleetStats = {
  machinesOnline: 2,
  totalRam: '128 GB',
  agentsRunning: 8,
}

const FLEET_STATUS_MAP: Record<string, { color: string; label: string; dot: string }> = {
  online:  { color: 'emerald', label: 'Online',  dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]' },
  cooling: { color: 'amber',  label: 'Cooling', dot: 'bg-amber-400' },
  offline: { color: 'slate',  label: 'Offline', dot: 'bg-neutral-500' },
}

// ── Page ─────────────────────────────────────────────────────────

export default function HardwarePage() {
  const { data } = useLiveData<HardwareStats>({
    url: '/api/hardware',
    mockData: { machines: MOCK_MACHINES, stats: MOCK_STATS },
    pollIntervalMs: 30000,
  })

  const machines = data?.machines ?? MOCK_MACHINES
  const s = data?.stats ?? MOCK_STATS

  const STATS = [
    ['Machines', String(s.machines), Server],
    ['Agents', String(s.agents), Cpu],
    ['RAM', `${s.ramUsed} / ${s.ramTotal}`, MemoryStick],
    ['Gateway', s.gateway, Network],
    ['CPUs', String(s.cpus), Cpu],
    ['Uptime', `${s.uptime}h`, Clock],
  ] as const

  // ── Fleet derived ──
  const fleetOnline = MOCK_FLEET_MACHINES.filter(m => m.status === 'online').length
  const fleetTotalRam = MOCK_FLEET_MACHINES.reduce((sum, m) => sum + parseInt(m.ram || '0'), 0)
  const fleetAgents = MOCK_FLEET_MACHINES.reduce((sum, m) => sum + m.agents.length, 0)

  return (
    <div>
      <PageHeader title="Hardware & Runtime" subtitle="The machines and runtime — Mac minis, the Hermes gateway, and live system telemetry." />

      {/* ── Summary stat cards ── */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map(([k, v, Icon]) => (
          <Card key={k} className="p-4">
            <div className="mb-2 flex items-center gap-2 text-on-surface-variant">
              <Icon size={15} style={{ color: 'var(--ws-accent)' }} />
              <span className="text-[12px]">{k}</span>
            </div>
            <p className="text-2xl font-bold text-on-surface">{v}</p>
          </Card>
        ))}
      </div>

      {/* ── Existing machine list ── */}
      <div className="space-y-3">
        {machines.map((m) => (
          <Card key={m.name} hover className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5"><Server size={18} style={{ color: 'var(--ws-accent)' }} /></div>
            <div className="flex-1"><h3 className="text-sm font-semibold text-on-surface">{m.name}</h3><p className="text-[12px] text-on-surface-variant">{m.role}</p></div>
            <StatusBadge tone={m.tone}>{m.status}</StatusBadge>
            <button className="btn-ghost !py-1.5 !text-xs">SSH</button>
            <button className="btn-ghost !py-1.5 !text-xs">Screen share</button>
          </Card>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          FLEET VIEW
          ════════════════════════════════════════════════════════════ */}
      <div className="mt-10">
        {/* Fleet section header */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-on-surface">Fleet</h2>
          <p className="mt-1 text-[13px] text-on-surface-variant">Per-machine detail — agent assignments, hardware specs, and remote access.</p>
        </div>

        {/* Fleet summary stats */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2 text-on-surface-variant">
              <Monitor size={15} style={{ color: 'var(--ws-accent)' }} />
              <span className="text-[12px]">Machines online</span>
            </div>
            <p className="text-2xl font-bold text-on-surface">
              {fleetOnline}
              <span className="text-sm font-normal text-on-surface-variant"> / {MOCK_FLEET_MACHINES.length}</span>
            </p>
          </Card>
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2 text-on-surface-variant">
              <MemoryStick size={15} style={{ color: 'var(--ws-accent)' }} />
              <span className="text-[12px]">Total RAM</span>
            </div>
            <p className="text-2xl font-bold text-on-surface">{fleetTotalRam} GB</p>
          </Card>
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2 text-on-surface-variant">
              <Cpu size={15} style={{ color: 'var(--ws-accent)' }} />
              <span className="text-[12px]">Agents running</span>
            </div>
            <p className="text-2xl font-bold text-on-surface">{fleetAgents}</p>
          </Card>
        </div>

        {/* Fleet machine cards */}
        <div className="space-y-3">
          {MOCK_FLEET_MACHINES.map((m) => {
            const statusInfo = FLEET_STATUS_MAP[m.status]
            return (
              <Card key={m.name} className="p-4">
                {/* Machine header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                      <HardDrive size={18} style={{ color: 'var(--ws-accent)' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-on-surface">{m.name}</h3>
                        <span className={`inline-block h-2 w-2 rounded-full ${statusInfo.dot}`} />
                        <span className="text-[11px] text-on-surface-variant">{statusInfo.label}</span>
                      </div>
                      <p className="text-[12px] text-on-surface-variant">{m.role}</p>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    <button className="btn-ghost !py-1.5 !text-xs"><TerminalIcon size={13} /> SSH</button>
                    <button className="btn-ghost !py-1.5 !text-xs"><MonitorPlay size={13} /> Screen share</button>
                  </div>
                </div>

                {/* Specs row */}
                <div className="mt-3 flex items-center gap-4 border-t border-white/6 pt-3">
                  <div className="flex items-center gap-1.5 text-[12px] text-on-surface-variant">
                    <Cpu size={13} />
                    <span>{m.cpu}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-on-surface-variant">
                    <MemoryStick size={13} />
                    <span>{m.ram}</span>
                  </div>
                </div>

                {/* Agent list */}
                {m.agents.length > 0 && (
                  <div className="mt-3 border-t border-white/6 pt-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant/60">Agents on this machine</p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.agents.map((a) => (
                        <span
                          key={a.name}
                          className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-on-surface"
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold">
                            {a.name.slice(0, 2)}
                          </span>
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty agent state */}
                {m.agents.length === 0 && (
                  <div className="mt-3 border-t border-white/6 pt-3">
                    <p className="text-[11px] italic text-on-surface-variant/50">No agents assigned</p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
