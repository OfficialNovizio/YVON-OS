'use client'

import { Users, UserCircle } from 'lucide-react'
import type { AgentAssignment } from '@/lib/council-preflight'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentInfo {
  id: string
  initials: string
  name: string
  role: string
  department: string
  color: string
}

type AgentStatus = 'active' | 'assigned' | 'idle'

interface AgentRoomProps {
  assignments: AgentAssignment[]
  activeAgent?: string | null
  isMobile?: boolean
}

// ─── Agent Registry ───────────────────────────────────────────────────────────

const ALL_AGENTS: AgentInfo[] = [
  // Command
  { id: 'marcus-ceo', initials: 'MC', name: 'Marcus', role: 'CEO', department: 'Command', color: '#abc7ff' },
  { id: 'diana-coo', initials: 'DC', name: 'Diana', role: 'COO', department: 'Command', color: '#5ee0ff' },
  { id: 'board-command', initials: 'BR', name: 'Board', role: 'Governance', department: 'Command', color: '#c084fc' },
  // Finance
  { id: 'felix-finance', initials: 'FX', name: 'Felix', role: 'CFO', department: 'Finance', color: '#5fd0b4' },
  // Marketing
  { id: 'kai-marketing', initials: 'KA', name: 'Kai', role: 'CMO', department: 'Marketing', color: '#c08bff' },
  { id: 'lena-marketing', initials: 'LN', name: 'Lena', role: 'Brand', department: 'Marketing', color: '#f472b6' },
  { id: 'nate-marketing', initials: 'NT', name: 'Nate', role: 'Growth', department: 'Marketing', color: '#34d399' },
  { id: 'rio-marketing', initials: 'RO', name: 'Rio', role: 'Ads', department: 'Marketing', color: '#facc15' },
  { id: 'atlas-marketing', initials: 'AT', name: 'Atlas', role: 'Art', department: 'Marketing', color: '#e879f9' },
  { id: 'pixel-marketing', initials: 'PX', name: 'Pixel', role: 'Production', department: 'Marketing', color: '#22d3ee' },
  // Psychology
  { id: 'kahneman-psychology', initials: 'KN', name: 'Kahneman', role: 'Bias Audit', department: 'Psychology', color: '#ffb693' },
  // Legal
  { id: 'comply-legal', initials: 'CP', name: 'Comply', role: 'Compliance', department: 'Legal', color: '#fb923c' },
  { id: 'docs-legal', initials: 'DC', name: 'Docs', role: 'Docs Officer', department: 'Legal', color: '#fbbf24' },
  { id: 'guard-legal', initials: 'GD', name: 'Guard', role: 'IP Protection', department: 'Legal', color: '#f87171' },
  // Research
  { id: 'depth-research', initials: 'DP', name: 'Depth', role: 'Deep Research', department: 'Research', color: '#a78bfa' },
  { id: 'synth-research', initials: 'SY', name: 'Synth', role: 'Synthesis', department: 'Research', color: '#818cf8' },
  { id: 'vette-research', initials: 'VT', name: 'Vette', role: 'Fact Check', department: 'Research', color: '#6366f1' },
  // Sense
  { id: 'forge-sense', initials: 'FG', name: 'Forge', role: 'Discovery', department: 'Sense', color: '#14b8a6' },
  { id: 'radar-sense', initials: 'RD', name: 'Radar', role: 'Intel', department: 'Sense', color: '#06b6d4' },
  { id: 'scout-sense', initials: 'SC', name: 'Scout', role: 'Tools', department: 'Sense', color: '#0ea5e9' },
  // Technical
  { id: 'dev-technical', initials: 'DV', name: 'Dev', role: 'Tech Lead', department: 'Technical', color: '#3b82f6' },
  { id: 'mia-technical', initials: 'MI', name: 'Mia', role: 'Frontend', department: 'Technical', color: '#ec4899' },
  { id: 'raj-technical', initials: 'RJ', name: 'Raj', role: 'Backend', department: 'Technical', color: '#f97316' },
  { id: 'quinn-technical', initials: 'QN', name: 'Quinn', role: 'QA', department: 'Technical', color: '#84cc16' },
]

// ─── Council default members ──────────────────────────────────────────────────

const COUNCIL_IDS = ['marcus-ceo', 'diana-coo', 'felix-finance', 'kai-marketing', 'kahneman-psychology']

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgentRoom({ assignments, activeAgent, isMobile }: AgentRoomProps) {
  // Build status map
  const statusMap: Record<string, AgentStatus> = {}

  // Active agent (currently streaming)
  if (activeAgent) {
    statusMap[activeAgent] = 'active'
  }

  // Assigned agents
  for (const a of assignments) {
    if (!statusMap[a.agentId] || statusMap[a.agentId] !== 'active') {
      statusMap[a.agentId] = 'assigned'
    }
  }

  // Council members always show as assigned (they're always available)
  for (const id of COUNCIL_IDS) {
    if (!statusMap[id]) {
      statusMap[id] = 'idle'
    }
  }

  // Group agents by department
  const departments = groupBy(ALL_AGENTS, 'department')
  const deptOrder = ['Command', 'Finance', 'Marketing', 'Technical', 'Psychology', 'Legal', 'Research', 'Sense']

  // Mobile: compact scrollable row
  if (isMobile) {
    return (
      <div className="glass-card p-3">
        <div className="mb-2 flex items-center gap-2">
          <Users size={13} style={{ color: 'var(--ws-accent)' }} />
          <span className="text-[12px] font-semibold text-on-surface">Agent Room</span>
          <span className="text-[10px] text-on-surface-variant ml-auto">
            {Object.values(statusMap).filter(s => s === 'active').length} active
          </span>
        </div>
        <div className="flex overflow-x-auto gap-2 pb-1 -mx-1 px-1 no-scrollbar">
          {/* Council row */}
          {COUNCIL_IDS.map(id => {
            const agent = ALL_AGENTS.find(a => a.id === id)
            if (!agent) return null
            return <AgentChip key={id} agent={agent} status={statusMap[id] || 'idle'} compact />
          })}
        </div>
        {assignments.some(a => !COUNCIL_IDS.includes(a.agentId)) && (
          <div className="flex overflow-x-auto gap-2 pb-1 mt-1 -mx-1 px-1 no-scrollbar">
            {assignments.filter(a => !COUNCIL_IDS.includes(a.agentId)).map(a => {
              const agent = ALL_AGENTS.find(ag => ag.id === a.agentId)
              if (!agent) return null
              return <AgentChip key={a.agentId} agent={agent} status={statusMap[a.agentId] || 'assigned'} compact />
            })}
          </div>
        )}
      </div>
    )
  }

  // Desktop: full department layout
  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Users size={15} style={{ color: 'var(--ws-accent)' }} />
        <span className="text-[13px] font-semibold text-on-surface">Agent Room</span>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-on-surface-variant">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-400" /> Active</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400" /> Assigned</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-white/20" /> Idle</span>
        </div>
      </div>

      {/* Council — always visible */}
      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50 mb-2">
          Council
        </p>
        <div className="flex flex-wrap gap-2">
          {COUNCIL_IDS.map(id => {
            const agent = ALL_AGENTS.find(a => a.id === id)
            if (!agent) return null
            return <AgentChip key={id} agent={agent} status={statusMap[id] || 'idle'} />
          })}
        </div>
      </div>

      {/* Assigned specialists (if any) */}
      {assignments.some(a => !COUNCIL_IDS.includes(a.agentId)) && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50 mb-2">
            Assigned Specialists
          </p>
          <div className="flex flex-wrap gap-2">
            {assignments.filter(a => !COUNCIL_IDS.includes(a.agentId)).map(a => {
              const agent = ALL_AGENTS.find(ag => ag.id === a.agentId)
              if (!agent) return null
              return <AgentChip key={a.agentId} agent={agent} status={statusMap[a.agentId] || 'assigned'} reason={a.reason} />
            })}
          </div>
        </div>
      )}

      {/* All departments */}
      {deptOrder.map(dept => {
        const agents = departments[dept] || []
        if (agents.length === 0) return null
        return (
          <div key={dept} className="mb-2 last:mb-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/40 mb-1.5">
              {dept}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {agents.map(agent => (
                <AgentChip key={agent.id} agent={agent} status={statusMap[agent.id] || 'idle'} small />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Agent Chip ───────────────────────────────────────────────────────────────

function AgentChip({ agent, status, reason, compact, small }: {
  agent: AgentInfo
  status: AgentStatus
  reason?: string
  compact?: boolean
  small?: boolean
}) {
  const statusDot = status === 'active'
    ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]'
    : status === 'assigned'
      ? 'bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.3)]'
      : 'bg-white/15'

  if (compact) {
    return (
      <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] px-2 py-1.5"
        title={`${agent.name} — ${agent.role}${reason ? ` · ${reason}` : ''}`}>
        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-black/80"
          style={{ background: agent.color }}>
          {agent.initials}
        </span>
        <span className="text-[10px] font-medium text-on-surface-variant">{agent.name}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
      </div>
    )
  }

  if (small) {
    return (
      <div className="flex items-center gap-1.5 rounded-md bg-white/[0.02] px-2 py-1"
        title={`${agent.name} — ${agent.role}${reason ? ` · ${reason}` : ''}`}>
        <span className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-black/80"
          style={{ background: agent.color }}>
          {agent.initials}
        </span>
        <span className="text-[10px] text-on-surface-variant/70">{agent.name}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.05] px-2.5 py-1.5 hover:bg-white/[0.05] transition-colors"
      title={reason || `${agent.name} — ${agent.role}`}>
      <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-black/80"
        style={{ background: agent.color }}>
        {agent.initials}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-on-surface leading-tight">{agent.name}</p>
        <p className="text-[9px] text-on-surface-variant/60 leading-tight">{agent.role}</p>
      </div>
      <span className={`ml-auto h-2 w-2 shrink-0 rounded-full ${statusDot}`} />
    </div>
  )
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const group = String(item[key])
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {} as Record<string, T[]>)
}
