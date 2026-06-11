import { PageHeader, StatusBadge, Card } from '@/components/ui'
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ITEMS: Record<number, { t: string; stage: string; tone: 'yellow' | 'blue' | 'green' }[]> = {
  1: [{ t: 'Film: 10 agents that ship code', stage: 'Filming', tone: 'blue' }],
  3: [{ t: 'Edit: memory system video', stage: 'Editing', tone: 'yellow' }],
  4: [{ t: 'Thumbnail review', stage: 'Thumbnails', tone: 'yellow' }],
  6: [{ t: 'Publish: Claude ran my business', stage: 'Publish', tone: 'green' }],
}
export default function ProductionCalendarPage() {
  return (
    <div>
      <PageHeader title="Production Calendar" subtitle="The long-form machine by date — when each video is scripted, filmed, edited and published." actions={<StatusBadge tone="green">On cadence · 1/week</StatusBadge>} />
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((d, di) => (
            <div key={d} className="min-h-[180px] rounded-xl border border-white/6 bg-white/[0.02] p-2">
              <p className="mb-2 text-[11px] font-semibold text-on-surface-variant">{d}</p>
              {(ITEMS[di] || []).map((it) => (
                <div key={it.t} className="mb-1.5 rounded-lg border border-white/8 bg-surface-container p-2">
                  <p className="text-[11px] text-on-surface">{it.t}</p>
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
