'use client'

import { useState } from 'react'
import { Card, PageHeader, StatusBadge } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'
import {
  TrendingUp, TrendingDown, Minus, ExternalLink, Send, FileText,
  X, BarChart3, Zap, Link2, Lightbulb, Filter, RefreshCw,
  BrainCircuit, ArrowUpRight, Layers
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Sentiment = 'rising' | 'stable' | 'cooling'
type TrendType = 'Technology' | 'Consumer' | 'Finance' | 'Fashion' | 'SaaS'
type Workspace = 'Novizio' | 'Hourbour' | 'Both'

interface Trend {
  id: string
  title: string
  sources: string[]
  sentiment: Sentiment
  workspaces: Workspace[]
  type: TrendType
  description: string
  strength: number
  actioned: boolean
}

interface TrendRadarData {
  trends: Trend[]
  stats: {
    detectedToday: number
    actioned: number
    advisoryCouncil: number
    contentIdeas: number
  }
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK: TrendRadarData = {
  trends: [
    {
      id: 't1',
      title: 'AI agent-as-a-service demand signals rising',
      sources: ['Twitter', 'GitHub', 'Google Trends'],
      sentiment: 'rising',
      workspaces: ['Novizio', 'Hourbour'],
      type: 'Technology',
      description:
        'Mentions of "agent-as-a-service" up 3.2× in 30 days. Enterprise RFPs are shifting from custom-build to managed agent ops. Window to position Hourbour as the fintech agent layer.',
      strength: 94,
      actioned: false,
    },
    {
      id: 't2',
      title: 'Deep-sea + bioluminescent aesthetic surging in fashion',
      sources: ['Instagram', 'TikTok', 'Pinterest'],
      sentiment: 'rising',
      workspaces: ['Novizio'],
      type: 'Fashion',
      description:
        'Muted teals, iridescent fabrics, and jellyfish-core styling up 78 % on Pinterest. Aligns with Canela\'s "deep sea" collection theme. Strong influencer pickup.',
      strength: 88,
      actioned: false,
    },
    {
      id: 't3',
      title: 'Embedded fintech — SaaS platforms bundling financial products',
      sources: ['Crunchbase', 'TechCrunch', 'GitHub'],
      sentiment: 'rising',
      workspaces: ['Hourbour'],
      type: 'SaaS',
      description:
        'Stripe Treasury, Unit, and Synctera are making it trivial for any SaaS to offer bank accounts. Hourbour\'s API-first approach is well-timed.',
      strength: 85,
      actioned: true,
    },
    {
      id: 't4',
      title: 'Voice-to-task productivity workflows',
      sources: ['TikTok', 'YouTube', 'Product Hunt'],
      sentiment: 'rising',
      workspaces: ['Hourbour'],
      type: 'Technology',
      description:
        'Short-form demos of "talk to your tools" are exploding. Voice-memo → structured task creation has high viral potential for content pipeline.',
      strength: 77,
      actioned: false,
    },
    {
      id: 't5',
      title: 'Micro-bundle checkout upsells',
      sources: ['Shopify blog', 'Twitter'],
      sentiment: 'stable',
      workspaces: ['Novizio'],
      type: 'Consumer',
      description:
        '3-for-2 and build-your-own-bundle at checkout driving 22 % AOV lifts across DTC brands. Feature request for Canela\'s cart experience.',
      strength: 71,
      actioned: true,
    },
    {
      id: 't6',
      title: 'Cinematic single-page brand sites',
      sources: ['Awwwards', 'YouTube', 'Dribbble'],
      sentiment: 'stable',
      workspaces: ['Novizio', 'Hourbour'],
      type: 'SaaS',
      description:
        'Demand for high-production one-pagers is rising. Feeds the Cinematic Sites offer. Competitors are charging $8–15k per page.',
      strength: 69,
      actioned: false,
    },
    {
      id: 't7',
      title: 'BNPL regulation tightening in EU',
      sources: ['EU Commission', 'Twitter'],
      sentiment: 'cooling',
      workspaces: ['Hourbour'],
      type: 'Finance',
      description:
        'New EU Consumer Credit Directive extends to BNPL. Compliance burden increasing — may cool the space. Hourbour should monitor but not pivot.',
      strength: 52,
      actioned: false,
    },
    {
      id: 't8',
      title: 'Cozy / cottage-core e-commerce aesthetics plateauing',
      sources: ['Instagram', 'Google Trends'],
      sentiment: 'cooling',
      workspaces: ['Novizio'],
      type: 'Fashion',
      description:
        'Search volume for "cottage-core clothing" down 31 % QoQ. Time to diversify Canela\'s aesthetic toward the deep-sea / bioluminescent trend.',
      strength: 44,
      actioned: true,
    },
  ],
  stats: {
    detectedToday: 14,
    actioned: 5,
    advisoryCouncil: 3,
    contentIdeas: 7,
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const sentimentMeta: Record<Sentiment, { icon: typeof TrendingUp; tone: 'green' | 'yellow' | 'red'; label: string }> = {
  rising:  { icon: TrendingUp,   tone: 'green',  label: 'Rising' },
  stable:  { icon: Minus,        tone: 'yellow', label: 'Stable' },
  cooling: { icon: TrendingDown, tone: 'red',    label: 'Cooling' },
}

const sourceColors: Record<string, string> = {
  Twitter:       'bg-sky-400/10 text-sky-300 border-sky-400/25',
  GitHub:        'bg-purple-400/10 text-purple-300 border-purple-400/25',
  arXiv:         'bg-red-400/10 text-red-300 border-red-400/25',
  'Google Trends': 'bg-amber-400/10 text-amber-300 border-amber-400/25',
  TikTok:        'bg-pink-400/10 text-pink-300 border-pink-400/25',
  Instagram:     'bg-fuchsia-400/10 text-fuchsia-300 border-fuchsia-400/25',
  Pinterest:     'bg-rose-400/10 text-rose-300 border-rose-400/25',
  YouTube:       'bg-red-400/10 text-red-300 border-red-400/25',
  Crunchbase:    'bg-teal-400/10 text-teal-300 border-teal-400/25',
  TechCrunch:    'bg-emerald-400/10 text-emerald-300 border-emerald-400/25',
  'Product Hunt': 'bg-orange-400/10 text-orange-300 border-orange-400/25',
  'Shopify blog': 'bg-lime-400/10 text-lime-300 border-lime-400/25',
  Awwwards:      'bg-indigo-400/10 text-indigo-300 border-indigo-400/25',
  Dribbble:      'bg-pink-400/10 text-pink-300 border-pink-400/25',
  'EU Commission': 'bg-blue-400/10 text-blue-300 border-blue-400/25',
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function TrendRadarPage() {
  const [wsFilter, setWsFilter] = useState<string>('All')
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('All')

  const { data, loading, refetch } = useLiveData<TrendRadarData>({
    url: '/api/trend-radar',
    mockData: MOCK,
    pollIntervalMs: 60000,
  })

  const [scanning, setScanning] = useState(false)

  const handleIsaacScan = async () => {
    setScanning(true)
    try {
      const res = await fetch('/api/isaac/scan')
      if (res.ok) {
        const scanData = await res.json()
        // Isaac data takes priority — merge into TrendRadar shape
        if (scanData.trends?.length) {
          // Trigger a refetch of the main data to reflect new trends
          refetch()
        }
      }
    } catch (err) {
      console.error('[trend-radar] isaac scan error:', err)
    } finally {
      setScanning(false)
    }
  }

  const trends = data?.trends ?? MOCK.trends
  const stats = data?.stats ?? MOCK.stats

  // ── Filtering ────────────────────────────────────────────────────────────

  const filtered = trends.filter((t) => {
    if (wsFilter !== 'All') {
      if (wsFilter === 'Both') {
        if (t.workspaces.length < 2) return false
      } else if (!t.workspaces.includes(wsFilter as Workspace)) {
        return false
      }
    }
    if (typeFilter !== 'All' && t.type !== typeFilter) return false
    if (urgencyFilter !== 'All') {
      if (urgencyFilter === 'Rising' && t.sentiment !== 'rising') return false
      if (urgencyFilter === 'Stable' && t.sentiment !== 'stable') return false
      if (urgencyFilter === 'Cooling' && t.sentiment !== 'cooling') return false
    }
    return true
  })

  // ── Isaac's analysis ─────────────────────────────────────────────────────

  const topSignal = [...trends].sort((a, b) => b.strength - a.strength)[0]
  const crossWorkspace = trends.filter((t) => t.workspaces.includes('Novizio') && t.workspaces.includes('Hourbour'))
  const allSources = [...new Set(trends.flatMap((t) => t.sources))].sort()

  return (
    <div className="mx-auto max-w-[1400px]">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        title="Trend Radar · Isaac"
        subtitle="Isaac identifies trends across your workspaces — research and trend analysis feeding decision-making and content creation"
        actions={
          <button className="btn-ghost" onClick={handleIsaacScan} disabled={scanning}>
            <RefreshCw size={15} className={scanning ? 'animate-spin' : ''} />{' '}
            {scanning ? 'Scanning…' : 'Refresh'}
          </button>
        }
      />

      {/* ── Top Stats Bar ────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Zap size={17} className="text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-on-surface">{stats.detectedToday}</p>
            <p className="text-[11px] text-on-surface-variant">Trends detected today</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
            <BarChart3 size={17} className="text-emerald-300" />
          </div>
          <div>
            <p className="text-2xl font-bold text-on-surface">{stats.actioned}</p>
            <p className="text-[11px] text-on-surface-variant">Trends actioned</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10">
            <Link2 size={17} className="text-amber-300" />
          </div>
          <div>
            <p className="text-2xl font-bold text-on-surface">{stats.advisoryCouncil}</p>
            <p className="text-[11px] text-on-surface-variant">Advisory Council</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-400/10">
            <Lightbulb size={17} className="text-violet-300" />
          </div>
          <div>
            <p className="text-2xl font-bold text-on-surface">{stats.contentIdeas}</p>
            <p className="text-[11px] text-on-surface-variant">Content ideas generated</p>
          </div>
        </Card>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <Card className="mb-5 p-3 flex flex-wrap items-center gap-3">
        <Filter size={15} className="text-on-surface-variant shrink-0" />

        {/* Workspace filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">Workspace</span>
          {['All', 'Novizio', 'Hourbour', 'Both'].map((ws) => (
            <button
              key={ws}
              onClick={() => setWsFilter(ws)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                wsFilter === ws
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-white/8 bg-white/[0.03] text-on-surface-variant hover:border-white/15'
              }`}
            >
              {ws}
            </button>
          ))}
        </div>

        <span className="h-4 w-px bg-white/8" />

        {/* Type filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">Type</span>
          {['All', 'Technology', 'Consumer', 'Finance', 'Fashion', 'SaaS'].map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                typeFilter === tp
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-white/8 bg-white/[0.03] text-on-surface-variant hover:border-white/15'
              }`}
            >
              {tp}
            </button>
          ))}
        </div>

        <span className="h-4 w-px bg-white/8" />

        {/* Urgency filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">Urgency</span>
          {['All', 'Rising', 'Stable', 'Cooling'].map((ur) => (
            <button
              key={ur}
              onClick={() => setUrgencyFilter(ur)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                urgencyFilter === ur
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-white/8 bg-white/[0.03] text-on-surface-variant hover:border-white/15'
              }`}
            >
              {ur}
            </button>
          ))}
        </div>

        {/* Result count */}
        <span className="ml-auto text-[11px] text-on-surface-variant">
          {filtered.length} of {trends.length} trends
        </span>
      </Card>

      {/* ── Main Layout: Feed + Right Rail ───────────────────────────────── */}
      <div className="flex flex-col gap-5 lg:flex-row">
        {/* ── Trend Cards Feed ───────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {loading && filtered.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-5 animate-pulse">
                  <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
                  <div className="mt-3 h-3 w-1/2 rounded bg-white/[0.04]" />
                  <div className="mt-3 h-3 w-full rounded bg-white/[0.04]" />
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-sm text-on-surface-variant">No trends match your filters.</p>
              <button
                className="btn-ghost mt-3 !text-xs"
                onClick={() => { setWsFilter('All'); setTypeFilter('All'); setUrgencyFilter('All') }}
              >
                Clear filters
              </button>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => {
                const sent = sentimentMeta[t.sentiment]
                const SentIcon = sent.icon
                return (
                  <Card key={t.id} hover className="p-5">
                    {/* Top row: title + sentiment */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[15px] font-semibold text-on-surface leading-snug">
                        {t.title}
                      </h3>
                      <StatusBadge tone={sent.tone}>
                        <SentIcon size={12} /> {sent.label} {t.strength}
                      </StatusBadge>
                    </div>

                    {/* Source tags */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {t.sources.map((src) => (
                        <span
                          key={src}
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            sourceColors[src] ?? 'bg-white/5 text-on-surface-variant border-white/10'
                          }`}
                        >
                          {src}
                        </span>
                      ))}
                      {/* Workspace relevance tags */}
                      {t.workspaces.map((ws) => (
                        <span
                          key={ws}
                          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary border-primary/25"
                        >
                          <Layers size={9} /> {ws}
                        </span>
                      ))}
                    </div>

                    {/* Description */}
                    <p className="mt-2.5 text-[12px] text-on-surface-variant leading-relaxed">
                      {t.description}
                    </p>

                    {/* Action buttons */}
                    <div className="mt-3.5 flex flex-wrap gap-2">
                      <button className="btn-accent !py-1.5 !text-xs">
                        <FileText size={12} /> Create task
                      </button>
                      <button className="btn-ghost !py-1.5 !text-xs">
                        <Send size={12} /> Advisory Council
                      </button>
                      <button className="btn-ghost !py-1.5 !text-xs">
                        <ExternalLink size={12} /> Content Pipeline
                      </button>
                      <button className="btn-ghost !py-1.5 !text-xs text-on-surface-variant/60 hover:text-red-300">
                        <X size={12} /> Dismiss
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Right Rail: Isaac's Analysis ──────────────────────────────── */}
        <div className="w-full shrink-0 lg:w-[320px]">
          <div className="space-y-4 lg:sticky lg:top-6">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-1">
              <BrainCircuit size={17} className="text-primary" />
              <h2 className="text-sm font-semibold text-on-surface">Isaac&apos;s Analysis</h2>
            </div>

            {/* Top signal this week */}
            {topSignal && (
              <Card className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/70">
                  Top signal this week
                </p>
                <p className="mt-1.5 text-sm font-semibold text-on-surface leading-snug">
                  {topSignal.title}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <StatusBadge tone={sentimentMeta[topSignal.sentiment].tone}>
                    {((): React.ReactNode => {
                      const S = sentimentMeta[topSignal.sentiment].icon
                      return <><S size={10} /> {topSignal.strength}</>
                    })()}
                  </StatusBadge>
                  <span className="text-[10px] text-on-surface-variant">
                    Recommend acting now
                  </span>
                </div>
              </Card>
            )}

            {/* Cross-workspace patterns */}
            <Card className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300/70">
                Cross-workspace patterns
              </p>
              {crossWorkspace.length === 0 ? (
                <p className="mt-2 text-[12px] text-on-surface-variant">No cross-workspace trends right now.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {crossWorkspace.map((ct) => (
                    <li key={ct.id} className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400/10">
                        <ArrowUpRight size={9} className="text-amber-300" />
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-on-surface leading-snug">{ct.title}</p>
                        <p className="text-[10px] text-on-surface-variant">{ct.type} · strength {ct.strength}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Data sources */}
            <Card className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-300/70">
                Data sources
              </p>
              <p className="mt-1 text-[11px] text-on-surface-variant">
                Isaac pulls signals from these platforms:
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {allSources.map((src) => (
                  <span
                    key={src}
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      sourceColors[src] ?? 'bg-white/5 text-on-surface-variant border-white/10'
                    }`}
                  >
                    {src}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
