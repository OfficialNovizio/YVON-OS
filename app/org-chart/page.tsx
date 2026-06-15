'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { MessageSquare, Terminal, Sparkles, ArrowRight, Brain, Wrench } from 'lucide-react'
import { useLiveData } from '@/lib/use-live-data'
import type { OrgChartAgent, OrgChartTier, WorkshopInfo } from '@/app/api/org-chart/route'

// ── Status dot ────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  active: 'bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]',
  idle: 'bg-amber-400',
  offline: 'bg-neutral-600',
}

// ── Workspace border colors ────────────────────────────────────────────

const WS_BORDER: Record<string, string> = {
  novizio: 'border-l-[3px] border-l-[#a78bfa]',
  hourbour: 'border-l-[3px] border-l-[#2dd4bf]',
}

// ── Page ───────────────────────────────────────────────────────────────

export default function OrgChartPage() {
  const [sel, setSel] = useState<OrgChartAgent | null>(null)

  const { data, loading } = useLiveData<{
    tiers: OrgChartTier[]; totalAgents: number; departments: number; workshops: WorkshopInfo[]
  }>({
    url: '/api/org-chart',
  })

  const tiers = data?.tiers ?? []
  const workshops = data?.workshops ?? []
  const totalAgents = data?.totalAgents ?? 0

  const ventureTiers = tiers.filter(t => t.title === 'Venture Teams')
  const mainTiers = tiers.filter(t => t.title !== 'Venture Teams' && t.title !== 'Skill Workshops')
  const workshopTier = tiers.find(t => t.title === 'Skill Workshops')

  // ── Agent card (reusable) ──────────────────────────────────────────
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
          {agent.initials}
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

  if (loading) {
    return (
      <div>
        <PageHeader title="Org Chart" subtitle="Loading agent structure..." />
        <div className="flex items-center justify-center h-48 text-on-surface-variant">Loading…</div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Org Chart"
        subtitle={`${totalAgents} agents across ${data?.departments ?? 0} departments — the full agent company. Click any agent for details.`}
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

        {/* ── Venture Teams — color-coded per workspace ── */}
        {ventureTiers.map(t => (
          <Card key={t.title} className="overflow-hidden p-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-on-surface">{t.title}</h3>
              <p className="text-[11px] text-on-surface-variant">{t.sub}</p>
            </div>

            {/* Novizio team */}
            <div className={`mb-3 rounded-lg border border-white/5 bg-white/[0.01] p-3 ${WS_BORDER.novizio}`}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#a78bfa]">Novizio Team</p>
              <div className="flex flex-wrap gap-2.5">
                {t.agents.map(a => <AgentCard key={`novizio-${a.id}`} agent={a} />)}
              </div>
            </div>

            {/* Hourbour team */}
            <div className={`rounded-lg border border-white/5 bg-white/[0.01] p-3 ${WS_BORDER.hourbour}`}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#2dd4bf]">Hourbour Team</p>
              <div className="flex flex-wrap gap-2.5">
                {t.agents.map(a => <AgentCard key={`hourbour-${a.id}`} agent={a} />)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          SKILL WORKSHOP TIER — connected to /skill-workshop
          ════════════════════════════════════════════════════════════════ */}
      {workshops.length > 0 && (
        <div className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-on-surface">Skill Workshops</h2>
            <p className="mt-1 text-[13px] text-on-surface-variant">
              Where agents get better — each workshop trains a specific capability.
              <Link href="/skill-workshop" className="ml-2 inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: 'var(--ws-accent)' }}>
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
                      <span
                        key={i}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-black/80"
                        style={{ background: ws.color, opacity: 0.3 + (i * 0.15) }}
                      >
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
            <button className="btn-ghost !py-1.5 !text-xs">
              <Terminal size={13} /> SSH
            </button>
            <button className="btn-ghost !py-1.5 !text-xs">
              <MessageSquare size={13} /> Chat
            </button>
            {sel && (
              <Link
                href={`/skill-workshop?workshop=${sel.department.toLowerCase()}`}
                className="btn-accent !py-1.5 !text-xs inline-flex items-center gap-1"
              >
                <Wrench size={13} /> Open Workshop
              </Link>
            )}
          </div>
        }
      >
        {sel && (
          <div className="space-y-2 text-[13px] text-on-surface-variant">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-black/80"
                style={{ background: sel.color }}
              >
                {sel.initials}
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
                  <span key={tag} className="inline-block mr-1 px-1.5 py-0.5 rounded bg-white/10 text-[11px]">
                    {tag}
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
