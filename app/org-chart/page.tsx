'use client'

import { useState } from 'react'
import { PageHeader, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { MessageSquare, Terminal } from 'lucide-react'
import { useLiveData } from '@/lib/use-live-data'
import type { OrgChartAgent, OrgChartTier, OrgChartResponse } from '@/app/api/org-chart/route'

const MOCK_TIERS: OrgChartTier[] = [
  {
    title: 'Personal Layer', sub: 'Serves you directly · cross-workspace', agents: [
      { id: 'marcus', name: 'Marcus', role: 'CEO', department: 'Command', color: '#abc7ff', avatar: '/avatars/agents/marcus-ceo.svg', workspaceTags: ['all'], status: 'active', reportsTo: 'You', memoryAccess: 'full — cross-workspace' },
      { id: 'diana', name: 'Diana', role: 'COO', department: 'Command', color: '#5ee0ff', avatar: '/avatars/agents/diana-coo.svg', workspaceTags: ['all'], status: 'active', reportsTo: 'Marcus', memoryAccess: 'full — cross-workspace' },
    ],
  },
  {
    title: 'Workspace Masters', sub: 'Shared masters · serve every workspace', agents: [
      { id: 'dev', name: 'Dev', role: 'Lead Developer', department: 'Technical', color: '#9db5e7', avatar: '/avatars/agents/dev-lead.svg', workspaceTags: ['all'], status: 'active', reportsTo: 'Diana', memoryAccess: 'workspace + cross-WS' },
      { id: 'raj', name: 'Raj', role: 'Backend Engineer', department: 'Technical', color: '#9db5e7', avatar: '/avatars/agents/raj-backend.svg', workspaceTags: ['all'], status: 'active', reportsTo: 'Dev', memoryAccess: 'workspace + cross-WS' },
      { id: 'mia', name: 'Mia', role: 'Frontend Engineer', department: 'Technical', color: '#9db5e7', avatar: '/avatars/agents/mia-frontend.svg', workspaceTags: ['all'], status: 'active', reportsTo: 'Dev', memoryAccess: 'workspace + cross-WS' },
      { id: 'quinn', name: 'Quinn', role: 'QA Engineer', department: 'Technical', color: '#9db5e7', avatar: '/avatars/agents/quinn-qa.svg', workspaceTags: ['all'], status: 'idle', reportsTo: 'Dev', memoryAccess: 'workspace + cross-WS' },
    ],
  },
  {
    title: 'Venture Teams', sub: 'Report to their workspace head', agents: [
      { id: 'kai', name: 'Kai', role: 'Analyst', department: 'Marketing', color: '#5fd0b4', avatar: '/avatars/agents/kai-analyst.svg', workspaceTags: ['novizio', 'hourbour'], status: 'active', reportsTo: 'Lena', memoryAccess: 'workspace-scoped' },
      { id: 'lena', name: 'Lena', role: 'Brand Strategist', department: 'Marketing', color: '#5fd0b4', avatar: '/avatars/agents/lena-brand.svg', workspaceTags: ['novizio', 'hourbour'], status: 'active', reportsTo: 'Diana', memoryAccess: 'workspace-scoped' },
      { id: 'rio', name: 'Rio', role: 'Ads Manager', department: 'Marketing', color: '#5ee0ff', avatar: '/avatars/agents/rio-ads.svg', workspaceTags: ['novizio', 'hourbour'], status: 'active', reportsTo: 'Lena', memoryAccess: 'workspace-scoped' },
      { id: 'nate', name: 'Nate', role: 'Growth Hacker', department: 'Marketing', color: '#5ee0ff', avatar: '/avatars/agents/nate-growth.svg', workspaceTags: ['novizio', 'hourbour'], status: 'active', reportsTo: 'Lena', memoryAccess: 'workspace-scoped' },
      { id: 'atlas', name: 'Atlas', role: 'Art Director', department: 'Marketing', color: '#c08bff', avatar: '/avatars/agents/atlas-art-director.svg', workspaceTags: ['novizio', 'hourbour'], status: 'active', reportsTo: 'Lena', memoryAccess: 'workspace-scoped' },
      { id: 'pixel', name: 'Pixel', role: 'Production', department: 'Marketing', color: '#c08bff', avatar: '/avatars/agents/pixel-production.svg', workspaceTags: ['novizio', 'hourbour'], status: 'idle', reportsTo: 'Atlas', memoryAccess: 'workspace-scoped' },
    ],
  },
  {
    title: 'Skill Workshops', sub: 'Continuously improves the masters', agents: [
      { id: 'felix', name: 'Felix', role: 'Finance Officer', department: 'Finance', color: '#8b919f', avatar: '/avatars/agents/felix-finance.svg', workspaceTags: ['all'], status: 'active', reportsTo: 'Diana', memoryAccess: 'full — cross-workspace' },
    ],
  },
]

const STATUS_DOT: Record<string, string> = {
  active: 'bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]',
  idle: 'bg-amber-400',
  offline: 'bg-neutral-600',
}

export default function OrgChartPage() {
  const [sel, setSel] = useState<OrgChartAgent | null>(null)

  const { data } = useLiveData<OrgChartResponse>({
    url: '/api/org-chart',
    mockData: { tiers: MOCK_TIERS, totalAgents: 13, departments: 4 },
  })

  const tiers = data?.tiers ?? []

  return (
    <div>
      <PageHeader title="Org Chart" subtitle="The agent company — personal C-suite, shared masters, per-workspace teams, and the workshops that improve them." />
      <div className="space-y-3">
        {tiers.map((t) => (
          <Card key={t.title} className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-on-surface">{t.title}</h3>
              <p className="text-[11px] text-on-surface-variant">{t.sub}</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {t.agents.map((a) => (
                <button key={a.id} onClick={() => setSel(a)} className="glass-card-hover flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] py-2 pl-2 pr-4">
                  {a.avatar ? (
                    <img src={a.avatar} alt={a.name} className="h-8 w-8 rounded-full" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-black/80" style={{ background: a.color }}>{a.name.slice(0, 2)}</span>
                  )}
                  <span className="text-left">
                    <span className="flex items-center gap-1.5">
                      <span className="block text-[12px] font-semibold text-on-surface">{a.name}</span>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[a.status]}`} />
                    </span>
                    <span className="block text-[10px] text-on-surface-variant">{a.role}</span>
                  </span>
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
            <p><span className="text-on-surface">Status:</span> {sel.status}</p>
            <p><span className="text-on-surface">Reports to:</span> {sel.reportsTo}</p>
            <p><span className="text-on-surface">Memory access:</span> {sel.memoryAccess}</p>
            {sel.workspaceTags.length > 0 && (
              <p>
                <span className="text-on-surface">Workspaces:</span>{' '}
                {sel.workspaceTags.map((tag) => (
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
