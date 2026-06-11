import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Server, Cpu, MemoryStick, Network } from 'lucide-react'
const STATS = [['Machines', '3', Server], ['Agents', '23', Cpu], ['RAM used', '48 GB', MemoryStick], ['Gateway', 'Hermes', Network]] as const
const MACHINES = [
  { name: 'Mac Mini 2 — Hermes', role: 'Personal layer · routing gateway', status: 'routing', tone: 'blue' as const },
  { name: 'Mac Mini 1 — OpenClaw', role: 'Workspace tier · production work', status: 'active', tone: 'green' as const },
  { name: 'Mac Mini 3 — Workshop', role: 'Skill training · makes the team better', status: 'idle', tone: 'muted' as const },
  { name: 'Mac Studio M5 — reserved', role: 'Future capacity', status: 'idle', tone: 'muted' as const },
]
export default function HardwarePage() {
  return (
    <div>
      <PageHeader title="Hardware & Runtime" subtitle="The machines and runtime — Mac minis, the Hermes gateway, and the archived OpenClaw reference." />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map(([k, v, Icon]) => (<Card key={k} className="p-4"><div className="mb-2 flex items-center gap-2 text-on-surface-variant"><Icon size={15} style={{ color: 'var(--ws-accent)' }} /><span className="text-[12px]">{k}</span></div><p className="text-2xl font-bold text-on-surface">{v}</p></Card>))}
      </div>
      <div className="space-y-3">
        {MACHINES.map((m) => (
          <Card key={m.name} hover className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5"><Server size={18} style={{ color: 'var(--ws-accent)' }} /></div>
            <div className="flex-1"><h3 className="text-sm font-semibold text-on-surface">{m.name}</h3><p className="text-[12px] text-on-surface-variant">{m.role}</p></div>
            <StatusBadge tone={m.tone}>{m.status}</StatusBadge>
            <button className="btn-ghost !py-1.5 !text-xs">SSH</button>
            <button className="btn-ghost !py-1.5 !text-xs">Screen share</button>
          </Card>
        ))}
      </div>
    </div>
  )
}
