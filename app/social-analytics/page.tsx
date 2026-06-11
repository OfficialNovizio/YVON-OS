'use client'

import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'

type PlatformStats = { platform: string; followers: number; engagement: number; posts: number; growth: number }

const MOCK: PlatformStats[] = [
  { platform: 'Instagram', followers: 5200, engagement: 3.2, posts: 84, growth: 8 },
  { platform: 'LinkedIn', followers: 1800, engagement: 5.1, posts: 42, growth: 22 },
  { platform: 'TikTok', followers: 12000, engagement: 7.4, posts: 56, growth: 35 },
  { platform: 'YouTube', followers: 2840, engagement: 4.8, posts: 38, growth: 12 },
]

export default function SocialAnalyticsPage() {
  const { data } = useLiveData<{ platforms: PlatformStats[] }>({
    url: '/api/social-stats',
    mockData: { platforms: MOCK },
  })
  const platforms = data?.platforms ?? MOCK

  return (
    <div>
      <PageHeader title="Social Analytics" subtitle="Cross-platform performance — followers, engagement, and growth." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {platforms.map((p) => (
          <Card key={p.platform} className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-on-surface">{p.platform}</h3>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between"><span className="text-on-surface-variant">Followers</span><span className="text-on-surface">{(p.followers).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Engagement</span><span className="text-on-surface">{p.engagement}%</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Posts</span><span className="text-on-surface">{p.posts}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Growth</span><StatusBadge tone={p.growth > 10 ? 'green' : 'yellow'}>+{p.growth}%</StatusBadge></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
