'use client'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'
import type { AgentStatus } from '@/app/api/agent-status/route'
import { Brain, Code, Palette, Mail, TrendingUp, Shield } from 'lucide-react'

const SKILLS = [
  { name: 'Decision synthesis', agent: 'Marcus', level: 92, icon: Brain },
  { name: 'React component', agent: 'Mia', level: 88, icon: Palette },
  { name: 'Supabase queries', agent: 'Raj', level: 85, icon: Code },
  { name: 'TypeScript strict', agent: 'Dev', level: 90, icon: Code },
  { name: 'Copywriting', agent: 'Lena', level: 82, icon: Mail },
  { name: 'Trend analysis', agent: 'Kai', level: 78, icon: TrendingUp },
  { name: 'Security audit', agent: 'Quinn', level: 80, icon: Shield },
]

export default function SkillWorkshopPage() {
  const { data: agentData } = useLiveData<{ agents: AgentStatus[] }>({
    url: '/api/agent-status',
    pollIntervalMs: 30000,
  })
  const agentCount = agentData?.agents?.length ?? 13
  const activeCount = agentData?.agents?.filter(a => a.status === 'active').length ?? 7

  return (
    <div>
      <PageHeader
        title="Skill Workshop"
        subtitle={`${agentCount} agents, ${activeCount} active — training and calibrating the team.`}
        actions={<StatusBadge tone="blue">{SKILLS.length} skills tracked</StatusBadge>}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SKILLS.map((s) => (
          <Card key={s.name} className="p-4" hover>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                <s.icon size={16} style={{ color: 'var(--ws-accent)' }} />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-on-surface">{s.name}</h3>
                <p className="text-[11px] text-on-surface-variant">{s.agent}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${s.level}%`, background: 'var(--ws-accent)' }} />
              </div>
              <span className="text-[12px] font-mono text-on-surface-variant">{s.level}%</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
