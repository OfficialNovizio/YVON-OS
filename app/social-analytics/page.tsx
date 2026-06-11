'use client'

import {
  BarChart3,
  TrendingUp,
  MessageCircle,
  Heart,
  Share2,
  Eye,
  Target,
  Layers,
} from 'lucide-react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'

// ── Types ───────────────────────────────────────────────────────────────────
type PlatformKpi = {
  platform: string
  impressions: number
  engagementRate: number
  followerGrowth: number
}

type TopPost = {
  id: string
  platform: string
  preview: string
  impressions: number
  engagement: number
  clicks: number
}

type AbTest = {
  id: string
  label: string
  variantAWon: boolean
  liftPct: number
  metric: string
  detail: string
}

type DailyEngagement = {
  day: string
  linkedin: number
  instagram: number
  tiktok: number
  youtube: number
}

type FrequencyRow = {
  platform: string
  postsPerWeek: number
  engagementTrend: 'up' | 'down' | 'flat'
  changePct: number
}

type SocialData = {
  platformKpis: PlatformKpi[]
  topPosts: TopPost[]
  abTests: AbTest[]
  dailyEngagement: DailyEngagement[]
  frequencyRows: FrequencyRow[]
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const MOCK: SocialData = {
  platformKpis: [
    { platform: 'LinkedIn', impressions: 142_000, engagementRate: 5.1, followerGrowth: 22 },
    { platform: 'Instagram', impressions: 384_000, engagementRate: 3.2, followerGrowth: 8 },
    { platform: 'TikTok', impressions: 1_240_000, engagementRate: 7.4, followerGrowth: 35 },
    { platform: 'YouTube', impressions: 276_000, engagementRate: 4.8, followerGrowth: 12 },
  ],
  topPosts: [
    {
      id: '1',
      platform: 'TikTok',
      preview: 'POV: when your AI agent ships a feature before the standup meeting… the team went wild 🔥',
      impressions: 487_000,
      engagement: 36_200,
      clicks: 14_800,
    },
    {
      id: '2',
      platform: 'LinkedIn',
      preview: 'We ran 1 200 A/B tests last quarter. Here are the 3 patterns that actually moved revenue.',
      impressions: 128_000,
      engagement: 6_540,
      clicks: 4_210,
    },
    {
      id: '3',
      platform: 'Instagram',
      preview: 'New Novizio drop — modular blazers designed to be worn 5 different ways. Swipe to see all fits.',
      impressions: 213_000,
      engagement: 12_800,
      clicks: 8_900,
    },
    {
      id: '4',
      platform: 'YouTube',
      preview: 'Building a real-time analytics pipeline in 14 minutes — from Supabase to glass dashboard.',
      impressions: 94_000,
      engagement: 4_120,
      clicks: 3_050,
    },
  ],
  abTests: [
    {
      id: 'ab-1',
      label: 'Copy: LinkedIn Thought-Leadership',
      variantAWon: true,
      liftPct: 18.4,
      metric: 'CTR',
      detail: 'Data-backed headline ("1 200 A/B tests") beat the curiosity-gap version by +18.4% CTR.',
    },
    {
      id: 'ab-2',
      label: 'Image: Instagram Carousel vs Single',
      variantAWon: false,
      liftPct: 12.7,
      metric: 'Engagement',
      detail: 'Single hero image outperformed the 5-slide carousel by +12.7% engagement — counter-intuitive win.',
    },
  ],
  dailyEngagement: [
    { day: 'Mon', linkedin: 420, instagram: 680, tiktok: 2100, youtube: 340 },
    { day: 'Tue', linkedin: 510, instagram: 720, tiktok: 1950, youtube: 380 },
    { day: 'Wed', linkedin: 480, instagram: 890, tiktok: 2400, youtube: 410 },
    { day: 'Thu', linkedin: 390, instagram: 760, tiktok: 1800, youtube: 360 },
    { day: 'Fri', linkedin: 350, instagram: 640, tiktok: 1600, youtube: 290 },
    { day: 'Sat', linkedin: 180, instagram: 550, tiktok: 2200, youtube: 420 },
    { day: 'Sun', linkedin: 120, instagram: 510, tiktok: 1900, youtube: 450 },
  ],
  frequencyRows: [
    { platform: 'TikTok', postsPerWeek: 7, engagementTrend: 'up', changePct: 14.2 },
    { platform: 'Instagram', postsPerWeek: 5, engagementTrend: 'flat', changePct: 1.1 },
    { platform: 'LinkedIn', postsPerWeek: 3, engagementTrend: 'up', changePct: 22.8 },
    { platform: 'YouTube', postsPerWeek: 2, engagementTrend: 'down', changePct: -4.3 },
  ],
}

// ── Platform helpers ────────────────────────────────────────────────────────
const PLATFORM_COLORS: Record<string, string> = {
  LinkedIn: '#0A66C2',
  Instagram: '#E1306C',
  TikTok: '#00F2EA',
  YouTube: '#FF0000',
}

const PLATFORM_ICONS: Record<string, string> = {
  LinkedIn: 'linkedin',
  Instagram: 'instagram',
  TikTok: 'tiktok',
  YouTube: 'youtube',
}

function platformIcon(platform: string) {
  const i = PLATFORM_ICONS[platform] ?? 'public'
  return (
    <span className="material-symbols-outlined text-base" style={{ color: PLATFORM_COLORS[platform] }}>
      {i === 'linkedin' ? 'work' : i === 'instagram' ? 'photo_camera' : i === 'tiktok' ? 'music_note' : 'play_circle'}
    </span>
  )
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PlatformKpiCard({ kpi }: { kpi: PlatformKpi }) {
  const color = PLATFORM_COLORS[kpi.platform] ?? '#888'
  return (
    <Card className="p-5 flex flex-col gap-4">
      {/* Platform label */}
      <div className="flex items-center gap-2.5">
        {platformIcon(kpi.platform)}
        <span className="text-sm font-semibold text-on-surface">{kpi.platform}</span>
      </div>

      {/* Impressions — big number */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant/50 mb-1">
          Impressions
        </p>
        <p className="text-2xl font-bold tracking-tight text-on-surface">
          {formatCompact(kpi.impressions)}
        </p>
      </div>

      {/* Engagement rate + follower growth side-by-side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Heart className="h-3 w-3 text-rose-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant/50">
              Eng. Rate
            </span>
          </div>
          <p className="text-lg font-bold text-on-surface">{kpi.engagementRate}%</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant/50">
              Growth
            </span>
          </div>
          <p className="text-lg font-bold text-on-surface">
            +{kpi.followerGrowth}%
          </p>
        </div>
      </div>

      {/* Mini progress bar */}
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(kpi.engagementRate * 10, 100)}%`,
            background: color,
          }}
        />
      </div>
    </Card>
  )
}

function TopPostCard({ post }: { post: TopPost }) {
  const color = PLATFORM_COLORS[post.platform] ?? '#888'
  return (
    <Card hover className="p-5 flex flex-col gap-4">
      {/* Platform badge */}
      <div className="flex items-center gap-2">
        {platformIcon(post.platform)}
        <span
          className="text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
          style={{ background: color + '18', color, border: `1px solid ${color}33` }}
        >
          {post.platform}
        </span>
      </div>

      {/* Post preview */}
      <p className="text-[13px] leading-relaxed text-on-surface line-clamp-3">
        {post.preview}
      </p>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2 mt-auto pt-3 border-t border-white/[0.06]">
        <div className="flex flex-col items-center gap-0.5">
          <Eye className="h-3.5 w-3.5 text-on-surface-variant/50" />
          <span className="text-xs font-semibold text-on-surface">{formatCompact(post.impressions)}</span>
          <span className="text-[10px] text-on-surface-variant/50">Impr.</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Heart className="h-3.5 w-3.5 text-rose-400/70" />
          <span className="text-xs font-semibold text-on-surface">{formatCompact(post.engagement)}</span>
          <span className="text-[10px] text-on-surface-variant/50">Eng.</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Share2 className="h-3.5 w-3.5 text-on-surface-variant/50" />
          <span className="text-xs font-semibold text-on-surface">{formatCompact(post.clicks)}</span>
          <span className="text-[10px] text-on-surface-variant/50">Clicks</span>
        </div>
      </div>
    </Card>
  )
}

function AbTestCard({ test }: { test: AbTest }) {
  return (
    <Card className="p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold text-on-surface">{test.label}</span>
      </div>

      {/* Winner badge */}
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-bold uppercase tracking-[0.1em] px-3 py-1 rounded-full"
          style={{
            background: test.variantAWon
              ? 'rgba(74, 222, 128, 0.12)'
              : 'rgba(255, 184, 108, 0.12)',
            color: test.variantAWon ? '#4ade80' : '#ffb86c',
            border: `1px solid ${test.variantAWon ? 'rgba(74, 222, 128, 0.25)' : 'rgba(255, 184, 108, 0.25)'}`,
          }}
        >
          {test.variantAWon ? 'Variant A won' : 'Variant B won'}
        </span>
        <StatusBadge tone="green">
          +{test.liftPct}% lift
        </StatusBadge>
      </div>

      {/* Detail */}
      <p className="text-[13px] leading-relaxed text-on-surface-variant">{test.detail}</p>

      {/* Metric pill */}
      <div className="flex items-center gap-1.5 mt-auto">
        <BarChart3 className="h-3.5 w-3.5 text-accent/60" />
        <span className="text-[11px] font-medium text-on-surface-variant/60">
          Metric: <span className="text-on-surface-variant">{test.metric}</span>
        </span>
      </div>
    </Card>
  )
}

function EngagementBarChart({ data }: { data: DailyEngagement[] }) {
  const maxVal = Math.max(
    ...data.map((d) => d.linkedin + d.instagram + d.tiktok + d.youtube),
    1,
  )

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-on-surface">Engagement Over Time</h3>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-5">
        {(['LinkedIn', 'Instagram', 'TikTok', 'YouTube'] as const).map((p) => (
          <div key={p} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: PLATFORM_COLORS[p] }}
            />
            <span className="text-[11px] text-on-surface-variant">{p}</span>
          </div>
        ))}
      </div>

      {/* Bars */}
      <div className="flex items-end justify-between gap-2 h-44">
        {data.map((d) => {
          const total = d.linkedin + d.instagram + d.tiktok + d.youtube
          const heightPct = (total / maxVal) * 100
          return (
            <div key={d.day} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              {/* Stacked bar */}
              <div
                className="w-full max-w-[48px] rounded-t-md overflow-hidden flex flex-col justify-end"
                style={{ height: '100%' }}
              >
                <div
                  className="w-full flex flex-col justify-end transition-all duration-500"
                  style={{ height: `${heightPct}%` }}
                >
                  {(['youtube', 'tiktok', 'instagram', 'linkedin'] as const).map((key) => {
                    const h = (d[key] / total) * 100
                    return (
                      <div
                        key={key}
                        style={{
                          height: `${h}%`,
                          background: PLATFORM_COLORS[key === 'linkedin' ? 'LinkedIn' : key === 'instagram' ? 'Instagram' : key === 'tiktok' ? 'TikTok' : 'YouTube'],
                        }}
                      />
                    )
                  })}
                </div>
              </div>
              {/* Day label */}
              <span className="text-[10px] font-medium text-on-surface-variant/60">
                {d.day}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function FrequencyTable({ rows }: { rows: FrequencyRow[] }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-on-surface">
          Posting Frequency vs Results
        </h3>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-4 gap-3 pb-2 mb-2 border-b border-white/[0.06]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant/50">
          Platform
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant/50 text-center">
          Posts/wk
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant/50 text-center">
          Trend
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant/50 text-right">
          Δ Change
        </span>
      </div>

      {/* Table rows */}
      <div className="flex flex-col gap-1">
        {rows.map((row) => (
          <div
            key={row.platform}
            className="grid grid-cols-4 gap-3 py-2.5 items-center rounded-lg hover:bg-white/[0.03] transition-colors"
          >
            {/* Platform name */}
            <div className="flex items-center gap-2">
              {platformIcon(row.platform)}
              <span className="text-[13px] font-medium text-on-surface">{row.platform}</span>
            </div>

            {/* Posts per week */}
            <span className="text-[13px] font-semibold text-on-surface text-center">
              {row.postsPerWeek}
            </span>

            {/* Trend */}
            <span className="flex justify-center">
              {row.engagementTrend === 'up' ? (
                <StatusBadge tone="green">
                  <TrendingUp className="h-3 w-3" /> Up
                </StatusBadge>
              ) : row.engagementTrend === 'down' ? (
                <StatusBadge tone="red">
                  <TrendingUp className="h-3 w-3 rotate-180" /> Down
                </StatusBadge>
              ) : (
                <StatusBadge tone="muted">Flat</StatusBadge>
              )}
            </span>

            {/* Change % */}
            <span
              className={`text-[13px] font-semibold text-right ${
                row.changePct > 0
                  ? 'text-emerald-400'
                  : row.changePct < 0
                    ? 'text-red-400'
                    : 'text-on-surface-variant'
              }`}
            >
              {row.changePct > 0 ? '+' : ''}
              {row.changePct}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function SocialAnalyticsPage() {
  const { data } = useLiveData<SocialData>({
    url: '/api/social-stats',
    mockData: MOCK,
  })

  const d = data ?? MOCK

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <PageHeader
        title="Social Analytics"
        subtitle="Cross-platform performance — what's working per platform"
        actions={
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-accent/60" />
            <span className="text-[11px] font-medium text-on-surface-variant/60">
              Last 7 days
            </span>
            <div className="live-dot" />
          </div>
        }
      />

      {/* ── Platform KPI Cards ───────────────────────────────── */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant/60">
          Platform Breakdown
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.platformKpis.map((kpi) => (
            <PlatformKpiCard key={kpi.platform} kpi={kpi} />
          ))}
        </div>
      </section>

      {/* ── Top Posts Grid ────────────────────────────────────── */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant/60">
          Top Performing Posts
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.topPosts.map((post) => (
            <TopPostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      {/* ── A/B Test Results ──────────────────────────────────── */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant/60">
          A/B Test Results
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {d.abTests.map((test) => (
            <AbTestCard key={test.id} test={test} />
          ))}
        </div>
      </section>

      {/* ── Engagement Chart + Frequency Table ────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <EngagementBarChart data={d.dailyEngagement} />
        </div>
        <div className="lg:col-span-2">
          <FrequencyTable rows={d.frequencyRows} />
        </div>
      </div>
    </div>
  )
}
