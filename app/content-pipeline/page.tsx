'use client'

import { useState, useEffect } from 'react'
import { PageHeader, StatusBadge, Avatar, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import { Plus, LayoutGrid, CalendarDays, ChevronLeft, ChevronRight, Youtube, Sparkles } from 'lucide-react'

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
  const [view, setView] = useState<'board' | 'calendar'>('board')
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
              <button onClick={() => setView('board')} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={view === 'board' ? { background: 'var(--ws-accent)', color: '#06121f' } : { color: '#c1c6d6' }}>
                <LayoutGrid size={13} /> Board
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

      {view === 'board' ? (
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
