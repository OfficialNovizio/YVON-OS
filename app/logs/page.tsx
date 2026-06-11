'use client'
import { useState } from 'react'
import { PageHeader, StatusBadge, Avatar, Card } from '@/components/ui'
const TYPES = ['All', 'Task', 'Post', 'Email', 'Security', 'Deploy']
type Log = { id: string; agent: string; type: string; tone: 'blue' | 'green' | 'red' | 'yellow' | 'muted'; text: string; time: string }
const LOGS: Log[] = [
  { id: 'l1', agent: 'KX', type: 'Security', tone: 'red', text: 'Stopped a credential leak, queued key rotation', time: '02:14' },
  { id: 'l2', agent: 'NX', type: 'Deploy', tone: 'blue', text: 'Opened PR #142 to GitHub', time: '03:09' },
  { id: 'l3', agent: 'LE', type: 'Task', tone: 'green', text: 'Rendered 8 post concepts', time: '04:51' },
  { id: 'l4', agent: 'WM', type: 'Email', tone: 'muted', text: 'Drafted reply to Maria Solano', time: '06:20' },
  { id: 'l5', agent: 'SC', type: 'Post', tone: 'yellow', text: 'Scheduled LinkedIn carousel for Thu 15:00', time: '07:02' },
  { id: 'l6', agent: 'IS', type: 'Task', tone: 'green', text: 'Flagged 4 new trends across workspaces', time: '07:40' },
]
export default function LogsPage() {
  const [filter, setFilter] = useState('All')
  const shown = LOGS.filter((l) => filter === 'All' || l.type === filter)
  return (
    <div>
      <PageHeader title="Logs" subtitle="System-wide activity and audit trail behind Live Activity and every approval gate." />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TYPES.map((t) => <button key={t} onClick={() => setFilter(t)} className="rounded-full border px-2.5 py-1 text-[11px] font-medium" style={filter === t ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' } : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }}>{t}</button>)}
      </div>
      <Card className="overflow-hidden p-0">
        {shown.map((l) => (
          <div key={l.id} className="flex items-center gap-3 border-b border-white/6 p-3 last:border-0">
            <span className="font-mono text-[11px] text-on-surface-variant">{l.time}</span>
            <Avatar initials={l.agent} />
            <span className="flex-1 text-[13px] text-on-surface">{l.text}</span>
            <StatusBadge tone={l.tone}>{l.type}</StatusBadge>
          </div>
        ))}
      </Card>
    </div>
  )
}
