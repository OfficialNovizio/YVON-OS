'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import { RefreshCw, Plus, AlertTriangle, Wrench, RotateCw } from 'lucide-react'

// ── Types ──────────────────────────────────────────────

type SchedulerFeedItem = {
  id: string
  title: string
  platform: string
  day: string       // "2026-06-18"
  time: string      // "09:00"
  status: string
  workspace: string
  type: string
}

type SchedulerFeed = { items: SchedulerFeedItem[]; total: number }

const PLATFORMS = ['All', 'YouTube', 'LinkedIn', 'Instagram', 'TikTok'] as const
const PCOLOR: Record<string, string> = { YouTube: '#ff5a5f', LinkedIn: '#5b8def', Instagram: '#c95bd0', TikTok: '#5ee0ff' }
const DAYS = ['Mon 18', 'Tue 19', 'Wed 20', 'Thu 21', 'Fri 22', 'Sat 23', 'Sun 24']

type Slot = { id: string; day: number; time: string; platform: keyof typeof PCOLOR; title: string }

const SEED: Slot[] = [
  { id: 's1', day: 0, time: '09:00', platform: 'LinkedIn', title: 'Convert the agent trend' },
  { id: 's2', day: 0, time: '17:00', platform: 'Instagram', title: 'Decision Queue reel' },
  { id: 's3', day: 1, time: '12:00', platform: 'YouTube', title: 'Shipping software in 20 min' },
  { id: 's4', day: 2, time: '10:00', platform: 'TikTok', title: 'Memory system breakdown' },
  { id: 's5', day: 3, time: '15:00', platform: 'LinkedIn', title: 'Agent roster carousel' },
  { id: 's6', day: 4, time: '11:00', platform: 'Instagram', title: 'Office floor teaser' },
  { id: 's7', day: 5, time: '18:00', platform: 'TikTok', title: 'War Room clip' },
]

// ── Helpers ────────────────────────────────────────────

/** Convert API date string "2026-06-18" → DAYS index (Mon=0 … Sun=6). */
function apiDayToIndex(dayStr: string): number {
  const date = new Date(dayStr + 'T00:00:00Z')
  const jsDay = date.getUTCDay() // 0=Sun … 6=Sat
  return jsDay === 0 ? 6 : jsDay - 1
}

/** Map an API feed item to a calendar Slot. Returns null for unknown platforms. */
function feedItemToSlot(item: SchedulerFeedItem): Slot | null {
  const platform = item.platform as keyof typeof PCOLOR
  if (!(platform in PCOLOR)) return null
  return {
    id: item.id,
    day: apiDayToIndex(item.day),
    time: item.time,
    platform,
    title: item.title,
  }
}

// ── Page ───────────────────────────────────────────────

export default function SchedulerPage() {
  const { data, loading, refetch } = useLiveData<SchedulerFeed>({
    url: '/api/content-feed?type=scheduler',
    pollIntervalMs: 30000,
  })

  // Derive slots from live feed (fall back to SEED when empty).
  const liveSlots: Slot[] = useMemo(() => {
    if (!data?.items || data.items.length === 0) return SEED
    return data.items.map(feedItemToSlot).filter((s): s is Slot => s !== null)
  }, [data])

  const [slots, setSlots] = useState<Slot[]>(liveSlots)
  const [filter, setFilter] = useState<(typeof PLATFORMS)[number]>('All')
  const [dragId, setDragId] = useState<string | null>(null)
  const [overDay, setOverDay] = useState<number | null>(null)
  const [fix, setFix] = useState(false)

  // Sync local state when live data arrives (keeps drag-drop working).
  useEffect(() => {
    if (!loading && liveSlots.length > 0) {
      setSlots(liveSlots)
    }
  }, [liveSlots, loading])

  const shown = slots.filter((s) => filter === 'All' || s.platform === filter)
  const drop = (day: number) => {
    if (dragId == null) return
    setSlots((xs) => xs.map((x) => (x.id === dragId ? { ...x, day } : x)))
    setDragId(null)
    setOverDay(null)
  }

  return (
    <div>
      <PageHeader
        title="Scheduler"
        subtitle="Schedule across every platform. Drag a card to any day to balance the queue and keep your posting frequency active."
        actions={
          <>
            <button className="btn-ghost" onClick={() => refetch()}><RefreshCw size={15} /> Refine</button>
            <button className="btn-accent"><Plus size={15} /> Schedule next slot</button>
          </>
        }
      />

      {/* platform filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition"
            style={filter === p ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' } : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }}
          >
            {p !== 'All' && <span className="h-2 w-2 rounded-full" style={{ background: PCOLOR[p] }} />}
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_280px]">
        {/* calendar */}
        <div className="scroll-x overflow-x-auto">
          <div className="grid min-w-[760px] grid-cols-7 gap-2">
            {DAYS.map((d, di) => (
              <div
                key={d}
                onDragOver={(e) => { e.preventDefault(); setOverDay(di) }}
                onDragLeave={() => setOverDay((o) => (o === di ? null : o))}
                onDrop={() => drop(di)}
                className="min-h-[340px] rounded-xl border p-2 transition"
                style={{ borderColor: overDay === di ? 'var(--ws-glow)' : 'rgba(255,255,255,0.06)', background: overDay === di ? 'var(--ws-accent-soft)' : 'rgba(255,255,255,0.02)' }}
              >
                <p className="mb-2 px-1 text-[11px] font-semibold text-on-surface-variant">{d}</p>
                <div className="space-y-2">
                  {shown
                    .filter((s) => s.day === di)
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((s) => (
                      <div
                        key={s.id}
                        draggable
                        onDragStart={() => setDragId(s.id)}
                        onDragEnd={() => { setDragId(null); setOverDay(null) }}
                        className="cursor-grab rounded-lg border border-white/8 bg-surface-container p-2 active:cursor-grabbing"
                        style={{ borderLeft: `3px solid ${PCOLOR[s.platform]}` }}
                      >
                        <p className="text-[11px] font-medium text-on-surface">{s.title}</p>
                        <p className="mt-0.5 text-[10px] text-on-surface-variant">{s.time} · {s.platform}</p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* rails */}
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-on-surface">
              <AlertTriangle size={15} className="text-tertiary" /> Failure triage
            </h4>
            <div className="rounded-xl bg-tertiary/10 p-3">
              <p className="text-[12px] text-on-surface">A LinkedIn post didn't go out — token expired.</p>
              <p className="mt-0.5 text-[11px] text-on-surface-variant">"Agent roster carousel" · 401 auth</p>
              <div className="mt-2 flex gap-2">
                <button className="btn-accent !py-1 !text-[11px]" onClick={() => setFix(true)}><RotateCw size={12} /> Reauthorize</button>
                <button className="btn-ghost !py-1 !text-[11px]"><Wrench size={12} /> Create fix task</button>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <h4 className="mb-3 text-sm font-semibold text-on-surface">Publishing engine</h4>
            <div className="space-y-2.5 text-[12px]">
              <div className="flex items-center justify-between"><span className="text-on-surface-variant">Status</span><StatusBadge tone="green">Active</StatusBadge></div>
              <div className="flex items-center justify-between"><span className="text-on-surface-variant">Connected accounts</span><span className="text-on-surface">4 / 4</span></div>
              <div className="flex items-center justify-between"><span className="text-on-surface-variant">Next post</span><span className="text-on-surface">Mon 09:00</span></div>
              <div className="flex items-center justify-between"><span className="text-on-surface-variant">Queued this week</span><span className="text-on-surface">{slots.length}</span></div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={fix}
        onClose={() => setFix(false)}
        title="Reauthorize LinkedIn"
        subtitle="Posting requires a fresh token"
        footer={
          <>
            <button className="btn-ghost !py-1.5 !text-xs" onClick={() => setFix(false)}>Cancel</button>
            <button className="btn-accent !py-1.5 !text-xs" onClick={() => setFix(false)}>I'll reconnect</button>
          </>
        }
      >
        <p className="text-[13px] text-on-surface-variant">
          For your security, connecting an account is something you do yourself. Open LinkedIn settings to grant access again, then the failed post will retry automatically.
        </p>
      </Modal>
    </div>
  )
}
