import DataCard from '@/components/DataCard'
import type { InstagramStats, YouTubeStats, LinkedInStats } from '@/lib/types'

type Platform = 'instagram' | 'youtube' | 'linkedin'
type SocialStats = InstagramStats | YouTubeStats | LinkedInStats

interface SocialPlatformCardProps {
  platform: Platform
  stats: SocialStats | null
  onRefresh: () => Promise<void>
  isLoading: boolean
}

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  youtube:   'YouTube',
  linkedin:  'LinkedIn',
}

const PLATFORM_ICONS: Record<Platform, string> = {
  instagram: '📸',
  youtube:   '▶️',
  linkedin:  '💼',
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: 'rgba(15,52,96,0.3)' }}>
      <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  )
}

function InstagramContent({ stats }: { stats: InstagramStats }) {
  return (
    <div>
      <StatRow label="Followers"  value={stats.followers} />
      <StatRow label="Following"  value={stats.following} />
      <StatRow label="Posts"      value={stats.posts} />
    </div>
  )
}

function YouTubeContent({ stats }: { stats: YouTubeStats }) {
  return (
    <div>
      <StatRow label="Subscribers" value={stats.subscribers} />
      <StatRow label="Total Views" value={stats.totalViews} />
      <StatRow label="Videos"      value={stats.videoCount} />
      {stats.latestVideos.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
            Latest Videos
          </p>
          <ul className="flex flex-col gap-1.5">
            {stats.latestVideos.map((v) => (
              <li key={v.id} className="flex justify-between gap-2 text-xs">
                <span className="truncate" style={{ color: 'var(--color-text)' }}>{v.title}</span>
                <span className="shrink-0" style={{ color: 'var(--color-muted)' }}>
                  {v.views.toLocaleString()} views
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function LinkedInContent({ stats }: { stats: LinkedInStats }) {
  return (
    <div>
      <StatRow label="Followers"    value={stats.followers} />
      <StatRow label="Connections"  value={stats.connections} />
    </div>
  )
}

function EmptyState({ platform }: { platform: Platform }) {
  return (
    <p className="text-sm py-4 text-center" style={{ color: 'var(--color-muted)' }}>
      No data yet — hit refresh to load {PLATFORM_LABELS[platform]} stats.
    </p>
  )
}

export default function SocialPlatformCard({
  platform,
  stats,
  onRefresh,
  isLoading,
}: SocialPlatformCardProps) {
  return (
    <DataCard
      title={`${PLATFORM_ICONS[platform]} ${PLATFORM_LABELS[platform]}`}
      lastFetched={stats?.lastFetched}
      onRefresh={onRefresh}
      isLoading={isLoading}
    >
      {!stats ? (
        <EmptyState platform={platform} />
      ) : platform === 'instagram' ? (
        <InstagramContent stats={stats as InstagramStats} />
      ) : platform === 'youtube' ? (
        <YouTubeContent stats={stats as YouTubeStats} />
      ) : (
        <LinkedInContent stats={stats as LinkedInStats} />
      )}
    </DataCard>
  )
}
