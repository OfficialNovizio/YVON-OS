'use client'

import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import Link from 'next/link'
import { PageHeader } from '@/components/ui'
import { Brain, ArrowRight } from 'lucide-react'
import { useLiveData } from '@/lib/use-live-data'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { OrgChartNodeCard } from './_OrgChartNodeCard'
import { AgentActionSheet } from './_AgentActionSheet'
import type { OrgChartNode, WorkshopInfo } from '@/app/api/org-chart/route'

// ── Full fallback mock tree — all 24 agents ────────────────────

const MOCK_AGENT = (id: string, name: string, role: string, dept: string, color: string,
  reportsTo: string, mem: string, tags: string[], lvl: number, st: string, skills: number) => ({
  id, name, role, department: dept, color,
  initials: name.length > 3 ? name.slice(0, 2).toUpperCase() : name.slice(0, 2),
  skillsCount: skills, memoryHealth: 50, level: lvl,
  status: st, reportsTo, memoryAccess: mem, workspaceTags: tags,
})

const MOCK_TREE: OrgChartNode = {
  agent: MOCK_AGENT('marcus', 'Marcus', 'CEO', 'CEO', '#abc7ff', 'You', 'full', ['all'], 1, 'active', 14),
  children: [{
    agent: MOCK_AGENT('diana', 'Diana', 'COO', 'COO', '#5ee0ff', 'Marcus', 'full', ['all'], 1, 'active', 23),
    children: [
      {
        agent: MOCK_AGENT('dev', 'Dev', 'Lead Developer', 'Technical', '#9db5e7', 'Diana', 'cross-WS', ['all'], 3, 'active', 22),
        children: [
          { agent: MOCK_AGENT('raj', 'Raj', 'Backend', 'Technical', '#9db5e7', 'Dev', 'cross-WS', ['all'], 2, 'active', 15), children: [] },
          { agent: MOCK_AGENT('mia', 'Mia', 'Frontend', 'Technical', '#9db5e7', 'Dev', 'cross-WS', ['all'], 2, 'active', 17), children: [] },
          { agent: MOCK_AGENT('quinn', 'Quinn', 'QA', 'Technical', '#9db5e7', 'Dev', 'cross-WS', ['all'], 2, 'idle', 17), children: [] },
        ],
      },
      {
        agent: MOCK_AGENT('lena', 'Lena', 'Brand Strategist', 'Marketing', '#5fd0b4', 'Diana', 'workspace', ['novizio', 'hourbour'], 3, 'active', 14),
        children: [
          { agent: MOCK_AGENT('kai', 'Kai', 'Analyst', 'Marketing', '#5fd0b4', 'Lena', 'workspace', ['novizio', 'hourbour'], 3, 'active', 13), children: [] },
          { agent: MOCK_AGENT('rio', 'Rio', 'Ads Manager', 'Marketing', '#5ee0ff', 'Lena', 'workspace', ['novizio', 'hourbour'], 2, 'active', 14), children: [] },
          { agent: MOCK_AGENT('nate', 'Nate', 'Growth', 'Marketing', '#5ee0ff', 'Lena', 'workspace', ['novizio', 'hourbour'], 2, 'active', 11), children: [] },
          {
            agent: MOCK_AGENT('atlas', 'Atlas', 'Art Director', 'Marketing', '#c08bff', 'Lena', 'workspace', ['novizio', 'hourbour'], 2, 'active', 13),
            children: [
              { agent: MOCK_AGENT('pixel', 'Pixel', 'Production', 'Marketing', '#c08bff', 'Atlas', 'workspace', ['novizio', 'hourbour'], 2, 'idle', 12), children: [] },
            ],
          },
        ],
      },
      { agent: MOCK_AGENT('felix', 'Felix', 'Finance', 'Finance', '#fbbf24', 'Diana', 'workspace', ['novizio', 'hourbour'], 3, 'active', 16), children: [] },
      {
        agent: MOCK_AGENT('comply', 'Comply', 'Compliance', 'Legal', '#f59e0b', 'Diana', 'workspace', ['novizio', 'hourbour'], 2, 'active', 8),
        children: [
          { agent: MOCK_AGENT('guard', 'Guard', 'Legal Guardian', 'Legal', '#f59e0b', 'Comply', 'workspace', ['novizio', 'hourbour'], 2, 'active', 6), children: [] },
          { agent: MOCK_AGENT('docs', 'Docs', 'Documentation', 'Legal', '#f59e0b', 'Comply', 'workspace', ['novizio', 'hourbour'], 2, 'active', 5), children: [] },
        ],
      },
      { agent: MOCK_AGENT('Daniel_Kahneman', 'Kahneman', 'Bias Validator', 'Psychology', '#ffb693', 'Diana', 'cross-WS', ['all'], 3, 'active', 12), children: [] },
      {
        agent: MOCK_AGENT('depth', 'Depth', 'Deep Research', 'Research', '#a78bfa', 'Diana', 'cross-WS', ['all'], 2, 'active', 10),
        children: [
          { agent: MOCK_AGENT('synth', 'Synth', 'Synthesis', 'Research', '#a78bfa', 'Depth', 'cross-WS', ['all'], 2, 'active', 8), children: [] },
          { agent: MOCK_AGENT('vette', 'Vette', 'Fact-Check', 'Research', '#a78bfa', 'Depth', 'cross-WS', ['all'], 2, 'active', 7), children: [] },
        ],
      },
      {
        agent: MOCK_AGENT('forge', 'Forge', 'Toolsmith', 'Sense', '#34d399', 'Diana', 'cross-WS', ['all'], 2, 'active', 9),
        children: [
          { agent: MOCK_AGENT('radar', 'Radar', 'Monitoring', 'Sense', '#34d399', 'Forge', 'cross-WS', ['all'], 2, 'active', 6), children: [] },
          { agent: MOCK_AGENT('scout', 'Scout', 'Recon', 'Sense', '#34d399', 'Forge', 'cross-WS', ['all'], 2, 'active', 5), children: [] },
        ],
      },
    ],
  }],
}

const MOCK_WORKSHOPS: WorkshopInfo[] = [
  { id: 'william', name: "William's Workshop", icon: '✍️', color: '#a78bfa', improving: 'Copywriting & brand voice', agentIds: ['lena', 'rio', 'nate'] },
  { id: 'leonardo', name: "Leonardo's Workshop", icon: '🎨', color: '#f472b6', improving: 'Image generation & brand kit', agentIds: ['atlas', 'pixel', 'mia'] },
  { id: 'isaac', name: "Isaac's Workshop", icon: '🔬', color: '#34d399', improving: 'Research quality & sources', agentIds: ['kai', 'depth', 'synth', 'vette'] },
  { id: 'nexus', name: "Nexus's Workshop", icon: '💻', color: '#60a5fa', improving: 'Code quality & PR reviews', agentIds: ['dev', 'raj', 'quinn'] },
  { id: 'lena-ws', name: "Lena's Workshop", icon: '💫', color: '#fbbf24', improving: 'Brand strategy & tone', agentIds: ['lena', 'diana'] },
  { id: 'kai-ws', name: "Kai's Workshop", icon: '📊', color: '#fb923c', improving: 'Analytics & intelligence', agentIds: ['kai', 'felix'] },
]

const MOCK_RESPONSE = { tree: MOCK_TREE, totalAgents: 24, departments: 9, workshops: MOCK_WORKSHOPS }

// ── Page ──────────────────────────────────────────────────────────

export default function OrgChartPage() {
  const { workspace } = useWorkspace()
  const ventureLabel = workspace.name
  const [selectedAgent, setSelectedAgent] = useState<OrgChartNode | null>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  const { data, loading } = useLiveData<{
    tree: OrgChartNode; totalAgents: number; departments: number; workshops: WorkshopInfo[]
  }>({
    url: '/api/org-chart',
    mockData: MOCK_RESPONSE,
  })

  const tree = data?.tree ?? MOCK_TREE
  const workshops = data?.workshops ?? []
  const totalAgents = data?.totalAgents ?? 24
  const departments = data?.departments ?? 9

  // ── GSAP: title entrance ──
  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(titleRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      )
    }
  }, [loading])

  // ── GSAP: board card entrance ──
  useEffect(() => {
    if (boardRef.current && !loading) {
      gsap.fromTo(boardRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: 'power3.out' }
      )
    }
  }, [loading])

  // ── Count agents recursively ──
  function countTree(node: OrgChartNode): number {
    return 1 + node.children.reduce((sum, c) => sum + countTree(c), 0)
  }

  if (loading && !data) {
    return (
      <div>
        <PageHeader title="Org Chart" subtitle="Loading company structure…" />
        <div className="flex items-center justify-center h-48 text-on-surface-variant text-[13px]">
          Building company tree…
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <div ref={titleRef}>
        <PageHeader
          title="Org Chart"
          subtitle={`${totalAgents} agents · ${departments} departments · ${ventureLabel}`}
        />
      </div>

      {/* ── Tree container ── */}
      <div className="mt-6 overflow-x-auto pb-8">
        <div className="flex flex-col items-center min-w-[900px] px-8">

          {/* ── FOUNDER ── */}
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-2 mb-1">
              <span className="text-[13px] font-bold text-on-surface">YOU</span>
              <span className="ml-2 text-[10px] text-on-surface-variant/50">Founder</span>
            </div>
            <svg className="w-px h-5" viewBox="0 0 2 20" preserveAspectRatio="none">
              <line x1="1" y1="0" x2="1" y2="20" stroke="#ffffff30" strokeWidth="1.5" />
            </svg>
          </div>

          {/* ── CEO → COO → Departments ── */}
          <OrgChartNodeCard
            node={tree}
            depth={0}
            index={0}
            totalInLevel={1}
            onSelect={setSelectedAgent}
            selectedId={selectedAgent?.agent.id ?? null}
          />

          {/* ── BOARD ── (peer of Marcus, independent oversight) ── */}
          <div ref={boardRef} className="mt-6 flex flex-col items-center opacity-0">
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-purple-500/20 bg-purple-500/[0.03] px-5 py-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-black/90 bg-[#c084fc]">
                BD
              </span>
              <div>
                <span className="text-[12px] font-semibold text-on-surface">Board</span>
                <span className="ml-2 text-[9px] text-on-surface-variant/40">Governance</span>
              </div>
            </div>
            <p className="mt-1 text-[9px] text-on-surface-variant/30">Independent oversight · reports to You</p>
          </div>
        </div>
      </div>

      {/* ── Workshops section ── */}
      {workshops.length > 0 && (
        <div className="mt-12 border-t border-white/[0.04] pt-10 px-8 max-w-5xl mx-auto">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-on-surface">Skill Workshops</h2>
            <p className="mt-1 text-[12px] text-on-surface-variant">
              Where agents train — each workshop improves a specific capability
              <Link href="/skill-workshop" className="ml-2 inline-flex items-center gap-1 text-[11px] font-medium"
                style={{ color: 'var(--ws-accent)' }}>
                Open all <ArrowRight size={10} />
              </Link>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workshops.map(ws => (
              <Link key={ws.id} href={`/skill-workshop?workshop=${ws.id}`}>
                <div className="group rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] p-4 transition-colors cursor-pointer h-full">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="text-lg">{ws.icon}</span>
                    <div>
                      <h4 className="text-[13px] font-semibold text-on-surface">{ws.name}</h4>
                      <p className="text-[11px] text-on-surface-variant">{ws.improving}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    {ws.agentIds.slice(0, 4).map((aid, i) => (
                      <span key={i} className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-black/80"
                        style={{ background: ws.color, opacity: 0.3 + i * 0.15 }}>
                        {aid.slice(0, 2).toUpperCase()}
                      </span>
                    ))}
                    {ws.agentIds.length > 4 && (
                      <span className="text-[10px] text-on-surface-variant/40">+{ws.agentIds.length - 4}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Brain size={10} className="text-on-surface-variant/30" />
                    <span className="text-[10px] text-on-surface-variant/40">
                      {ws.agentIds.length} agent{ws.agentIds.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Action sheet ── */}
      <AgentActionSheet
        agent={selectedAgent?.agent ?? null}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  )
}
