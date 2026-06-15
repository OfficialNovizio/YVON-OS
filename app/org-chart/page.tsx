'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { MessageSquare, Terminal, ArrowRight, Brain, Wrench } from 'lucide-react'
import { useLiveData } from '@/lib/use-live-data'
import { useWorkspace } from '@/lib/WorkspaceContext'
import type { OrgChartAgent, OrgChartTier, WorkshopInfo } from '@/app/api/org-chart/route'

// ── Fallback mock data (shows while API loads or on error) ────────────────

const MOCK_TIERS: OrgChartTier[] = [
  {
    title: 'Personal Layer', sub: 'Serves you directly · cross-workspace',
    agents: [
      { id: 'marcus', name: 'Marcus', role: 'CEO', department: 'CEO', color: '#abc7ff', initials: 'MC', workspaceTags: ['all'], status: 'active', reportsTo: 'You', memoryAccess: 'full — cross-workspace', skillsCount: 14, memoryHealth: 41, level: 1 },
      { id: 'diana', name: 'Diana', role: 'COO', department: 'COO', color: '#5ee0ff', initials: 'DC', workspaceTags: ['all'], status: 'active', reportsTo: 'Marcus', memoryAccess: 'full — cross-workspace', skillsCount: 23, memoryHealth: 35, level: 1 },
    ],
  },
  {
    title: 'Workspace Masters', sub: 'Shared masters · serve every workspace',
    agents: [
      { id: 'dev', name: 'Dev', role: 'Lead Developer', department: 'Technical', color: '#9db5e7', initials: 'DV', workspaceTags: ['all'], status: 'active', reportsTo: 'Diana', memoryAccess: 'workspace + cross-WS', skillsCount: 22, memoryHealth: 24, level: 3 },
      { id: 'raj', name: 'Raj', role: 'Backend Engineer', department: 'Technical', color: '#9db5e7', initials: 'RJ', workspaceTags: ['all'], status: 'active', reportsTo: 'Dev', memoryAccess: 'workspace + cross-WS', skillsCount: 15, memoryHealth: 24, level: 2 },
      { id: 'mia', name: 'Mia', role: 'Frontend Engineer', department: 'Technical', color: '#9db5e7', initials: 'MI', workspaceTags: ['all'], status: 'active', reportsTo: 'Dev', memoryAccess: 'workspace + cross-WS', skillsCount: 17, memoryHealth: 27, level: 2 },
      { id: 'quinn', name: 'Quinn', role: 'QA Engineer', department: 'Technical', color: '#9db5e7', initials: 'QN', workspaceTags: ['all'], status: 'idle', reportsTo: 'Dev', memoryAccess: 'workspace + cross-WS', skillsCount: 17, memoryHealth: 18, level: 2 },
    ],
  },
  {
    title: 'Venture Teams', sub: 'Per-workspace teams · marketing & growth',
    agents: [
      { id: 'kai', name: 'Kai', role: 'Analyst', department: 'Marketing', color: '#5fd0b4', initials: 'KA', workspaceTags: ['novizio', 'hourbour'], status: 'active', reportsTo: 'Lena', memoryAccess: 'workspace-scoped', skillsCount: 13, memoryHealth: 39, level: 3 },
      { id: 'lena', name: 'Lena', role: 'Brand Strategist', department: 'Marketing', color: '#5fd0b4', initials: 'LN', workspaceTags: ['novizio', 'hourbour'], status: 'active', reportsTo: 'Diana', memoryAccess: 'workspace-scoped', skillsCount: 14, memoryHealth: 34, level: 3 },
      { id: 'rio', name: 'Rio', role: 'Ads Manager', department: 'Marketing', color: '#5ee0ff', initials: 'RO', workspaceTags: ['novizio', 'hourbour'], status: 'active', reportsTo: 'Lena', memoryAccess: 'workspace-scoped', skillsCount: 14, memoryHealth: 19, level: 2 },
      { id: 'nate', name: 'Nate', role: 'Growth Hacker', department: 'Marketing', color: '#5ee0ff', initials: 'NT', workspaceTags: ['novizio', 'hourbour'], status: 'active', reportsTo: 'Lena', memoryAccess: 'workspace-scoped', skillsCount: 11, memoryHealth: 32, level: 2 },
      { id: 'atlas', name: 'Atlas', role: 'Art Director', department: 'Marketing', color: '#c08bff', initials: 'AT', workspaceTags: ['novizio', 'hourbour'], status: 'active', reportsTo: 'Lena', memoryAccess: 'workspace-scoped', skillsCount: 13, memoryHealth: 16, level: 2 },
      { id: 'pixel', name: 'Pixel', role: 'Production', department: 'Marketing', color: '#c08bff', initials: 'PX', workspaceTags: ['novizio', 'hourbour'], status: 'idle', reportsTo: 'Atlas', memoryAccess: 'workspace-scoped', skillsCount: 12, memoryHealth: 15, level: 2 },
    ],
  },
]

const MOCK_WORKSHOPS: WorkshopInfo[] = [
  { id: 'william', name: "William's Workshop", icon: '✍️', color: '#a78bfa', improving: 'Copywriting & brand voice', agentIds: ['lena', 'rio', 'nate'] },
  { id: 'leonardo', name: "Leonardo's Workshop", icon: '🎨', color: '#f472b6', improving: 'Image generation & brand kit', agentIds: ['atlas', 'pixel', 'mia'] },
  { id: 'isaac', name: "Isaac's Workshop", icon: '🔬', color: '#34d399', improving: 'Research quality & sources', agentIds: ['kai', 'depth', 'synth', 'vette'] },
  { id: 'nexus', name: "Nexus's Workshop", icon: '💻', color: '#60a5fa', improving: 'Code quality & PR reviews', agentIds: ['dev', 'raj', 'quinn'] },
  { id: 'lena-ws', name: "Lena's Workshop", icon: '💫', color: '#fbbf24', improving: 'Brand strategy & tone', agentIds: ['lena', 'diana'] },
  { id: 'kai-ws', name: "Kai's Workshop", icon: '📊', color: '#fb923c', improving: 'Analytics & intelligence', agentIds: ['kai', 'felix'] },
]

const MOCK_RESPONSE = { tiers: MOCK_TIERS, totalAgents: 12, departments: 4, workshops: MOCK_WORKSHOPS }

// ── Status dot ────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  active: 'bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]',
  idle: 'bg-amber-400',
  offline: 'bg-neutral-600',
}

const WS_BORDER: Record<string, string> = {
  novizio: 'border-l-[3px] border-l-[#a78bfa]',
  hourbour: 'border-l-[3px] border-l-[#2dd4bf]',
}

// ── Page ───────────────────────────────────────────────────────────────

export default function OrgChartPage() {
  const { workspace } = useWorkspace()
  const activeVenture = workspace.key // 'novizio' | 'hourbour'
  const [sel, setSel] = useState<OrgChartAgent | null>(null)

  const { data, loading } = useLiveData<{
    tiers: OrgChartTier[]; totalAgents: number; departments: number; workshops: WorkshopInfo[]
  }>({
    url: '/api/org-chart',
    mockData: MOCK_RESPONSE,
  })

  const rawTiers = data?.tiers ?? []
  const rawWorkshops = data?.workshops ?? []
  const departments = data?.departments ?? 0

  // Filter agents by active venture
  const ventureTiers = rawTiers
    .filter(t => t.title === 'Venture Teams')
    .map(t => ({
      ...t,
      agents: t.agents.filter(a =>
        a.workspaceTags.includes('all') || a.workspaceTags.includes(activeVenture)
      ),
    }))
    .filter(t => t.agents.length > 0)

  // Non-venture tiers: show all (they're cross-workspace)
  const mainTiers = rawTiers.filter(t => t.title !== 'Venture Teams' && t.title !== 'Skill Workshops')
  const workshopTier = rawTiers.find(t => t.title === 'Skill Workshops')

  // Count total visible agents
  const allVisible = [
    ...mainTiers.flatMap(t => t.agents),
    ...ventureTiers.flatMap(t => t.agents),
  ]
  const totalAgents = allVisible.length

  const ventureLabel = workspace.name // 'Novizio' | 'Hourbour'

  function AgentCard({ agent }: { agent: OrgChartAgent }) {
    return (
      <button
        onClick={() => setSel(agent)}
        className="glass-card-hover flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] py-2 pl-2 pr-4"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-black/80"
          style={{ background: agent.color }}
        >
          {agent.initials || agent.name.slice(0, 2)}
        </span>
        <span className="text-left">
          <span className="flex items-center gap-1.5">
            <span className="block text-[12px] font-semibold text-on-surface">{agent.name}</span>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[agent.status]}`} />
          </span>
          <span className="block text-[10px] text-on-surface-variant">
            {agent.role} {agent.skillsCount > 0 && `· ${agent.skillsCount} skills`}
          </span>
        </span>
      </button>
    )
  }

  if (loading && totalAgents === 0) {
    return (
      <div>
        <PageHeader title="Org Chart" subtitle={`Loading agent structure for ${ventureLabel}…`} />
        <div className="flex items-center justify-center h-48 text-on-surface-variant">Loading agents…</div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Org Chart"
        subtitle={`${totalAgents} agents across ${departments} departments · active venture: ${ventureLabel}`}
      />

      <div className="space-y-3">
        {/* ── Main tiers: Personal Layer, Workspace Masters, Specialized ── */}
        {mainTiers.map(t => (
          <Card key={t.title} className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-on-surface">{t.title}</h3>
              <p className="text-[11px] text-on-surface-variant">
                {t.sub} · {t.agents.length} agent{t.agents.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {t.agents.map(a => <AgentCard key={a.id} agent={a} />)}
            </div>
          </Card>
        ))}

        {/* ── Venture Teams — color-coded per active venture ── */}
        {ventureTiers.map(t => (
          <Card key={t.title} className="overflow-hidden p-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-on-surface">{t.title}</h3>
              <p className="text-[11px] text-on-surface-variant">{t.sub} · {t.agents.length} agents</p>
            </div>

            <div className={`rounded-lg border border-white/5 bg-white/[0.01] p-3 ${WS_BORDER[activeVenture] || ''}`}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: activeVenture === 'novizio' ? '#a78bfa' : '#2dd4bf' }}>
                {ventureLabel} Team
              </p>
              <div className="flex flex-wrap gap-2.5">
                {t.agents.map(a => <AgentCard key={`${activeVenture}-${a.id}`} agent={a} />)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Skill Workshops ── */}
      {rawWorkshops.length > 0 && (
        <div className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-on-surface">Skill Workshops</h2>
            <p className="mt-1 text-[13px] text-on-surface-variant">
              Where agents get better — each workshop trains a specific capability.
              <Link href="/skill-workshop" className="ml-2 inline-flex items-center gap-1 text-[12px] font-medium"
                style={{ color: 'var(--ws-accent)' }}>
                Open full workshop <ArrowRight size={11} />
              </Link>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rawWorkshops.map(ws => (
              <Link key={ws.id} href={`/skill-workshop?workshop=${ws.id}`}>
                <Card hover className="p-4 h-full">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="text-lg leading-none">{ws.icon}</span>
                    <div>
                      <h4 className="text-[13px] font-semibold text-on-surface">{ws.name}</h4>
                      <p className="text-[11px] text-on-surface-variant">{ws.improving}</p>
                    </div>
                  </div>
                  <div className="mb-3 flex items-center gap-1.5">
                    {ws.agentIds.slice(0, 4).map((aid, i) => (
                      <span key={i} className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-black/80"
                        style={{ background: ws.color, opacity: 0.3 + (i * 0.15) }}>
                        {aid.slice(0, 2).toUpperCase()}
                      </span>
                    ))}
                    {ws.agentIds.length > 4 && (
                      <span className="text-[10px] text-on-surface-variant/50">+{ws.agentIds.length - 4}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Brain size={11} className="text-on-surface-variant/40" />
                    <span className="text-[11px] text-on-surface-variant/50">
                      {ws.agentIds.length} agent{ws.agentIds.length !== 1 ? 's' : ''} training
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Agent detail modal ── */}
      <Modal
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel?.name}
        subtitle={`${sel?.role} · ${sel?.department}`}
        footer={
          <div className="flex gap-2">
            <button className="btn-ghost !py-1.5 !text-xs"><Terminal size={13} /> SSH</button>
            <button className="btn-ghost !py-1.5 !text-xs"><MessageSquare size={13} /> Chat</button>
            {sel && (
              <Link href={`/skill-workshop?workshop=${sel.department.toLowerCase()}`}
                className="btn-accent !py-1.5 !text-xs inline-flex items-center gap-1">
                <Wrench size={13} /> Open Workshop
              </Link>
            )}
          </div>
        }
      >
        {sel && (
          <div className="space-y-2 text-[13px] text-on-surface-variant">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-black/80"
                style={{ background: sel.color }}>
                {sel.initials || sel.name.slice(0, 2)}
              </span>
              <div>
                <p className="text-on-surface font-semibold">{sel.name}</p>
                <p className="text-[11px]">{sel.role}</p>
              </div>
            </div>
            <p><span className="text-on-surface">Status:</span> {sel.status}</p>
            <p><span className="text-on-surface">Reports to:</span> {sel.reportsTo}</p>
            <p><span className="text-on-surface">Memory access:</span> {sel.memoryAccess}</p>
            <p><span className="text-on-surface">Skills:</span> {sel.skillsCount}</p>
            <p><span className="text-on-surface">Level:</span> {sel.level}</p>
            {sel.workspaceTags.length > 0 && (
              <p>
                <span className="text-on-surface">Workspaces:</span>{' '}
                {sel.workspaceTags.map(tag => (
                  <span key={tag} className="inline-block mr-1 px-1.5 py-0.5 rounded bg-white/10 text-[11px]">{tag}</span>
                ))}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
