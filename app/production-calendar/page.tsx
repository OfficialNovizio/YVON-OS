'use client'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type Slot = { id: string; day: number; stage: string; tone: 'yellow' | 'blue' | 'green'; title: string }

const MOCK: Record<number, Slot[]> = {
  1: [{ id: 'c1', day: 1, stage: 'Filming', tone: 'blue', title: 'Film: 10 agents that ship code' }],
  3: [{ id: 'c3', day: 3, stage: 'Editing', tone: 'yellow', title: 'Edit: memory system video' }],
  4: [{ id: 'c4', day: 4, stage: 'Thumbnails', tone: 'yellow', title: 'Thumbnail review' }],
  6: [{ id: 'c6', day: 6, stage: 'Publish', tone: 'green', title: 'Publish: Claude ran my business' }],
}

export default function ProductionCalendarPage() {
  const { data } = useLiveData<{ items: Slot[] }>({
    url: '/api/content-feed?type=calendar',
    mockData: { items: Object.values(MOCK).flat() },
  })

  // Derive ITEMS from data
  const items: Record<number, Slot[]> = {}
  for (const item of (data?.items ?? Object.values(MOCK).flat())) {
    if (!items[item.day]) items[item.day] = []
    items[item.day].push(item)
  }

  return (
    <div>
      <PageHeader title="Production Calendar" subtitle="The long-form machine by date — when each video is scripted, filmed, edited and published." actions={<StatusBadge tone="green">On cadence · 1/week</StatusBadge>} />
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((d, di) => (
            <div key={d} className="min-h-[180px] rounded-xl border border-white/6 bg-white/[0.02] p-2">
              <p className="mb-2 text-[11px] font-semibold text-on-surface-variant">{d}</p>
              {(items[di] || []).map((it) => (
                <div key={it.id} className="mb-1.5 rounded-lg border border-white/8 bg-surface-container p-2">
                  <p className="text-[11px] text-on-surface">{it.title}</p>
                  <StatusBadge tone={it.tone}>{it.stage}</StatusBadge>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
