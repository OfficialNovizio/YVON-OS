'use client'

import { useState, useEffect } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import { UploadCloud, Play, Send, CalendarClock, RefreshCw, Check } from 'lucide-react'

const PLAT = [
  { id: 'youtube', name: 'YouTube', color: '#ff5a5f' },
  { id: 'linkedin', name: 'LinkedIn', color: '#5b8def' },
  { id: 'instagram', name: 'Instagram', color: '#c95bd0' },
  { id: 'tiktok', name: 'TikTok', color: '#5ee0ff' },
]

type ShortItem = {
  id: string
  title: string
  platform: string
  status: 'ready' | 'draft'
  workspace?: string
  createdAt?: string
}

type ShortsFeedResponse = {
  items: ShortItem[]
  total: number
  source: string
}

const SEED: ShortItem[] = [
  { id: 'sh1', title: 'Agent ships code in 20 min', platform: 'YouTube', status: 'ready' },
  { id: 'sh2', title: 'Memory system breakdown', platform: 'Instagram', status: 'ready' },
  { id: 'sh3', title: 'Convert the agent trend', platform: 'TikTok', status: 'draft' },
]

function getPlatformColor(platform: string): string {
  const p = PLAT.find((pl) => pl.name.toLowerCase() === platform.toLowerCase())
  return p?.color ?? '#5ee0ff'
}

export default function ShortsPage() {
  const { data, loading } = useLiveData<ShortsFeedResponse>({
    url: '/api/content-feed?type=shorts',
    mockData: { items: SEED, total: SEED.length, source: 'mock' },
    pollIntervalMs: 30000,
  })

  const [items, setItems] = useState<ShortItem[]>(SEED)
  const [dropped, setDropped] = useState(true)
  const [confirm, setConfirm] = useState<null | { item: ShortItem; mode: 'post' | 'schedule' }>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)

  // Sync API data into local state so we can optimistically toggle ready/draft
  useEffect(() => {
    if (data?.items) setItems(data.items)
  }, [data])

  const toggleReady = async (item: ShortItem) => {
    const newStatus: 'ready' | 'draft' = item.status === 'ready' ? 'draft' : 'ready'
    // Optimistic update
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)))
    // Persist to API
    try {
      await fetch('/api/content-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, stage: newStatus }),
      })
    } catch {
      // Keep optimistic update on error
    }
  }

  const filteredItems = selectedPlatform
    ? items.filter((i) => i.platform.toLowerCase() === selectedPlatform.toLowerCase())
    : items

  const readyCount = items.filter((i) => i.status === 'ready').length

  return (
    <div>
      <PageHeader
        title="Shorts"
        subtitle="Drop one clip, get a card for every platform with copy and distribution prepared. Manage each queue."
        actions={<StatusBadge tone="green">{readyCount}/{items.length} ready</StatusBadge>}
      />

      {/* dropzone */}
      <Card className="mb-5 p-5">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/12 py-8 text-center">
          <UploadCloud size={28} style={{ color: 'var(--ws-accent)' }} />
          <p className="mt-2 text-sm font-semibold text-on-surface">{dropped ? 'agents-7day-autopilot.mp4' : 'Drop a short here'}</p>
          <p className="mt-1 text-[12px] text-on-surface-variant">MP4 / MOV / WebM · up to 1080p · captions for YouTube, Instagram & TikTok auto-generated</p>
          <div className="mt-3 flex gap-2">
            <button className="btn-ghost !py-1.5 !text-xs" onClick={() => setDropped(true)}>Choose file</button>
            {dropped && <button className="btn-ghost !py-1.5 !text-xs" onClick={() => setDropped(false)}>Clear</button>}
          </div>
        </div>
      </Card>

      {/* platform filter chips */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedPlatform(null)}
          className="rounded-full px-3 py-1 text-[11px] font-semibold transition-colors"
          style={!selectedPlatform ? { background: 'var(--ws-accent)', color: '#06121f' } : { background: 'rgba(255,255,255,0.05)', color: '#c1c6d6' }}
        >
          All
        </button>
        {PLAT.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPlatform(selectedPlatform === p.id ? null : p.id)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors"
            style={selectedPlatform === p.id ? { background: p.color, color: '#fff' } : { background: 'rgba(255,255,255,0.05)', color: '#c1c6d6' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} /> {p.name}
          </button>
        ))}
      </div>

      {/* per-platform cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {filteredItems.map((item) => {
          const color = getPlatformColor(item.platform)
          return (
            <Card key={item.id} hover className="overflow-hidden p-0">
              <div className="relative flex aspect-[9/12] items-center justify-center" style={{ background: `linear-gradient(160deg, ${color}33, #0c0c10)` }}>
                <Play size={26} className="text-white/70" />
                <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-semibold text-white">
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {item.platform}
                </span>
                <span className="absolute right-2 top-2">
                  {item.status === 'ready' ? <StatusBadge tone="green">Ready</StatusBadge> : <StatusBadge tone="yellow">Draft</StatusBadge>}
                </span>
              </div>
              <div className="p-3">
                <p className="min-h-[48px] text-[12px] leading-relaxed text-on-surface-variant">{item.title}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  <button onClick={() => toggleReady(item)} className="btn-ghost flex-1 !py-1.5 !text-[11px] !justify-center">
                    {item.status === 'ready' ? <><Check size={12} /> Ready</> : 'Mark ready'}
                  </button>
                  <button onClick={() => setConfirm({ item, mode: 'post' })} className="btn-accent !py-1.5 !text-[11px] !px-2.5"><Send size={12} /></button>
                  <button onClick={() => setConfirm({ item, mode: 'schedule' })} className="btn-ghost !py-1.5 !text-[11px] !px-2.5"><CalendarClock size={12} /></button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <button className="btn-ghost mt-4"><RefreshCw size={14} /> Regenerate all captions</button>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.mode === 'post' ? 'Post short now?' : 'Schedule short'}
        subtitle={confirm?.item.platform}
        footer={
          <>
            <button className="btn-ghost !py-1.5 !text-xs" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn-accent !py-1.5 !text-xs" onClick={() => setConfirm(null)}>Confirm</button>
          </>
        }
      >
        {confirm && <p className="text-[13px] text-on-surface-variant">{confirm.item.title}</p>}
      </Modal>
    </div>
  )
}
