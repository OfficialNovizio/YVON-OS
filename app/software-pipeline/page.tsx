'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, PageHeader, StatusBadge, Avatar } from '@/components/ui'
import KaisRead from '@/components/KaisRead'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Github, ExternalLink, GitPullRequest, ShieldCheck, Plus } from 'lucide-react'

const projects = [
  { name: 'Idea-Feed MVP', status: 'needs you', tone: 'yellow' as const, progress: 72 },
  { name: 'By Design', status: 'needs work', tone: 'muted' as const, progress: 48 },
  { name: 'Canela Shop', status: 'in progress', tone: 'blue' as const, progress: 61 },
  { name: 'Mission Control', status: 'needs work', tone: 'muted' as const, progress: 35 },
  { name: 'Valhalla Tools', status: 'active', tone: 'green' as const, progress: 80 },
]

type Tone = 'yellow' | 'green' | 'muted' | 'blue'
type Col = { title: string; tone?: Tone; cards: { t: string; agent: string }[] }

const columns: Col[] = [
  { title: 'Triage', cards: [{ t: 'Onboarding tooltip overlaps shortcut', agent: 'NX' }, { t: 'Cart badge count on mobile', agent: 'NX' }] },
  { title: 'Planning', cards: [{ t: 'Stream counter on home, 4 subtasks', agent: 'NX' }, { t: 'Decision-queue keyboard shortcuts', agent: 'NX' }] },
  { title: 'In progress', tone: 'muted', cards: [{ t: 'Apple sign-in flow', agent: 'NX' }, { t: 'Shopify webhook retry', agent: 'NX' }] },
  { title: 'Steve QA', tone: 'blue', cards: [{ t: 'Brain search relevance tuning', agent: 'ST' }, { t: 'Venue CSV import validation', agent: 'ST' }] },
  { title: 'Needs review', tone: 'yellow', cards: [{ t: 'Voice-memo intake to structured idea', agent: 'NX' }] },
  { title: 'Done', tone: 'green', cards: [{ t: 'Push notification opt-in', agent: 'NX' }, { t: 'Discount-code field at checkout', agent: 'NX' }] },
]

const dotColor: Record<Tone, string> = {
  yellow: '#ffb693',
  green: '#4ade80',
  blue: '#abc7ff',
  muted: 'rgba(255,255,255,0.25)',
}

export default function SoftwarePipelinePage() {
  const { workspace } = useWorkspace()
  const [activeProduct, setActiveProduct] = useState<string | null>(null)

  return (
    <div>
      <PageHeader
        title="Software Pipeline"
        subtitle="The software factory. Nexus codes and opens PRs (never merges to main); Steve runs a mandatory QA gate; you do the final review. Connected to GitHub and Vercel."
        actions={
          <>
            <button className="btn-ghost">
              <Github size={15} /> Repo
            </button>
            <button className="btn-accent">
              <ExternalLink size={15} /> Vercel
            </button>
          </>
        }
      />

      {/* portfolio */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {projects.map((p) => (
          <Card key={p.name} hover className="p-4">
            <h3 className="mb-2 text-sm font-semibold text-on-surface">{p.name}</h3>
            <StatusBadge tone={p.tone}>{p.status}</StatusBadge>
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: 'var(--ws-accent)' }} />
              </div>
              <p className="mt-1 text-right text-[11px] text-on-surface-variant">{p.progress}%</p>
            </div>
          </Card>
        ))}
      </div>

      {/* QA gate explainer */}
      <Card className="mb-4 flex flex-wrap items-center gap-3 p-3 text-[12px] text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <GitPullRequest size={14} style={{ color: 'var(--ws-accent)' }} /> Nexus opens PRs only
        </span>
        <span className="text-on-surface-variant/40">-&gt;</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-300" /> Steve QA, fails loop back to Planning
        </span>
        <span className="text-on-surface-variant/40">-&gt;</span>
        <span className="flex items-center gap-1.5">
          <Avatar initials="ST" /> Your final review and merge
        </span>
      </Card>

      {/* kanban */}
      <div className="scroll-x flex gap-3 overflow-x-auto pb-2">
        {columns.map((col) => (
          <div key={col.title} className="kanban-col">
            <div className="mb-2.5 flex items-center justify-between px-1">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-on-surface">
                {col.tone && <span className="h-2 w-2 rounded-full" style={{ background: dotColor[col.tone] }} />}
                {col.title}
              </span>
              <span className="text-[11px] text-on-surface-variant">{col.cards.length}</span>
            </div>
            <div className="space-y-2.5">
              {col.cards.map((c) => (
                <div key={c.t} className="kanban-card">
                  <p className="text-[13px] leading-snug text-on-surface">{c.t}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <Avatar initials={c.agent} />
                    {col.title === 'Needs review' && <button className="btn-accent !px-3 !py-1 !text-[11px]">Review</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Right panel */}
      <div className="space-y-4">
        {/* Quick Actions */}
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-on-surface">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/idea-feed" className="btn-accent w-full !justify-center text-xs">
              <Plus size={14} /> New Idea
            </Link>
            <Link href="/decision-queue" className="btn-ghost w-full !justify-center text-xs">
              Review Queue
            </Link>
          </div>
        </Card>

        {/* KaisRead */}
        <KaisRead ventureSlug={workspace.key} variant="dark" context="software-pipeline" />

        {/* Filter by product */}
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold text-on-surface">Filter</h3>
          <div className="space-y-1.5">
            <button
              onClick={() => setActiveProduct(null)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                activeProduct === null ? 'bg-white/[0.08] text-on-surface' : 'text-on-surface-variant hover:bg-white/[0.04]'
              }`}
            >
              All products
            </button>
            {projects.map((p) => (
              <button
                key={p.name}
                onClick={() => setActiveProduct(p.name)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                  activeProduct === p.name
                    ? 'bg-white/[0.08] text-on-surface'
                    : 'text-on-surface-variant hover:bg-white/[0.04]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
