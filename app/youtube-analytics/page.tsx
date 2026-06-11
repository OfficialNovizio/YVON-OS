'use client'

import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'

type YTAnalytics = {
  subscribers?: number; totalViews?: number; videoCount?: number
  latestVideos?: { title: string; views: string; ctr?: string }[]
  source?: string
}

const MOCK: YTAnalytics = {
  subscribers: 2140, totalViews: 312000, videoCount: 38,
  latestVideos: [
    { title: 'Building my Mission Control, part 1', views: '128k', ctr: '8.1%' },
    { title: 'The memory system that runs my agents', views: '74k', ctr: '7.2%' },
    { title: 'I fired my dashboards for a cockpit', views: '52k', ctr: '6.6%' },
  ],
}

export default function YouTubeAnalyticsPage() {
  const { data } = useLiveData<YTAnalytics>({
    url: '/api/youtube?ventureId=novizio',
    mockData: MOCK,
    pollIntervalMs: 120000,
  })
  const d = data ?? MOCK
  const subs = (d.subscribers ?? 0).toLocaleString()
  const views = d.totalViews ? `${(d.totalViews / 1000).toFixed(0)}k` : '0'
  const vids = d.latestVideos ?? MOCK.latestVideos!

  return (
    <div>
      <PageHeader title="YouTube Analytics" subtitle="Long-form channel performance — feeds ideas and titling back into the pipeline." />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Views (28d)', views, '+18%'],
          ['Subscribers', subs, '+12%'],
          ['Videos', String(d.videoCount ?? 38), ''],
          ['Source', d.source === 'live' ? 'Live' : 'Cached', d.source === 'live' ? '●' : '○'],
        ].map(([k, v, tag]) => (
          <Card key={k} className="p-4">
            <p className="text-[12px] text-on-surface-variant">{k}</p>
            <p className="text-2xl font-bold text-on-surface">{v}</p>
            {tag && <StatusBadge tone="green">{tag}</StatusBadge>}
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <h4 className="mb-3 text-sm font-semibold text-on-surface">Top videos</h4>
        {vids.map((v) => (
          <div key={v.title} className="border-b border-white/6 py-2.5 last:border-0">
            <p className="text-[13px] text-on-surface">{v.title}</p>
            <p className="text-[11px] text-on-surface-variant">{v.views} views{v.ctr ? ` · ${v.ctr} CTR` : ''}</p>
          </div>
        ))}
      </Card>
    </div>
  )
}
