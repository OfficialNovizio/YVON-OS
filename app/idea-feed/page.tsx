'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader, StatusBadge, Card, Avatar } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import { Check, Clock, X, ArrowUpRight, Search } from 'lucide-react'

type Idea = {
  id: string
  title: string
  type: string
  tone: 'blue' | 'yellow' | 'green'
  by: string
  score: number
  detail: string
}

const SEED: Idea[] = [
  { id: 'i1', title: 'Voice-memo → structured idea card', type: 'Tool', tone: 'blue', by: 'NX', score: 88, detail: 'Record a voice memo, get a clean idea card with title, summary and next step.' },
  { id: 'i2', title: 'Canela: bundle builder at checkout', type: 'Feature', tone: 'green', by: 'AR', score: 81, detail: 'Let shoppers build a 3-item bundle for a discount. Lifts AOV.' },
  { id: 'i3', title: 'Agent-as-a-service retainer page', type: 'Product', tone: 'yellow', by: 'IV', score: 79, detail: 'Productize the consulting offer into a €2k/mo retainer landing page.' },
  { id: 'i4', title: 'Decision Queue keyboard shortcuts', type: 'Feature', tone: 'blue', by: 'NX', score: 72, detail: 'J/K to move, Enter to approve, D to defer. Clear the queue faster.' },
  { id: 'i5', title: 'By Design: weekly retention digest', type: 'Feature', tone: 'green', by: 'VI', score: 70, detail: 'Email founders a cohort retention curve each Monday.' },
  { id: 'i6', title: 'Trend → thumbnail auto-brief', type: 'Tool', tone: 'yellow', by: 'IS', score: 66, detail: 'When Isaac flags a trend, auto-draft a thumbnail brief for Leonardo.' },
]

type FilterMode = 'all' | 'promoted' | 'not-promoted'

export default function IdeaFeedPage() {
  const { data } = useLiveData<{ ideas: Idea[] }>({
    url: '/api/idea-feed',
    mockData: { ideas: SEED },
    pollIntervalMs: 30000,
  })

  const liveIdeas = data?.ideas ?? SEED
  const [ideas, setIdeas] = useState<Idea[]>(liveIdeas)

  // --- Promotion state (no backend) ---
  // Map of idea id → ISO timestamp when promoted
  const [promoted, setPromoted] = useState<Record<string, string>>({})

  // --- Filter & search state ---
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [workspaceFilter, setWorkspaceFilter] = useState<string>('all')

  // --- Detail modal ---
  const [sel, setSel] = useState<Idea | null>(null)

  // Sync local state when live data arrives (preserves local actions)
  useEffect(() => { if (data?.ideas) setIdeas(data.ideas) }, [data])

  // --- Actions ---

  const dismiss = (id: string) => {
    setIdeas((xs) => xs.filter((x) => x.id !== id))
    setSel(null)
  }

  const defer = (id: string) => {
    setIdeas((xs) => xs.filter((x) => x.id !== id))
    setSel(null)
  }

  const promote = (id: string) => {
    setPromoted((prev) => ({ ...prev, [id]: new Date().toISOString() }))
    setSel(null)
  }

  const unpromote = (id: string) => {
    setPromoted((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  // --- Derived data ---

  const workspaces = useMemo(() => {
    const unique = new Set(ideas.map((i) => i.by))
    return Array.from(unique).sort()
  }, [ideas])

  // Stats
  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    const total = ideas.length
    const promotedCount = Object.keys(promoted).length
    const promotedThisMonth = Object.entries(promoted).filter(([, iso]) => {
      const d = new Date(iso)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    }).length
    const awaitingReview = total - promotedCount

    return { total, promotedCount, promotedThisMonth, awaitingReview }
  }, [ideas, promoted])

  // Filtered + searched ideas
  const filteredIdeas = useMemo(() => {
    let result = ideas

    // Promotion filter
    if (filterMode === 'promoted') {
      result = result.filter((i) => promoted[i.id])
    } else if (filterMode === 'not-promoted') {
      result = result.filter((i) => !promoted[i.id])
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (i) => i.title.toLowerCase().includes(q) || i.detail.toLowerCase().includes(q),
      )
    }

    // Workspace filter
    if (workspaceFilter !== 'all') {
      result = result.filter((i) => i.by === workspaceFilter)
    }

    return result
  }, [ideas, filterMode, searchQuery, workspaceFilter, promoted])

  return (
    <div>
      {/* ===== Header ===== */}
      <PageHeader
        title="Idea Feed"
        subtitle="The intake for the software factory. Promote the best into the Software Pipeline."
        actions={<StatusBadge tone="blue">{ideas.length} open</StatusBadge>}
      />

      {/* ===== Stats row ===== */}
      <div className="mb-4 flex flex-wrap gap-3">
        <Card className="flex-1 min-w-[120px] px-3 py-2">
          <p className="text-[11px] text-on-surface-variant">Total ideas</p>
          <p className="text-lg font-bold text-on-surface">{stats.total}</p>
        </Card>
        <Card className="flex-1 min-w-[120px] px-3 py-2">
          <p className="text-[11px] text-on-surface-variant">Promoted this month</p>
          <p className="text-lg font-bold text-green-600">{stats.promotedThisMonth}</p>
        </Card>
        <Card className="flex-1 min-w-[120px] px-3 py-2">
          <p className="text-[11px] text-on-surface-variant">Awaiting review</p>
          <p className="text-lg font-bold text-amber-600">{stats.awaitingReview}</p>
        </Card>
      </div>

      {/* ===== Search + Filters ===== */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search ideas…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-[13px] rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
          />
        </div>

        {/* Workspace filter */}
        <select
          value={workspaceFilter}
          onChange={(e) => setWorkspaceFilter(e.target.value)}
          className="px-3 py-2 text-[13px] rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="all">All workspaces</option>
          {workspaces.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>

        {/* Promotion filter toggle — CSS custom property pills */}
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'not-promoted', 'promoted'] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className="rounded-full border px-3 py-1.5 text-[12px] font-semibold transition"
              style={
                filterMode === mode
                  ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' }
                  : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }
              }
            >
              {mode === 'all' ? 'All ideas' : mode === 'promoted' ? 'Promoted' : 'Not promoted'}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Idea cards ===== */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filteredIdeas.map((it) => {
          const isPromoted = !!promoted[it.id]
          return (
            <Card
              key={it.id}
              hover
              className={`p-4 ${isPromoted ? 'ring-2 ring-green-400/50' : ''}`}
            >
              {/* Top row: type badge, score, avatar, pipeline indicator */}
              <div className="mb-1.5 flex items-center gap-2">
                <StatusBadge tone={it.tone}>{it.type}</StatusBadge>
                <span className="text-[11px] text-on-surface-variant">score {it.score}</span>
                <Avatar initials={it.by} />
                {isPromoted && (
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-semibold">
                    <Check size={12} /> Pipeline
                  </span>
                )}
              </div>

              {/* Title + detail — click opens modal */}
              <button onClick={() => setSel(it)} className="block text-left w-full">
                <h3 className="text-sm font-semibold text-on-surface">{it.title}</h3>
                <p className="mt-1 text-[12px] text-on-surface-variant">{it.detail}</p>
              </button>

              {/* Action buttons */}
              <div className="mt-3 flex gap-2">
                {isPromoted ? (
                  <>
                    <button
                      className="btn-ghost !py-1.5 !text-xs text-green-600"
                      onClick={() => unpromote(it.id)}
                    >
                      <Check size={13} /> Promoted
                    </button>
                    <button
                      className="btn-ghost !py-1.5 !text-xs"
                      onClick={() => defer(it.id)}
                    >
                      <Clock size={13} /> Defer
                    </button>
                    <button
                      className="btn-ghost !py-1.5 !text-xs"
                      onClick={() => dismiss(it.id)}
                    >
                      <X size={13} /> Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn-accent !py-1.5 !text-xs"
                      onClick={() => promote(it.id)}
                    >
                      <ArrowUpRight size={13} /> Promote
                    </button>
                    <button
                      className="btn-ghost !py-1.5 !text-xs"
                      onClick={() => defer(it.id)}
                    >
                      <Clock size={13} /> Defer
                    </button>
                    <button
                      className="btn-ghost !py-1.5 !text-xs"
                      onClick={() => dismiss(it.id)}
                    >
                      <X size={13} /> Reject
                    </button>
                  </>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* ===== Empty state ===== */}
      {filteredIdeas.length === 0 && (
        <Card className="p-8 text-center text-[13px] text-on-surface-variant">
          {ideas.length === 0
            ? 'Feed cleared. New ideas arrive from you, agents, Isaac, and the Advisory Council.'
            : 'No ideas match your current filters.'}
        </Card>
      )}

      {/* ===== Detail modal ===== */}
      <Modal
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel?.title}
        subtitle={
          sel
            ? `${sel.type} · score ${sel.score}${promoted[sel.id] ? ' · → Pipeline' : ''}`
            : ''
        }
        footer={
          <>
            <button
              className="btn-ghost !py-1.5 !text-xs"
              onClick={() => sel && dismiss(sel.id)}
            >
              Reject
            </button>
            <button
              className="btn-ghost !py-1.5 !text-xs"
              onClick={() => sel && defer(sel.id)}
            >
              Defer
            </button>
            {sel && promoted[sel.id] ? (
              <button
                className="btn-accent !py-1.5 !text-xs"
                onClick={() => sel && unpromote(sel.id)}
              >
                <X size={13} /> Remove from Pipeline
              </button>
            ) : (
              <button
                className="btn-accent !py-1.5 !text-xs"
                onClick={() => sel && promote(sel.id)}
              >
                <Check size={13} /> Promote to Pipeline
              </button>
            )}
          </>
        }
      >
        {sel && (
          <>
            <p className="text-[13px] text-on-surface-variant">{sel.detail}</p>
            {promoted[sel.id] && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-[13px]">
                <Check size={14} />
                Promoted to Software Pipeline on{' '}
                {new Date(promoted[sel.id]).toLocaleDateString()}
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
