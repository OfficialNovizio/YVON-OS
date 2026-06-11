'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, BarChart3, Eye, Clock, MousePointerClick, Users } from 'lucide-react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'

// ── Types ────────────────────────────────────────────────────────────────────

type DailyViews = { date: string; views: number }

type Video = {
  id: string
  title: string
  thumbnail: string
  views: number
  watchTimeHours: number
  ctr: number
  retention: number
  publishedDate: string
}

type YTAnalytics = {
  totalViews: number
  watchTimeHours: number
  subscribersGained: number
  avgCtr: number
  viewsTrend: number // percentage change
  watchTimeTrend: number
  subsTrend: number
  ctrTrend: number
  dailyViews: DailyViews[]
  videos: Video[]
  topVideo?: Video & { insight: string }
  source?: string
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK: YTAnalytics = {
  totalViews: 1_284_000,
  watchTimeHours: 42_310,
  subscribersGained: 2_140,
  avgCtr: 7.4,
  viewsTrend: 18.2,
  watchTimeTrend: 12.5,
  subsTrend: 8.7,
  ctrTrend: -1.3,
  dailyViews: generateDailyViews(30),
  videos: [
    {
      id: 'v1',
      title: 'I gave an AI my entire YVON codebase for 30 days',
      thumbnail: '',
      views: 312_000,
      watchTimeHours: 9_840,
      ctr: 9.2,
      retention: 62,
      publishedDate: '2026-05-28',
    },
    {
      id: 'v2',
      title: 'The memory system that runs my 13 AI agents',
      thumbnail: '',
      views: 187_500,
      watchTimeHours: 6_220,
      ctr: 7.8,
      retention: 54,
      publishedDate: '2026-05-21',
    },
    {
      id: 'v3',
      title: 'Building my Mission Control — part 1',
      thumbnail: '',
      views: 128_400,
      watchTimeHours: 5_110,
      ctr: 8.1,
      retention: 58,
      publishedDate: '2026-05-15',
    },
    {
      id: 'v4',
      title: 'I fired my dashboards for a cockpit',
      thumbnail: '',
      views: 95_200,
      watchTimeHours: 3_880,
      ctr: 6.9,
      retention: 49,
      publishedDate: '2026-05-08',
    },
    {
      id: 'v5',
      title: 'How I ship 10x faster with AI agents (no bs)',
      thumbnail: '',
      views: 74_300,
      watchTimeHours: 3_020,
      ctr: 7.2,
      retention: 51,
      publishedDate: '2026-05-01',
    },
    {
      id: 'v6',
      title: 'The real cost of running 13 AI agents 24/7',
      thumbnail: '',
      views: 66_800,
      watchTimeHours: 2_540,
      ctr: 6.4,
      retention: 45,
      publishedDate: '2026-04-24',
    },
    {
      id: 'v7',
      title: 'Why I switched from SaaS to AI-native architecture',
      thumbnail: '',
      views: 52_100,
      watchTimeHours: 1_980,
      ctr: 6.6,
      retention: 42,
      publishedDate: '2026-04-17',
    },
    {
      id: 'v8',
      title: 'Debugging AI agents in production (war stories)',
      thumbnail: '',
      views: 41_900,
      watchTimeHours: 1_610,
      ctr: 5.8,
      retention: 38,
      publishedDate: '2026-04-10',
    },
  ],
  topVideo: {
    id: 'v1',
    title: 'I gave an AI my entire YVON codebase for 30 days',
    thumbnail: '',
    views: 312_000,
    watchTimeHours: 9_840,
    ctr: 9.2,
    retention: 62,
    publishedDate: '2026-05-28',
    insight: 'This title pattern won: "I gave X to AI for Y days" — high curiosity gap, personal stakes, clear timeframe.',
  },
}

function generateDailyViews(days: number): DailyViews[] {
  const result: DailyViews[] = []
  let views = 28_000 + Math.floor(Math.random() * 12_000)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().split('T')[0]
    // gentle random walk
    views = views + Math.floor((Math.random() - 0.45) * 6_000)
    if (views < 8_000) views = 8_000
    if (views > 65_000) views = 65_000
    result.push({ date, views })
  }
  return result
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: 'All time', days: Infinity },
] as const

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

function formatHours(h: number): string {
  if (h >= 1_000) return `${(h / 1_000).toFixed(1)}k`
  return h.toLocaleString()
}

// ── Page component ───────────────────────────────────────────────────────────

export default function YouTubeAnalyticsPage() {
  const { data } = useLiveData<YTAnalytics>({
    url: '/api/youtube?ventureId=novizio',
    mockData: MOCK,
    pollIntervalMs: 120_000,
  })

  const d = data ?? MOCK

  const [dateRange, setDateRange] = useState<'7 days' | '30 days' | '90 days' | 'All time'>('30 days')
  const [sortKey, setSortKey] = useState<'views' | 'watchTimeHours' | 'ctr' | 'retention'>('views')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const selectedDays = DATE_RANGES.find((r) => r.label === dateRange)!.days
  const chartDays = d.dailyViews.slice(-Math.min(selectedDays, d.dailyViews.length))
  const maxChartViews = Math.max(...chartDays.map((p) => p.views), 1)

  const sortedVideos = useMemo(() => {
    const vids = [...(d.videos ?? [])]
    vids.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'desc' ? bVal - aVal : aVal - bVal
      }
      return 0
    })
    return vids
  }, [d.videos, sortKey, sortDir])

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortIcon = (key: typeof sortKey) => {
    if (sortKey !== key) return ''
    return sortDir === 'desc' ? ' ↓' : ' ↑'
  }

  const kpis = [
    {
      label: 'Total views',
      value: formatNumber(d.totalViews ?? 0),
      trend: `${d.viewsTrend >= 0 ? '+' : ''}${d.viewsTrend.toFixed(1)}%`,
      icon: Eye,
      tone: d.viewsTrend >= 0 ? 'green' : 'red',
    },
    {
      label: 'Watch time',
      value: `${formatHours(d.watchTimeHours ?? 0)} hrs`,
      trend: `${d.watchTimeTrend >= 0 ? '+' : ''}${d.watchTimeTrend.toFixed(1)}%`,
      icon: Clock,
      tone: d.watchTimeTrend >= 0 ? 'green' : 'red',
    },
    {
      label: 'Subs gained',
      value: formatNumber(d.subscribersGained ?? 0),
      trend: `${d.subsTrend >= 0 ? '+' : ''}${d.subsTrend.toFixed(1)}%`,
      icon: Users,
      tone: d.subsTrend >= 0 ? 'green' : 'red',
    },
    {
      label: 'Avg CTR',
      value: `${(d.avgCtr ?? 0).toFixed(1)}%`,
      trend: `${d.ctrTrend >= 0 ? '+' : ''}${d.ctrTrend.toFixed(1)}%`,
      icon: MousePointerClick,
      tone: d.ctrTrend >= 0 ? 'green' : 'red',
    },
  ] as const

  return (
    <div>
      {/* ── Page header ────────────────────────────────────────────────── */}
      <PageHeader
        title="YouTube Analytics"
        subtitle="Long-form performance — views, retention, CTR, subscribers per video"
        actions={
          <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] p-1">
            {DATE_RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setDateRange(r.label)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  dateRange === r.label
                    ? 'bg-white/10 text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {/* ── KPI Row ────────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-on-surface-variant" />
                <p className="text-[12px] text-on-surface-variant">{kpi.label}</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-on-surface">{kpi.value}</p>
                <StatusBadge
                  tone={
                    kpi.tone === 'green'
                      ? 'green'
                      : kpi.tone === 'red'
                        ? 'red'
                        : 'muted'
                  }
                >
                  {kpi.trend}
                </StatusBadge>
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── Chart + Top Performer ──────────────────────────────────────── */}
      <div className="mb-6 grid gap-3 lg:grid-cols-3">
        {/* Chart area */}
        <Card className="p-4 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-on-surface-variant" />
              <h3 className="text-sm font-semibold text-on-surface">Daily views · Last {dateRange}</h3>
            </div>
            <p className="text-[11px] text-on-surface-variant/60">
              Peak: {formatNumber(maxChartViews)}
            </p>
          </div>

          {/* CSS-only bar chart */}
          <div className="flex items-end gap-1 h-44">
            {chartDays.map((day) => {
              const pct = (day.views / maxChartViews) * 100
              const barColor =
                pct >= 80
                  ? 'bg-primary/70'
                  : pct >= 50
                    ? 'bg-primary/50'
                    : 'bg-primary/30'
              return (
                <div
                  key={day.date}
                  className="group relative flex flex-1 flex-col items-center"
                  title={`${day.date}: ${day.views.toLocaleString()} views`}
                >
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 hover:brightness-125 ${barColor}`}
                    style={{ height: `${Math.max(pct, 2)}%` }}
                  />
                  {/* Date label every 5th bar */}
                  {chartDays.indexOf(day) % Math.ceil(chartDays.length / 6) === 0 && (
                    <span className="mt-1.5 text-[9px] text-on-surface-variant/50 whitespace-nowrap">
                      {day.date.slice(5)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Top performer card */}
        {d.topVideo && (
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-on-surface">Top Performer</h3>
            </div>

            {/* Thumbnail placeholder */}
            <div className="mb-3 aspect-video w-full rounded-lg bg-white/[0.04] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">
                smart_display
              </span>
            </div>

            <p className="mb-1 text-[13px] font-semibold text-on-surface leading-snug">
              {d.topVideo.title}
            </p>

            <div className="mb-3 flex flex-wrap gap-1.5">
              <StatusBadge tone="green">{formatNumber(d.topVideo.views)} views</StatusBadge>
              <StatusBadge tone="blue">{d.topVideo.ctr.toFixed(1)}% CTR</StatusBadge>
              <StatusBadge tone="yellow">{d.topVideo.retention}% ret.</StatusBadge>
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
              <p className="text-[12px] leading-relaxed text-on-surface-variant">
                💡 {d.topVideo.insight}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* ── Video performance table ────────────────────────────────────── */}
      <Card className="p-4">
        <h3 className="mb-4 text-sm font-semibold text-on-surface">
          Video performance ({sortedVideos.length})
        </h3>

        {/* Table header */}
        <div className="mb-2 grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-4 px-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
          <span className="w-14" />
          <span>Title</span>
          <button
            onClick={() => toggleSort('views')}
            className="text-right hover:text-on-surface transition-colors"
          >
            Views{sortIcon('views')}
          </button>
          <span className="text-right">Watch time</span>
          <button
            onClick={() => toggleSort('ctr')}
            className="text-right hover:text-on-surface transition-colors"
          >
            CTR{sortIcon('ctr')}
          </button>
          <button
            onClick={() => toggleSort('retention')}
            className="text-right hover:text-on-surface transition-colors"
          >
            Ret.{sortIcon('retention')}
          </button>
          <span className="text-right">Published</span>
        </div>

        <div className="space-y-1">
          {sortedVideos.map((v) => (
            <div
              key={v.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-4 rounded-xl px-1 py-2.5 transition-colors hover:bg-white/[0.03]"
            >
              {/* Thumbnail placeholder */}
              <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-md bg-white/[0.04]">
                <span className="material-symbols-outlined text-sm text-on-surface-variant/30">
                  smart_display
                </span>
              </div>

              {/* Title */}
              <p className="text-[13px] font-medium text-on-surface truncate">
                {v.title}
              </p>

              {/* Views */}
              <p className="text-[13px] text-on-surface text-right tabular-nums font-medium">
                {formatNumber(v.views)}
              </p>

              {/* Watch time */}
              <p className="text-[13px] text-on-surface-variant text-right tabular-nums">
                {formatHours(v.watchTimeHours)}h
              </p>

              {/* CTR */}
              <p className="text-[13px] text-right tabular-nums">
                <span
                  className={
                    v.ctr >= 7
                      ? 'text-emerald-300'
                      : v.ctr >= 5
                        ? 'text-on-surface-variant'
                        : 'text-red-300'
                  }
                >
                  {v.ctr.toFixed(1)}%
                </span>
              </p>

              {/* Retention */}
              <div className="flex items-center gap-1.5 justify-end">
                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full ${
                      v.retention >= 55
                        ? 'bg-emerald-400/60'
                        : v.retention >= 40
                          ? 'bg-tertiary/60'
                          : 'bg-red-400/50'
                    }`}
                    style={{ width: `${v.retention}%` }}
                  />
                </div>
                <span className="text-[12px] text-on-surface-variant tabular-nums w-9 text-right">
                  {v.retention}%
                </span>
              </div>

              {/* Published date */}
              <p className="text-[12px] text-on-surface-variant/60 text-right tabular-nums whitespace-nowrap">
                {v.publishedDate}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
