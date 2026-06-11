'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, PageHeader, StatusBadge, Avatar } from '@/components/ui'
import KaisRead from '@/components/KaisRead'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Github, ExternalLink, GitPullRequest, ShieldCheck, Plus, FileText } from 'lucide-react'

const projects = [
  { name: 'Idea-Feed MVP', status: 'needs you', tone: 'yellow' as const, progress: 72 },
  { name: 'By Design', status: 'needs work', tone: 'muted' as const, progress: 48 },
  { name: 'Canela Shop', status: 'in progress', tone: 'blue' as const, progress: 61 },
  { name: 'Mission Control', status: 'needs work', tone: 'muted' as const, progress: 35 },
  { name: 'Valhalla Tools', status: 'active', tone: 'green' as const, progress: 80 },
]

type Tone = 'yellow' | 'green' | 'muted' | 'blue'

interface KanbanCard {
  id: string
  t: string
  agent: string
}

interface KanbanColumn {
  key: string
  title: string
  tone?: Tone
  cards: KanbanCard[]
}

const initialColumns: KanbanColumn[] = [
  {
    key: 'triage',
    title: 'Triage',
    cards: [
      { id: 't1', t: 'Onboarding tooltip overlaps shortcut', agent: 'NX' },
      { id: 't2', t: 'Cart badge count on mobile', agent: 'NX' },
    ],
  },
  {
    key: 'planning',
    title: 'Planning',
    cards: [
      { id: 'p1', t: 'Stream counter on home, 4 subtasks', agent: 'NX' },
      { id: 'p2', t: 'Decision-queue keyboard shortcuts', agent: 'NX' },
    ],
  },
  {
    key: 'backlog',
    title: 'Backlog',
    tone: 'muted',
    cards: [
      { id: 'b1', t: 'Dark mode toggle for dashboard', agent: 'NX' },
    ],
  },
  {
    key: 'in-progress',
    title: 'In progress',
    tone: 'muted',
    cards: [
      { id: 'ip1', t: 'Apple sign-in flow', agent: 'NX' },
      { id: 'ip2', t: 'Shopify webhook retry', agent: 'NX' },
    ],
  },
  {
    key: 'steve-qa',
    title: 'Steve QA',
    tone: 'blue',
    cards: [
      { id: 'sq1', t: 'Brain search relevance tuning', agent: 'ST' },
      { id: 'sq2', t: 'Venue CSV import validation', agent: 'ST' },
    ],
  },
  {
    key: 'needs-review',
    title: 'Needs review',
    tone: 'yellow',
    cards: [
      { id: 'nr1', t: 'Voice-memo intake to structured idea', agent: 'NX' },
    ],
  },
  {
    key: 'done',
    title: 'Done',
    tone: 'green',
    cards: [
      { id: 'd1', t: 'Push notification opt-in', agent: 'NX' },
      { id: 'd2', t: 'Discount-code field at checkout', agent: 'NX' },
    ],
  },
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
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns)
  const [decisionToast, setDecisionToast] = useState<string | null>(null)

  /** Move a card from one column to another by card id */
  const moveCard = useCallback((cardId: string, toKey: string) => {
    setColumns((prev) => {
      let cardToMove: KanbanCard | null = null
      const next = prev.map((col) => {
        if (col.cards.some((c) => c.id === cardId)) {
          const idx = col.cards.findIndex((c) => c.id === cardId)
          cardToMove = col.cards[idx]
          return { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
        }
        return col
      })
      if (!cardToMove) return prev
      return next.map((col) => {
        if (col.key === toKey) {
          return { ...col, cards: [...col.cards, cardToMove!] }
        }
        return col
      })
    })
  }, [])

  /** Approve a Planning task → moves to Backlog */
  const handleApprove = useCallback((cardId: string) => {
    moveCard(cardId, 'backlog')
  }, [moveCard])

  /** Start a Backlog task → moves to In progress (claimed by Nexus) */
  const handleStart = useCallback((cardId: string) => {
    moveCard(cardId, 'in-progress')
  }, [moveCard])

  /** Create Decision — simulates creating a Decision Queue item */
  const handleCreateDecision = useCallback((cardId: string) => {
    const card = columns.flatMap((c) => c.cards).find((c) => c.id === cardId)
    const title = card?.t ?? 'Unknown task'
    setDecisionToast(`📋 Decision created for "${title}" — routed to Decision Queue`)
    setTimeout(() => setDecisionToast(null), 4000)
    // Keep card in Needs review — decision is a separate workflow item
  }, [columns])

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

      {/* Decision toast */}
      {decisionToast && (
        <div className="mb-4 px-4 py-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-200 text-xs animate-in fade-in slide-in-from-top-2">
          {decisionToast}
        </div>
      )}

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

      {/* QA gate explainer — updated to show BACKLOG step */}
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

      {/* ── Main grid: kanban + right rail ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
        {/* kanban */}
        <div className="scroll-x flex gap-3 overflow-x-auto pb-2">
          {columns.map((col) => (
            <div key={col.key} className="kanban-col">
              <div className="mb-2.5 flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-on-surface">
                  {col.tone && <span className="h-2 w-2 rounded-full" style={{ background: dotColor[col.tone] }} />}
                  {col.title}
                </span>
                <span className="text-[11px] text-on-surface-variant">{col.cards.length}</span>
              </div>
              <div className="space-y-2.5">
                {col.cards.map((c) => (
                  <div key={c.id} className="kanban-card">
                    <p className="text-[13px] leading-snug text-on-surface">{c.t}</p>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <Avatar initials={c.agent} />

                      {/* Planning: Approve → Backlog */}
                      {col.key === 'planning' && (
                        <button
                          onClick={() => handleApprove(c.id)}
                          className="btn-ghost !px-2.5 !py-1 !text-[11px] text-emerald-300 hover:bg-emerald-500/10"
                        >
                          Approve
                        </button>
                      )}

                      {/* Backlog: Start → In progress */}
                      {col.key === 'backlog' && (
                        <button
                          onClick={() => handleStart(c.id)}
                          className="btn-accent !px-2.5 !py-1 !text-[11px]"
                        >
                          Start
                        </button>
                      )}

                      {/* Needs review: Review + Create Decision */}
                      {col.key === 'needs-review' && (
                        <div className="flex items-center gap-1.5">
                          <button className="btn-accent !px-2.5 !py-1 !text-[11px]">Review</button>
                          <button
                            onClick={() => handleCreateDecision(c.id)}
                            className="btn-ghost !px-2.5 !py-1 !text-[11px] text-amber-300 hover:bg-amber-500/10"
                            title="Create a Decision Queue item for this task"
                          >
                            <FileText size={13} className="mr-1" />
                            Create Decision
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {/* Empty state */}
                {col.cards.length === 0 && (
                  <div className="kanban-card opacity-50">
                    <p className="text-[12px] text-on-surface-variant italic text-center py-3">No tasks</p>
                  </div>
                )}
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
    </div>
  )
}
