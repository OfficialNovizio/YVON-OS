'use client'

import { useState, useEffect } from 'react'
import { PageHeader, StatusBadge, Avatar, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import { Plus, LayoutGrid, CalendarDays, ChevronLeft, ChevronRight, Youtube, Sparkles, Lightbulb, Briefcase, Users } from 'lucide-react'

const STAGES = ['Ideas', 'Scripting', 'Thumbnails', 'Filming', 'Editing', 'Ready', 'Published'] as const

type Item = {
  id: string
  title: string
  source: string
  note?: string
  agents: string[]
  stage: number
  score?: number
  views?: string
}

const SEED: Item[] = [
  { id: 'i1', title: 'I gave 5 AI agents one indecisive idea for a week', source: 'Brain dump', agents: [], stage: 0, score: 82 },
  { id: 'i2', title: 'Building a $10k SaaS with just Claude Code', source: 'Trend Radar · Isaac', agents: ['IS'], stage: 0, score: 74 },
  { id: 'i3', title: 'Why I fired my dashboards for a cockpit', source: 'Brain dump', agents: [], stage: 0, score: 69 },
  { id: 's1', title: 'AI agents that ship code while you sleep', source: 'Talking points', agents: ['WM'], stage: 1, note: 'Hook needs a number' },
  { id: 's2', title: 'I rebuilt my whole company on a team of AI agents', source: 'Talking points', agents: ['WM'], stage: 1 },
  { id: 't1', title: 'From idea to shipped in one prompt', source: 'Thumbnail', agents: ['LE'], stage: 2, note: 'Needs candidate — pick one' },
  { id: 't2', title: 'My agent stack, fully explained', source: 'Thumbnail', agents: ['LE'], stage: 2 },
  { id: 'f1', title: '10 agents that ship code', source: 'Filming', agents: [], stage: 3 },
  { id: 'e1', title: 'How I let software edit my code', source: 'Editing', agents: [], stage: 4 },
  { id: 'e2', title: 'The memory system that runs my agents', source: 'Editing', agents: [], stage: 4 },
  { id: 'r1', title: 'Claude ran my business for 7 days', source: 'Ready to upload', agents: ['WM', 'LE'], stage: 5 },
  { id: 'p1', title: 'Building my Mission Control, part 1', source: 'Published', agents: [], stage: 6, views: '128k' },
]

const dot = ['#abc7ff', '#abc7ff', '#ffb693', '#5ee0ff', '#5ee0ff', '#4ade80', '#8b919f']

// ── Strategy pillars with mock video ideas ─────────────────────────────

type PillarCard = {
  id: string
  title: string
  format: string
  estimatedViews?: string
  priority: 'High' | 'Medium'
}

type Pillar = {
  name: string
  icon: typeof Lightbulb
  description: string
  cards: PillarCard[]
}

const PILLARS: Pillar[] = [
  {
    name: 'Agent Tech',
    icon: Lightbulb,
    description: 'Deep dives into AI tooling, agent architectures, and shipping with code-gen',
    cards: [
      { id: 'at1', title: 'Building a multi-agent memory system from scratch', format: 'Tutorial · 12 min', estimatedViews: '85k', priority: 'High' },
      { id: 'at2', title: 'I let Claude Code refactor my entire SaaS — here is what shipped', format: 'Case study · 18 min', estimatedViews: '120k', priority: 'High' },
      { id: 'at3', title: 'The Decision Queue pattern: how I run 13 agents from one screen', format: 'Deep dive · 15 min', estimatedViews: '95k', priority: 'Medium' },
    ],
  },
  {
    name: 'Business Building',
    icon: Briefcase,
    description: 'Founder stories, revenue models, and building in public with AI leverage',
    cards: [
      { id: 'bb1', title: 'I built a $10k MRR SaaS with AI agents in 30 days', format: 'Build in public · 20 min', estimatedViews: '150k', priority: 'High' },
      { id: 'bb2', title: 'The exact funnel that turned my newsletter into a product', format: 'Case study · 14 min', priority: 'Medium' },
    ],
  },
  {
    name: 'Creator Life',
    icon: Users,
    description: 'Behind-the-scenes, workflows, and the reality of being an AI-first creator',
    cards: [
      { id: 'cl1', title: 'A week in the life of an AI-first YouTube creator', format: 'Vlog · 22 min', estimatedViews: '60k', priority: 'High' },
      { id: 'cl2', title: 'My content engine: from idea to published with zero manual editing', format: 'Walkthrough · 16 min', estimatedViews: '78k', priority: 'Medium' },
      { id: 'cl3', title: 'Why I stopped editing my own videos (and you should too)', format: 'Essay · 10 min', priority: 'Medium' },
    ],
  },
]

export default function ContentPipelinePage() {
  const { data: liveItems, loading } = useLiveData<Item[]>({
    url: '/api/content-feed?type=pipeline',
    mockData: SEED,
    pollIntervalMs: 30000,
  })
  const [items, setItems] = useState<Item[]>(SEED)
  useEffect(() => {
    if (liveItems) setItems(liveItems)
  }, [liveItems])
  const [sel, setSel] = useState<Item | null>(null)
  const [view, setView] = useState<'kanban' | 'strategy' | 'calendar'>('kanban')
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const move = (it: Item, dir: number) => {
    const ns = Math.max(0, Math.min(STAGES.length - 1, it.stage + dir))
    setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, stage: ns } : x)))
    setSel((s) => (s && s.id === it.id ? { ...s, stage: ns } : s))
  }
  const addIdea = () => {
    if (!draft.trim()) return
    setItems((xs) => [{ id: `n${Date.now()}`, title: draft.trim(), source: 'Brain dump', agents: [], stage: 0 }, ...xs])
    setDraft('')
    setAdding(false)
  }

  return (
    <div>
      <PageHeader
        title="Content Pipeline"
        subtitle="Long-form · idea → published. Agents find ideas, talking points and thumbnails; you film and edit."
        actions={
          <>
            <div className="flex rounded-full border border-white/8 bg-white/[0.03] p-1">
              <button onClick={() => setView('kanban')} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={view === 'kanban' ? { background: 'var(--ws-accent)', color: '#06121f' } : { color: '#c1c6d6' }}>
                <LayoutGrid size={13} /> Kanban
              </button>
              <button onClick={() => setView('strategy')} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={view === 'strategy' ? { background: 'var(--ws-accent)', color: '#06121f' } : { color: '#c1c6d6' }}>
                <Sparkles size={13} /> Strategy
              </button>
              <button onClick={() => setView('calendar')} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={view === 'calendar' ? { background: 'var(--ws-accent)', color: '#06121f' } : { color: '#c1c6d6' }}>
                <CalendarDays size={13} /> Calendar
              </button>
            </div>
            <button className="btn-accent" onClick={() => setAdding(true)}>
              <Plus size={15} /> New idea
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge tone="green">On cadence</StatusBadge>
        <span className="text-[12px] text-on-surface-variant">1 video / week · {items.filter((i) => i.stage === 0).length} ideas in queue · {items.filter((i) => i.stage === 6).length} published</span>
      </div>

      {view === 'kanban' ? (
        <div className="scroll-x flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((stage, si) => {
            const col = items.filter((i) => i.stage === si)
            return (
              <div key={stage} className="kanban-col">
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-on-surface">
                    <span className="h-2 w-2 rounded-full" style={{ background: dot[si] }} />
                    {stage}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">{col.length}</span>
                </div>
                <div className="space-y-2.5">
                  {col.map((it) => (
                    <button key={it.id} onClick={() => setSel(it)} className="kanban-card block w-full text-left">
                      <p className="text-[13px] leading-snug text-on-surface">{it.title}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-on-surface-variant">{it.source}</span>
                        <span className="flex items-center gap-1">
                          {it.score != null && <StatusBadge tone="blue">{it.score}</StatusBadge>}
                          {it.views && <StatusBadge tone="green">{it.views}</StatusBadge>}
                          {it.agents.map((a) => (
                            <Avatar key={a} initials={a} />
                          ))}
                        </span>
                      </div>
                      {it.note && <p className="mt-1.5 text-[11px] text-tertiary">{it.note}</p>}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : view === 'strategy' ? (
        <StrategyView pillars={PILLARS} />
      ) : (
        <CalendarView items={items} />
      )}

      {/* card detail */}
      <Modal
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel?.title}
        subtitle={sel ? `${STAGES[sel.stage]} · ${sel.source}` : ''}
        size="lg"
        footer={
          sel && (
            <>
              <button className="btn-ghost !py-1.5 !text-xs" onClick={() => sel && move(sel, -1)} disabled={sel.stage === 0}>
                <ChevronLeft size={13} /> Send back
              </button>
              <button className="btn-ghost !py-1.5 !text-xs">
                <Youtube size={13} /> Open in YouTube Studio
              </button>
              <button className="btn-accent !py-1.5 !text-xs" onClick={() => sel && move(sel, 1)} disabled={sel.stage === STAGES.length - 1}>
                Advance <ChevronRight size={13} />
              </button>
            </>
          )
        }
      >
        {sel && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {STAGES.map((s, i) => (
                <span key={s} className="flex items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={i === sel.stage ? { background: 'var(--ws-accent)', color: '#06121f' } : { background: 'rgba(255,255,255,0.05)', color: '#8b919f' }}>
                    {s}
                  </span>
                  {i < STAGES.length - 1 && <span className="text-on-surface-variant/30">›</span>}
                </span>
              ))}
            </div>
            <Card className="p-3">
              <p className="text-[12px] text-on-surface-variant">Talking points (drafted by William)</p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-on-surface">
                <li>· The cockpit vs. the dashboard — why one screen wins</li>
                <li>· Decision Queue: the 7 things that need you</li>
                <li>· Agents that ship while you sleep</li>
              </ul>
            </Card>
            <div className="flex items-center gap-3 text-[12px] text-on-surface-variant">
              <span>Assigned:</span>
              {sel.agents.length ? sel.agents.map((a) => <Avatar key={a} initials={a} />) : <span>—</span>}
            </div>
          </div>
        )}
      </Modal>

      {/* new idea */}
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="New idea"
        subtitle="Drops into the Ideas column"
        footer={
          <>
            <button className="btn-ghost !py-1.5 !text-xs" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn-accent !py-1.5 !text-xs" onClick={addIdea}>
              <Sparkles size={13} /> Add idea
            </button>
          </>
        }
      >
        <label className="block text-[12px] text-on-surface-variant">Video idea</label>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addIdea()}
          placeholder="e.g. I let agents run my launch for a week"
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-[var(--ws-glow)] focus:outline-none"
        />
      </Modal>
    </div>
  )
}

// ── Strategy View ──────────────────────────────────────────────────────

function StrategyView({ pillars }: { pillars: Pillar[] }) {
  const priorityColor = (p: PillarCard['priority']) =>
    p === 'High' ? { background: '#4ade8022', color: '#4ade80', border: '1px solid #4ade8055' } : { background: 'rgba(255,255,255,0.05)', color: '#8b919f', border: '1px solid rgba(255,255,255,0.12)' }

  return (
    <div className="space-y-6">
      <p className="text-[12px] text-on-surface-variant">
        Content strategy pillars — each pillar has 2-3 video ideas aligned with a theme. Drag to reorder, promote to Kanban when ready.
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {pillars.map((pillar) => {
          const Icon = pillar.icon
          return (
            <div key={pillar.name} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              {/* Pillar header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--ws-accent-soft)' }}>
                  <Icon size={18} style={{ color: 'var(--ws-accent)' }} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-on-surface">{pillar.name}</h4>
                  <p className="text-[11px] text-on-surface-variant">{pillar.cards.length} ideas</p>
                </div>
              </div>
              <p className="mb-4 text-[12px] text-on-surface-variant leading-relaxed">{pillar.description}</p>

              {/* Cards */}
              <div className="space-y-2.5">
                {pillar.cards.map((card) => (
                  <div key={card.id} className="rounded-xl border border-white/6 bg-white/[0.04] p-3 hover:border-white/12 transition">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] text-on-surface leading-snug flex-1">{card.title}</p>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                        style={priorityColor(card.priority)}
                      >
                        {card.priority}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span>{card.format}</span>
                      {card.estimatedViews && (
                        <span className="flex items-center gap-1">
                          <Youtube size={10} />
                          {card.estimatedViews}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add card placeholder */}
              <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 py-2.5 text-[12px] text-on-surface-variant hover:border-white/20 hover:text-on-surface transition">
                <Plus size={13} /> Add idea
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Calendar View ──────────────────────────────────────────────────────

function CalendarView({ items }: { items: Item[] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const ready = items.filter((i) => i.stage >= 4)
  return (
    <Card className="p-4">
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, di) => (
          <div key={d} className="min-h-[160px] rounded-xl border border-white/6 bg-white/[0.02] p-2">
            <p className="mb-2 text-[11px] font-semibold text-on-surface-variant">{d}</p>
            {ready
              .filter((_, idx) => idx % 7 === di)
              .map((it) => (
                <div key={it.id} className="mb-1.5 rounded-lg border border-white/8 bg-white/[0.04] p-2 text-[11px] text-on-surface">
                  {it.title.slice(0, 40)}
                  <span className="mt-1 block text-[10px] text-on-surface-variant">{STAGES[it.stage]}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </Card>
  )
}
