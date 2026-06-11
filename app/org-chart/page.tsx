'use client'

import { useState } from 'react'
import { PageHeader, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { MessageSquare, Terminal } from 'lucide-react'

type Node = { id: string; name: string; role: string; color: string }
type Tier = { title: string; sub: string; nodes: Node[] }

const TIERS: Tier[] = [
  { title: 'Personal Layer', sub: 'Serves you directly · cross-workspace', nodes: [
    { id: 'henry', name: 'Henry', role: 'Chief of Staff', color: '#abc7ff' },
    { id: 'nexus', name: 'Nexus', role: 'CTO', color: '#5ee0ff' },
    { id: 'steve', name: 'Steve', role: 'QA', color: '#4ade80' },
    { id: 'knox', name: 'Knox', role: 'Security', color: '#ff5a5f' },
    { id: 'wolf', name: 'Wolf', role: 'Finance', color: '#ffb693' },
  ] },
  { title: 'Workspace Tier', sub: 'Shared masters · serve every workspace', nodes: [
    { id: 'mrx', name: 'Mr. X', role: 'Master', color: '#9db5e7' },
    { id: 'william', name: 'William', role: 'Copywriting', color: '#9db5e7' },
    { id: 'leonardo', name: 'Leonardo', role: 'Image gen', color: '#9db5e7' },
    { id: 'ivy', name: 'Ivy', role: 'Research', color: '#9db5e7' },
    { id: 'isaac', name: 'Isaac', role: 'Trends', color: '#9db5e7' },
  ] },
  { title: 'Per-workspace teams', sub: 'Report to their workspace head', nodes: [
    { id: 'aria', name: 'Aria', role: 'Canela', color: '#5fd0b4' },
    { id: 'nyx', name: 'Nyx', role: 'Canela', color: '#5fd0b4' },
    { id: 'viola', name: 'Viola', role: 'By Design', color: '#5ee0ff' },
    { id: 'hana', name: 'Hana', role: 'By Design', color: '#5ee0ff' },
    { id: 'fenrir', name: 'Fenrir', role: 'Valhalla', color: '#c08bff' },
    { id: 'saga', name: 'Saga', role: 'Valhalla', color: '#c08bff' },
  ] },
  { title: 'Skill Workshop', sub: 'Continuously improves the masters', nodes: [
    { id: 'wx', name: "Mr. X's Workshop", role: 'Training', color: '#8b919f' },
    { id: 'ww', name: "William's Workshop", role: 'Training', color: '#8b919f' },
    { id: 'wl', name: "Leonardo's Workshop", role: 'Training', color: '#8b919f' },
  ] },
]

export default function OrgChartPage() {
  const [sel, setSel] = useState<Node | null>(null)
  return (
    <div>
      <PageHeader title="Org Chart" subtitle="The agent company — personal C-suite, shared masters, per-workspace teams, and the workshops that improve them." />
      <div className="space-y-3">
        {TIERS.map((t) => (
          <Card key={t.title} className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-on-surface">{t.title}</h3>
              <p className="text-[11px] text-on-surface-variant">{t.sub}</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {t.nodes.map((n) => (
                <button key={n.id} onClick={() => setSel(n)} className="glass-card-hover flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] py-2 pl-2 pr-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-black/80" style={{ background: n.color }}>{n.name.slice(0, 2)}</span>
                  <span className="text-left"><span className="block text-[12px] font-semibold text-on-surface">{n.name}</span><span className="block text-[10px] text-on-surface-variant">{n.role}</span></span>
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.name} subtitle={sel?.role}
        footer={<><button className="btn-ghost !py-1.5 !text-xs"><Terminal size={13} /> SSH</button><button className="btn-accent !py-1.5 !text-xs"><MessageSquare size={13} /> Spark a chat</button></>}>
        {sel && (
          <div className="space-y-2 text-[13px] text-on-surface-variant">
            <p><span className="text-on-surface">Status:</span> online</p>
            <p><span className="text-on-surface">Reports to:</span> Henry</p>
            <p><span className="text-on-surface">Memory access:</span> workspace + cross-WS</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
