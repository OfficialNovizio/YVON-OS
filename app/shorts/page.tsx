'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'
import {
  UploadCloud,
  Play,
  CalendarClock,
  RefreshCw,
  Check,
  Send,
  Youtube,
  Linkedin,
  Instagram,
  Music2,
  FileVideo,
  Filter,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', icon: <Youtube size={15} />, color: '#ff5a5f' },
  { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin size={15} />, color: '#5b8def' },
  { id: 'instagram', name: 'Instagram', icon: <Instagram size={15} />, color: '#c95bd0' },
  { id: 'tiktok', name: 'TikTok', icon: <Music2 size={15} />, color: '#5ee0ff' },
] as const

type PlatformId = (typeof PLATFORMS)[number]['id']

type ShortCard = {
  id: string
  title: string
  platform: PlatformId
  caption: string // auto-generated caption
  status: 'ready' | 'draft' | 'scheduled'
  sourceFile?: string
  duration?: string
  thumbnailColor?: string
  createdAt?: string
}

type ShortsFeedResponse = {
  cards: ShortCard[]
  total: number
  source: string
}

// ── Mock data ──────────────────────────────────────────

const MOCK_CARDS: ShortCard[] = [
  {
    id: 'sc1',
    title: 'Decision Queue in 60s',
    platform: 'youtube',
    caption: '🧠 Ever wonder how AI agents make decisions under pressure? Here’s the Decision Queue explained in 60 seconds. ⚡ #AI #YVON',
    status: 'ready',
    sourceFile: 'decision-queue-cut.mp4',
    duration: '0:58',
    thumbnailColor: '#ff5a5f',
    createdAt: '2026-06-09',
  },
  {
    id: 'sc2',
    title: 'Decision Queue in 60s',
    platform: 'instagram',
    caption: 'The Decision Queue: how our AI agents prioritize like a pro 🧠⚡ Watch how it works in under a minute 👇 #AI #dev #YVON',
    status: 'ready',
    sourceFile: 'decision-queue-cut.mp4',
    duration: '0:58',
    thumbnailColor: '#c95bd0',
    createdAt: '2026-06-09',
  },
  {
    id: 'sc3',
    title: 'Decision Queue in 60s',
    platform: 'tiktok',
    caption: 'POV: you built an AI that ships code faster than your morning coffee ☕⚡ Decision Queue explained in 60s #AIShorts #YVON',
    status: 'ready',
    sourceFile: 'decision-queue-cut.mp4',
    duration: '0:58',
    thumbnailColor: '#5ee0ff',
    createdAt: '2026-06-09',
  },
  {
    id: 'sc4',
    title: 'Agent memory explained',
    platform: 'youtube',
    caption: '📦 How do AI agents remember? We break down the memory system that powers YVON — context windows, embeddings & retrieval. #AgentMemory #AI',
    status: 'ready',
    sourceFile: 'agent-memory-clip.mp4',
    duration: '1:12',
    thumbnailColor: '#ff5a5f',
    createdAt: '2026-06-10',
  },
  {
    id: 'sc5',
    title: 'Agent memory explained',
    platform: 'linkedin',
    caption: '🧩 The single most underrated piece of AI agent infrastructure: memory. Here’s how YVON agents retain context across sessions and why it matters for enterprise adoption. Full breakdown 👇',
    status: 'draft',
    sourceFile: 'agent-memory-clip.mp4',
    duration: '1:12',
    thumbnailColor: '#5b8def',
    createdAt: '2026-06-10',
  },
  {
    id: 'sc6',
    title: 'Agent memory explained',
    platform: 'tiktok',
    caption: 'How do AI agents NOT forget everything? 🧠⚡ Memory system breakdown #AI #AgentMemory #YVON',
    status: 'ready',
    sourceFile: 'agent-memory-clip.mp4',
    duration: '1:12',
    thumbnailColor: '#5ee0ff',
    createdAt: '2026-06-10',
  },
  {
    id: 'sc7',
    title: 'Office floor tour',
    platform: 'instagram',
    caption: '🏢 Step inside the AI office floor — where 13 agents work across 4 departments. CEO Marcus, Dev Nexus, Analyst Kai, and more 👀✨ #AIOffice #YVON',
    status: 'ready',
    sourceFile: 'office-tour.mp4',
    duration: '0:45',
    thumbnailColor: '#c95bd0',
    createdAt: '2026-06-11',
  },
  {
    id: 'sc8',
    title: 'How Nexus ships PRs',
    platform: 'linkedin',
    caption: '⚙️ Meet Nexus — our dev agent that opens PRs, never merges to main, and passes every PR through a Steve QA gate before human review. Here’s the full flow 👇 #AIEngineering #DevOps',
    status: 'ready',
    sourceFile: 'nexus-pr-flow.mp4',
    duration: '1:05',
    thumbnailColor: '#5b8def',
    createdAt: '2026-06-10',
  },
  {
    id: 'sc9',
    title: 'How Nexus ships PRs',
    platform: 'tiktok',
    caption: 'This AI writes code AND opens PRs like a senior dev 👨‍💻⚡ Meet Nexus #AIDev #YVON #CodingAI',
    status: 'draft',
    sourceFile: 'nexus-pr-flow.mp4',
    duration: '1:05',
    thumbnailColor: '#5ee0ff',
    createdAt: '2026-06-10',
  },
  {
    id: 'sc10',
    title: 'Fashion bundle builder demo',
    platform: 'youtube',
    caption: '👗 Novizio’s bundle builder lets shoppers stack 3 items for a discount — boosting AOV by 22%. Watch the demo! 🛍️ #FashionTech #Ecommerce',
    status: 'scheduled',
    sourceFile: 'novizio-launch.mp4',
    duration: '1:08',
    thumbnailColor: '#ff5a5f',
    createdAt: '2026-06-08',
  },
  {
    id: 'sc11',
    title: 'Fashion bundle builder demo',
    platform: 'instagram',
    caption: 'Build your dream outfit in 3 clicks 🛍️✨ Novizio bundle builder = 22% higher AOV. Watch how 👆 #OOTD #FashionTech #Novizio',
    status: 'scheduled',
    sourceFile: 'novizio-launch.mp4',
    duration: '1:08',
    thumbnailColor: '#c95bd0',
    createdAt: '2026-06-08',
  },
  {
    id: 'sc12',
    title: 'Trend → thumbnail pipeline',
    platform: 'youtube',
    caption: '🔍 When Isaac flags a trend, Leonardo gets a thumbnail brief in seconds. Watch the auto-pipeline from data signal → visual asset. #AIWorkflow #ContentStrategy',
    status: 'draft',
    sourceFile: 'trend-thumbnail.mp4',
    duration: '1:20',
    thumbnailColor: '#ff5a5f',
    createdAt: '2026-06-10',
  },
]

const MOCK_FEED: ShortsFeedResponse = {
  cards: MOCK_CARDS,
  total: MOCK_CARDS.length,
  source: 'mock',
}

// ── Helpers ────────────────────────────────────────────

function getPlatform(platformId: string) {
  return PLATFORMS.find((p) => p.id === platformId) ?? PLATFORMS[0]
}

function statusTone(status: ShortCard['status']): 'green' | 'yellow' | 'blue' {
  if (status === 'ready') return 'green'
  if (status === 'scheduled') return 'blue'
  return 'yellow'
}

function statusLabel(status: ShortCard['status']): string {
  if (status === 'ready') return 'Ready'
  if (status === 'scheduled') return 'Scheduled'
  return 'Draft'
}

// ── Component ──────────────────────────────────────────

export default function ShortsPage() {
  const { data } = useLiveData<ShortsFeedResponse>({
    url: '/api/content-feed?type=shorts',
    mockData: MOCK_FEED,
    pollIntervalMs: 30000,
  })

  const [cards, setCards] = useState<ShortCard[]>(MOCK_CARDS)
  const [activePlatform, setActivePlatform] = useState<PlatformId | null>(null)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync with live data
  useEffect(() => {
    if (data?.cards) setCards(data.cards)
  }, [data])

  // ── Drop zone handlers ──────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleFile = (file: File) => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm']
    if (!validTypes.includes(file.type)) {
      alert('Please upload an MP4, MOV, or WebM file.')
      return
    }
    setDroppedFile(file)
    // In production this would POST to an API that slices + captions per platform
  }

  const clearFile = () => {
    setDroppedFile(false as unknown as null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Filter ──────────────────────────────────────

  const filteredCards = activePlatform
    ? cards.filter((c) => c.platform === activePlatform)
    : cards

  // ── Counts ──────────────────────────────────────

  const readyCount = cards.filter((c) => c.status === 'ready').length
  const scheduledCount = cards.filter((c) => c.status === 'scheduled').length

  return (
    <div>
      <PageHeader
        title="Shorts"
        subtitle="Drop one clip, get a card for every platform, manage each queue. Auto-generated captions per platform, ready to schedule or post."
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone="green">{readyCount} ready</StatusBadge>
            {scheduledCount > 0 && <StatusBadge tone="blue">{scheduledCount} scheduled</StatusBadge>}
          </div>
        }
      />

      {/* ── Upload / Drop zone ────────────────────── */}
      <Card className="mb-5 overflow-hidden p-0">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center px-6 py-10 text-center transition-colors ${
            isDragging
              ? 'border-2 border-dashed border-[var(--ws-accent)] bg-[var(--ws-accent-soft)]'
              : 'border-2 border-dashed border-white/10'
          }`}
          style={{ borderRadius: '1.25rem' }}
        >
          {/* Upload icon */}
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
              isDragging ? 'bg-[var(--ws-accent)]/20 text-[var(--ws-accent)]' : 'bg-white/5 text-on-surface-variant'
            }`}
          >
            {droppedFile ? <FileVideo size={28} className="text-emerald-300" /> : <UploadCloud size={28} />}
          </span>

          {/* Status text */}
          {droppedFile ? (
            <>
              <p className="mt-3 text-sm font-semibold text-on-surface">{droppedFile.name}</p>
              <p className="mt-1 text-[12px] text-on-surface-variant">
                {(droppedFile.size / (1024 * 1024)).toFixed(1)} MB — Processing per-platform cards…
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm font-semibold text-on-surface">
                Drop a short here
              </p>
              <p className="mt-1 text-[12px] text-on-surface-variant">
                MP4 / MOV / WebM · up to 1080p · captions for YouTube, LinkedIn, Instagram & TikTok auto-generated
              </p>
            </>
          )}

          {/* Buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost !py-1.5 !text-xs"
            >
              {droppedFile ? 'Replace file' : 'Choose file'}
            </button>
            {droppedFile && (
              <button onClick={clearFile} className="btn-ghost !py-1.5 !text-xs">
                Clear
              </button>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </Card>

      {/* ── Platform filter chips ──────────────────── */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
          <Filter size={12} />
          Filter
        </span>
        <button
          onClick={() => setActivePlatform(null)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all"
          style={
            !activePlatform
              ? { background: 'var(--ws-accent)', color: '#06121f' }
              : { background: 'rgba(255,255,255,0.05)', color: '#c1c6d6' }
          }
        >
          All
        </button>
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePlatform(activePlatform === p.id ? null : p.id)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all"
            style={
              activePlatform === p.id
                ? { background: p.color, color: '#fff' }
                : { background: 'rgba(255,255,255,0.05)', color: '#c1c6d6' }
            }
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
            {p.name}
          </button>
        ))}
      </div>

      {/* ── Per-platform cards grid ────────────────── */}
      {filteredCards.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <FileVideo size={32} className="text-on-surface-variant/30" />
          <p className="text-[13px] text-on-surface-variant">No cards yet. Drop a short above to generate platform cards.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCards.map((card) => {
            const platform = getPlatform(card.platform)
            return (
              <Card key={card.id} hover className="overflow-hidden p-0">
                {/* Thumbnail placeholder */}
                <div
                  className="relative flex aspect-[9/12] items-center justify-center"
                  style={{
                    background: `linear-gradient(160deg, ${platform.color}33, #0c0c10)`,
                  }}
                >
                  <Play size={28} className="text-white/60" />

                  {/* Platform badge — top left */}
                  <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                    <span className="flex items-center" style={{ color: platform.color }}>
                      {platform.icon}
                    </span>
                    {platform.name}
                  </span>

                  {/* Status badge — top right */}
                  <span className="absolute right-2 top-2">
                    <StatusBadge tone={statusTone(card.status)}>{statusLabel(card.status)}</StatusBadge>
                  </span>

                  {/* Duration — bottom right */}
                  {card.duration && (
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
                      {card.duration}
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-3">
                  {/* Title */}
                  <p className="text-[13px] font-medium text-on-surface">{card.title}</p>

                  {/* Auto-generated caption */}
                  <p className="mt-1.5 min-h-[56px] text-[11px] leading-relaxed text-on-surface-variant/80 line-clamp-3">
                    {card.caption}
                  </p>

                  {/* Source file */}
                  {card.sourceFile && (
                    <p className="mt-1.5 flex items-center gap-1 text-[10px] text-on-surface-variant/50">
                      <FileVideo size={10} />
                      {card.sourceFile} · {card.createdAt}
                    </p>
                  )}

                  {/* Actions row */}
                  <div className="mt-3 flex items-center gap-1.5">
                    {/* Toggle ready/draft */}
                    <button
                      onClick={() => {
                        setCards((prev) =>
                          prev.map((c) =>
                            c.id === card.id
                              ? { ...c, status: c.status === 'ready' ? ('draft' as const) : ('ready' as const) }
                              : c,
                          ),
                        )
                      }}
                      className="btn-ghost flex-1 !py-1.5 !text-[11px] !justify-center"
                    >
                      {card.status === 'ready' ? (
                        <>
                          <Check size={12} /> Ready
                        </>
                      ) : (
                        'Mark ready'
                      )}
                    </button>

                    {/* Post now */}
                    <button className="btn-accent !py-1.5 !text-[11px] !px-2.5" title="Post now">
                      <Send size={12} />
                    </button>

                    {/* Schedule — links to Scheduler */}
                    <Link
                      href="/scheduler"
                      className="btn-ghost !py-1.5 !text-[11px] !px-2.5"
                      title="Schedule this short"
                    >
                      <CalendarClock size={12} />
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Global actions ─────────────────────────── */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button className="btn-ghost !text-xs">
          <RefreshCw size={14} /> Regenerate all captions
        </button>
        <Link href="/short-pipeline" className="btn-ghost !text-xs">
          <Play size={14} /> Open Short Pipeline
        </Link>
        <Link href="/scheduler" className="btn-accent !text-xs">
          <CalendarClock size={14} /> View Scheduler
        </Link>
      </div>
    </div>
  )
}
