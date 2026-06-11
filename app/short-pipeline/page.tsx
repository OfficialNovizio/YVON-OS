'use client'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'

type ShortItem = { id: string; title: string; stage: string; platform: string; tone: 'blue' | 'yellow' | 'green' }

const MOCK: ShortItem[] = [
  { id: 'sh1', title: 'Decision Queue in 60s', stage: 'Editing', platform: 'TikTok', tone: 'yellow' },
  { id: 'sh2', title: 'Agent memory explained', stage: 'Ready', platform: 'YouTube', tone: 'green' },
  { id: 'sh3', title: 'Office floor tour', stage: 'Ideas', platform: 'Instagram', tone: 'blue' },
]

const STAGES = ['Ideas', 'Filming', 'Editing', 'Ready', 'Posted']

export default function ShortPipelinePage() {
  const { data } = useLiveData<{ items: ShortItem[] }>({
    url: '/api/content-feed?type=shorts',
    mockData: { items: MOCK },
    pollIntervalMs: 30000,
  })
  const items = data?.items ?? MOCK

  return (
    <div>
      <PageHeader title="Short Pipeline" subtitle="Short-form content from idea to posted — one pipeline per platform." />
      <div className="space-y-4">
        {STAGES.map((stage) => {
          const stageItems = items.filter((i) => i.stage === stage)
          return (
            <div key={stage}>
              <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant">{stage} ({stageItems.length})</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {stageItems.map((item) => (
                  <Card key={item.id} className="p-3">
                    <p className="text-[13px] font-medium text-on-surface">{item.title}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StatusBadge tone={item.tone}>{item.platform}</StatusBadge>
                    </div>
                  </Card>
                ))}
                {stageItems.length === 0 && <p className="text-[12px] text-on-surface-variant col-span-full py-2">No shorts in this stage</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
