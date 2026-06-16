'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { MessageSquare, Terminal, ArrowRight, Brain, Wrench, ChevronRight, ChevronDown, Users } from 'lucide-react'
import { useLiveData } from '@/lib/use-live-data'
import { useWorkspace } from '@/lib/WorkspaceContext'
import type { OrgChartAgent, OrgChartTier, OrgChartNode, WorkshopInfo } from '@/app/api/org-chart/route'

// ── Full fallback mock — all 24 agents, 9 department tiers ────────────────

const MOCK_AGENT = (id: string, name: string, role: string, dept: string, color: string,
  reportsTo: string, mem: string, tags: string[], lvl: number, st: string, skills: number): OrgChartAgent => ({
  id, name, role, department: dept, color,
  initials: name.length > 3 ? name.slice(0, 2).toUpperCase() : name.slice(0, 2),
  skillsCount: skills, memoryHealth: 50, level: lvl,
  status: st, reportsTo, memoryAccess: mem, workspaceTags: tags,
})

const MOCK_TIERS: OrgChartTier[] = [
  {
    title: 'Executive Office', sub: 'CEO · COO — serves you directly · 2 agents',
    agents: [
      MOCK_AGENT('marcus', 'Marcus', 'CEO', 'CEO', '#abc7ff', 'You', 'full — cross-workspace', ['all'], 1, 'active', 14),
      MOCK_AGENT('diana', 'Diana', 'COO', 'COO', '#5ee0ff', 'Marcus', 'full — cross-workspace', ['all'], 1, 'active', 23),
    ],
  },
  {
    title: 'Governance', sub: 'Board oversight & risk thresholds · 1 agent',
    agents: [
      MOCK_AGENT('board', 'Board', 'Board of Directors', 'Command', '#c084fc', 'You', 'oversight — cross-workspace', ['all'], 0, 'active', 0),
    ],
  },
  {
    title: 'Technology', sub: 'Everything that ships — build, deploy, QA · 4 agents',
    agents: [
      MOCK_AGENT('dev', 'Dev', 'Lead Developer', 'Technical', '#9db5e7', 'Diana', 'workspace + cross-WS', ['all'], 3, 'active', 22),
      MOCK_AGENT('raj', 'Raj', 'Backend Engineer', 'Technical', '#9db5e7', 'Dev', 'workspace + cross-WS', ['all'], 2, 'active', 15),
      MOCK_AGENT('mia', 'Mia', 'Frontend Engineer', 'Technical', '#9db5e7', 'Dev', 'workspace + cross-WS', ['all'], 2, 'active', 17),
      MOCK_AGENT('quinn', 'Quinn', 'QA Engineer', 'Technical', '#9db5e7', 'Dev', 'workspace + cross-WS', ['all'], 2, 'idle', 17),
    ],
  },
  {
    title: 'Marketing & Growth', sub: 'Revenue, brand, content, growth · 6 agents',
    agents: [
      MOCK_AGENT('lena', 'Lena', 'Brand Strategist', 'Marketing', '#5fd0b4', 'Diana', 'workspace-scoped', ['novizio', 'hourbour'], 3, 'active', 14),
      MOCK_AGENT('kai', 'Kai', 'Analyst', 'Marketing', '#5fd0b4', 'Lena', 'workspace-scoped', ['novizio', 'hourbour'], 3, 'active', 13),
      MOCK_AGENT('rio', 'Rio', 'Ads Manager', 'Marketing', '#5ee0ff', 'Lena', 'workspace-scoped', ['novizio', 'hourbour'], 2, 'active', 14),
      MOCK_AGENT('nate', 'Nate', 'Growth Hacker', 'Marketing', '#5ee0ff', 'Lena', 'workspace-scoped', ['novizio', 'hourbour'], 2, 'active', 11),
      MOCK_AGENT('atlas', 'Atlas', 'Art Director', 'Marketing', '#c08bff', 'Lena', 'workspace-scoped', ['novizio', 'hourbour'], 2, 'active', 13),
      MOCK_AGENT('pixel', 'Pixel', 'Production Artist', 'Marketing', '#c08bff', 'Atlas', 'workspace-scoped', ['novizio', 'hourbour'], 2, 'idle', 12),
    ],
  },
  {
    title: 'Finance', sub: 'Financial intelligence & planning · 1 agent',
    agents: [
      MOCK_AGENT('felix', 'Felix', 'Financial Intelligence', 'Finance', '#fbbf24', 'Diana', 'workspace-scoped', ['novizio', 'hourbour'], 3, 'active', 16),
    ],
  },
  {
    title: 'Legal & Compliance', sub: 'Compliance, contracts, guard rails · 3 agents',
    agents: [
      MOCK_AGENT('comply', 'Comply', 'Compliance Officer', 'Legal', '#f59e0b', 'Diana', 'workspace-scoped', ['novizio', 'hourbour'], 2, 'active', 8),
      MOCK_AGENT('guard', 'Guard', 'Legal Guardian', 'Legal', '#f59e0b', 'Comply', 'workspace-scoped', ['novizio', 'hourbour'], 2, 'active', 6),
      MOCK_AGENT('docs', 'Docs', 'Documentation & Contracts', 'Legal', '#f59e0b', 'Comply', 'workspace-scoped', ['novizio', 'hourbour'], 2, 'active', 5),
    ],
  },
  {
    title: 'Psychology', sub: 'Behavioral validation & cognitive bias review · 1 agent',
    agents: [
      MOCK_AGENT('Daniel_Kahneman', 'Kahneman', 'Cognitive Bias Validator', 'Psychology', '#ffb693', 'Diana', 'cross-workspace validator', ['all'], 3, 'active', 12),
    ],
  },
  {
    title: 'Research', sub: 'Deep research, synthesis, fact-checking · 3 agents',
    agents: [
      MOCK_AGENT('depth', 'Depth', 'Deep Researcher', 'Research', '#a78bfa', 'Diana', 'cross-workspace', ['all'], 2, 'active', 10),
      MOCK_AGENT('synth', 'Synth', 'Synthesis', 'Research', '#a78bfa', 'Depth', 'cross-workspace', ['all'], 2, 'active', 8),
      MOCK_AGENT('vette', 'Vette', 'Fact-Checker', 'Research', '#a78bfa', 'Depth', 'cross-workspace', ['all'], 2, 'active', 7),
    ],
  },
  {
    title: 'Sense & Monitoring', sub: 'Detection, reconnaissance, tooling · 3 agents',
    agents: [
      MOCK_AGENT('forge', 'Forge', 'Toolsmith', 'Sense', '#34d399', 'Diana', 'cross-workspace', ['all'], 2, 'active', 9),
      MOCK_AGENT('radar', 'Radar', 'Monitoring', 'Sense', '#34d399', 'Forge', 'cross-workspace', ['all'], 2, 'active', 6),
      MOCK_AGENT('scout', 'Scout', 'Reconnaissance', 'Sense', '#34d399', 'Forge', 'cross-workspace', ['all'], 2, 'active', 5),
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

const MOCK_RESPONSE = { tiers: MOCK_TIERS, totalAgents: 24, departments: 9, workshops: MOCK_WORKSHOPS, tree: null as any }

// ── Status dot ────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  active: 'bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]',
  idle: 'bg-amber-400',
  offline: 'bg-neutral-600',
}

// ── Reporting line connector colors ──────────────────────────────────────────

const REPORTING_COLORS: Record<string, string> = {
  'You': '#ffffff',
  'Marcus': '#abc7ff',
  'Diana': '#5ee0ff',
  'Dev': '#9db5e7',
  'Lena': '#5fd0b4',
  'Atlas': '#c08bff',
  'Comply': '#f59e0b',
  'Depth': '#a78bfa',
  'Forge': '#34d399',
}

// ── Pages ─────────────────────────────────────────────────────────────────────

export default function OrgChartPage() {
  const { workspace } = useWorkspace()
  const activeVenture = workspace.key
  const ventureLabel = workspace.name
  const [sel, setSel] = useState<OrgChartAgent | null>(null)
  const [view, setView] = useState<'tiers' | 'tree'>('tiers')

  const { data, loading } = useLiveData<{
    tiers: OrgChartTier[]; totalAgents: number; departments: number; workshops: WorkshopInfo[]; tree: OrgChartNode
  }>({
    url: '/api/org-chart',
    mockData: MOCK_RESPONSE,
  })

  const tiers = data?.tiers ?? []
  const workshops = data?.workshops ?? []
  const totalAgents = data?.totalAgents ?? 0
  const departments = data?.departments ?? 0
  const tree = data?.tree

  // ── Agent card (shared) ──

  function AgentCard({ agent, compact }: { agent: OrgChartAgent; compact?: boolean }) {
    return (
      <button
        onClick={() => setSel(agent)}
        className={`glass-card-hover flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] py-2 pl-2 pr-4 ${compact ? '!py-1.5 !pl-1.5 !pr-2.5' : ''}`}
      >
        <span
          className={`flex items-center justify-center rounded-full text-[11px] font-bold text-black/80 ${compact ? 'h-6 w-6 !text-[9px]' : 'h-8 w-8'}`}
          style={{ background: agent.color }}
        >
          {agent.initials || agent.name.slice(0, 2)}
        </span>
        <span className="text-left">
          <span className="flex items-center gap-1.5">
            <span className={`block font-semibold text-on-surface ${compact ? 'text-[11px]' : 'text-[12px]'}`}>{agent.name}</span>
            <span className={`inline-block rounded-full ${STATUS_DOT[agent.status] || STATUS_DOT.idle} ${compact ? 'w-1 h-1' : 'w-1.5 h-1.5'}`} />
          </span>
          <span className={`block text-on-surface-variant ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
            {agent.role}{agent.skillsCount > 0 && ` · ${agent.skillsCount} skills`}
          </span>
        </span>
      </button>
    )
  }

  // ── Tree node (recursive) ──

  function TreeNode({ node, depth = 0 }: { node: OrgChartNode; depth?: number }) {
    const [expanded, setExpanded] = useState(depth < 3) // auto-expand top 3 levels
    const hasChildren = node.children && node.children.length > 0
    const agent = node.agent

    return (
      <div className="ml-0">
        <div className="flex items-center gap-1.5 group">
          {/* Connector line */}
          {depth > 0 && (
            <div className="flex items-center">
              <div className="w-4 h-px opacity-30" style={{ background: REPORTING_COLORS[agent.reportsTo] || '#ffffff40' }} />
            </div>
          )}

          {/* Expand/collapse */}
          {hasChildren ? (
            <button onClick={() => setExpanded(!expanded)} className="p-0.5 rounded hover:bg-white/10 transition-colors">
              {expanded ? <ChevronDown size={12} className="text-on-surface-variant/50" /> : <ChevronRight size={12} className="text-on-surface-variant/50" />}
            </button>
          ) : (
            <span className="w-5" />
          )}

          <AgentCard agent={agent} compact={depth > 1} />

          {/* Reports-to tag */}
          {depth > 0 && (
            <span className="text-[9px] text-on-surface-variant/30 hidden group-hover:inline transition-opacity">
              → {agent.reportsTo}
            </span>
          )}
        </div>

        {hasChildren && expanded && (
          <div className="ml-5 border-l border-white/[0.06] pl-4 pt-1 pb-1 space-y-1">
            {node.children.map(child => (
              <TreeNode key={child.agent.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Loading state ──

  if (loading && totalAgents === 0) {
    return (
      <div>
        <PageHeader title="Org Chart" subtitle="Loading agent structure…" />
        <div className="flex items-center justify-center h-48 text-on-surface-variant">Loading agents…</div>
      </div>
    )
  }

  // ── Render ──

  return (
    <div>
      <PageHeader
        title="Org Chart"
        subtitle={`${totalAgents} agents across ${departments} departments · active venture: ${ventureLabel}`}
      />

      {/* ── View toggle ── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setView('tiers')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${view === 'tiers' ? 'bg-white/10 text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <Users size={13} className="inline mr-1.5" />
          Department View
        </button>
        <button
          onClick={() => setView('tree')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${view === 'tree' ? 'bg-white/10 text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <ChevronRight size={13} className="inline mr-1.5" />
          Tree View
        </button>
      </div>

      {/* ── TIERS VIEW (department cards) ── */}
      {view === 'tiers' && (
        <div className="space-y-3">
          {tiers.map(t => (
            <Card key={t.title} className="p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-on-surface">{t.title}</h3>
                <p className="text-[11px] text-on-surface-variant">{t.sub}</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {t.agents.map(a => <AgentCard key={a.id} agent={a} />)}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── TREE VIEW (hierarchical) ── */}
      {view === 'tree' && tree && (
        <Card className="p-6">
          <div className="mb-4 pb-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-on-surface">Company Hierarchy</h3>
            <p className="text-[11px] text-on-surface-variant">Reporting lines · click to expand/collapse departments</p>
          </div>
          <TreeNode node={tree} depth={0} />

          {/* Board — peer of Marcus, shown separately */}
          {tiers.find(t => t.title === 'Governance')?.agents.map(a => (
            <div key={a.id} className="mt-3 pt-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-on-surface-variant/40 italic w-16 text-right pr-2">governance</span>
                <AgentCard agent={a} />
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* ── Skill Workshops ── */}
      {workshops.length > 0 && (
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
            {workshops.map(ws => (
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
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <p><span className="text-on-surface">Status:</span> <span className="inline-flex items-center gap-1"><span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[sel.status]}`} />{sel.status}</span></p>
              <p><span className="text-on-surface">Reports to:</span> {sel.reportsTo}</p>
              <p><span className="text-on-surface">Department:</span> {sel.department}</p>
              <p><span className="text-on-surface">Level:</span> {sel.level}</p>
              <p><span className="text-on-surface">Skills:</span> {sel.skillsCount}</p>
              <p><span className="text-on-surface">Memory:</span> {sel.memoryHealth}%</p>
            </div>
            <p><span className="text-on-surface">Memory access:</span> {sel.memoryAccess}</p>
            {sel.workspaceTags.length > 0 && (
              <p>
                <span className="text-on-surface">Workspaces:</span>{' '}
                {sel.workspaceTags.map(tag => (
                  <span key={tag} className="inline-block mr-1 px-1.5 py-0.5 rounded bg-white/10 text-[11px]">
                    {tag === 'all' ? '🌐 all' : tag}
                  </span>
                ))}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
