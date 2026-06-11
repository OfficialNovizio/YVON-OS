'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader, StatusBadge, Card, Avatar } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'
import {
  Lightbulb,
  Scissors,
  MessageSquareText,
  CheckCircle2,
  ArrowRight,
  Send,
  Film,
  Clock,
  Tag,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────

type ShortStage = 'ideas' | 'cut-clip' | 'caption-copy' | 'ready'

type ShortItem = {
  id: string
  title: string
  stage: ShortStage
  sourceVideo?: string // e.g. "podcast-ep-42.mp4" — if derived from long-form
  duration: string // e.g. "0:58"
  workspace: string
  agent: string // initials e.g. "AL"
  agentColor?: string
  createdAt: string
}

type PipelineFeed = {
  items: ShortItem[]
  stats: {
    ideasInQueue: number
    readyToDistribute: number
    producedThisWeek: number
  }
}

// ── Stage definitions ──────────────────────────────────

const STAGES: { key: ShortStage; label: string; icon: React.ReactNode; tone: 'blue' | 'yellow' | 'green' | 'muted' }[] = [
  { key: 'ideas', label: 'IDEAS', icon: <Lightbulb size={15} />, tone: 'blue' },
  { key: 'cut-clip', label: 'CUT/CLIP', icon: <Scissors size={15} />, tone: 'yellow' },
  { key: 'caption-copy', label: 'CAPTION/COPY', icon: <MessageSquareText size={15} />, tone: 'yellow' },
  { key: 'ready', label: 'READY', icon: <CheckCircle2 size={15} />, tone: 'green' },
]

const STAGE_ORDER: ShortStage[] = ['ideas', 'cut-clip', 'caption-copy', 'ready']

// ── Mock data ──────────────────────────────────────────

const MOCK_ITEMS: ShortItem[] = [
  {
    id: 'sp1',
    title: 'Decision Queue in 60s',
    stage: 'ready',
    sourceVideo: 'office-walkthrough-42.mp4',
    duration: '0:58',
    workspace: 'Vibe',
    agent: 'AL',
    agentColor: '#abc7ff',
    createdAt: '2026-06-09',
  },
  {
    id: 'sp2',
    title: 'Agent memory explained',
    stage: 'caption-copy',
    sourceVideo: 'dev-stream-17.mp4',
    duration: '1:12',
    workspace: 'Vibe',
    agent: 'NX',
    agentColor: '#c08bff',
    createdAt: '2026-06-10',
  },
  {
    id: 'sp3',
    title: 'How Nexus ships PRs',
    stage: 'cut-clip',
    sourceVideo: 'podcast-ep-55.mp4',
    duration: '1:05',
    workspace: 'Vibe',
    agent: 'ST',
    agentColor: '#5fd0b4',
    createdAt: '2026-06-10',
  },
  {
    id: 'sp4',
    title: 'Office floor tour',
    stage: 'cut-clip',
    duration: '0:45',
    workspace: 'Vibe',
    agent: 'IS',
    agentColor: '#5ee0ff',
    createdAt: '2026-06-11',
  },
  {
    id: 'sp5',
    title: 'YVON dashboard walkthrough',
    stage: 'ideas',
    duration: '0:50',
    workspace: 'Vibe',
    agent: 'MI',
    agentColor: '#c95bd0',
    createdAt: '2026-06-11',
  },
  {
    id: 'sp6',
    title: 'Trend → thumbnail pipeline',
    stage: 'ideas',
    sourceVideo: 'analytics-brief-03.mp4',
    duration: '1:20',
    workspace: 'Vibe',
    agent: 'LE',
    agentColor: '#ff5a5f',
    createdAt: '2026-06-10',
  },
  {
    id: 'sp7',
    title: 'Supabase real-time hooks explained',
    stage: 'ideas',
    duration: '1:30',
    workspace: 'Vibe',
    agent: 'RJ',
    agentColor: '#5b8def',
    createdAt: '2026-06-11',
  },
  {
    id: 'sp8',
    title: 'Venture Switcher under the hood',
    stage: 'caption-copy',
    sourceVideo: 'dev-stream-18.mp4',
    duration: '0:55',
    workspace: 'Hourbour',
    agent: 'NX',
    agentColor: '#c08bff',
    createdAt: '2026-06-11',
  },
  {
    id: 'sp9',
    title: 'Fashion bundle builder demo',
    stage: 'ready',
    sourceVideo: 'novizio-launch.mp4',
    duration: '1:08',
    workspace: 'Novizio',
    agent: 'AR',
    agentColor: '#E94560',
    createdAt: '2026-06-08',
  },
]

const MOCK_STATS = {
  ideasInQueue: 3,
  readyToDistribute: 2,
  producedThisWeek: 5,
}

const MOCK_FEED: PipelineFeed = {
  items: MOCK_ITEMS,
  stats: MOCK_STATS,
}

// ── Component ──────────────────────────────────────────

export default function ShortPipelinePage() {
  const { data } = useLiveData<PipelineFeed>({
    url: '/api/content-feed?type=short-pipeline',
    mockData: MOCK_FEED,
    pollIntervalMs: 30000,
  })

  const [items, setItems] = useState<ShortItem[]>(MOCK_ITEMS)
  const stats = data?.stats ?? MOCK_STATS

  // Sync when live data arrives
  const [synced, setSynced] = useState(false)
  if (data?.items && !synced) {
    setItems(data.items)
    setSynced(true)
  }

  // Move a short to the next stage
  const advanceStage = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const idx = STAGE_ORDER.indexOf(item.stage)
        const next = idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : item.stage
        return { ...item, stage: next }
      }),
    )
  }

  return (
    <div>
      <PageHeader
        title="Short Pipeline"
        subtitle="Short-form production flow — idea → clip → caption → ready to distribute. Move cards through stages, send finished shorts to distribution."
      />

      {/* ── Stats bar ──────────────────────────────── */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lightbulb size={18} />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Ideas in Queue</p>
            <p className="text-xl font-bold text-on-surface">{stats.ideasInQueue}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Ready to Distribute</p>
            <p className="text-xl font-bold text-on-surface">{stats.readyToDistribute}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
            <Film size={18} />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Produced This Week</p>
            <p className="text-xl font-bold text-on-surface">{stats.producedThisWeek}</p>
          </div>
        </Card>
      </div>

      {/* ── Flow indicator ──────────────────────────── */}
      <div className="mb-4 flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant/60">
        {STAGES.map((s, i) => (
          <span key={s.key} className="flex items-center gap-1">
            {s.icon}
            <span>{s.label}</span>
            {i < STAGES.length - 1 && <ArrowRight size={12} className="mx-1 text-on-surface-variant/30" />}
          </span>
        ))}
      </div>

      {/* ── Kanban board ────────────────────────────── */}
      <div className="scroll-x flex gap-3 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const stageItems = items.filter((i) => i.stage === stage.key)
          return (
            <div key={stage.key} className="kanban-col min-w-[260px]">
              {/* Column header */}
              <div className="mb-2.5 flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-on-surface">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background:
                        stage.tone === 'green'
                          ? '#4ade80'
                          : stage.tone === 'yellow'
                            ? '#fbbf24'
                            : stage.tone === 'blue'
                              ? '#abc7ff'
                              : 'rgba(255,255,255,0.25)',
                    }}
                  />
                  {stage.label}
                </span>
                <StatusBadge tone={stage.tone === 'green' ? 'green' : stage.tone === 'blue' ? 'blue' : 'muted'}>
                  {stageItems.length}
                </StatusBadge>
              </div>

              {/* Cards */}
              <div className="space-y-2.5">
                {stageItems.map((item) => (
                  <div key={item.id} className="kanban-card">
                    {/* Title */}
                    <p className="text-[13px] font-medium leading-snug text-on-surface">{item.title}</p>

                    {/* Meta: source video, duration */}
                    <div className="mt-2 space-y-1 text-[11px] text-on-surface-variant">
                      {item.sourceVideo && (
                        <span className="flex items-center gap-1.5">
                          <Film size={12} className="shrink-0 text-on-surface-variant/50" />
                          <span className="truncate">{item.sourceVideo}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="shrink-0 text-on-surface-variant/50" />
                        {item.duration}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Tag size={12} className="shrink-0 text-on-surface-variant/50" />
                        {item.workspace}
                      </span>
                    </div>

                    {/* Actions row */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar initials={item.agent} color={item.agentColor} />
                        <span className="text-[11px] text-on-surface-variant/60">{item.createdAt}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Approve → advance to next stage */}
                        {item.stage !== 'ready' && (
                          <button
                            onClick={() => advanceStage(item.id)}
                            className="btn-accent !px-3 !py-1 !text-[11px] !gap-1.5"
                            title="Advance to next stage"
                          >
                            <CheckCircle2 size={12} />
                            Approve
                          </button>
                        )}
                        {/* Send to Shorts (distribution) */}
                        <Link
                          href="/shorts"
                          className="btn-ghost !px-2.5 !py-1 !text-[11px] !gap-1.5"
                          title="Send to Shorts distribution"
                        >
                          <Send size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {stageItems.length === 0 && (
                  <p className="py-6 text-center text-[12px] text-on-surface-variant/40">
                    No shorts in this stage
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Quick link to Shorts ────────────────────── */}
      <div className="mt-5">
        <Link href="/shorts" className="btn-accent !text-xs">
          <Send size={14} />
          Open Shorts Distribution
        </Link>
      </div>
    </div>
  )
}
